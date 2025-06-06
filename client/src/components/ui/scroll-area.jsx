import **@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

const ScrollArea = React.forwardRef<
  React.ElementRef,
  React.ComponentPropsWithoutRef
>(({ className, children, ...props }, ref) => (
  
    
      {children}
    
    
    
  
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
  React.ElementRef,
  React.ComponentPropsWithoutRef
>(({ className, orientation = "vertical", ...props }, ref) => (
  
    
  
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
