import React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { Lightbulb } from 'lucide-react';

const speechBubbleVariants = cva(
  "relative p-4 rounded-xl text-sm shadow-sm",
  {
    variants: {
      variant: {
        default: "bg-blue-50 text-blue-800 border border-blue-100",
        primary: "bg-indigo-50 text-indigo-800 border border-indigo-100",
        success: "bg-green-50 text-green-800 border border-green-100",
        warning: "bg-amber-50 text-amber-800 border border-amber-100",
        destructive: "bg-red-50 text-red-800 border border-red-100",
        ai: "bg-purple-50 text-purple-800 border border-purple-100",
      },
      position: {
        left: "ml-4 before:absolute before:left-[-10px] before:top-4 before:border-t-[10px] before:border-r-[10px] before:border-b-[10px] before:border-t-transparent before:border-r-current before:border-b-transparent",
        right: "mr-4 after:absolute after:right-[-10px] after:top-4 after:border-t-[10px] after:border-l-[10px] after:border-b-[10px] after:border-t-transparent after:border-l-current after:border-b-transparent",
        top: "mt-4 before:absolute before:top-[-10px] before:left-4 before:border-l-[10px] before:border-r-[10px] before:border-b-[10px] before:border-l-transparent before:border-r-transparent before:border-b-current",
        bottom: "mb-4 after:absolute after:bottom-[-10px] after:left-4 after:border-l-[10px] after:border-r-[10px] after:border-t-[10px] after:border-l-transparent after:border-r-transparent after:border-t-current",
      },
      size: {
        default: "max-w-md",
        sm: "max-w-sm",
        lg: "max-w-lg",
        full: "w-full",
      },
    },
    defaultVariants: {
      variant,
      position,
      size);



export function SpeechBubble({
  className,
  variant,
  position,
  size,
  icon,
  title,
  children,
  ...props
}={cn(speechBubbleVariants({ variant, position, size }), className)}
      {...props}
    >
      
        {icon && (
          
            {icon}
          
        )}
        
          {title && {title}}
          {children}
        
      
    
  );
}

// Preset analysis bubbles
export function DescriptiveAnalysisBubble({ className, children, ...props }.HTMLAttributes) {
  return (
    <SpeechBubble 
      variant="primary" 
      position="left" 
      icon={}
      title="Descriptive Analysis"
      className={cn("mb-4", className)}
      {...props}
    >
      {children}
    
  );
}

export function PrescriptiveAnalysisBubble({ className, children, ...props }.HTMLAttributes) {
  return (
    <SpeechBubble 
      variant="ai" 
      position="right" 
      icon={}
      title="Prescriptive Analysis"
      className={cn("mt-4", className)}
      {...props}
    >
      {children}
    
  );
}