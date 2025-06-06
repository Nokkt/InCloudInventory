import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import {
  PlusCircle,
  ShoppingCart,
  FileText,
  RefreshCw,
  Calendar,
  Settings
} from "lucide-react";





export function QuickAccess({ actions }) {
  const defaultActions= [
    {
      title,
      href: "/products/new",
      icon="h-6 w-6 text-primary" />,
      iconBgColor: "bg-blue-100",
    },
    {
      title,
      href: "/orders/new",
      icon="h-6 w-6 text-green-500" />,
      iconBgColor: "bg-green-100",
    },
    {
      title,
      href: "/reports",
      icon="h-6 w-6 text-purple-500" />,
      iconBgColor: "bg-purple-100",
    },
    {
      title,
      href: "/stock",
      icon="h-6 w-6 text-amber-500" />,
      iconBgColor: "bg-amber-100",
    },
    {
      title,
      href: "/expiration",
      icon="h-6 w-6 text-red-500" />,
      iconBgColor: "bg-red-100",
    },
    {
      title,
      href: "/user",
      icon="h-6 w-6 text-indigo-500" />,
      iconBgColor: "bg-indigo-100",
    },
  ];

  const displayActions = actions || defaultActions;

  return (
    
      
        Quick Access
        
        
          {displayActions.map((action, index) => (
            
              
                
                  {action.icon}
                
                {action.title}
              
            
          ))}
        
      
    
  );
}
