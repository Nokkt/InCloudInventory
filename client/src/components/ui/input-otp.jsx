import *-otp"
import { Dot } from "lucide-react"

import { cn } from "@/lib/utils"

const InputOTP = React.forwardRef<
  React.ElementRef,
  React.ComponentPropsWithoutRef
>(({ className, containerClassName, ...props }, ref) => (
  
))
InputOTP.displayName = "InputOTP"

const InputOTPGroup = React.forwardRef<
  React.ElementRef,
  React.ComponentPropsWithoutRef
>(({ className, ...props }, ref) => (
  
))
InputOTPGroup.displayName = "InputOTPGroup"

const InputOTPSlot = React.forwardRef<
  React.ElementRef,
  React.ComponentPropsWithoutRef & { index, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index]

  return (
    
      {char}
      {hasFakeCaret && (
        
          
        
      )}
    
  )
})
InputOTPSlot.displayName = "InputOTPSlot"

const InputOTPSeparator = React.forwardRef<
  React.ElementRef,
  React.ComponentPropsWithoutRef
>(({ ...props }, ref) => (
  
    
  
))
InputOTPSeparator.displayName = "InputOTPSeparator"

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
