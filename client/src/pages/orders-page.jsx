import React, { useState } from "react";
import { Layout } from "../components/layout/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";

const OrdersPage = () => {
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("branch"); // branch or supplier
  const [newOrder, setNewOrder] = useState({
    productId: "",
    quantity: 1,
    note: "",
    type: "in", // For supplier orders
    status: "pending" // Added status to track pending/completed orders
  });

  // Get product ID from URL if present
  const params = new URLSearchParams(window.location.search);
  const productIdParam = params.get("product");
  
  React.useEffect(() => {
    if (productIdParam) {
      setActiveTab("supplier");
      setNewOrder(prev => ({
        ...prev,
        productId: parseInt(productIdParam, 10)
      }));
    }
  }, [productIdParam]);

  // Fetch products
  const { 
    data: products = [], 
    isLoading: isLoadingProducts,
    error: productsError
  } = useQuery({ 
    queryKey: ["/api/products"],
  });
  
  // Fetch orders
  const { 
    data: orders = [], 
    isLoading: isLoadingOrders 
  } = useQuery({ 
    queryKey: ["/api/orders"],
    staleTime: 1000 * 60, // 1 minute
  });
  
  // Fetch stock transactions (for supplier orders)
  const {
    data: stockTransactions = [],
    isLoading: isLoadingTransactions
  } = useQuery({
    queryKey: ["/api/stock-transactions"],
    staleTime: 1000 * 60, // 1 minute
  });

  // Create supplier order mutation (for creating pending supplier orders)
  const createStockTransactionMutation = useMutation({
    mutationFn: async (transaction) => {
      // Add status as pending and add reason with "Supplier order"
      const res = await apiRequest("POST", "/api/stock-transactions", {
        ...transaction,
        status: "pending",
        reason: transaction.note || "Supplier order"
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock-transactions"] });
      toast({
        title: "Success",
        description: "Supplier order created successfully",
      });
      setNewOrder({
        productId: "",
        quantity: 1,
        note: "",
        type: "in",
        status: "pending"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Process supplier order mutation (when marking an order as completed)
  const processSupplierOrderMutation = useMutation({
    mutationFn: async (transaction) => {
      // This marks the transaction as completed and updates inventory
      const res = await apiRequest("POST", "/api/stock-transactions/process", transaction);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Supplier order processed and stock updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Cancel supplier order mutation
  const cancelSupplierOrderMutation = useMutation({
    mutationFn: async (transactionId) => {
      console.log("Cancelling transaction ID:", transactionId);
      const res = await apiRequest("DELETE", `/api/stock-transactions/${transactionId}`);
      console.log("Cancel response status:", res.status);
      if (!res.ok) {
        throw new Error(`Failed to cancel order: ${res.status}`);
      }
      return await res.json();
    },
    onSuccess: (data, transactionId) => {
      console.log("Cancel successful, invalidating cache...");
      queryClient.invalidateQueries({ queryKey: ["/api/stock-transactions"] });
      queryClient.refetchQueries({ queryKey: ["/api/stock-transactions"] });
      toast({
        title: "Success",
        description: "Supplier order canceled successfully",
      });
    },
    onError: (error) => {
      console.error("Cancel error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create order mutation (for branch orders)
  const createOrderMutation = useMutation({
    mutationFn: async (orderData) => {
      const res = await apiRequest("POST", "/api/orders", orderData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Order created successfully",
      });
      setNewOrder({
        productId: "",
        quantity: 1,
        note: "",
        type: "in",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewOrder(prev => ({
      ...prev,
      [name]: name === "quantity" ? parseInt(value, 10) || 1 : value
    }));
  };

  const handleSupplierOrderSubmit = (e) => {
    e.preventDefault();
    
    if (!newOrder.productId || !newOrder.quantity) {
      toast({
        title: "Validation Error",
        description: "Please select a product and specify quantity",
        variant: "destructive",
      });
      return;
    }
    
    // Create a supplier order (pending stock transaction)
    createStockTransactionMutation.mutate({
      productId: parseInt(newOrder.productId, 10),
      quantity: newOrder.quantity,
      type: "in",
      note: newOrder.note || "Supplier order"
    });
  };
  
  const handleProcessOrder = (transaction) => {
    processSupplierOrderMutation.mutate({
      id: transaction.id,
      productId: transaction.productId,
      quantity: transaction.quantity
    });
  };
  
  const handleCancelOrder = (transactionId) => {
    cancelSupplierOrderMutation.mutate(transactionId);
  };

  const handleBranchOrderSubmit = (e) => {
    e.preventDefault();
    
    if (!newOrder.productId || !newOrder.quantity) {
      toast({
        title: "Validation Error",
        description: "Please select a product and specify quantity",
        variant: "destructive",
      });
      return;
    }
    
    // Create an order with one item (this will also create a stock transaction of type "out")
    createOrderMutation.mutate({
      orderItems: [{
        productId: parseInt(newOrder.productId, 10),
        quantity: newOrder.quantity,
      }],
      customerName: "Branch Order",
      customerContact: newOrder.note || "Mobile App Order",
      status: "completed"
    });
  };

  // Branch orders = stock going out (to branches/customers)
  // Supplier orders = stock coming in (from suppliers)
  
  // Filter orders for display
  const branchOrders = orders.filter(order => order.customerName?.includes("Branch") || order.customerContact?.includes("Mobile App"));
  
  // Get supplier orders from stock transactions
  const supplierOrders = stockTransactions
    .filter(t => t.type === "in" && (t.reason || "").toLowerCase().includes("supplier"))
    .map(t => {
      const product = products.find(p => p.id === t.productId);
      return {
        id: t.id,
        productId: t.productId,
        productName: product ? product.name : `Product #${t.productId}`,
        quantity: t.quantity,
        date: t.timestamp,
        status: t.status || "completed",
        note: t.reason
      };
    });
    
  // Separate pending and completed supplier orders
  const pendingSupplierOrders = supplierOrders.filter(order => order.status === "pending");
  const completedSupplierOrders = supplierOrders.filter(order => order.status === "completed");

  // Sort orders by date (newest first)
  branchOrders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
  supplierOrders.sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <Layout>
      <div className="p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Orders Management</h1>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b">
          <div className="flex space-x-6">
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === "branch"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("branch")}
            >
              Branch Orders (Stock Out)
            </button>
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === "supplier"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("supplier")}
            >
              Supplier Orders (Stock In)
            </button>
          </div>
        </div>

        {/* Branch Orders (Mobile App) - Stock Out */}
        {activeTab === "branch" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Branch Orders</h2>
              <p className="text-gray-600 mb-4">
                Branch orders are created through the mobile app and displayed here. You can mark orders as complete to deduct stock.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Information</h3>
                    <div className="text-sm text-blue-700 mt-1">
                      <p>Branch orders are created through the mobile app. When you mark them as complete, the system automatically deducts inventory.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Branch Order List - Sample Orders */}
              <div className="space-y-4 mt-6">
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Pending</span>
                      <h3 className="font-medium mt-1">North Branch Order #2310</h3>
                      <p className="text-sm text-gray-500">2 items • May 23, 2023</p>
                    </div>
                    <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                      Mark Complete
                    </button>
                  </div>
                  <div className="mt-3 text-sm">
                    <p>• 10x Rice (2kg)</p>
                    <p>• 5x Cooking Oil (1L)</p>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Pending</span>
                      <h3 className="font-medium mt-1">East Branch Order #2309</h3>
                      <p className="text-sm text-gray-500">3 items • May 22, 2023</p>
                    </div>
                    <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                      Mark Complete
                    </button>
                  </div>
                  <div className="mt-3 text-sm">
                    <p>• 8x Milk (1L)</p>
                    <p>• 12x Eggs (Dozen)</p>
                    <p>• 6x Bread</p>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Completed</span>
                      <h3 className="font-medium mt-1">South Branch Order #2308</h3>
                      <p className="text-sm text-gray-500">1 item • May 21, 2023</p>
                    </div>
                  </div>
                  <div className="mt-3 text-sm">
                    <p>• 20x Sugar (1kg)</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="text-xl font-bold">Recent Branch Orders</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Products
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Branch/Reference
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isLoadingOrders ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          </div>
                        </td>
                      </tr>
                    ) : branchOrders.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                          No branch orders found
                        </td>
                      </tr>
                    ) : (
                      branchOrders.map((order) => {
                        const orderItems = order.orderItems || [];
                        return (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">#{order.id}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">
                                {orderItems.map((item, index) => {
                                  const product = products.find(p => p.id === item.productId);
                                  return (
                                    <div key={index}>
                                      {product ? `${item.quantity}x ${product.name}` : `Unknown Product (${item.quantity})`}
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {new Date(order.orderDate).toLocaleString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{order.customerContact}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                {order.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Supplier Orders - Stock In */}
        {activeTab === "supplier" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Create Supplier Order</h2>
              <p className="text-gray-600 mb-4">
                Supplier orders increase your inventory as products are received from suppliers.
              </p>
              
              <form onSubmit={handleSupplierOrderSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Product</label>
                    <select
                      name="productId"
                      value={newOrder.productId}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md"
                      required
                      disabled={isLoadingProducts}
                    >
                      <option value="">
                        {isLoadingProducts ? "Loading products..." : "Select Product"}
                      </option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} (Current: {product.currentStock})
                        </option>
                      ))}
                    </select>
                    {productsError && (
                      <p className="text-red-500 text-sm mt-1">
                        Error loading products. Please refresh the page.
                      </p>
                    )}
                    {!isLoadingProducts && products.length === 0 && (
                      <p className="text-gray-500 text-sm mt-1">
                        No products available. Please add products first.
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Quantity</label>
                    <input
                      type="number"
                      name="quantity"
                      value={newOrder.quantity}
                      onChange={handleInputChange}
                      min="1"
                      className="w-full p-2 border rounded-md"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Supplier Reference</label>
                    <input
                      type="text"
                      name="note"
                      value={newOrder.note}
                      onChange={handleInputChange}
                      placeholder="Supplier name or order reference"
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    disabled={createStockTransactionMutation.isPending}
                  >
                    {createStockTransactionMutation.isPending ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      "Create Supplier Order"
                    )}
                  </button>
                </div>
              </form>
            </div>
            
            {/* Pending Supplier Orders */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="text-xl font-bold">Pending Supplier Orders</h2>
                <p className="text-sm text-gray-600 mt-1">Orders that are waiting to be received and processed</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplier Reference
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
                    {isLoadingProducts ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 text-center">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          </div>
                        </td>
                      </tr>
                    ) : pendingSupplierOrders.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                          No pending supplier orders found
                        </td>
                      </tr>
                    ) : (
                      pendingSupplierOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">#{order.id}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{order.productName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{order.quantity}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {new Date(order.date).toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{order.note || "N/A"}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleProcessOrder(order)}
                                disabled={processSupplierOrderMutation.isPending}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs disabled:opacity-50"
                              >
                                Process
                              </button>
                              <button
                                onClick={() => handleCancelOrder(order.id)}
                                disabled={cancelSupplierOrderMutation.isPending}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default OrdersPage;