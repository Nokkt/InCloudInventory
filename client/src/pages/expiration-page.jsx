import React, { useState } from "react";
import { Layout } from "../components/layout/Layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";

const ExpirationPage = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortField, setSortField] = useState("expiryDate");
  const [sortDirection, setSortDirection] = useState("asc");
  
  // Fetch products
  const { 
    data: products = [], 
    isLoading: isLoadingProducts,
    error: productsError
  } = useQuery({ 
    queryKey: ["/api/products"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Fetch categories
  const { 
    data: categories = [],
    isLoading: isLoadingCategories 
  } = useQuery({ 
    queryKey: ["/api/categories"],
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
  
  // Fetch stock transactions for expiration calculations
  const { 
    data: stockTransactions = [],
    isLoading: isLoadingStockTransactions 
  } = useQuery({ 
    queryKey: ["/api/stock-transactions"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Fetch inventory batches for accurate stock calculations
  const { 
    data: inventoryBatches = [],
    isLoading: isLoadingBatches 
  } = useQuery({ 
    queryKey: ["/api/inventory-batches"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Function to get days until expiration
  const getDaysUntilExpiration = (expirationDate) => {
    if (!expirationDate) return null;
    const today = new Date();
    const diffTime = expirationDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  
  // Get all batches with expiration data - show individual batches instead of aggregated products
  const batchesWithExpiry = inventoryBatches
    .filter(batch => {
      // Only show batches with remaining quantity and expiration dates
      if (batch.remainingQuantity <= 0 || !batch.expiryDate) return false;
      
      const product = products.find(p => p.id === batch.productId);
      if (!product || !product.shelfLife) return false;
      
      const daysUntilExpiration = getDaysUntilExpiration(new Date(batch.expiryDate));
      
      // Calculate threshold based on shelf life (30% of shelf life)
      let attentionThreshold = Math.max(Math.round(product.shelfLife * 0.30), 1);
      
      // Special handling for very short shelf life items (≤ 10 days)
      if (product.shelfLife <= 10) {
        attentionThreshold = Math.max(Math.round(product.shelfLife * 0.30), 3);
      }
      
      // Include expired batches and those within attention threshold
      return daysUntilExpiration <= attentionThreshold || daysUntilExpiration < 0;
    })
    .map(batch => {
      const product = products.find(p => p.id === batch.productId);
      const daysUntilExpiration = getDaysUntilExpiration(new Date(batch.expiryDate));
      
      return {
        ...batch,
        product,
        productName: product ? product.name : `Product #${batch.productId}`,
        productSku: product ? product.sku : '',
        categoryId: product ? product.categoryId : null,
        calculatedExpiryDate: new Date(batch.expiryDate),
        daysRemaining: daysUntilExpiration
      };
    })
    .filter(batch => batch.product); // Only include batches with valid products
  
  // Apply additional filters to batches
  const filteredBatches = batchesWithExpiry.filter(batch => {
    // Filter by category
    if (selectedCategory !== "all" && batch.categoryId !== parseInt(selectedCategory)) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        batch.productName.toLowerCase().includes(query) ||
        batch.productSku.toLowerCase().includes(query) ||
        batch.batchNumber.toLowerCase().includes(query)
      );
    }
    
    return true;
  });
  
  // Sort filtered batches
  const sortedBatches = [...filteredBatches].sort((a, b) => {
    let aValue, bValue;
    
    if (sortField === "expiryDate") {
      aValue = new Date(a.calculatedExpiryDate).getTime();
      bValue = new Date(b.calculatedExpiryDate).getTime();
    } else if (sortField === "daysRemaining") {
      aValue = a.daysRemaining;
      bValue = b.daysRemaining;
    } else if (sortField === "name") {
      aValue = a.productName;
      bValue = b.productName;
    } else if (sortField === "sku") {
      aValue = a.productSku;
      bValue = b.productSku;
    } else if (sortField === "category") {
      const categoryA = categories.find(c => c.id === a.categoryId)?.name || "";
      const categoryB = categories.find(c => c.id === b.categoryId)?.name || "";
      aValue = categoryA;
      bValue = categoryB;
    } else if (sortField === "currentStock") {
      aValue = a.remainingQuantity;
      bValue = b.remainingQuantity;
    } else if (sortField === "batchNumber") {
      aValue = a.batchNumber;
      bValue = b.batchNumber;
    }
    
    if (typeof aValue === "string") {
      const comparison = aValue.localeCompare(bValue);
      return sortDirection === "asc" ? comparison : -comparison;
    } else {
      const comparison = aValue - bValue;
      return sortDirection === "asc" ? comparison : -comparison;
    }
  });
  
  // Get category name by ID
  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : "Uncategorized";
  };



  // Disposal mutation - creates a stock-out transaction to dispose of expired batches
  const disposalMutation = useMutation({
    mutationFn: async ({ productId, quantity, productName, batchId }) => {
      const transactionData = {
        productId: parseInt(productId),
        type: 'out',
        quantity: parseInt(quantity),
        reason: `Disposed - Expired batch: ${productName}`,
        status: 'completed',
        batchId: batchId ? parseInt(batchId) : undefined
      };
      
      const res = await apiRequest("POST", "/api/stock-transactions", transactionData);
      return await res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-batches"] });
      toast({
        title: "Success",
        description: `${variables.productName} batch has been marked as disposed and removed from inventory`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to dispose batch",
        variant: "destructive",
      });
    },
  });
  
  // Handle batch disposal
  const handleDisposeBatch = (batch) => {    
    if (batch.remainingQuantity <= 0) {
      toast({
        title: "No Stock Available",
        description: `No remaining stock in batch ${batch.batchNumber} to dispose`,
        variant: "destructive",
      });
      return;
    }
    
    if (window.confirm(`Are you sure you want to dispose of ${batch.remainingQuantity} units from batch ${batch.batchNumber} of "${batch.productName}"? This action cannot be undone.`)) {
      disposalMutation.mutate({
        productId: batch.productId,
        quantity: batch.remainingQuantity,
        productName: batch.productName,
        batchId: batch.id
      });
    }
  };

  // Handle sort toggle
  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };
  
  // Get sort indicator
  const getSortIndicator = (field) => {
    if (sortField !== field) return null;
    return <span className="ml-1">{sortDirection === "asc" ? "▲" : "▼"}</span>;
  };
  
  // Group batches by expiration status using percentage-based thresholds
  const getStatusThresholds = (shelfLife) => {
    if (shelfLife <= 10) {
      // Special handling for short shelf life items (≤ 10 days)
      return {
        critical: 1,
        warning: 2, 
        attention: 3
      };
    } else {
      // Percentage-based for longer shelf life items
      return {
        critical: Math.max(Math.round(shelfLife * 0.10), 1),
        warning: Math.max(Math.round(shelfLife * 0.20), 2),
        attention: Math.max(Math.round(shelfLife * 0.30), 3)
      };
    }
  };

  const expiredBatches = sortedBatches.filter(batch => batch.daysRemaining < 0);
  
  const criticalBatches = sortedBatches.filter(batch => {
    if (batch.daysRemaining < 0) return false;
    const thresholds = getStatusThresholds(batch.product?.shelfLife || 7);
    return batch.daysRemaining <= thresholds.critical;
  });
  
  const warningBatches = sortedBatches.filter(batch => {
    if (batch.daysRemaining < 0) return false;
    const thresholds = getStatusThresholds(batch.product?.shelfLife || 7);
    return batch.daysRemaining > thresholds.critical && batch.daysRemaining <= thresholds.warning;
  });
  
  const attentionBatches = sortedBatches.filter(batch => {
    if (batch.daysRemaining < 0) return false;
    const thresholds = getStatusThresholds(batch.product?.shelfLife || 7);
    return batch.daysRemaining > thresholds.warning && batch.daysRemaining <= thresholds.attention;
  });

  return (
    <Layout>
      <div className="p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-8">Expiration Tracking</h1>
        
        {/* Status summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-red-100 p-4 rounded-lg border border-red-300">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-medium text-red-800">Expired</h2>
              <span className="px-2 py-1 bg-red-500 text-white rounded-full text-xs">{expiredBatches.length}</span>
            </div>
            <p className="text-sm text-red-800">Batches that have already expired</p>
          </div>
          
          <div className="bg-red-100 p-4 rounded-lg border border-red-300">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-medium text-red-800">Critical (≤ 10%)</h2>
              <span className="px-2 py-1 bg-red-500 text-white rounded-full text-xs">{criticalBatches.length}</span>
            </div>
            <p className="text-sm text-red-800">Within 10% of shelf life remaining</p>
          </div>
          
          <div className="bg-orange-100 p-4 rounded-lg border border-orange-300">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-medium text-orange-800">Warning (≤ 20%)</h2>
              <span className="px-2 py-1 bg-orange-500 text-white rounded-full text-xs">{warningBatches.length}</span>
            </div>
            <p className="text-sm text-orange-800">Within 20% of shelf life remaining</p>
          </div>
          
          <div className="bg-yellow-100 p-4 rounded-lg border border-yellow-300">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-medium text-yellow-800">Attention (≤ 30%)</h2>
              <span className="px-2 py-1 bg-yellow-500 text-black rounded-full text-xs">{attentionBatches.length}</span>
            </div>
            <p className="text-sm text-yellow-800">Within 30% of shelf life remaining</p>
          </div>
        </div>
        
        {/* Search and filters */}
        <div className="bg-white p-4 rounded-lg shadow border mb-8">
          <div className="flex flex-col md:flex-row gap-4">
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
                className="border rounded-md p-2 min-w-[180px]"
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
        
        {/* Products table */}
        {isLoadingProducts || isLoadingCategories || isLoadingStockTransactions || isLoadingBatches ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : productsError ? (
          <div className="bg-red-100 text-red-800 p-4 rounded-md">
            Error loading products: {productsError.message}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden border">
            <div className="overflow-x-auto">
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
                      onClick={() => handleSort("category")}
                    >
                      Category {getSortIndicator("category")}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("batchNumber")}
                    >
                      Batch # {getSortIndicator("batchNumber")}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("currentStock")}
                    >
                      Stock {getSortIndicator("currentStock")}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("expiryDate")}
                    >
                      Expiry Date {getSortIndicator("expiryDate")}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("daysRemaining")}
                    >
                      Days Remaining {getSortIndicator("daysRemaining")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedBatches.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                        No batches with expiration dates found. Try a different search or filter.
                      </td>
                    </tr>
                  ) : (
                    sortedBatches.map(batch => {
                      const getStatusClass = (days, shelfLife) => {
                        if (days < 0) return "bg-red-500 text-white";
                        
                        const thresholds = getStatusThresholds(shelfLife || 7);
                        if (days <= thresholds.critical) return "bg-red-500 text-white";
                        if (days <= thresholds.warning) return "bg-orange-500 text-white";
                        if (days <= thresholds.attention) return "bg-yellow-500 text-black";
                        return "bg-green-500 text-white";
                      };
                      
                      const getStatusText = (days, shelfLife) => {
                        if (days < 0) return "Expired";
                        
                        const thresholds = getStatusThresholds(shelfLife || 7);
                        if (days <= thresholds.critical) return "Critical";
                        if (days <= thresholds.warning) return "Warning";
                        if (days <= thresholds.attention) return "Attention";
                        return "Good";
                      };
                      
                      return (
                        <tr key={batch.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{batch.productName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {batch.productSku}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getCategoryName(batch.categoryId)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {batch.batchNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {batch.remainingQuantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {batch.calculatedExpiryDate.toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {batch.daysRemaining < 0 ? `${Math.abs(batch.daysRemaining)} days overdue` : `${batch.daysRemaining} days`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusClass(batch.daysRemaining, batch.product?.shelfLife)}`}>
                              {getStatusText(batch.daysRemaining, batch.product?.shelfLife)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                              onClick={() => handleDisposeBatch(batch)}
                              disabled={disposalMutation.isPending || batch.remainingQuantity === 0}
                            >
                              {disposalMutation.isPending ? "Disposing..." : "Mark as Disposed"}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 border-t">
              <p className="text-sm text-gray-500">
                Showing {sortedBatches.length} of {batchesWithExpiry.length} batches with expiration dates
              </p>
            </div>
          </div>
        )}
        
        {/* Recommendations */}
        {(expiredBatches.length > 0 || criticalBatches.length > 0) && (
          <div className="mt-8 bg-blue-50 border border-blue-300 rounded-lg p-6">
            <h2 className="text-xl font-bold text-blue-800 mb-4">Recommendations</h2>
            <ul className="space-y-2 text-blue-800">
              {expiredBatches.length > 0 && (
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-600 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>You have {expiredBatches.length} expired batches that should be disposed of immediately to comply with food safety regulations.</span>
                </li>
              )}
              {criticalBatches.length > 0 && (
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-600 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>{criticalBatches.length} batches are expiring within 7 days. Consider applying discounts or promotions to move these items quickly.</span>
                </li>
              )}
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
                <span>Optimize your ordering cycles based on product shelf life patterns to reduce waste and maximize freshness.</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ExpirationPage;