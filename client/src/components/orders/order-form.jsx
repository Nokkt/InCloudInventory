import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, PackagePlus } from "lucide-react";
import { Product } from "@shared/schema";

// Order schema
const orderFormSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  orderNumber: z.string().min(1, "Order number is required"),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.number().min(1, "Please select a product"),
      quantity: z.number().min(1, "Quantity must be at least 1"),
      unitPrice: z.number().min(0.01, "Price must be greater than 0"),
    })
  ).min(1, "At least one item is required"),
});



export function OrderForm({
  products = [],
  onSubmit,
  defaultValues,
  isSubmitting = false,
}= useState<{[key: number]);
  
  const form = useForm({
    resolver,
    defaultValues: {
      customerName,
      orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
      notes,
      items: [{ productId: 0, quantity: 1, unitPrice: 0 }],
      ...defaultValues,
    },
  });

  // Watch for changes to items to update the selected products
  const formItems = form.watch("items");

  const handleProductSelect = (productId, index=> {
    const product = products.find(p => p.id === productId);
    if (product) {
      // Update selected products
      setSelectedProducts(prev => ({
        ...prev,
        [index]);
      
      // Update the unit price in the form
      const items = form.getValues("items");
      items[index].unitPrice = product.price;
      form.setValue("items", items);
    }
  };

  const addItem = () => {
    const items = form.getValues("items");
    form.setValue("items", [...items, { productId: 0, quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index=> {
    const items = form.getValues("items");
    if (items.length > 1) {
      // Remove from selected products
      const newSelectedProducts = {...selectedProducts};
      delete newSelectedProducts[index];

      // Adjust indexes for selected products above the removed one
      Object.keys(newSelectedProducts).forEach(key => {
        const numKey = parseInt(key);
        if (numKey > index) {
          newSelectedProducts[numKey - 1] = newSelectedProducts[numKey];
          delete newSelectedProducts[numKey];
        }
      });
      
      setSelectedProducts(newSelectedProducts);
      
      // Remove from form values
      form.setValue("items", items.filter((_, i) => i !== index));
    }
  };

  const calculateTotal = () => {
    const items = form.getValues("items");
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  return (
    
      
        Create New Order
      
      
        
          
            
               (
                  
                    Customer Name
                    
                      
                    
                    
                  
                )}
              />
               (
                  
                    Order Number
                    
                      
                    
                    
                  
                )}
              />
            

            
              
                Order Items
                
                  
                  Add Item
                
              

              {form.formState.errors.items?.message && (
                
                  {form.formState.errors.items?.message}
                
              )}

              
                {formItems.map((item, index) => (
                  
                    
                      Item #{index + 1}
                       removeItem(index)}
                        disabled={formItems.length 
                        
                      
                    
                    
                    
                       (
                          
                            Product
                             {
                                field.onChange(parseInt(value));
                                handleProductSelect(parseInt(value), index);
                              }}
                            >
                              
                                
                                  
                                
                              
                              
                                {products.map((product) => (
                                  
                                    {product.name}
                                  
                                ))}
                              
                            
                            
                          
                        )}
                      />

                       (
                          
                            Quantity
                            
                               field.onChange(parseInt(e.target.value))}
                              />
                            
                            
                          
                        )}
                      />

                       (
                          
                            Unit Price ($)
                            
                               field.onChange(parseFloat(e.target.value))}
                              />
                            
                            
                          
                        )}
                      />
                    
                    
                    
                      Subtotal: ${(formItems[index].quantity * formItems[index].unitPrice).toFixed(2)}
                    
                  
                ))}
              
            

             (
                
                  Order Notes
                  
                    
                  
                  
                
              )}
            />

            
              Total:
              ${calculateTotal().toFixed(2)}
            
          
          
          
            
              
              {isSubmitting ? "Creating Order..." : "Create Order"}
            
          
        
      
    
  );
}
