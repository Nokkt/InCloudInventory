import React, { useState } from "react";
import { Layout } from "../components/layout/Layout";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, BarChart3, MessageCircle } from "lucide-react";

const ReportsPage = () => {
  const [dateRange, setDateRange] = useState("month");
  const [reportType, setReportType] = useState("inventory");

  // Fetch data
  const { 
    data: products = [], 
    isLoading: isLoadingProducts
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
  
  const { 
    data: orders = [], 
    isLoading: isLoadingOrders
  } = useQuery({ 
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const res = await fetch("/api/orders");
      if (!res.ok) {
        throw new Error("Failed to load orders");
      }
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  const { 
    data: transactions = [], 
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
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
  
  // Loading state - defined after all queries
  const isLoading = isLoadingProducts || isLoadingOrders || isLoadingTransactions || isLoadingCategories;

  // Prepare data for charts
  const prepareCategoryData = () => {
    // Create a mapping of category IDs to names
    const categoryNames = {};
    categories.forEach(category => {
      categoryNames[category.id] = category.name;
    });
    
    const categoryMap = new Map();
    
    // Only include food products in the analytics
    const foodProducts = products.filter(product => product.isFoodProduct !== false);
    
    foodProducts.forEach(product => {
      const categoryId = product.categoryId;
      const categoryName = categoryNames[categoryId] || "Uncategorized";
      
      if (categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, categoryMap.get(categoryName) + 1);
      } else {
        categoryMap.set(categoryName, 1);
      }
    });
    
    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value); // Sort by value descending
  };
  
  const prepareInventoryValueData = () => {
    // Create a mapping of category IDs to names
    const categoryNames = {};
    categories.forEach(category => {
      categoryNames[category.id] = category.name;
    });
    
    const categoryMap = new Map();
    
    // Only include food products in the analytics
    const foodProducts = products.filter(product => product.isFoodProduct !== false);
    
    foodProducts.forEach(product => {
      const categoryId = product.categoryId;
      const categoryName = categoryNames[categoryId] || "Uncategorized";
      const value = (product.price || 0) * (product.currentStock || 0);
      
      if (categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, categoryMap.get(categoryName) + value);
      } else {
        categoryMap.set(categoryName, value);
      }
    });
    
    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value); // Sort by value descending
  };
  
  const prepareStockMovementData = () => {
    const now = new Date();
    const monthAgo = new Date();
    monthAgo.setMonth(now.getMonth() - 1);
    
    // Filter transactions for food products only
    const foodProductIds = new Set(products.filter(p => p.isFoodProduct !== false).map(p => p.id));
    const filtered = transactions.filter(t => 
      new Date(t.timestamp) >= monthAgo && foodProductIds.has(t.productId)
    );
    
    const stockInData = {};
    const stockOutData = {};
    
    filtered.forEach(transaction => {
      const date = new Date(transaction.timestamp);
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const dateKey = `${month}/${day}`;
      
      if (transaction.type === 'in') {
        stockInData[dateKey] = (stockInData[dateKey] || 0) + transaction.quantity;
      } else {
        stockOutData[dateKey] = (stockOutData[dateKey] || 0) + transaction.quantity;
      }
    });
    
    const result = [];
    const allDates = new Set([...Object.keys(stockInData), ...Object.keys(stockOutData)]);
    
    // If no data, return empty array instead of mock data
    if (allDates.size === 0) {
      return [];
    }
    
    // Sort dates
    const sortedDates = Array.from(allDates).sort((a, b) => {
      const [aMonth, aDay] = a.split('/').map(Number);
      const [bMonth, bDay] = b.split('/').map(Number);
      if (aMonth !== bMonth) return aMonth - bMonth;
      return aDay - bDay;
    });
    
    sortedDates.forEach(date => {
      result.push({
        date,
        in: stockInData[date] || 0,
        out: stockOutData[date] || 0
      });
    });
    
    return result;
  };
  
  // Generate monthly order data
  const prepareMonthlyOrdersData = () => {
    // Prepare data by month
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Initialize with 0 values
    const monthlyData = months.map(month => ({ month, value: 0 }));
    
    // Get food products only
    const foodProducts = products.filter(product => product.isFoodProduct !== false);
    const foodProductIds = new Set(foodProducts.map(p => p.id));
    
    // Calculate orders for food products
    orders.forEach(order => {
      const orderDate = new Date(order.orderDate);
      const monthIndex = orderDate.getMonth();
      
      // If we have order items, filter to include only food products
      const orderItems = order.orderItems || [];
      const foodOrderItems = orderItems.filter(item => foodProductIds.has(item.productId));
      
      // Add order value to the month's total (only for food products)
      if (foodOrderItems.length > 0) {
        const orderValue = foodOrderItems.reduce((sum, item) => {
          const product = foodProducts.find(p => p.id === item.productId);
          return sum + ((product?.price || 0) * item.quantity);
        }, 0);
        
        monthlyData[monthIndex].value += orderValue;
      }
    });
    
    // Return all months (will show zero for months with no data)
    return monthlyData;
  };
  
  // Generate data for top selling products
  const getTopSellingProducts = () => {
    // Get food products only
    const foodProducts = products.filter(product => product.isFoodProduct !== false);
    const productMap = new Map();
    
    // Initialize with 0 sales for each product
    foodProducts.forEach(product => {
      productMap.set(product.id, {
        id: product.id,
        name: product.name,
        quantity: 0
      });
    });
    
    // Aggregate quantities from order items
    orders.forEach(order => {
      const orderItems = order.orderItems || [];
      orderItems.forEach(item => {
        if (productMap.has(item.productId)) {
          const product = productMap.get(item.productId);
          product.quantity += item.quantity;
          productMap.set(item.productId, product);
        }
      });
    });
    
    // Convert to array, sort by quantity, and take top 5
    const topProducts = Array.from(productMap.values())
      .filter(product => product.quantity > 0)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
    
    // Calculate percentages for the progress bars
    if (topProducts.length > 0) {
      const maxQuantity = topProducts[0].quantity;
      topProducts.forEach(product => {
        product.percentage = Math.round((product.quantity / maxQuantity) * 100);
      });
    }
    
    return topProducts;
  };
  
  // Generate data for category sales
  const prepareCategorySalesData = () => {
    // Create a mapping of category IDs to names
    const categoryNames = {};
    categories.forEach(category => {
      categoryNames[category.id] = category.name;
    });
    
    // Get food products only
    const foodProducts = products.filter(product => product.isFoodProduct !== false);
    
    // Create a mapping of product IDs to data we need
    const productMap = {};
    foodProducts.forEach(product => {
      productMap[product.id] = {
        categoryId: product.categoryId,
        categoryName: categoryNames[product.categoryId] || "Uncategorized",
        price: product.price || 0
      };
    });
    
    // Aggregate sales by category
    const categorySales = {};
    
    orders.forEach(order => {
      const orderItems = order.orderItems || [];
      orderItems.forEach(item => {
        const product = productMap[item.productId];
        
        if (product) {
          const categoryName = product.categoryName;
          if (!categorySales[categoryName]) {
            categorySales[categoryName] = 0;
          }
          
          categorySales[categoryName] += (product.price * item.quantity);
        }
      });
    });
    
    // Convert to array format needed for pie chart
    const result = Object.entries(categorySales)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
    
    return result;
  };

  // Calculate descriptive analytics
  const calculateDescriptiveAnalytics = () => {
    const foodProducts = products.filter(product => product.isFoodProduct !== false);
    
    // Stock level analysis
    const totalProducts = foodProducts.length;
    const totalStock = foodProducts.reduce((sum, p) => sum + (p.currentStock || 0), 0);
    const averageStockPerProduct = totalProducts > 0 ? Math.round(totalStock / totalProducts) : 0;
    
    // Low stock analysis
    const lowStockItems = foodProducts.filter(p => (p.currentStock || 0) <= 50);
    const lowStockPercentage = totalProducts > 0 ? Math.round((lowStockItems.length / totalProducts) * 100) : 0;
    
    // Category analysis
    const categoryMap = new Map();
    foodProducts.forEach(product => {
      const categoryId = product.categoryId;
      const categoryName = categories.find(c => c.id === categoryId)?.name || "Uncategorized";
      
      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, { count: 0, totalStock: 0 });
      }
      
      const data = categoryMap.get(categoryName);
      data.count += 1;
      data.totalStock += (product.currentStock || 0);
      categoryMap.set(categoryName, data);
    });
    
    const topCategory = Array.from(categoryMap.entries())
      .sort((a, b) => b[1].count - a[1].count)[0];
    
    // Stock movement analysis
    const recentTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.timestamp);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return transactionDate >= thirtyDaysAgo;
    });
    
    const stockInTotal = recentTransactions
      .filter(t => t.type === 'in')
      .reduce((sum, t) => sum + t.quantity, 0);
    
    const stockOutTotal = recentTransactions
      .filter(t => t.type === 'out')
      .reduce((sum, t) => sum + t.quantity, 0);
    
    const netStockChange = stockInTotal - stockOutTotal;
    const stockTurnover = stockOutTotal > 0 && totalStock > 0 ? 
      Math.round((stockOutTotal / totalStock) * 100) : 0;
    
    return {
      totalProducts,
      totalStock,
      averageStockPerProduct,
      lowStockItems: lowStockItems.length,
      lowStockPercentage,
      topCategory: topCategory ? topCategory[0] : "No categories",
      stockInTotal,
      stockOutTotal,
      netStockChange,
      stockTurnover
    };
  };

  // Calculate prescriptive analytics
  const calculatePrescriptiveAnalytics = () => {
    const foodProducts = products.filter(product => product.isFoodProduct !== false);
    
    // Analyze stock movement patterns by product
    const productAnalysis = new Map();
    
    foodProducts.forEach(product => {
      const productTransactions = transactions.filter(t => t.productId === product.id);
      
      // Get recent transactions (last 30 days)
      const recentTransactions = productTransactions.filter(t => {
        const transactionDate = new Date(t.timestamp);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return transactionDate >= thirtyDaysAgo;
      });
      
      const stockIn = recentTransactions
        .filter(t => t.type === 'in')
        .reduce((sum, t) => sum + t.quantity, 0);
      
      const stockOut = recentTransactions
        .filter(t => t.type === 'out')
        .reduce((sum, t) => sum + t.quantity, 0);
      
      const currentStock = product.currentStock || 0;
      const velocity = stockOut > 0 ? stockOut / 30 : 0; // daily velocity
      const daysUntilStockout = velocity > 0 ? Math.floor(currentStock / velocity) : Infinity;
      
      productAnalysis.set(product.id, {
        name: product.name,
        currentStock,
        stockIn,
        stockOut,
        velocity,
        daysUntilStockout,
        isLowStock: currentStock <= 50,
        category: categories.find(c => c.id === product.categoryId)?.name || "Uncategorized"
      });
    });
    
    // Find products that need attention
    const needsRestocking = Array.from(productAnalysis.values())
      .filter(p => p.daysUntilStockout < 14 && p.daysUntilStockout !== Infinity)
      .sort((a, b) => a.daysUntilStockout - b.daysUntilStockout)
      .slice(0, 3);
    
    const overstocked = Array.from(productAnalysis.values())
      .filter(p => p.velocity < 1 && p.currentStock > 100)
      .sort((a, b) => b.currentStock - a.currentStock)
      .slice(0, 3);
    
    const fastMoving = Array.from(productAnalysis.values())
      .filter(p => p.velocity > 5)
      .sort((a, b) => b.velocity - a.velocity)
      .slice(0, 3);
    
    // Category-level insights
    const categoryPerformance = new Map();
    
    Array.from(productAnalysis.values()).forEach(product => {
      if (!categoryPerformance.has(product.category)) {
        categoryPerformance.set(product.category, {
          totalVelocity: 0,
          productCount: 0,
          lowStockCount: 0
        });
      }
      
      const data = categoryPerformance.get(product.category);
      data.totalVelocity += product.velocity;
      data.productCount += 1;
      if (product.isLowStock) data.lowStockCount += 1;
      categoryPerformance.set(product.category, data);
    });
    
    const bestPerformingCategory = Array.from(categoryPerformance.entries())
      .map(([name, data]) => ({
        name,
        avgVelocity: data.totalVelocity / data.productCount,
        lowStockRate: (data.lowStockCount / data.productCount) * 100
      }))
      .sort((a, b) => b.avgVelocity - a.avgVelocity)[0];
    
    return {
      needsRestocking,
      overstocked,
      fastMoving,
      bestPerformingCategory: bestPerformingCategory || { name: "No data", avgVelocity: 0 }
    };
  };
  
  // Chart data
  const categoryData = prepareCategoryData();
  const inventoryValueData = prepareInventoryValueData();
  const stockMovementData = prepareStockMovementData();
  
  // Calculate analytics
  const descriptiveData = calculateDescriptiveAnalytics();
  const prescriptiveData = calculatePrescriptiveAnalytics();
  
  // Colors for pie charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  // Speech Bubble Component
  const SpeechBubble = ({ title, children, icon: Icon, type = "info" }) => {
    const bgColor = type === "warning" ? "bg-amber-50" : type === "success" ? "bg-green-50" : "bg-blue-50";
    const borderColor = type === "warning" ? "border-amber-200" : type === "success" ? "border-green-200" : "border-blue-200";
    const iconColor = type === "warning" ? "text-amber-600" : type === "success" ? "text-green-600" : "text-blue-600";
    
    return (
      <div className={`relative ${bgColor} ${borderColor} border-2 rounded-lg p-6 shadow-sm`}>
        <div className="flex items-start space-x-3">
          {Icon && <Icon className={`h-6 w-6 ${iconColor} mt-1 flex-shrink-0`} />}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
            <div className="text-gray-700 text-sm leading-relaxed">{children}</div>
          </div>
        </div>
        {/* Speech bubble tail */}
        <div className={`absolute -bottom-2 left-8 w-4 h-4 ${bgColor} ${borderColor} border-b-2 border-r-2 transform rotate-45`}></div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          
          <div className="flex space-x-4">
            <select 
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="px-4 py-2 border rounded-md bg-white"
            >
              <option value="inventory">Inventory Reports</option>
              <option value="sales">Sales Reports</option>
            </select>
            
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border rounded-md bg-white"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Top insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow border">
                <h3 className="text-lg font-medium mb-2">Total Products</h3>
                <p className="text-3xl font-bold">{products.length}</p>
                <p className="text-sm text-gray-500 mt-1">Across {categoryData.length} categories</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow border">
                <h3 className="text-lg font-medium mb-2">Inventory Value</h3>
                <p className="text-3xl font-bold">₱{inventoryValueData.reduce((sum, item) => sum + item.value, 0).toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-1">Total value of all products</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow border">
                <h3 className="text-lg font-medium mb-2">Low Stock Items</h3>
                <p className="text-3xl font-bold">{products.filter(p => p.currentStock <= 50).length}</p>
                <p className="text-sm text-gray-500 mt-1">Products below threshold</p>
              </div>
            </div>
            
            {/* Charts - Inventory Reports */}
            {reportType === "inventory" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow border">
                  <h3 className="text-lg font-medium mb-4">Product Categories Distribution</h3>
                  <div className="h-80">
                    {categoryData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [value, "Products"]} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <BarChart3 className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium">No Product Categories</p>
                        <p className="text-sm">Add food products with categories to see distribution</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow border">
                  <h3 className="text-lg font-medium mb-4">Inventory Value by Category</h3>
                  <div className="h-80">
                    {inventoryValueData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={inventoryValueData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {inventoryValueData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`₱${value.toLocaleString()}`, "Value"]} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <BarChart3 className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium">No Inventory Value Data</p>
                        <p className="text-sm">Add products with prices to see inventory value distribution</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow border md:col-span-2">
                  <h3 className="text-lg font-medium mb-4">Stock Movement Trends</h3>
                  <div className="h-80">
                    {stockMovementData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={stockMovementData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="in" name="Stock In" fill="#82ca9d" />
                          <Bar dataKey="out" name="Stock Out" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <TrendingUp className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium">No Stock Movement Data</p>
                        <p className="text-sm">Add products and record stock transactions to see movement trends</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Charts - Sales Reports */}
            {reportType === "sales" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow border md:col-span-2">
                  <h3 className="text-lg font-medium mb-4">Monthly Food Sales</h3>
                  <div className="h-80">
                    {prepareMonthlyOrdersData().some(month => month.value > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={prepareMonthlyOrdersData()}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value) => [`₱${value.toLocaleString()}`, "Sales"]} />
                          <Bar dataKey="value" name="Sales Value" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <TrendingUp className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium">No Sales Data</p>
                        <p className="text-sm">Create orders with food products to see monthly sales trends</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow border">
                  <h3 className="text-lg font-medium mb-4">Top Selling Food Products</h3>
                  {getTopSellingProducts().length > 0 ? (
                    <div className="space-y-4">
                      {getTopSellingProducts().map((product, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div className="flex-1 mr-4">
                            <p className="font-medium">{product.name}</p>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${product.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                          <p className="font-medium whitespace-nowrap">{product.quantity} units</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-48 text-gray-500">
                      No sales data available
                    </div>
                  )}
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow border">
                  <h3 className="text-lg font-medium mb-4">Product Categories by Sales</h3>
                  <div className="h-64">
                    {prepareCategorySalesData().length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={prepareCategorySalesData()}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {prepareCategorySalesData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`₱${value.toLocaleString()}`, "Sales"]} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <BarChart3 className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium">No Category Sales Data</p>
                        <p className="text-sm">Process orders to see sales by category</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Analytics Section with Speech Bubbles */}
            <div className="space-y-8 mt-8">
              <div className="flex items-center space-x-2 mb-6">
                <BarChart3 className="h-6 w-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Inventory Analytics & Insights</h2>
              </div>
              
              {/* Descriptive Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <SpeechBubble 
                  title="📊 Descriptive Analytics - Current State" 
                  icon={BarChart3}
                  type="info"
                >
                  <div className="space-y-3">
                    <p><strong>Inventory Overview:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Total products: <strong>{descriptiveData.totalProducts}</strong> food items</li>
                      <li>Total stock units: <strong>{descriptiveData.totalStock.toLocaleString()}</strong></li>
                      <li>Average stock per product: <strong>{descriptiveData.averageStockPerProduct}</strong> units</li>
                      <li>Top category: <strong>{descriptiveData.topCategory}</strong></li>
                    </ul>
                    
                    <p className="mt-3"><strong>Stock Movement (Last 30 days):</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Stock received: <strong>{descriptiveData.stockInTotal.toLocaleString()}</strong> units</li>
                      <li>Stock consumed: <strong>{descriptiveData.stockOutTotal.toLocaleString()}</strong> units</li>
                      <li>Net change: <strong style={{color: descriptiveData.netStockChange >= 0 ? 'green' : 'red'}}>
                        {descriptiveData.netStockChange >= 0 ? '+' : ''}{descriptiveData.netStockChange.toLocaleString()}</strong> units</li>
                      <li>Stock turnover rate: <strong>{descriptiveData.stockTurnover}%</strong></li>
                    </ul>
                    
                    <p className="mt-3"><strong>Risk Analysis:</strong></p>
                    <p className="ml-2">
                      <span className={descriptiveData.lowStockPercentage > 20 ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                        {descriptiveData.lowStockItems} products ({descriptiveData.lowStockPercentage}%) are below the 50-unit threshold
                      </span>
                    </p>
                  </div>
                </SpeechBubble>
                
                {/* Prescriptive Analytics */}
                <SpeechBubble 
                  title="🎯 Prescriptive Analytics - Action Required" 
                  icon={AlertTriangle}
                  type={prescriptiveData.needsRestocking.length > 0 ? "warning" : "success"}
                >
                  <div className="space-y-3">
                    <p><strong>Immediate Actions Needed:</strong></p>
                    
                    {prescriptiveData.needsRestocking.length > 0 ? (
                      <div>
                        <p className="text-red-600 font-medium">⚠️ Urgent Restocking Required:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          {prescriptiveData.needsRestocking.map((product, index) => (
                            <li key={index}>
                              <strong>{product.name}</strong> - Only {product.daysUntilStockout} days of stock remaining 
                              ({product.currentStock} units at {product.velocity.toFixed(1)} units/day velocity)
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-green-600">✅ No urgent restocking needed</p>
                    )}
                    
                    {prescriptiveData.fastMoving.length > 0 && (
                      <div className="mt-3">
                        <p className="text-blue-600 font-medium">🚀 High-Velocity Products (Increase stock levels):</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          {prescriptiveData.fastMoving.map((product, index) => (
                            <li key={index}>
                              <strong>{product.name}</strong> - {product.velocity.toFixed(1)} units/day
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {prescriptiveData.overstocked.length > 0 && (
                      <div className="mt-3">
                        <p className="text-orange-600 font-medium">📦 Overstocked Items (Consider reducing orders):</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          {prescriptiveData.overstocked.map((product, index) => (
                            <li key={index}>
                              <strong>{product.name}</strong> - {product.currentStock} units, slow velocity ({product.velocity.toFixed(1)}/day)
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="mt-3">
                      <p><strong>Best Performing Category:</strong></p>
                      <p className="ml-2">
                        <strong>{prescriptiveData.bestPerformingCategory.name}</strong> 
                        {prescriptiveData.bestPerformingCategory.avgVelocity > 0 && 
                          ` (${prescriptiveData.bestPerformingCategory.avgVelocity.toFixed(1)} avg velocity)`
                        }
                      </p>
                    </div>
                  </div>
                </SpeechBubble>
              </div>
              
              {/* Additional Strategic Insights */}
              <div className="grid grid-cols-1 gap-6">
                <SpeechBubble 
                  title="💡 Strategic Recommendations" 
                  icon={CheckCircle}
                  type="success"
                >
                  <div className="space-y-3">
                    <p><strong>Inventory Optimization Strategy:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>
                        <strong>Reorder Point Strategy:</strong> Set automatic reorder triggers at 14-day supply levels 
                        to prevent stockouts for high-velocity items
                      </li>
                      <li>
                        <strong>Category Focus:</strong> Prioritize {prescriptiveData.bestPerformingCategory.name} category 
                        for inventory investment due to high turnover
                      </li>
                      <li>
                        <strong>Stock Optimization:</strong> 
                        {descriptiveData.stockTurnover < 20 ? 
                          " Consider reducing overall inventory levels to improve cash flow - current turnover is low" :
                          " Maintain current stock levels - healthy turnover rate detected"
                        }
                      </li>
                      <li>
                        <strong>Risk Mitigation:</strong> 
                        {descriptiveData.lowStockPercentage > 20 ?
                          ` ${descriptiveData.lowStockPercentage}% of products are at risk - implement safety stock policies` :
                          " Current stock levels are well-maintained across most products"
                        }
                      </li>
                      <li>
                        <strong>Seasonal Planning:</strong> Use velocity trends to forecast demand and adjust procurement cycles 
                        for perishable items
                      </li>
                    </ul>
                  </div>
                </SpeechBubble>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ReportsPage;