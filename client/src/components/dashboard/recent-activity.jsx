import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowRightCircle, 
  ArrowLeftCircle, 
  AlertTriangle, 
  ShoppingCart 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";


    orderNumber?: string;
    amount?: number;
    quantity?: number;
    reason?: string;
    user?: string;
  };
}



export function RecentActivity({ activities }= (type=> {
    switch (type) {
      case "stock_in"="rounded-full bg-blue-100 p-2 mr-3 mt-1">
            
          
        );
      case "stock_out"="rounded-full bg-red-100 p-2 mr-3 mt-1">
            
          
        );
      case "low_stock"="rounded-full bg-amber-100 p-2 mr-3 mt-1">
            
          
        );
      case "new_order"="rounded-full bg-green-100 p-2 mr-3 mt-1">
            
          
        );
    }
  };

  const getActivityText = (activity=> {
    switch (activity.type) {
      case "stock_in":
        return `New stock received - ${activity.details.product?.name} (${activity.details.quantity} units)`;
      case "stock_out":
        return `Stock out - ${activity.details.product?.name} (${activity.details.quantity} units)`;
      case "low_stock":
        return `Low stock alert - ${activity.details.product?.name}`;
      case "new_order":
        return `New order #${activity.details.orderNumber} received`;
    }
  };

  const formatTimestamp = (timestamp=> {
    const now = new Date();
    const activityDate = new Date(timestamp);
    
    // If today
    if (activityDate.setHours(0, 0, 0, 0) === now.setHours(0, 0, 0, 0)) {
      return `Today, ${format(new Date(timestamp), "h)}`;
    }

    // If yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (activityDate.setHours(0, 0, 0, 0) === yesterday.setHours(0, 0, 0, 0)) {
      return `Yesterday, ${format(new Date(timestamp), "h)}`;
    }

    // Otherwise
    return format(new Date(timestamp), "MMM d, yyyy, h);
  };

  return (
    
      
        
          Recent Activity
          View All
        
        
        {activities.length === 0 ? (
          
            No recent activity to display
          
        ) ="space-y-4">
            {activities.map((activity, index) => (
              <li key={index} className={cn(
                "flex items-start pb-4",
                index 
                {getActivityIcon(activity.type)}
                
                  
                    {getActivityText(activity)}
                  
                  
                    {formatTimestamp(activity.timestamp)}
                  
                
              
            ))}
          
        )}
      
    
  );
}
