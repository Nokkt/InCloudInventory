import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart;
import { Chart } from "@/components/ui/chart";





export function LineChart({
  title,
  data,
  lines,
  className,
  xAxisLabel,
  yAxisLabel,
}={className}>
      
        {title}
      
      
        
          
            
              
              
              
              
              
              {lines.map((line, index) => (
                
              ))}
            
          
        
      
    
  );
}
