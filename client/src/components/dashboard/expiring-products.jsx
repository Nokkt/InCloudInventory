import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";





export function ExpiringProducts({ products, onAction }= (days=> {
    if (days <= 7) return { bgColor: "bg-red-50", borderColor: "border-red-100", textColor: "text-red-600" };
    if (days <= 14) return { bgColor: "bg-amber-50", borderColor: "border-amber-100", textColor: "text-amber-600" };
    return { bgColor: "bg-yellow-50", borderColor: "border-yellow-100", textColor: "text-yellow-600" };
  };
  
  return (
    
      
        
          Expiring Soon
          View All
        
        
        {products.length === 0 ? (
          
            No products expiring soon
          
        ) ="space-y-4">
            {products.map((product) => {
              const status = getExpiryStatus(product.daysUntilExpiry);
              
              return (
                
                  
                    
                    
                      {product.name}
                      
                        Expires in {product.daysUntilExpiry} days
                      
                    
                  
                   onAction && onAction(product.id)}
                  >
                    Take Action
                  
                
              );
            })}
          
        )}
      
    
  );
}
