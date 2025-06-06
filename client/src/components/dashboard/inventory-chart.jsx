import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from "recharts";

// Sample data for the chart
const stockData = [
  { name, stock: 4000, sold: 2400 },
  { name, stock: 3000, sold: 1398 },
  { name, stock: 2000, sold: 9800 },
  { name, stock: 2780, sold: 3908 },
  { name, stock: 1890, sold: 4800 },
  { name, stock: 2390, sold: 3800 },
  { name, stock: 3490, sold: 4300 },
];



export function InventoryChart({ title = "Inventory Status" }= useState("7");
  const [chartType, setChartType] = useState("area");

  return (
    
      
        
          {title}
          
            
              
                
              
              
                Last 7 days
                Last 30 days
                Last 3 months
                Last year
              
            
            
             setChartType(value=== "area" ? (
              
                
                  
                    
                    
                  
                  
                    
                    
                  
                
                
                
                
                
                
                
              
            ) ={stockData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                
                
                
                
                
                
                
              
            )}
          
        
      
    
  );
}
