import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User, Calendar, FileText, Check, X, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";





export function OrderCard({
  id,
  orderNumber,
  customerName,
  date,
  totalAmount,
  status,
  items,
  onViewDetails,
  onUpdateStatus,
}= () => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    
      
        
          
            
              
                
                {orderNumber}
              
              {customerName && (
                
                  
                  {customerName}
                
              )}
            
            {status}
          

          
            
              
              {format(new Date(date), "MMM d, yyyy")}
            
            
              ${totalAmount.toFixed(2)}
            
          
        

        {items && items.length > 0 && (
          
            Items
            
              {items.slice(0, 3).map((item) => (
                
                  
                    {item.quantity} x {item.productName}
                  
                  ${(item.quantity * item.unitPrice).toFixed(2)}
                
              ))}
              {items.length > 3 && (
                
                  +{items.length - 3} more items
                
              )}
            
          
        )}
      

      
         onViewDetails && onViewDetails(id)}
        >
          
          View Details
        

        {status === "pending" && (
          
             onUpdateStatus && onUpdateStatus(id, "processing")}
            >
              
              Process
            
             onUpdateStatus && onUpdateStatus(id, "cancelled")}
            >
              
              Cancel
            
          
        )}

        {status === "processing" && (
           onUpdateStatus && onUpdateStatus(id, "completed")}
          >
            
            Complete
          
        )}

        {(status === "completed" || status === "cancelled") && (
          
            
            View Invoice
          
        )}
      
    
  );
}
