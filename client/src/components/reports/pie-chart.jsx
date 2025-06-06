import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart;
import { Chart } from "@/components/ui/chart";





export function PieChart({ title, data, className }= useState(null);

  const onPieEnter = (_, index=> {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  return (
    
      
        {title}
      
      
        
          
            
              
                {data.map((entry, index) => (
                  
                ))}
              
               [`${value}`, 'Value']}
                contentStyle={{ 
                  backgroundColor,
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  padding: '8px'
                }}
              />
              
            
          
        
      
    
  );
}
