import React, { useState, useEffect } from "react";
import { Layout } from "../components/layout/Layout";
import { useAuth } from "../hooks/use-auth";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

// Activity Item Component
const ActivityItem = ({ type, details, date }) => {
  const getIcon = () => {
    switch (type) {
      case "transaction":
        return (
          <div className="p-2 rounded-full bg-blue-100 text-blue-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
            </svg>
          </div>
        );
      case "order":
        return (
          <div className="p-2 rounded-full bg-green-100 text-green-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="p-2 rounded-full bg-gray-100 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="flex items-start space-x-3 py-2">
      {getIcon()}
      <div className="flex-1">
        <p className="text-sm font-medium">{details}</p>
        <p className="text-xs text-gray-500">{date}</p>
      </div>
    </div>
  );
};

// Stats Card Component
const StatCard = ({ title, value, icon, color = "text-blue-600", link = null }) => {
  const content = (
    <div className="flex items-center cursor-pointer">
      <div className={`${color} p-3 rounded-full bg-opacity-10`}>
        {icon}
      </div>
      <div className="ml-4">
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-semibold">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow border hover:shadow-md transition-shadow">
      {link ? (
        <Link href={link}>
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch products
  const { 
    data: products = [], 
    isLoading: isLoadingProducts
  } = useQuery({ 
    queryKey: ["/api/products"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Fetch stock transactions
  const { 
    data: transactions = [], 
    isLoading: isLoadingTransactions
  } = useQuery({ 
    queryKey: ["/api/stock-transactions"],
    staleTime: 1000 * 60, // 1 minute
  });
  
  // Calculate dashboard stats
  const totalProducts = products.length;
  
  // Products with stock below 50 items
  const lowStockProducts = products.filter(p => p.currentStock <= 50);
  const lowStockCount = lowStockProducts.length;
  
  // Products expiring within 30 days
  const expiringProducts = products.filter(product => {
    if (!product.expiryDate) return false;
    
    const expiryDate = new Date(product.expiryDate);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= 30 && diffDays > 0;
  });
  const expiringCount = expiringProducts.length;
  
  // Recent activity from transactions
  const recentActivity = transactions
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5)
    .map(transaction => {
      const product = products.find(p => p.id === transaction.productId);
      const productName = product ? product.name : "Unknown Product";
      
      return {
        type: "transaction",
        details: `${transaction.type === "in" ? "Added" : "Removed"} ${transaction.quantity} units of ${productName}`,
        date: new Date(transaction.timestamp).toLocaleString()
      };
    });
  
  // Set loading state based on all data fetches
  useEffect(() => {
    if (!isLoadingProducts && !isLoadingTransactions) {
      setIsLoading(false);
    }
  }, [isLoadingProducts, isLoadingTransactions]);

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-500">Welcome back, {user?.name || "User"}</p>
        </div>
        
        {/* Stats overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total Products" 
            value={totalProducts} 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }
            link="/products" 
          />
          
          <StatCard 
            title="Low Stock Items" 
            value={lowStockCount} 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            } 
            color="text-orange-500"
            link="/low-stock" 
          />
          
          <StatCard 
            title="Expiring Soon" 
            value={expiringCount} 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            } 
            color="text-red-500" 
            link="/expiration"
          />
          
          <StatCard 
            title="Stock Transactions" 
            value={transactions.length} 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            } 
            color="text-blue-600" 
            link="/stock"
          />
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Recent Activity</h2>
              <Link href="/stock">
                <span className="text-sm text-blue-600 hover:underline cursor-pointer">View All</span>
              </Link>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                No recent activity found
              </div>
            ) : (
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {recentActivity.map((activity, index) => (
                  <ActivityItem 
                    key={index} 
                    type={activity.type} 
                    details={activity.details} 
                    date={activity.date} 
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/products">
                <div className="bg-blue-50 hover:bg-blue-100 transition-colors p-4 rounded-lg border border-blue-200 flex flex-col items-center text-center cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="font-medium">Add New Product</span>
                </div>
              </Link>
              
              <Link href="/stock">
                <div className="bg-green-50 hover:bg-green-100 transition-colors p-4 rounded-lg border border-green-200 flex flex-col items-center text-center cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                  <span className="font-medium">Record Stock Transaction</span>
                </div>
              </Link>
              
              <Link href="/orders">
                <div className="bg-purple-50 hover:bg-purple-100 transition-colors p-4 rounded-lg border border-purple-200 flex flex-col items-center text-center cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="font-medium">Create Order</span>
                </div>
              </Link>
              
              <Link href="/expiration">
                <div className="bg-red-50 hover:bg-red-100 transition-colors p-4 rounded-lg border border-red-200 flex flex-col items-center text-center cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Check Expiring Items</span>
                </div>
              </Link>
            </div>
          </div>
          
          {/* Critical Alerts */}
          {(lowStockCount > 0 || expiringCount > 0) && (
            <div className="bg-white p-6 rounded-lg shadow border">
              <h2 className="text-xl font-bold mb-4">Critical Alerts</h2>
              <div className="space-y-4">
                {lowStockCount > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-orange-800">Low Stock Alert</h3>
                        <div className="mt-2 text-sm text-orange-700">
                          <p>You have {lowStockCount} products with less than 50 items in stock.</p>
                        </div>
                        <div className="mt-3">
                          <Link href="/low-stock">
                            <span className="text-sm font-medium text-orange-800 hover:text-orange-600 cursor-pointer">
                              View low stock items →
                            </span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {expiringCount > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Expiration Alert</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>You have {expiringCount} products expiring within 30 days.</p>
                        </div>
                        <div className="mt-3">
                          <Link href="/expiration">
                            <span className="text-sm font-medium text-red-800 hover:text-red-600 cursor-pointer">
                              View expiring items →
                            </span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;