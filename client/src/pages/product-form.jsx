import React, { useState, useEffect } from "react";
import { Layout } from "../components/layout/Layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../hooks/use-auth";
import { useLocation } from "wouter";

const ProductForm = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  
  // Check if we're in edit mode by examining the current path
  const match = location.match(/\/products\/edit\/(\d+)/);
  const productId = match ? match[1] : null;
  const isEditMode = !!productId;

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    categoryId: "",
    price: "",
    costPrice: "",
    minStockLevel: "10",
    currentStock: "0",
    isFoodProduct: true,
    shelfLife: "",
    imageUrl: ""
  });

  // Form validation state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get currency symbol from user settings
  const getCurrencySymbol = () => {
    const currency = user?.settings?.currency || "PHP";
    switch (currency) {
      case "USD": return "$";
      case "EUR": return "€";
      case "GBP": return "£";
      case "PHP": return "₱";
      case "JPY": return "¥";
      case "CAD": return "$";
      case "AUD": return "$";
      default: return "₱";
    }
  };

  const getCurrencyLabel = () => {
    const currency = user?.settings?.currency || "PHP";
    return currency;
  };

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to load categories");
      return res.json();
    }
  });

  // Fetch product data if in edit mode
  const { data: productData, isLoading: isLoadingProduct } = useQuery({
    queryKey: ["/api/products", productId],
    queryFn: async () => {
      if (!productId) return null;
      const res = await fetch(`/api/products/${productId}`);
      if (!res.ok) throw new Error("Failed to load product");
      return res.json();
    },
    enabled: isEditMode
  });

  // Set form data when product data is loaded
  useEffect(() => {
    if (productData) {
      setFormData({
        name: productData.name || "",
        sku: productData.sku || "",
        description: productData.description || "",
        categoryId: productData.categoryId?.toString() || "",
        price: productData.price?.toString() || "",
        costPrice: productData.costPrice?.toString() || "",
        minStockLevel: productData.minStockLevel?.toString() || "10",
        currentStock: productData.currentStock?.toString() || "0",
        isFoodProduct: productData.isFoodProduct !== undefined ? productData.isFoodProduct : true,
        shelfLife: productData.shelfLife?.toString() || "",
        imageUrl: productData.imageUrl || ""
      });
    }
  }, [productData]);

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (data) => {
      const res = await apiRequest("POST", "/api/products", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ 
        title: "Success", 
        description: "Product created successfully", 
      });
      setLocation("/products");
    },
    onError: (error) => {
      // Check if the error message contains duplicate key info
      let errorMessage = error.message || "Failed to create product";
      
      // More user-friendly message for duplicate SKU
      if (errorMessage.includes('duplicate') && errorMessage.includes('sku')) {
        errorMessage = "This SKU already exists. Please use a different SKU code.";
      }
      
      toast({ 
        title: "Error", 
        description: errorMessage, 
        variant: "destructive" 
      });
      setIsSubmitting(false);
    }
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async (data) => {
      const res = await apiRequest("PUT", `/api/products/${productId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId] });
      toast({ 
        title: "Success", 
        description: "Product updated successfully", 
      });
      setLocation("/products");
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update product", 
        variant: "destructive" 
      });
      setIsSubmitting(false);
    }
  });

  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = "Product name is required";
    if (!formData.sku.trim()) newErrors.sku = "SKU is required";
    if (!formData.categoryId) newErrors.categoryId = "Category is required";
    
    if (!formData.price || isNaN(parseFloat(formData.price))) {
      newErrors.price = "Valid price is required";
    }
    
    if (!formData.costPrice || isNaN(parseFloat(formData.costPrice))) {
      newErrors.costPrice = "Valid cost price is required";
    }
    
    if (formData.minStockLevel && isNaN(parseInt(formData.minStockLevel))) {
      newErrors.minStockLevel = "Must be a number";
    }
    
    if (formData.currentStock && isNaN(parseInt(formData.currentStock))) {
      newErrors.currentStock = "Must be a number";
    }
    
    if (formData.shelfLife && isNaN(parseInt(formData.shelfLife))) {
      newErrors.shelfLife = "Must be a number";
    }
    
    return newErrors;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    const formErrors = validateForm();
    setErrors(formErrors);
    
    // If there are errors, don't submit
    if (Object.keys(formErrors).length > 0) {
      return;
    }
    
    // Prepare data for submission
    setIsSubmitting(true);
    const productData = {
      ...formData,
      categoryId: parseInt(formData.categoryId),
      price: parseFloat(formData.price),
      costPrice: parseFloat(formData.costPrice),
      minStockLevel: formData.minStockLevel ? parseInt(formData.minStockLevel) : 10,
      currentStock: formData.currentStock ? parseInt(formData.currentStock) : 0,
      shelfLife: formData.shelfLife ? parseInt(formData.shelfLife) : null
    };
    
    // Submit the data
    if (isEditMode) {
      updateProductMutation.mutate(productData);
    } else {
      createProductMutation.mutate(productData);
    }
  };

  // Loading state
  if (isEditMode && isLoadingProduct) {
    return (
      <Layout>
        <div className="p-8 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 md:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">
            {isEditMode ? "Edit Product" : "Add New Product"}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEditMode 
              ? "Update the product information below"
              : "Fill in the details to add a new product to inventory"
            }
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name*
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              {/* SKU */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SKU*
                </label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md ${errors.sku ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.sku && <p className="mt-1 text-sm text-red-600">{errors.sku}</p>}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category*
                </label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md ${errors.categoryId ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>}
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selling Price ({getCurrencyLabel()})*
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    {getCurrencySymbol()}
                  </span>
                  <input
                    type="text"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className={`w-full pl-8 pr-3 py-2 border rounded-md ${errors.price ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="0.00"
                  />
                </div>
                {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
              </div>

              {/* Cost Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost Price ({getCurrencyLabel()})*
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    {getCurrencySymbol()}
                  </span>
                  <input
                    type="text"
                    name="costPrice"
                    value={formData.costPrice}
                    onChange={handleChange}
                    className={`w-full pl-8 pr-3 py-2 border rounded-md ${errors.costPrice ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="0.00"
                  />
                </div>
                {errors.costPrice && <p className="mt-1 text-sm text-red-600">{errors.costPrice}</p>}
              </div>

              {/* Current Stock */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Stock
                </label>
                <input
                  type="text"
                  name="currentStock"
                  value={formData.currentStock}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md ${errors.currentStock ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.currentStock && <p className="mt-1 text-sm text-red-600">{errors.currentStock}</p>}
              </div>

              {/* Minimum Stock Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reorder Level
                </label>
                <input
                  type="text"
                  name="minStockLevel"
                  value={formData.minStockLevel}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md ${errors.minStockLevel ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.minStockLevel && <p className="mt-1 text-sm text-red-600">{errors.minStockLevel}</p>}
              </div>

              {/* Shelf Life */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shelf Life (days) <span className="text-xs text-gray-500">(Products with 30% of their shelf life left will appear in expiration reports)</span>
                </label>
                <input
                  type="number"
                  name="shelfLife"
                  value={formData.shelfLife}
                  onChange={handleChange}
                  placeholder="Enter number of days until expiration"
                  className={`w-full p-2 border rounded-md ${errors.shelfLife ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.shelfLife && <p className="mt-1 text-sm text-red-600">{errors.shelfLife}</p>}
                <p className="mt-1 text-xs text-blue-600">System monitors products at 30% (attention), 20% (warning), and 10% (critical) of shelf life remaining</p>
              </div>

              {/* Food Product Toggle */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isFoodProduct"
                  name="isFoodProduct"
                  checked={formData.isFoodProduct}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isFoodProduct" className="ml-2 block text-sm text-gray-700">
                  Food Product
                </label>
              </div>

              {/* Image URL */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="text"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  className="w-full p-2 border border-gray-300 rounded-md"
                ></textarea>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setLocation("/products")}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting 
                  ? "Saving..." 
                  : isEditMode 
                    ? "Update Product" 
                    : "Add Product"
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default ProductForm;