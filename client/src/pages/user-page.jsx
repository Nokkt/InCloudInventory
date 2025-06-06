import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import Layout from "../components/layout/Layout";
import { Plus } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../hooks/use-auth";

function UserPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    bio: "",
    position: ""
  });

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/user"]
  });

  // Query to get all users for admin count validation
  const { data: allUsers = [] } = useQuery({
    queryKey: ["/api/users"],
    enabled: user?.role === "admin", // Only fetch if current user is admin
  });

  // Update form data when user data changes
  React.useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        username: user.username || "",
        email: user.email || "",
        phone: user.phone || "",
        bio: user.bio || "",
        position: user.position || ""
      });
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (updatedData) => {
      const res = await apiRequest("PATCH", "/api/user/profile", updatedData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/user"]);
      queryClient.invalidateQueries(["/api/users"]);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error", 
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (imageData) => {
      const res = await apiRequest("POST", `/api/user/${user.id}/upload-image`, imageData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/user"]);
    }
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      
      // Check file size
      if (file.size > maxSize) {
        alert('File size must be less than 5MB. Please choose a smaller image.');
        e.target.value = ''; // Clear the input
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file.');
        e.target.value = ''; // Clear the input
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        uploadImageMutation.mutate({
          imageData: event.target.result,
          fileName: file.name,
          fileSize: file.size
        });
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">User Profile</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Profile Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="relative inline-block mb-4">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto">
                    {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                  </div>
                  <label className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-1.5 cursor-pointer hover:bg-blue-700">
                    <Plus size={16} />
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
                <h2 className="text-xl font-bold text-center">{user?.fullName || "User"}</h2>
                <p className="text-gray-500 text-center">
                  {user?.position && `${user.position} • `}
                  {user?.role === "admin" ? "Admin" : "User"}
                </p>
                
                <div className="mt-4 w-full">
                  <button className="w-full bg-white border border-blue-600 text-blue-600 px-4 py-2 rounded-md hover:bg-blue-50">
                    Change Password
                  </button>
                </div>
                
                {/* Role section below change password */}
                <div className="mt-6 pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">System Role</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    {user?.role === "admin" ? "Administrator" : "User"}
                  </p>
                  {user?.role === "admin" && (
                    <p className="text-xs text-amber-600">
                      Admin role can be changed in profile settings
                    </p>
                  )}
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow mt-6 p-6">
                <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="mr-3 mt-0.5">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Updated product inventory</p>
                      <p className="text-xs text-muted-foreground">Today, 9:30 AM</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="mr-3 mt-0.5">
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Viewed inventory report</p>
                      <p className="text-xs text-muted-foreground">Yesterday, 3:45 PM</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="mr-3 mt-0.5">
                      <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Updated user profile</p>
                      <p className="text-xs text-muted-foreground">Yesterday, 11:20 AM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          
            {/* Right Column - Edit Profile */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="border-b">
                  <div className="flex">
                    <button className="px-6 py-3 font-medium text-sm border-b-2 border-primary text-primary">
                      Edit Profile
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-1">Full Name</label>
                        <input 
                          type="text" 
                          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                          value={formData.fullName}
                          onChange={(e) => handleInputChange('fullName', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Username</label>
                        <input 
                          type="text" 
                          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                          value={formData.username}
                          onChange={(e) => handleInputChange('username', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input 
                          type="email" 
                          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Phone</label>
                        <input 
                          type="tel" 
                          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Position</label>
                        <input 
                          type="text" 
                          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                          value={formData.position}
                          onChange={(e) => handleInputChange('position', e.target.value)}
                          placeholder="e.g. Store Manager, Inventory Supervisor"
                        />
                      </div>

                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Bio</label>
                      <textarea 
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-20" 
                        value={formData.bio}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <button 
                        type="submit" 
                        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending && (
                          <span className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent border-white"></span>
                        )}
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default UserPage;