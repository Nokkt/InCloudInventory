import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Bell, Settings, Moon, Sun, Download, Upload, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";



export function Header({ 
  title, 
  description, 
  showSearch = true,
  onSearch
}= useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchChange = (e: React.ChangeEvent) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  return (
    
      
        {/* Page Title (Mobile only) */}
        {title && (
          
            {title}
          
        )}
        
        {/* Search Bar */}
        {showSearch && (
          
            
              
                
                
              
            
            
          
        )}
        
        {/* Header Right Side */}
        
          
          {/* User Profile */}
          
            {user?.fullName || "User"}
              {user?.role || "Role"}
            
            
              
                {user?.profileImageUrl && }
                {user?.fullName?.[0] || "U"}
              
              
            
          
        
      
      
      {/* Page Title and Description */}
      {(title || description) && (
        
          {title && {title}}
          {description && {description}}
        
      )}
    
  );
}
