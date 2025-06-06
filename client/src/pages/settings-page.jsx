import React, { useState, useEffect } from "react";
import { Layout } from "../components/layout/Layout";
import { useAuth } from "../hooks/use-auth";
import { useToast } from "../hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";

const SettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  
  // General settings state
  const [generalSettings, setGeneralSettings] = useState({
    companyName: "InCloud Food Inventory",
    contactEmail: "support@incloud.com",
    defaultCurrency: "PHP",
    dateFormat: "MM/DD/YYYY",
    timezone: "UTC+8"
  });

  // Load user settings on component mount
  useEffect(() => {
    if (user?.settings) {
      setGeneralSettings(prev => ({
        ...prev,
        defaultCurrency: user.settings.currency || "PHP",
        dateFormat: user.settings.dateFormat || "MM/DD/YYYY",
        timezone: user.settings.timezone || "UTC+8"
      }));
    }
  }, [user?.settings]); // Watch for changes in user settings specifically
  
  // Inventory settings state
  const [inventorySettings, setInventorySettings] = useState({
    lowStockThreshold: 50,
    expirationWarningDays: 30,
    enableExpirationAlerts: true,
  });
  
  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    lowStockAlerts: true,
    expirationAlerts: true,
    orderStatusUpdates: true,
    systemNotifications: false,
    emailNotifications: true,
    inAppNotifications: true
  });

  // 2FA settings state
  const [twoFactorSettings, setTwoFactorSettings] = useState({
    enabled: false,
    qrCode: null,
    secret: null,
    backupCodes: [],
    showBackupCodes: false,
    setupStep: 1 // 1: setup, 2: verify, 3: complete
  });

  // Load 2FA status from user data
  useEffect(() => {
    if (user) {
      setTwoFactorSettings(prev => ({
        ...prev,
        enabled: user.twoFactorEnabled || false
      }));
    }
  }, [user]);

  // Preferences settings state
  const [preferencesSettings, setPreferencesSettings] = useState({
    fontSize: "medium",
    fontFamily: "sans-serif",
    defaultDashboardView: "dashboard",
    itemsPerPage: "25"
  });
  
  // Handle changes for different settings
  const handleGeneralChange = (e) => {
    const { name, value } = e.target;
    setGeneralSettings(prev => ({ ...prev, [name]: value }));
  };
  
  const handleInventoryChange = (e) => {
    const { name, value, type, checked } = e.target;
    setInventorySettings(prev => ({ 
      ...prev, 
      [name]: type === "checkbox" ? checked : value 
    }));
  };
  
  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotificationSettings(prev => ({ ...prev, [name]: checked }));
  };
  
  const handlePreferencesChange = (e) => {
    const { name, value } = e.target;
    setPreferencesSettings(prev => ({ 
      ...prev, 
      [name]: value 
    }));
  };
  
  // Settings update mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings) => {
      const res = await apiRequest("PUT", "/api/user/settings", { settings });
      return await res.json();
    },
    onSuccess: (updatedUser) => {
      // Update both the user cache and settings form
      queryClient.setQueryData(["/api/user"], updatedUser);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  // 2FA mutations for email-based system
  const enable2FAMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/2fa/enable");
      return await res.json();
    },
    onSuccess: (data) => {
      setTwoFactorSettings(prev => ({
        ...prev,
        enabled: true,
        backupCodes: data.backupCodes,
        setupStep: 2,
        showBackupCodes: true
      }));
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Success",
        description: "Email-based two-factor authentication enabled successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to enable 2FA",
        variant: "destructive",
      });
    },
  });

  const disable2FAMutation = useMutation({
    mutationFn: async ({ token, password }) => {
      const res = await apiRequest("POST", "/api/2fa/disable", { token, password });
      return await res.json();
    },
    onSuccess: () => {
      setTwoFactorSettings(prev => ({
        ...prev,
        enabled: false,
        qrCode: null,
        secret: null,
        backupCodes: [],
        showBackupCodes: false,
        setupStep: 1
      }));
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Success",
        description: "Two-factor authentication disabled successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to disable 2FA",
        variant: "destructive",
      });
    },
  });

  // Handle form submissions
  const handleGeneralSubmit = (e) => {
    e.preventDefault();
    updateSettingsMutation.mutate({
      currency: generalSettings.defaultCurrency,
      dateFormat: generalSettings.dateFormat,
      timezone: generalSettings.timezone
    });
  };
  
  const handleInventorySubmit = (e) => {
    e.preventDefault();
    // API call would go here
    toast({
      title: "Success",
      description: "Inventory settings updated successfully",
    });
  };
  
  const handleNotificationSubmit = (e) => {
    e.preventDefault();
    // API call would go here
    toast({
      title: "Success",
      description: "Notification settings updated successfully",
    });
  };
  
  const handlePreferencesSubmit = (e) => {
    e.preventDefault();
    // API call would go here
    toast({
      title: "Success",
      description: "Preferences updated successfully",
    });
  };
  
  return (
    <Layout>
      <div className="p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
        
        {/* Settings Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="font-bold">Settings Menu</h2>
              </div>
              <div className="p-2">
                <button 
                  onClick={() => setActiveTab("general")}
                  className={`flex items-center w-full p-3 rounded-md text-left ${
                    activeTab === "general" 
                      ? "bg-blue-50 text-blue-600" 
                      : "hover:bg-gray-50"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                  General
                </button>
                <button 
                  onClick={() => setActiveTab("inventory")}
                  className={`flex items-center w-full p-3 rounded-md text-left ${
                    activeTab === "inventory" 
                      ? "bg-blue-50 text-blue-600" 
                      : "hover:bg-gray-50"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                    <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  Inventory
                </button>
                <button 
                  onClick={() => setActiveTab("notifications")}
                  className={`flex items-center w-full p-3 rounded-md text-left ${
                    activeTab === "notifications" 
                      ? "bg-blue-50 text-blue-600" 
                      : "hover:bg-gray-50"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                  Notifications
                </button>
                <button 
                  onClick={() => setActiveTab("security")}
                  className={`flex items-center w-full p-3 rounded-md text-left ${
                    activeTab === "security" 
                      ? "bg-blue-50 text-blue-600" 
                      : "hover:bg-gray-50"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Security
                </button>
                <button 
                  onClick={() => setActiveTab("preferences")}
                  className={`flex items-center w-full p-3 rounded-md text-left ${
                    activeTab === "preferences" 
                      ? "bg-blue-50 text-blue-600" 
                      : "hover:bg-gray-50"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M12 6V4a2 2 0 00-2-2H4a2 2 0 00-2 2v2a2 2 0 002 2h6a2 2 0 002-2zm0 8V12a2 2 0 00-2-2H4a2 2 0 00-2 2v2a2 2 0 002 2h6a2 2 0 002-2zm8-8V4a2 2 0 00-2-2h-6a2 2 0 00-2 2v2a2 2 0 002 2h6a2 2 0 002-2zm0 8V12a2 2 0 00-2-2h-6a2 2 0 00-2 2v2a2 2 0 002 2h6a2 2 0 002-2z" />
                  </svg>
                  Preferences
                </button>
              </div>
            </div>
          </div>
          
          <div className="md:col-span-3">
            {/* General Settings */}
            {activeTab === "general" && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                  <h2 className="text-xl font-bold">General Settings</h2>
                </div>
                <form onSubmit={handleGeneralSubmit} className="p-6">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-1">Company Name</label>
                      <input 
                        type="text" 
                        name="companyName"
                        value={generalSettings.companyName}
                        onChange={handleGeneralChange}
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Contact Email</label>
                      <input 
                        type="email" 
                        name="contactEmail"
                        value={generalSettings.contactEmail}
                        onChange={handleGeneralChange}
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Default Currency</label>
                        <select 
                          name="defaultCurrency"
                          value={generalSettings.defaultCurrency}
                          onChange={handleGeneralChange}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="PHP">PHP (₱)</option>
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="JPY">JPY (¥)</option>
                          <option value="CAD">CAD ($)</option>
                          <option value="AUD">AUD ($)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Date Format</label>
                        <select 
                          name="dateFormat"
                          value={generalSettings.dateFormat}
                          onChange={handleGeneralChange}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                          <option value="YYYY/MM/DD">YYYY/MM/DD</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Time Zone</label>
                      <select 
                        name="timezone"
                        value={generalSettings.timezone}
                        onChange={handleGeneralChange}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="UTC-12">UTC-12</option>
                        <option value="UTC-11">UTC-11</option>
                        <option value="UTC-10">UTC-10</option>
                        <option value="UTC-9">UTC-9</option>
                        <option value="UTC-8">UTC-8</option>
                        <option value="UTC-7">UTC-7</option>
                        <option value="UTC-6">UTC-6</option>
                        <option value="UTC-5">UTC-5</option>
                        <option value="UTC-4">UTC-4</option>
                        <option value="UTC-3">UTC-3</option>
                        <option value="UTC-2">UTC-2</option>
                        <option value="UTC-1">UTC-1</option>
                        <option value="UTC">UTC</option>
                        <option value="UTC+1">UTC+1</option>
                        <option value="UTC+2">UTC+2</option>
                        <option value="UTC+3">UTC+3</option>
                        <option value="UTC+4">UTC+4</option>
                        <option value="UTC+5">UTC+5</option>
                        <option value="UTC+6">UTC+6</option>
                        <option value="UTC+7">UTC+7</option>
                        <option value="UTC+8">UTC+8</option>
                        <option value="UTC+9">UTC+9</option>
                        <option value="UTC+10">UTC+10</option>
                        <option value="UTC+11">UTC+11</option>
                        <option value="UTC+12">UTC+12</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {/* Inventory Settings */}
            {activeTab === "inventory" && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                  <h2 className="text-xl font-bold">Inventory Settings</h2>
                </div>
                <form onSubmit={handleInventorySubmit} className="p-6">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Low Stock Threshold</label>
                        <input 
                          type="number" 
                          name="lowStockThreshold"
                          value={inventorySettings.lowStockThreshold}
                          onChange={handleInventoryChange}
                          min="1"
                          className="w-full p-2 border rounded-md"
                        />
                        <p className="text-xs text-gray-500 mt-1">Items with stock below this threshold will be flagged as low stock</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Expiration Warning Days</label>
                        <input 
                          type="number" 
                          name="expirationWarningDays"
                          value={inventorySettings.expirationWarningDays}
                          onChange={handleInventoryChange}
                          min="1"
                          className="w-full p-2 border rounded-md"
                        />
                        <p className="text-xs text-gray-500 mt-1">Items expiring within this many days will be flagged</p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Default Category</label>
                      <input 
                        type="text" 
                        name="defaultCategory"
                        value={inventorySettings.defaultCategory}
                        onChange={handleInventoryChange}
                        className="w-full p-2 border rounded-md"
                      />
                      <p className="text-xs text-gray-500 mt-1">New products without a category will be assigned to this category</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Stock Management Method</label>
                      <select 
                        name="stockManagementMethod"
                        value={inventorySettings.stockManagementMethod}
                        onChange={handleInventoryChange}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="FIFO">FIFO (First In, First Out)</option>
                        <option value="LIFO">LIFO (Last In, First Out)</option>
                        <option value="FEFO">FEFO (First Expired, First Out)</option>
                        <option value="AVG">Average Cost</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="enableAutoReorder" 
                          name="enableAutoReorder"
                          checked={inventorySettings.enableAutoReorder}
                          onChange={handleInventoryChange}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600" 
                        />
                        <label htmlFor="enableAutoReorder" className="ml-2 block text-sm">
                          Enable Automatic Reorder Notifications
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="enableExpirationAlerts" 
                          name="enableExpirationAlerts"
                          checked={inventorySettings.enableExpirationAlerts}
                          onChange={handleInventoryChange}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600" 
                        />
                        <label htmlFor="enableExpirationAlerts" className="ml-2 block text-sm">
                          Enable Expiration Alerts
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {/* Notification Settings */}
            {activeTab === "notifications" && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                  <h2 className="text-xl font-bold">Notification Settings</h2>
                </div>
                <form onSubmit={handleNotificationSubmit} className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Notification Types</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Low Stock Alerts</p>
                            <p className="text-sm text-gray-500">Get notified when products are below reorder level</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              name="lowStockAlerts"
                              checked={notificationSettings.lowStockAlerts}
                              onChange={handleNotificationChange}
                              className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Expiration Alerts</p>
                            <p className="text-sm text-gray-500">Get notified when products are nearing expiration</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              name="expirationAlerts"
                              checked={notificationSettings.expirationAlerts}
                              onChange={handleNotificationChange}
                              className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Order Status Updates</p>
                            <p className="text-sm text-gray-500">Get notified when order status changes</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              name="orderStatusUpdates"
                              checked={notificationSettings.orderStatusUpdates}
                              onChange={handleNotificationChange}
                              className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">System Notifications</p>
                            <p className="text-sm text-gray-500">Get notified about system updates and maintenance</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              name="systemNotifications"
                              checked={notificationSettings.systemNotifications}
                              onChange={handleNotificationChange}
                              className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Notification Delivery</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Email Notifications</p>
                            <p className="text-sm text-gray-500">Receive notifications via email</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              name="emailNotifications"
                              checked={notificationSettings.emailNotifications}
                              onChange={handleNotificationChange}
                              className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Push Notifications</p>
                            <p className="text-sm text-gray-500">Receive notifications in your browser</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              name="pushNotifications"
                              checked={notificationSettings.pushNotifications}
                              onChange={handleNotificationChange}
                              className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">SMS Notifications</p>
                            <p className="text-sm text-gray-500">Receive notifications via text message</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              name="smsNotifications"
                              checked={notificationSettings.smsNotifications}
                              onChange={handleNotificationChange}
                              className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {/* Security Settings */}
            {activeTab === "security" && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                  <h2 className="text-xl font-bold">Security Settings</h2>
                  <p className="text-gray-600 mt-1">Manage your account security and two-factor authentication</p>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    {/* Two-Factor Authentication Section */}
                    <div className="border rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-medium">Two-Factor Authentication (2FA)</h3>
                          <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            twoFactorSettings.enabled 
                              ? "bg-green-100 text-green-800" 
                              : "bg-gray-100 text-gray-800"
                          }`}>
                            {twoFactorSettings.enabled ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                      </div>

                      {!twoFactorSettings.enabled ? (
                        /* Email-based 2FA Setup */
                        <div className="space-y-4">
                          {twoFactorSettings.setupStep === 1 && (
                            <div>
                              <p className="text-gray-600 mb-4">
                                Two-factor authentication adds an extra layer of security to your account by sending 
                                a 6-digit verification code to your registered email address during login.
                              </p>
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <h4 className="font-medium text-blue-900 mb-2">Email-based 2FA Features:</h4>
                                <ul className="text-sm text-blue-800 space-y-1">
                                  <li>• Verification codes sent to: {user?.email}</li>
                                  <li>• Codes expire after 10 minutes</li>
                                  <li>• Backup codes provided for emergency access</li>
                                  <li>• No mobile app required</li>
                                </ul>
                              </div>
                              <button
                                onClick={() => enable2FAMutation.mutate()}
                                disabled={enable2FAMutation.isPending}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                              >
                                {enable2FAMutation.isPending ? "Enabling..." : "Enable Email 2FA"}
                              </button>
                            </div>
                          )}

                          {twoFactorSettings.setupStep === 2 && twoFactorSettings.showBackupCodes && (
                            <div className="space-y-4">
                              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                <div className="flex items-center mb-2">
                                  <svg className="h-5 w-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  <h4 className="font-medium text-green-900">2FA Successfully Enabled!</h4>
                                </div>
                                <p className="text-sm text-green-800">
                                  Email-based two-factor authentication is now active for your account.
                                </p>
                              </div>

                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <h4 className="font-medium text-yellow-900 mb-2">⚠️ Save Your Backup Codes</h4>
                                <p className="text-sm text-yellow-800 mb-3">
                                  Store these backup codes in a safe place. You can use them to access your account if you cannot receive emails.
                                </p>
                                <div className="grid grid-cols-2 gap-2 font-mono text-sm bg-white p-3 rounded border">
                                  {twoFactorSettings.backupCodes.map((code, index) => (
                                    <div key={index} className="text-center p-1 border rounded">
                                      {code}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <button
                                onClick={() => setTwoFactorSettings(prev => ({ ...prev, showBackupCodes: false, setupStep: 1 }))}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                              >
                                I've Saved My Backup Codes
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* 2FA Management */
                        <div className="space-y-4">
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center">
                              <svg className="h-5 w-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span className="text-green-800 font-medium">Two-factor authentication is enabled</span>
                            </div>
                            <p className="text-sm text-green-700 mt-1">Your account is protected with 2FA</p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2">Disable Two-Factor Authentication</h4>
                            <p className="text-sm text-gray-600 mb-4">
                              To disable 2FA, enter your current password. You can use a backup code if needed.
                            </p>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium mb-1">Current Password</label>
                                <input
                                  type="password"
                                  placeholder="Enter your password"
                                  className="w-full p-2 border rounded-md"
                                  onChange={(e) => setTwoFactorSettings(prev => ({ ...prev, currentPassword: e.target.value }))}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Backup Code (Optional)</label>
                                <input
                                  type="text"
                                  placeholder="Enter backup code if needed"
                                  className="w-full p-2 border rounded-md"
                                  onChange={(e) => setTwoFactorSettings(prev => ({ ...prev, disableCode: e.target.value }))}
                                />
                                <p className="text-xs text-gray-500 mt-1">Leave empty if you don't want to use a backup code</p>
                              </div>
                              <button
                                onClick={() => {
                                  if (twoFactorSettings.currentPassword) {
                                    disable2FAMutation.mutate({
                                      password: twoFactorSettings.currentPassword,
                                      token: twoFactorSettings.disableCode || undefined
                                    });
                                  }
                                }}
                                disabled={disable2FAMutation.isPending || !twoFactorSettings.currentPassword}
                                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
                              >
                                {disable2FAMutation.isPending ? "Disabling..." : "Disable 2FA"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Password Security Section */}
                    <div className="border rounded-lg p-6">
                      <h3 className="text-lg font-medium mb-2">Password Security</h3>
                      <p className="text-sm text-gray-500 mb-4">Keep your account secure with a strong password</p>
                      <div className="space-y-3">
                        <div className="flex items-center text-sm">
                          <svg className="h-4 w-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Password is secure</span>
                        </div>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                          Change Password
                        </button>
                      </div>
                    </div>

                    {/* Security Activity Section */}
                    <div className="border rounded-lg p-6">
                      <h3 className="text-lg font-medium mb-2">Security Activity</h3>
                      <p className="text-sm text-gray-500 mb-4">Monitor your account activity and security events</p>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span>Last login</span>
                          <span className="text-gray-600">Today at 10:43 AM</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span>Password last changed</span>
                          <span className="text-gray-600">2 weeks ago</span>
                        </div>
                        <button className="text-blue-600 hover:underline text-sm">
                          View full security log
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Preferences Settings */}
            {activeTab === "preferences" && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                  <h2 className="text-xl font-bold">User Preferences</h2>
                </div>
                <form onSubmit={handlePreferencesSubmit} className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">UI Preferences</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Font Size</label>
                          <div className="flex gap-4">
                            <button
                              type="button"
                              onClick={() => setPreferencesSettings(prev => ({ ...prev, fontSize: "small" }))}
                              className={`px-4 py-2 border rounded-md text-sm hover:bg-muted ${
                                preferencesSettings.fontSize === "small" ? "bg-primary/10 border-primary" : ""
                              }`}
                            >
                              Small
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreferencesSettings(prev => ({ ...prev, fontSize: "medium" }))}
                              className={`px-4 py-2 border rounded-md text-sm hover:bg-muted ${
                                preferencesSettings.fontSize === "medium" ? "bg-primary/10 border-primary" : ""
                              }`}
                            >
                              Medium
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreferencesSettings(prev => ({ ...prev, fontSize: "large" }))}
                              className={`px-4 py-2 border rounded-md text-sm hover:bg-muted ${
                                preferencesSettings.fontSize === "large" ? "bg-primary/10 border-primary" : ""
                              }`}
                            >
                              Large
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium mb-1 block">Font Family</label>
                          <div className="flex gap-4">
                            <button
                              type="button"
                              onClick={() => setPreferencesSettings(prev => ({ ...prev, fontFamily: "sans-serif" }))}
                              className={`px-4 py-2 border rounded-md text-sm hover:bg-muted ${
                                preferencesSettings.fontFamily === "sans-serif" ? "bg-primary/10 border-primary" : ""
                              }`}
                            >
                              Sans Serif
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreferencesSettings(prev => ({ ...prev, fontFamily: "serif" }))}
                              className={`px-4 py-2 border rounded-md text-sm hover:bg-muted ${
                                preferencesSettings.fontFamily === "serif" ? "bg-primary/10 border-primary" : ""
                              }`}
                            >
                              Serif
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreferencesSettings(prev => ({ ...prev, fontFamily: "monospace" }))}
                              className={`px-4 py-2 border rounded-md text-sm hover:bg-muted ${
                                preferencesSettings.fontFamily === "monospace" ? "bg-primary/10 border-primary" : ""
                              }`}
                            >
                              Monospace
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <h3 className="text-lg font-medium mb-4">System Preferences</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Default Dashboard View</p>
                            <p className="text-sm text-muted-foreground">Choose what you see first when logging in</p>
                          </div>
                          <select 
                            name="defaultDashboardView"
                            value={preferencesSettings.defaultDashboardView}
                            onChange={handlePreferencesChange}
                            className="p-2 border rounded-md"
                          >
                            <option value="dashboard">Dashboard</option>
                            <option value="inventory">Inventory</option>
                            <option value="reports">Reports</option>
                          </select>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Items Per Page</p>
                            <p className="text-sm text-muted-foreground">Number of items to show in tables</p>
                          </div>
                          <select 
                            name="itemsPerPage"
                            value={preferencesSettings.itemsPerPage}
                            onChange={handlePreferencesChange}
                            className="p-2 border rounded-md"
                          >
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t flex justify-end">
                      <button type="submit" className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90">
                        Save Preferences
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
            
            {/* Appearance Settings */}
            {activeTab === "appearance" && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                  <h2 className="text-xl font-bold">Appearance Settings</h2>
                </div>
                <form onSubmit={handleAppearanceSubmit} className="p-6">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-1">Theme</label>
                      <div className="grid grid-cols-3 gap-4">
                        <div 
                          className={`border rounded-md p-4 cursor-pointer flex flex-col items-center ${
                            appearanceSettings.theme === "light" 
                              ? "border-blue-500 bg-blue-50" 
                              : "hover:bg-gray-50"
                          }`}
                          onClick={() => setAppearanceSettings(prev => ({ ...prev, theme: "light" }))}
                        >
                          <div className="w-full h-20 bg-white border border-gray-200 rounded-md mb-2"></div>
                          <span className="text-sm font-medium">Light</span>
                        </div>
                        
                        <div 
                          className={`border rounded-md p-4 cursor-pointer flex flex-col items-center ${
                            appearanceSettings.theme === "dark" 
                              ? "border-blue-500 bg-blue-50" 
                              : "hover:bg-gray-50"
                          }`}
                          onClick={() => setAppearanceSettings(prev => ({ ...prev, theme: "dark" }))}
                        >
                          <div className="w-full h-20 bg-gray-800 border border-gray-700 rounded-md mb-2"></div>
                          <span className="text-sm font-medium">Dark</span>
                        </div>
                        
                        <div 
                          className={`border rounded-md p-4 cursor-pointer flex flex-col items-center ${
                            appearanceSettings.theme === "system" 
                              ? "border-blue-500 bg-blue-50" 
                              : "hover:bg-gray-50"
                          }`}
                          onClick={() => setAppearanceSettings(prev => ({ ...prev, theme: "system" }))}
                        >
                          <div className="w-full h-20 bg-gradient-to-r from-white to-gray-800 border border-gray-200 rounded-md mb-2"></div>
                          <span className="text-sm font-medium">System</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Primary Color</label>
                      <div className="grid grid-cols-6 gap-4">
                        {["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"].map(color => (
                          <div 
                            key={color}
                            className={`w-12 h-12 rounded-full cursor-pointer ${
                              appearanceSettings.primaryColor === color 
                                ? "ring-2 ring-offset-2 ring-gray-400" 
                                : ""
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setAppearanceSettings(prev => ({ ...prev, primaryColor: color }))}
                          ></div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Sidebar Position</label>
                      <div className="grid grid-cols-2 gap-4">
                        <div 
                          className={`border rounded-md p-4 cursor-pointer flex flex-col items-center ${
                            appearanceSettings.sidebarPosition === "left" 
                              ? "border-blue-500 bg-blue-50" 
                              : "hover:bg-gray-50"
                          }`}
                          onClick={() => setAppearanceSettings(prev => ({ ...prev, sidebarPosition: "left" }))}
                        >
                          <div className="w-full h-20 flex mb-2">
                            <div className="w-1/4 h-full bg-gray-200 rounded-l-md"></div>
                            <div className="w-3/4 h-full bg-white border-t border-r border-b border-gray-200 rounded-r-md"></div>
                          </div>
                          <span className="text-sm font-medium">Left</span>
                        </div>
                        
                        <div 
                          className={`border rounded-md p-4 cursor-pointer flex flex-col items-center ${
                            appearanceSettings.sidebarPosition === "right" 
                              ? "border-blue-500 bg-blue-50" 
                              : "hover:bg-gray-50"
                          }`}
                          onClick={() => setAppearanceSettings(prev => ({ ...prev, sidebarPosition: "right" }))}
                        >
                          <div className="w-full h-20 flex mb-2">
                            <div className="w-3/4 h-full bg-white border-t border-l border-b border-gray-200 rounded-l-md"></div>
                            <div className="w-1/4 h-full bg-gray-200 rounded-r-md"></div>
                          </div>
                          <span className="text-sm font-medium">Right</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="compactView" 
                          name="compactView"
                          checked={appearanceSettings.compactView}
                          onChange={handleAppearanceChange}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600" 
                        />
                        <label htmlFor="compactView" className="ml-2 block text-sm">
                          Enable Compact View
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="showHelpTips" 
                          name="showHelpTips"
                          checked={appearanceSettings.showHelpTips}
                          onChange={handleAppearanceChange}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600" 
                        />
                        <label htmlFor="showHelpTips" className="ml-2 block text-sm">
                          Show Help Tips
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {/* Backup & Export Settings */}
            {activeTab === "backup" && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                  <h2 className="text-xl font-bold">Backup & Export</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="text-lg font-medium mb-2">Database Backup</h3>
                      <p className="text-sm text-gray-500 mb-4">Create a backup of your entire database. This includes all products, transactions, and settings.</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Last backup: </p>
                          <p className="text-sm text-gray-500">May 23, 2023, 09:45 AM</p>
                        </div>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                          Backup Now
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="text-lg font-medium mb-2">Export Data</h3>
                      <p className="text-sm text-gray-500 mb-4">Export specific data to CSV or Excel format for use in other applications.</p>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <p className="font-medium">Products List</p>
                          <div className="flex space-x-2">
                            <button className="px-3 py-1 border rounded-md hover:bg-gray-100">CSV</button>
                            <button className="px-3 py-1 border rounded-md hover:bg-gray-100">Excel</button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="font-medium">Transactions History</p>
                          <div className="flex space-x-2">
                            <button className="px-3 py-1 border rounded-md hover:bg-gray-100">CSV</button>
                            <button className="px-3 py-1 border rounded-md hover:bg-gray-100">Excel</button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="font-medium">Orders History</p>
                          <div className="flex space-x-2">
                            <button className="px-3 py-1 border rounded-md hover:bg-gray-100">CSV</button>
                            <button className="px-3 py-1 border rounded-md hover:bg-gray-100">Excel</button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="text-lg font-medium mb-2">Data Import</h3>
                      <p className="text-sm text-gray-500 mb-4">Import data from CSV or Excel files.</p>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <p className="font-medium">Import Products</p>
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            Upload File
                          </button>
                        </div>
                        <p className="text-xs text-gray-500">
                          Note: Importing data will not overwrite existing records unless specifically configured to do so. Make sure your import file follows the correct format.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Security Settings */}
            {activeTab === "security" && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                  <h2 className="text-xl font-bold">Security Settings</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Password Policy</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">Minimum Password Length</p>
                          <select className="p-2 border rounded-md">
                            <option value="6">6 characters</option>
                            <option value="8" selected>8 characters</option>
                            <option value="10">10 characters</option>
                            <option value="12">12 characters</option>
                          </select>
                        </div>
                        
                        <div className="flex items-center">
                          <input type="checkbox" id="requireUppercase" className="h-4 w-4 rounded border-gray-300 text-blue-600" checked />
                          <label htmlFor="requireUppercase" className="ml-2 block text-sm">
                            Require at least one uppercase letter
                          </label>
                        </div>
                        
                        <div className="flex items-center">
                          <input type="checkbox" id="requireNumber" className="h-4 w-4 rounded border-gray-300 text-blue-600" checked />
                          <label htmlFor="requireNumber" className="ml-2 block text-sm">
                            Require at least one number
                          </label>
                        </div>
                        
                        <div className="flex items-center">
                          <input type="checkbox" id="requireSpecial" className="h-4 w-4 rounded border-gray-300 text-blue-600" checked />
                          <label htmlFor="requireSpecial" className="ml-2 block text-sm">
                            Require at least one special character
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Login Security</h3>
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <input type="checkbox" id="enableTwoFactor" className="h-4 w-4 rounded border-gray-300 text-blue-600" checked />
                          <label htmlFor="enableTwoFactor" className="ml-2 block text-sm">
                            Enable Two-Factor Authentication (2FA) for all users
                          </label>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <p className="font-medium">Session Timeout</p>
                          <select className="p-2 border rounded-md">
                            <option value="15">15 minutes</option>
                            <option value="30">30 minutes</option>
                            <option value="60" selected>1 hour</option>
                            <option value="120">2 hours</option>
                            <option value="240">4 hours</option>
                            <option value="480">8 hours</option>
                          </select>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <p className="font-medium">Failed Login Attempts</p>
                          <select className="p-2 border rounded-md">
                            <option value="3">3 attempts</option>
                            <option value="5" selected>5 attempts</option>
                            <option value="10">10 attempts</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Data Protection</h3>
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <input type="checkbox" id="encryptData" className="h-4 w-4 rounded border-gray-300 text-blue-600" checked />
                          <label htmlFor="encryptData" className="ml-2 block text-sm">
                            Encrypt sensitive data in the database
                          </label>
                        </div>
                        
                        <div className="flex items-center">
                          <input type="checkbox" id="enforceHttps" className="h-4 w-4 rounded border-gray-300 text-blue-600" checked />
                          <label htmlFor="enforceHttps" className="ml-2 block text-sm">
                            Enforce HTTPS for all connections
                          </label>
                        </div>
                        
                        <div className="flex items-center">
                          <input type="checkbox" id="dataBackup" className="h-4 w-4 rounded border-gray-300 text-blue-600" checked />
                          <label htmlFor="dataBackup" className="ml-2 block text-sm">
                            Enable automatic daily backups
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t flex justify-end">
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        Save Security Settings
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;