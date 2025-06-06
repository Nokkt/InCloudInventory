import React, { useState } from "react";
import { Layout } from "../components/layout/Layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../hooks/use-auth";
import { Link } from "wouter";

const ProductsPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");

  // Fetch products
  const { 
    data: products = [], 
    isLoading: isLoadingProducts,
    error: productsError
  } = useQuery({ 
    queryKey: ["/api/products"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      if (!res.ok) {
        throw new Error("Failed to load products");
      }
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch categories
  const { 
    data: categories = [],
    isLoading: isLoadingCategories
  } = useQuery({ 
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) {
        throw new Error("Failed to load categories");
      }
      return res.json();
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  // Fetch stock transactions to calculate expiration dates
  const { 
    data: stockTransactions = [],
    isLoading: isLoadingTransactions
  } = useQuery({ 
    queryKey: ["/api/stock-transactions"],
    queryFn: async () => {
      const res = await fetch("/api/stock-transactions");
      if (!res.ok) {
        throw new Error("Failed to load stock transactions");
      }
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Handle product deletion
  const deleteProductMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to delete product");
      }
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ 
        title: "Product deleted", 
        description: "The product has been successfully removed", 
      });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete product", 
        variant: "destructive" 
      });
    }
  });

  // Function to calculate expiration date for a product
  const calculateExpirationDate = (productId, shelfLifeDays) => {
    if (!shelfLifeDays || shelfLifeDays <= 0) return null;
    
    // Find the most recent completed stock-in transaction for this product
    const latestStockIn = stockTransactions
      .filter(t => t.productId === productId && t.type === 'in' && t.status === 'completed')
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
    
    if (!latestStockIn) return null;
    
    const stockDate = new Date(latestStockIn.timestamp);
    const expirationDate = new Date(stockDate);
    expirationDate.setDate(stockDate.getDate() + shelfLifeDays);
    
    return expirationDate;
  };

  // Function to get days until expiration
  const getDaysUntilExpiration = (expirationDate) => {
    if (!expirationDate) return null;
    const today = new Date();
    const diffTime = expirationDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get currency symbol from user settings
  const getCurrencySymbol = () => {
    const currency = user?.settings?.currency || "PHP";
    switch (currency) {
      case "USD": return "$";
      case "EUR": return "€";
      case "GBP": return "£";
      case "PHP": return "₱";
      case "JPY": return "¥";
      case "CAD": return "$";
      case "AUD": return "$";
      default: return "₱";
    }
  };

  // Filter products by category and search query
  const filteredProducts = products.filter(product => {
    // Filter by category
    if (selectedCategory !== "all" && product.categoryId !== parseInt(selectedCategory)) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        (product.description && product.description.toLowerCase().includes(query))
      );
    }
    
    return true;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    // Handle different field types
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    // Parse numbers for numerical fields
    if (sortField === "price" || sortField === "currentStock" || sortField === "minStockLevel") {
      aValue = parseFloat(aValue) || 0;
      bValue = parseFloat(bValue) || 0;
    } else {
      // Default to string comparison
      aValue = aValue?.toString().toLowerCase() || "";
      bValue = bValue?.toString().toLowerCase() || "";
    }
    
    // Apply sort direction
    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    }
  });

  // Get category name by ID
  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : "Uncategorized";
  };

  // Get status thresholds based on shelf life
  const getStatusThresholds = (shelfLife) => {
    if (shelfLife <= 10) {
      return {
        critical: 1,
        warning: 2, 
        attention: 3
      };
    } else {
      return {
        critical: Math.max(Math.round(shelfLife * 0.10), 1),
        warning: Math.max(Math.round(shelfLife * 0.20), 2),
        attention: Math.max(Math.round(shelfLife * 0.30), 3)
      };
    }
  };

  // Calculate expiration status using percentage-based thresholds
  const getExpirationStatus = (product) => {
    if (!product.isFoodProduct || !product.shelfLife) {
      return { status: "none", label: "Non-perishable", color: "bg-gray-400" };
    }
    
    const expirationDate = calculateExpirationDate(product.id, product.shelfLife);
    if (!expirationDate) {
      // Show shelf life info even without stock data
      return { status: "pending", label: `${product.shelfLife} days shelf life`, color: "bg-blue-400" };
    }
    
    const daysUntilExpiration = getDaysUntilExpiration(expirationDate);
    const thresholds = getStatusThresholds(product.shelfLife);
    
    if (daysUntilExpiration < 0) {
      return { status: "expired", label: "Expired", color: "bg-red-500" };
    } else if (daysUntilExpiration <= thresholds.critical) {
      return { status: "critical", label: `${daysUntilExpiration} days left`, color: "bg-red-500" };
    } else if (daysUntilExpiration <= thresholds.warning) {
      return { status: "warning", label: `${daysUntilExpiration} days left`, color: "bg-orange-500" };
    } else if (daysUntilExpiration <= thresholds.attention) {
      return { status: "attention", label: `${daysUntilExpiration} days left`, color: "bg-yellow-500" };
    } else {
      return { status: "good", label: `${daysUntilExpiration} days left`, color: "bg-green-500" };
    }
  };

  // Handle sort toggle
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Get sort indicator arrow
  const getSortIndicator = (field) => {
    if (sortField !== field) return null;
    
    return (
      <span className="ml-1 text-xs">
        {sortDirection === "asc" ? "▲" : "▼"}
      </span>
    );
  };

  const handleDeleteProduct = (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      deleteProductMutation.mutate(id);
    }
  };

  return (
    <Layout>
      <div className="p-4 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-3xl font-bold mb-4 md:mb-0">Food Products</h1>
          
          <Link href="/products/add">
            <div className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Product
            </div>
          </Link>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search products..."
                className="w-full border rounded-md p-2"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div>
              <select
                className="border rounded-md p-2 min-w-[200px]"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {isLoadingProducts || isLoadingCategories ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : productsError ? (
          <div className="bg-red-100 text-red-800 p-4 rounded-md">
            Error loading products: {productsError.message}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("name")}
                    >
                      Product Name {getSortIndicator("name")}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("sku")}
                    >
                      SKU {getSortIndicator("sku")}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("categoryId")}
                    >
                      Category {getSortIndicator("categoryId")}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("currentStock")}
                    >
                      Quantity {getSortIndicator("currentStock")}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("minStockLevel")}
                    >
                      Reorder Level {getSortIndicator("minStockLevel")}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("price")}
                    >
                      Price {getSortIndicator("price")}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("expiryDate")}
                    >
                      Expiration {getSortIndicator("expiryDate")}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("createdAt")}
                    >
                      Date Added {getSortIndicator("createdAt")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedProducts.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                        No products found. Try a different search or category filter.
                      </td>
                    </tr>
                  ) : (
                    sortedProducts.map(product => {
                      const expirationStatus = getExpirationStatus(product);
                      const stockStatus = product.currentStock <= product.minStockLevel ? 
                        "bg-red-100 text-red-800" : 
                        "bg-green-100 text-green-800";
                        
                      return (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{product.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.sku}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getCategoryName(product.categoryId)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${stockStatus}`}>
                              {product.currentStock}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.minStockLevel}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getCurrencySymbol()}{parseFloat(product.price).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              {expirationStatus ? (
                                <>
                                  <span className={`px-2 py-1 text-xs rounded-full text-white ${expirationStatus.color} mb-1 inline-block w-fit`}>
                                    {expirationStatus.label}
                                  </span>
                                  {product.isFoodProduct && product.shelfLife && (() => {
                                    const expDate = calculateExpirationDate(product.id, product.shelfLife);
                                    const latestStockIn = stockTransactions
                                      .filter(t => t.productId === product.id && t.type === 'in' && t.status === 'completed')
                                      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
                                    
                                    return expDate && latestStockIn ? (
                                      <div className="text-xs text-gray-500">
                                        <div>Expires: {expDate.toLocaleDateString()}</div>
                                        <div>Based on stock from: {new Date(latestStockIn.timestamp).toLocaleDateString()}</div>
                                        <div>Shelf life: {product.shelfLife} days</div>
                                      </div>
                                    ) : null;
                                  })()}
                                </>
                              ) : (
                                <span className="text-sm text-gray-500">N/A</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(product.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-3">
                              <Link href={`/products/edit/${product.id}`}>
                                <div className="text-blue-600 hover:text-blue-800 flex items-center cursor-pointer">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Edit
                                </div>
                              </Link>
                              <button 
                                className="text-red-600 hover:text-red-800 flex items-center"
                                onClick={() => handleDeleteProduct(product.id)}
                                disabled={deleteProductMutation.isPending}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 text-gray-500 text-sm">
              Showing {sortedProducts.length} of {products.length} products
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default ProductsPage;