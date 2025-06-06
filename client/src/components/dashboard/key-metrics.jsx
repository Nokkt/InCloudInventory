import {
  LayoutDashboard,
  AlertTriangle,
  Calendar,
  ShoppingCart,
  ArrowUp
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";



function MetricCard({ title, value, change, icon, iconClass, changeType = "neutral" }="p-6 flex items-center">
        
          {icon}
        
        
          {title}
          {value}
          {change && (
            
              {changeType !== "neutral" && }
              {change}
            
          )}
        
      
    
  );
}



export function KeyMetrics({
  totalProducts,
  lowStockItems,
  expiringProducts,
  totalOrders,
  productGrowth = "12.5% from last month",
  lowStockChange = "4 more than yesterday",
  expiringTimeframe = "Next 30 days",
  ordersGrowth = "23.6% from last month"
}="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <MetricCard
        title="Total Products"
        value={totalProducts}
        change={productGrowth}
        icon={}
        iconClass="bg-blue-100"
        changeType="increase"
      />
      
      <MetricCard
        title="Low Stock Items"
        value={lowStockItems}
        change={lowStockChange}
        icon={}
        iconClass="bg-amber-100"
        changeType="decrease"
      />
      
      <MetricCard
        title="Expiring Soon"
        value={expiringProducts}
        change={expiringTimeframe}
        icon={}
        iconClass="bg-red-100"
        changeType="neutral"
      />
      
      <MetricCard
        title="Total Orders"
        value={totalOrders}
        change={ordersGrowth}
        icon={}
        iconClass="bg-green-100"
        changeType="increase"
      />
    
  );
}
