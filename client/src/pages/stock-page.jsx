import React, { useState } from "react";
import { Layout } from "../components/layout/Layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";

const StockPage = () => {
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [transactionType, setTransactionType] = useState("in");
  const [reason, setReason] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortField, setSortField] = useState("timestamp");
  const [sortDirection, setSortDirection] = useState("desc");
  
  // Fetch products
  const { 
    data: products = [], 
    isLoading: isLoadingProducts
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
  
  // Fetch stock transactions
  const { 
    data: transactions = [], 
    isLoading: isLoadingTransactions,
    error: transactionsError
  } = useQuery({ 
    queryKey: ["/api/stock-transactions"],
    staleTime: 1000 * 60, // 1 minute
  });
  
  // Create a stock transaction
  const createTransactionMutation = useMutation({
    mutationFn: async (data) => {
      const res = await fetch("/api/stock-transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to create transaction");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      // Reset form
      setSelectedProduct("");
      setQuantity("");
      setReason("");
      setBatchNumber("");
      setExpiryDate("");
      
      // Refetch products and stock transactions
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-batches"] });
      
      // Force immediate refetch to ensure fresh data
      queryClient.refetchQueries({ queryKey: ["/api/products"] });
      
      toast({ 
        title: "Transaction Created", 
        description: "The stock transaction has been recorded successfully" 
      });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create stock transaction", 
        variant: "destructive" 
      });
    }
  });
  
  // Get product name by ID
  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : "Unknown Product";
  };
  
  // Get category name by ID
  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : "Uncategorized";
  };
  
  // Filter transactions by product name and category
  const filteredTransactions = transactions.filter(transaction => {
    const product = products.find(p => p.id === transaction.productId);
    if (!product) return false;
    
    // Filter by category
    if (selectedCategory !== "all" && product.categoryId !== parseInt(selectedCategory)) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const productName = product.name.toLowerCase();
      const transactionReason = transaction.reason ? transaction.reason.toLowerCase() : "";
      
      return productName.includes(query) || transactionReason.includes(query);
    }
    
    return true;
  });
  
  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortField === "timestamp") {
      const aTime = new Date(a.timestamp).getTime();
      const bTime = new Date(b.timestamp).getTime();
      return sortDirection === "asc" ? aTime - bTime : bTime - aTime;
    } else if (sortField === "product") {
      const aName = getProductName(a.productId).toLowerCase();
      const bName = getProductName(b.productId).toLowerCase();
      return sortDirection === "asc" ? 
        aName.localeCompare(bName) : 
        bName.localeCompare(aName);
    } else if (sortField === "type") {
      return sortDirection === "asc" ? 
        a.type.localeCompare(b.type) : 
        b.type.localeCompare(a.type);
    } else if (sortField === "quantity") {
      return sortDirection === "asc" ? a.quantity - b.quantity : b.quantity - a.quantity;
    }
    
    return 0;
  });
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedProduct || !quantity || quantity <= 0) {
      toast({ 
        title: "Validation Error", 
        description: "Please select a product and enter a valid quantity", 
        variant: "destructive" 
      });
      return;
    }
    
    const transactionData = {
      productId: parseInt(selectedProduct),
      type: transactionType,
      quantity: parseInt(quantity),
      reason: reason || `${transactionType === "in" ? "Stock in" : "Stock out"} transaction`,
      batchNumber: transactionType === "in" ? batchNumber : undefined,
      expiryDate: transactionType === "in" && expiryDate ? expiryDate : undefined,
      status: "completed"
    };
    
    createTransactionMutation.mutate(transactionData);
  };
  
  // Handle sort toggle
  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc"); // Default to newest first when changing sort field
    }
  };
  
  // Get sort indicator
  const getSortIndicator = (field) => {
    if (sortField !== field) return null;
    return <span className="ml-1">{sortDirection === "asc" ? "▲" : "▼"}</span>;
  };
  
  return (
    <Layout>
      <div className="p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-8">Stock Management</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* New Transaction Form */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow border">
              <h2 className="text-xl font-bold mb-4">New Transaction</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product
                  </label>
                  <select
                    className="w-full border rounded-md p-2"
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    required
                  >
                    <option value="">Select a product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} (Current: {product.currentStock})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transaction Type
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="transactionType"
                        value="in"
                        checked={transactionType === "in"}
                        onChange={() => setTransactionType("in")}
                        className="mr-2"
                      />
                      <span>Stock In</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="transactionType"
                        value="out"
                        checked={transactionType === "out"}
                        onChange={() => setTransactionType("out")}
                        className="mr-2"
                      />
                      <span>Stock Out</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full border rounded-md p-2"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                </div>
                
                {/* Batch-specific fields for stock-in */}
                {transactionType === "in" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Batch Number (Optional)
                      </label>
                      <input
                        type="text"
                        className="w-full border rounded-md p-2"
                        value={batchNumber}
                        onChange={(e) => setBatchNumber(e.target.value)}
                        placeholder="Auto-generated if not provided"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expiry Date (Optional)
                      </label>
                      <input
                        type="date"
                        className="w-full border rounded-md p-2"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        If not provided, will be calculated based on product shelf life
                      </p>
                    </div>
                  </>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason (Optional)
                  </label>
                  <textarea
                    className="w-full border rounded-md p-2"
                    rows="2"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={`${transactionType === "in" ? "New delivery, restock, etc." : "Sale, damage, expiry, etc."}`}
                  ></textarea>
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark transition-colors"
                  disabled={createTransactionMutation.isPending}
                >
                  {createTransactionMutation.isPending ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing
                    </span>
                  ) : (
                    "Record Transaction"
                  )}
                </button>
              </form>
            </div>
          </div>
          
          {/* Transaction History */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Transaction History</h2>
                <div className="flex space-x-2">
                  <button 
                    className={`px-3 py-1 text-sm rounded-md ${
                      sortField === "timestamp" && sortDirection === "desc"
                        ? "bg-blue-100 text-blue-800 border border-blue-300"
                        : "bg-gray-100 text-gray-800 border border-gray-300"
                    }`}
                    onClick={() => {
                      setSortField("timestamp");
                      setSortDirection("desc");
                    }}
                  >
                    Latest First
                  </button>
                  <button 
                    className={`px-3 py-1 text-sm rounded-md ${
                      sortField === "timestamp" && sortDirection === "asc"
                        ? "bg-blue-100 text-blue-800 border border-blue-300"
                        : "bg-gray-100 text-gray-800 border border-gray-300"
                    }`}
                    onClick={() => {
                      setSortField("timestamp");
                      setSortDirection("asc");
                    }}
                  >
                    Oldest First
                  </button>
                </div>
              </div>
              
              {/* Search and filters */}
              <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <input
                    type="text"
                    placeholder="Search products or reasons..."
                    className="w-full border rounded-md p-2"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div>
                  <select
                    className="w-full border rounded-md p-2"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Transaction Type Filters */}
              <div className="mb-4 flex flex-wrap gap-2">
                <button 
                  className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm"
                  onClick={() => setSearchQuery("")}
                >
                  All Transactions
                </button>
                <button 
                  className="px-3 py-1 bg-green-100 text-green-800 border border-green-300 rounded-md text-sm"
                  onClick={() => setSearchQuery("Stock In")}
                >
                  Stock In Only
                </button>
                <button 
                  className="px-3 py-1 bg-red-100 text-red-800 border border-red-300 rounded-md text-sm"
                  onClick={() => setSearchQuery("Stock Out")}
                >
                  Stock Out Only
                </button>
              </div>
              
              {isLoadingTransactions || isLoadingProducts || isLoadingCategories ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : transactionsError ? (
                <div className="bg-red-100 text-red-800 p-4 rounded-md">
                  Error loading transactions: {transactionsError.message}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => handleSort("timestamp")}
                          >
                            Date & Time {getSortIndicator("timestamp")}
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => handleSort("product")}
                          >
                            Product {getSortIndicator("product")}
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => handleSort("type")}
                          >
                            Type {getSortIndicator("type")}
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => handleSort("quantity")}
                          >
                            Quantity {getSortIndicator("quantity")}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Batch Info
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Reason
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sortedTransactions.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                              No transactions found. Try a different search or filter.
                            </td>
                          </tr>
                        ) : (
                          sortedTransactions.map(transaction => {
                            const product = products.find(p => p.id === transaction.productId);
                            
                            return (
                              <tr key={transaction.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {new Date(transaction.timestamp).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="font-medium text-gray-900">
                                    {getProductName(transaction.productId)}
                                  </div>
                                  {product && (
                                    <div className="text-xs text-gray-500">
                                      {getCategoryName(product.categoryId)}
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    transaction.type === "in" 
                                      ? "bg-green-100 text-green-800" 
                                      : "bg-red-100 text-red-800"
                                  }`}>
                                    {transaction.type === "in" ? "Stock In" : "Stock Out"}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {transaction.quantity}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {transaction.batchNumber && (
                                    <div className="font-medium text-gray-900">
                                      Batch: {transaction.batchNumber}
                                    </div>
                                  )}
                                  {transaction.expiryDate && (
                                    <div className="text-xs text-gray-500">
                                      Expires: {new Date(transaction.expiryDate).toLocaleDateString()}
                                    </div>
                                  )}
                                  {!transaction.batchNumber && !transaction.expiryDate && "-"}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs">
                                  {transaction.reason || "-"}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-4 text-gray-500 text-sm">
                    Showing {sortedTransactions.length} of {transactions.length} transactions
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StockPage;