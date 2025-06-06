import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart;
import { Chart } from "@/components/ui/chart";





export function BarChart({
  title,
  data,
  keys,
  className,
  xAxisLabel,
  yAxisLabel,
}={className}>
      
        {title}
      
      
        
          
            
              
              
              
              
              
              {keys.map((item, index) => (
                
              ))}
            
          
        
      
    
  );
}
