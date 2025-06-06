import *-variance-authority"

import { cn } from "@/lib/utils"

const chartVariants = cva(
  "relative mx-auto overflow-hidden rounded-lg",
  {
    variants: {
      variant: {
        default: "bg-white shadow",
        outline: "border border-gray-200",
      },
      size: {
        default,
        sm: "h-32",
        md: "h-48",
        lg: "h-72",
        xl: "h-96",
      },
    },
    defaultVariants: {
      variant,
      size= React.forwardRef(
  ({ className, variant, size, ...props }, ref) => (
    
  )
)
Chart.displayName = "Chart"

export { Chart, chartVariants }
