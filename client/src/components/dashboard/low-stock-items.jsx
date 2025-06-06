import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";





export function LowStockItems({ items, onRestock }= (current, min=> {
    const ratio = current / min;
    
    if (ratio <= 0.25) return { label, style: "bg-red-100 text-red-800" };
    if (ratio <= 0.5) return { label, style: "bg-amber-100 text-amber-800" };
    return { label, style: "bg-green-100 text-green-800" };
  };
  
  return (
    
      
        
          Low Stock Items
          View All
        
        
        
          
            
              
                Product Name
                Category
                Current Stock
                Min. Required
                Status
                Action
              
            
            
              {items.length === 0 ? (
                
                  
                    No low stock items found
                  
                
              ) : (
                items.map((item) => {
                  const status = getStockStatus(item.currentStock, item.minStockLevel);
                  
                  return (
                    
                      
                        
                          
                          
                            {item.name}
                            SKU: {item.sku}
                          
                        
                      
                      
                        {item.category}
                      
                      
                        <span className={cn(
                          "text-sm font-medium",
                          item.currentStock 
                          {item.currentStock} units
                        
                      
                      
                        {item.minStockLevel} units
                      
                      
                        
                          {status.label}
                        
                      
                      
                         onRestock && onRestock(item.id)}
                        >
                          Restock
                        
                      
                    
                  );
                })
              )}
            
          
        
      
    
  );
}
