import React, { useState, useEffect } from "react";
import { Layout } from "../components/layout/Layout";
import { useAuth } from "../hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { Link } from "wouter";

// User Item Component for user list
const UserItem = ({ user, onEdit, onDelete }) => {
  return (
    <div className="flex items-center justify-between p-4 border-b last:border-b-0">
      <div className="flex items-center space-x-3">
        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
          {user.fullName ? user.fullName.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="font-medium">{user.fullName || user.username}</h3>
          <p className="text-sm text-gray-500">
            {user.position && `${user.position} • `}
            {user.role === "admin" ? "Admin" : "User"}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button 
          onClick={() => onEdit(user)} 
          className="p-2 rounded-md text-blue-600 hover:bg-blue-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </button>
        <button 
          onClick={() => onDelete(user)} 
          className="p-2 rounded-md text-red-600 hover:bg-red-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// User Form Modal
const UserFormModal = ({ isOpen, onClose, user, isEditing }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
    position: "",
    role: "user",
  });

  // Update form data when user prop changes
  useEffect(() => {
    if (isEditing && user) {
      setFormData({
        username: user.username || "",
        fullName: user.fullName || "",
        email: user.email || "",
        password: "",
        position: user.position || "",
        role: user.role || "user",
      });
    } else {
      // Reset form for new user
      setFormData({
        username: "",
        fullName: "",
        email: "",
        password: "",
        position: "",
        role: "user",
      });
    }
  }, [user, isEditing, isOpen]);

  const createUserMutation = useMutation({
    mutationFn: async (userData) => {
      const res = await apiRequest("POST", "/api/users", userData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User created successfully",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (userData) => {
      const res = await apiRequest("PATCH", `/api/users/${user.id}`, userData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEditing) {
      // Don't include password if it's empty
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password;
      }
      updateUserMutation.mutate(updateData);
    } else {
      createUserMutation.mutate(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">{isEditing ? "Edit User" : "Add New User"}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                required
                disabled={isEditing}
              />
              {isEditing && (
                <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Position</label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                placeholder="e.g., Manager, Supervisor, Inventory Clerk"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {isEditing ? "New Password (leave blank to keep current)" : "Password"}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                required={!isEditing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={createUserMutation.isPending || updateUserMutation.isPending}
            >
              {(createUserMutation.isPending || updateUserMutation.isPending) ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                isEditing ? "Update User" : "Create User"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteConfirmationModal = ({ isOpen, onClose, user, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="p-6">
          <h3 className="text-lg font-bold mb-4">Confirm Deletion</h3>
          <p className="mb-6">
            Are you sure you want to delete the user <strong>{user?.fullName || user?.username}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(user)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Admin Page Component
const AdminPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch all users
  const {
    data: users = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["/api/users"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId) => {
      await apiRequest("DELETE", `/api/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      setIsDeleteModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddUser = () => {
    setSelectedUser(null);
    setIsEditing(false);
    setIsUserFormOpen(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setIsEditing(true);
    setIsUserFormOpen(true);
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteUser = (user) => {
    deleteUserMutation.mutate(user.id);
  };

  // Filter users based on search term
  const filteredUsers = users.filter((user) =>
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="mb-6 border-b">
          <div className="flex space-x-4">
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === "users"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("users")}
            >
              User Management
            </button>
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === "settings"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("settings")}
            >
              System Settings
            </button>
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === "logs"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("logs")}
            >
              Activity Logs
            </button>
          </div>
        </div>

        {/* User Management Tab */}
        {activeTab === "users" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search users..."
                  className="pl-10 pr-4 py-2 border rounded-md w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <button
                onClick={handleAddUser}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add User
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : isError ? (
                <div className="flex justify-center items-center h-64">
                  <p className="text-red-500">Error loading users</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-64">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <p className="text-gray-500">No users found</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredUsers.map((user) => (
                    <UserItem
                      key={user.id}
                      user={user}
                      onEdit={handleEditUser}
                      onDelete={handleDeleteUser}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* System Settings Tab */}
        {activeTab === "settings" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">General Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Company Name</label>
                  <input type="text" className="w-full p-2 border rounded-md" defaultValue="InCloud Food Inventory" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Email</label>
                  <input type="email" className="w-full p-2 border rounded-md" defaultValue="support@incloud.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Default Currency</label>
                  <select className="w-full p-2 border rounded-md">
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="JPY">JPY (¥)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date Format</label>
                  <select className="w-full p-2 border rounded-md">
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
                <div className="pt-4">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    Save Settings
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Inventory Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Default Low Stock Threshold</label>
                  <input type="number" className="w-full p-2 border rounded-md" defaultValue="50" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Expiration Warning Days</label>
                  <input type="number" className="w-full p-2 border rounded-md" defaultValue="30" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Stock Management Method</label>
                  <select className="w-full p-2 border rounded-md">
                    <option value="FIFO">FIFO (First In, First Out)</option>
                    <option value="LIFO">LIFO (Last In, First Out)</option>
                    <option value="AVG">Average Cost</option>
                  </select>
                </div>
                <div className="flex items-center pt-2">
                  <input type="checkbox" id="automaticReorder" className="h-4 w-4 rounded border-gray-300" checked />
                  <label htmlFor="automaticReorder" className="ml-2">
                    Enable Automatic Reorder Notifications
                  </label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="expirationAlert" className="h-4 w-4 rounded border-gray-300" checked />
                  <label htmlFor="expirationAlert" className="ml-2">
                    Enable Expiration Alerts
                  </label>
                </div>
                <div className="pt-4">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    Save Settings
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
              <h2 className="text-xl font-bold mb-4">Backup & Maintenance</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-md">
                  <div>
                    <h3 className="font-medium">Database Backup</h3>
                    <p className="text-sm text-gray-500">Last backup: May 22, 2023, 04:30 PM</p>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    Backup Now
                  </button>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-md">
                  <div>
                    <h3 className="font-medium">Clear Cache</h3>
                    <p className="text-sm text-gray-500">Improve performance by clearing system cache</p>
                  </div>
                  <button className="px-4 py-2 border rounded-md hover:bg-gray-100">
                    Clear Cache
                  </button>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-md">
                  <div>
                    <h3 className="font-medium">System Update</h3>
                    <p className="text-sm text-gray-500">Current version: v1.2.3</p>
                  </div>
                  <button className="px-4 py-2 border rounded-md hover:bg-gray-100">
                    Check for Updates
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activity Logs Tab */}
        {activeTab === "logs" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search logs..."
                  className="pl-10 pr-4 py-2 border rounded-md w-64"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="flex space-x-2">
                <select className="p-2 border rounded-md">
                  <option value="all">All Activity Types</option>
                  <option value="login">Login</option>
                  <option value="product">Product Changes</option>
                  <option value="order">Order Processing</option>
                  <option value="user">User Management</option>
                </select>
                <button className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200">
                  Export Logs
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[
                    {
                      time: "2023-05-23 14:30:45",
                      user: "admin",
                      action: "Login",
                      details: "Successful login",
                      ip: "192.168.1.1",
                    },
                    {
                      time: "2023-05-23 13:15:22",
                      user: "john_doe",
                      action: "Product Create",
                      details: "Added new product: Organic Milk",
                      ip: "192.168.1.5",
                    },
                    {
                      time: "2023-05-23 12:45:10",
                      user: "jane_smith",
                      action: "Order Process",
                      details: "Processed order #12345",
                      ip: "192.168.1.10",
                    },
                    {
                      time: "2023-05-23 11:30:18",
                      user: "admin",
                      action: "User Update",
                      details: "Updated user: john_doe",
                      ip: "192.168.1.1",
                    },
                    {
                      time: "2023-05-23 10:15:30",
                      user: "admin",
                      action: "Settings Change",
                      details: "Updated system settings",
                      ip: "192.168.1.1",
                    },
                  ].map((log, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {log.user}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.action}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.details}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.ip}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-6 py-4 border-t">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Showing 1 to 5 of 24 entries
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 border rounded-md hover:bg-gray-50">Previous</button>
                    <button className="px-3 py-1 bg-blue-600 text-white rounded-md">1</button>
                    <button className="px-3 py-1 border rounded-md hover:bg-gray-50">2</button>
                    <button className="px-3 py-1 border rounded-md hover:bg-gray-50">3</button>
                    <button className="px-3 py-1 border rounded-md hover:bg-gray-50">Next</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Form Modal */}
      <UserFormModal
        isOpen={isUserFormOpen}
        onClose={() => setIsUserFormOpen(false)}
        user={selectedUser}
        isEditing={isEditing}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        user={selectedUser}
        onConfirm={confirmDeleteUser}
      />
    </Layout>
  );
};

export default AdminPage;