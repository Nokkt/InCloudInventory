import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { cn } from "@/lib/utils";



export function PageContainer({
  children,
  title,
  description,
  className,
  showSearch = true,
  onSearch,
}="flex h-screen overflow-hidden bg-gray-50">
      
      
      
        
        
        
          {children}
        
      
    
  );
}
