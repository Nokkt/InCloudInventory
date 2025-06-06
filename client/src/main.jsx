import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line,
  PieChart, Pie, Cell, Legend
} from "recharts";

// Dashboard Analytics Component
const AnalyticsCard = ({ title, children, insight, insightType = "info" }) => {
  const getBubbleStyle = () => {
    switch (insightType) {
      case "success": return "bg-green-100 border-green-300 text-green-800";
      case "warning": return "bg-orange-100 border-orange-300 text-orange-800";
      case "danger": return "bg-red-100 border-red-300 text-red-800";
      default: return "bg-blue-100 border-blue-300 text-blue-800";
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow border">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <div className="h-60 mb-4">{children}</div>
      
      {insight && (
        <div className={`p-4 rounded-lg ${getBubbleStyle()} border relative mt-2`}>
          <div className={`absolute -top-2 left-4 w-4 h-4 transform rotate-45 ${getBubbleStyle()}`}></div>
          <p className="text-sm">{insight}</p>
        </div>
      )}
    </div>
  );
};

// Stats Card Component
const StatCard = ({ title, value, icon, color = "text-blue-600" }) => (
  <div className="bg-white p-6 rounded-lg shadow border">
    <div className="flex justify-between items-center mb-2">
      <h3 className="text-sm text-gray-500">{title}</h3>
      {icon && <div className={color}>{icon}</div>}
    </div>
    <p className="text-3xl font-bold">{value}</p>
  </div>
);

// Activity Item Component
const ActivityItem = ({ type, details, date }) => {
  const getTypeColor = () => {
    if (type === "transaction") {
      return details.includes("Added") ? "bg-green-500" : "bg-orange-500";
    }
    return "bg-blue-500";
  };
  
  return (
    <div className="flex items-start space-x-3 py-2 border-b">
      <div className={`rounded-full w-2 h-2 mt-2 ${getTypeColor()}`}></div>
      <div className="flex-1">
        <p className="text-sm">{details}</p>
        <p className="text-xs text-gray-500">{date}</p>
      </div>
    </div>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const [dashboardStats, setDashboardStats] = useState({
    totalProducts: 24,
    lowStockCount: 5,
    expiringCount: 8,
    totalOrders: 12,
    recentActivity: [
      { type: "transaction", details: "Added 45 units of Whole Milk", date: "Today, 9:30 AM" },
      { type: "transaction", details: "Removed 12 units of Organic Apples", date: "Today, 11:15 AM" },
      { type: "order", details: "New order #103 created", date: "Yesterday, 3:45 PM" }
    ]
  });

  const [stockTrend, setStockTrend] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [turnoverData, setTurnoverData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Simulate API fetch
  useEffect(() => {
    // Generate demo data for charts
    const generateDemoData = () => {
      // Stock trend data (last 7 days)
      const stockTrendData = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        stockTrendData.push({
          name: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          value: Math.floor(Math.random() * 2000) + 5000
        });
      }
      
      // Category data
      const categoryChartData = [
        { name: "Dairy", value: 35 },
        { name: "Produce", value: 30 },
        { name: "Meat", value: 20 },
        { name: "Bakery", value: 10 },
        { name: "Beverages", value: 5 }
      ];
      
      // Turnover rate data
      const turnoverChartData = [
        { name: "Dairy", rate: 0.8 },
        { name: "Produce", rate: 0.9 },
        { name: "Meat", rate: 0.7 },
        { name: "Bakery", rate: 0.85 },
        { name: "Beverages", rate: 0.4 }
      ];
      
      return { stockTrendData, categoryChartData, turnoverChartData };
    };
    
    // Simulate API fetch delay
    setTimeout(() => {
      const { stockTrendData, categoryChartData, turnoverChartData } = generateDemoData();
      setStockTrend(stockTrendData);
      setCategoryData(categoryChartData);
      setTurnoverData(turnoverChartData);
      setIsLoading(false);
    }, 1000);
  }, []);

  return (
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
        <StatCard 
          title="Total Products" 
          value={dashboardStats.totalProducts}
          color="text-blue-600" 
        />
        
        <StatCard 
          title="Low Stock Items" 
          value={dashboardStats.lowStockCount}
          color="text-orange-500" 
        />
        
        <StatCard 
          title="Expiring Soon" 
          value={dashboardStats.expiringCount}
          color="text-red-500" 
        />
        
        <StatCard 
          title="Total Orders" 
          value={dashboardStats.totalOrders}
          color="text-green-500" 
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <div className="space-y-1">
            {dashboardStats.recentActivity.map((activity, index) => (
              <ActivityItem 
                key={index} 
                type={activity.type} 
                details={activity.details} 
                date={activity.date} 
              />
            ))}
          </div>
        </div>
        
        {/* Inventory Trend Analysis */}
        <AnalyticsCard 
          title="Inventory Trend"
          insight="Your overall inventory value has increased by 15% in the last week, indicating healthy stock levels."
          insightType="success"
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={stockTrend}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  activeDot={{ r: 8 }} 
                  name="Total Value ($)"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </AnalyticsCard>
      </div>
      
      {/* Category Distribution */}
      <AnalyticsCard 
        title="Category Distribution"
        insight="Dairy and Produce categories represent the largest portion of your inventory. Consider optimizing storage space allocation based on these proportions."
        insightType="info"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {categoryData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={[
                      "#3b82f6", "#10b981", "#ef4444", 
                      "#f59e0b", "#8b5cf6"
                    ][index % 5]} 
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </AnalyticsCard>
      
      {/* Turnover Rate Analysis */}
      <AnalyticsCard 
        title="Category Turnover Rate"
        insight="Produce has the highest turnover rate at 90%. Consider increasing dairy inventory as it's becoming a high-demand category."
        insightType="success"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={turnoverData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `${(value * 100).toFixed(0)}%`} />
              <Bar 
                dataKey="rate" 
                name="Turnover Rate" 
                fill="#3b82f6"
                radius={[4, 4, 0, 0]} 
              >
                {turnoverData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.rate > 0.8 ? "#10b981" : entry.rate > 0.6 ? "#3b82f6" : "#f59e0b"} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </AnalyticsCard>
      
      {/* Expiration Analytics */}
      <AnalyticsCard 
        title="Expiration Forecast"
        insight="There's a significant increase in products expiring next month. Consider running promotions on these items to minimize waste."
        insightType="warning"
      >
        <div className="flex items-center justify-center h-full">
          <div className="w-full">
            <div className="flex justify-between mb-4">
              <div className="text-sm text-gray-500">This Month</div>
              <div className="text-sm font-medium">8 products</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: '25%' }}></div>
            </div>
            
            <div className="flex justify-between mb-4 mt-6">
              <div className="text-sm text-gray-500">Next Month</div>
              <div className="text-sm font-medium">15 products</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-red-500 h-2.5 rounded-full" style={{ width: '45%' }}></div>
            </div>
            
            <div className="mt-6 border-t pt-4">
              <h4 className="text-sm font-medium mb-2">Top Expiring Products</h4>
              <div className="space-y-2">
                {[
                  { name: "Whole Milk", days: 3, quantity: 12 },
                  { name: "Organic Yogurt", days: 5, quantity: 8 },
                  { name: "Fresh Bread", days: 2, quantity: 6 }
                ].map((product, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="text-sm">{product.name}</div>
                    <div className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                      {product.days} days left • {product.quantity} units
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AnalyticsCard>
    </div>
  );
};

// App Component with Navigation
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
                { href: "/reports", label: "Reports & Analytics" },
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
            
            <div className="pt-4 mt-auto">
              <div className="px-3 py-2 text-xs text-gray-500">
                <p>InCloud v1.0</p>
                <p className="mt-1">© 2025 InCloud Systems</p>
              </div>
            </div>
          </div>
        </aside>
        
        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <Dashboard />
        </main>
      </div>
    </div>
  );
};

// Export the App component
export default App;