"use client"

import **@radix-ui/react-toggle-group"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { toggleVariants } from "@/components/ui/toggle"

const ToggleGroupContext = React.createContext<
  VariantProps
>({
  size,
  variant= React.forwardRef<
  React.ElementRef,
  React.ComponentPropsWithoutRef &
    VariantProps
>(({ className, variant, size, children, ...props }, ref) => (
  
    
      {children}
    
  
))

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

const ToggleGroupItem = React.forwardRef<
  React.ElementRef,
  React.ComponentPropsWithoutRef &
    VariantProps
>(({ className, children, variant, size, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext)

  return (
    
      {children}
    
  )
})

ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName

export { ToggleGroup, ToggleGroupItem }
