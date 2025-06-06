import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// Simple app structure focusing on analytics
const App = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-blue-600">InCloud</h1>
          <span className="text-gray-500 ml-2">Inventory</span>
        </div>
      </header>
      
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r h-screen hidden md:block">
          <div className="p-4 h-full flex flex-col">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-blue-600">InCloud</h2>
              <p className="text-xs text-gray-500">Food Inventory Management</p>
            </div>
            
            <nav className="space-y-1 flex-1">
              {[
                { href: "/", label: "Dashboard", active: true },
                { href: "/products", label: "Products" },
                { href: "/stock", label: "Stock" },
                { href: "/expiration", label: "Expiration" },
                { href: "/low-stock", label: "Low Stock" },
                { href: "/reports", label: "Reports" },
                { href: "/orders", label: "Orders" }
              ].map((item) => (
                <a 
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                    item.active 
                      ? "bg-blue-600 text-white" 
                      : "text-gray-700 hover:bg-blue-50"
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>
        
        {/* Main content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="p-4 md:p-8 space-y-8">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            
            {/* Welcome card */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-2">
                Welcome to InCloud Inventory!
              </h2>
              <p className="text-gray-600">
                Here's an overview of your food inventory management system.
              </p>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Total Products", value: "24", color: "text-blue-600" },
                { title: "Low Stock Items", value: "5", color: "text-orange-500" },
                { title: "Expiring Soon", value: "8", color: "text-red-500" },
                { title: "Total Orders", value: "12", color: "text-green-500" }
              ].map((stat, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-sm text-gray-500 mb-1">{stat.title}</h3>
                  <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>
            
            {/* Analytics insight */}
            <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 relative mb-6">
              <div className="absolute -top-2 left-4 w-4 h-4 transform rotate-45 bg-blue-100 border-t border-l border-blue-300"></div>
              <h4 className="font-medium text-blue-800 mb-1">Inventory Analysis</h4>
              <p className="text-sm text-blue-700">
                Your dairy products are showing a 20% higher turnover rate compared to last month. 
                Consider increasing your stock levels to meet the growing demand.
              </p>
            </div>
            
            {/* Recent Activity */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {[
                  { type: "Stock In", item: "Whole Milk", quantity: 45, time: "Today, 9:30 AM" },
                  { type: "Stock Out", item: "Organic Apples", quantity: 12, time: "Today, 11:15 AM" },
                  { type: "New Order", item: "Branch #103", amount: "$1,245.00", time: "Yesterday, 3:45 PM" }
                ].map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 pb-3 border-b">
                    <div className={`rounded-full w-2 h-2 mt-2 ${
                      activity.type === "Stock In" ? "bg-green-500" :
                      activity.type === "Stock Out" ? "bg-orange-500" :
                      "bg-blue-500"
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.type}:</span> {" "}
                        {activity.item} {activity.quantity && `(${activity.quantity} units)`} {activity.amount}
                      </p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
}