"use client"

import **@radix-ui/react-menubar"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

function MenubarMenu({
  ...props
}.ComponentProps) {
  return 
}

function MenubarGroup({
  ...props
}.ComponentProps) {
  return 
}

function MenubarPortal({
  ...props
}.ComponentProps) {
  return 
}

function MenubarRadioGroup({
  ...props
}.ComponentProps) {
  return 
}

function MenubarSub({
  ...props
}.ComponentProps) {
  return 
}

const Menubar = React.forwardRef<
  React.ElementRef,
  React.ComponentPropsWithoutRef
>(({ className, ...props }, ref) => (
  
))
Menubar.displayName = MenubarPrimitive.Root.displayName

const MenubarTrigger = React.forwardRef<
  React.ElementRef,
  React.ComponentPropsWithoutRef
>(({ className, ...props }, ref) => (
  
))
MenubarTrigger.displayName = MenubarPrimitive.Trigger.displayName

const MenubarSubTrigger = React.forwardRef<
  React.ElementRef,
  React.ComponentPropsWithoutRef & {
    inset?, ...props }, ref) => (
  
    {children}
    
  
))
MenubarSubTrigger.displayName = MenubarPrimitive.SubTrigger.displayName

const MenubarSubContent = React.forwardRef<
  React.ElementRef,
  React.ComponentPropsWithoutRef
>(({ className, ...props }, ref) => (
  
))
MenubarSubContent.displayName = MenubarPrimitive.SubContent.displayName

const MenubarContent = React.forwardRef<
  React.ElementRef,
  React.ComponentPropsWithoutRef
>(
  (
    { className, align = "start", alignOffset = -4, sideOffset = 8, ...props },
    ref
  ) => (
    
      
    
  )
)
MenubarContent.displayName = MenubarPrimitive.Content.displayName

const MenubarItem = React.forwardRef<
  React.ElementRef,
  React.ComponentPropsWithoutRef & {
    inset?, ...props }, ref) => (
  
))
MenubarItem.displayName = MenubarPrimitive.Item.displayName

const MenubarCheckboxItem = React.forwardRef<
  React.ElementRef,
  React.ComponentPropsWithoutRef
>(({ className, children, checked, ...props }, ref) => (
  
    
      
        
      
    
    {children}
  
))
MenubarCheckboxItem.displayName = MenubarPrimitive.CheckboxItem.displayName

const MenubarRadioItem = React.forwardRef<
  React.ElementRef,
  React.ComponentPropsWithoutRef
>(({ className, children, ...props }, ref) => (
  
    
      
        
      
    
    {children}
  
))
MenubarRadioItem.displayName = MenubarPrimitive.RadioItem.displayName

const MenubarLabel = React.forwardRef<
  React.ElementRef,
  React.ComponentPropsWithoutRef & {
    inset?, ...props }, ref) => (
  
))
MenubarLabel.displayName = MenubarPrimitive.Label.displayName

const MenubarSeparator = React.forwardRef<
  React.ElementRef,
  React.ComponentPropsWithoutRef
>(({ className, ...props }, ref) => (
  
))
MenubarSeparator.displayName = MenubarPrimitive.Separator.displayName

const MenubarShortcut = ({
  className,
  ...props
}.HTMLAttributes) => {
  return (
    
  )
}
MenubarShortcut.displayname = "MenubarShortcut"

export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarPortal,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarGroup,
  MenubarSub,
  MenubarShortcut,
}
