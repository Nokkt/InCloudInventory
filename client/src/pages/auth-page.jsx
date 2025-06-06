import React, { useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Redirect } from "wouter";
import { useToast } from "../hooks/use-toast";

// Form schemas
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  twoFactorCode: z.string().optional(),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  position: z.string().optional(),
});

const passwordResetSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  verificationCode: z.string().optional(),
  newPassword: z.string().min(6, "Password must be at least 6 characters").optional(),
});

const AuthPage = () => {
  const { user, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();
  
  // Auth state management
  const [authMode, setAuthMode] = useState("login"); // login, register, reset, twoFactor
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: username/email, 2: verification code, 3: new password
  
  // Function to switch modes and reset forms
  const switchAuthMode = (mode) => {
    setAuthMode(mode);
    setShowTwoFactor(false);
    setResetStep(1);
  };
  
  // Login form
  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      twoFactorCode: ""
    }
  });
  
  // Register form
  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      email: "",
      role: ""
    }
  });
  
  // Password reset form
  const resetForm = useForm({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      username: "",
      email: "",
      verificationCode: "",
      newPassword: ""
    }
  });
  
  const handleLogin = async (data) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: data.username,
          password: data.password,
          twoFactorCode: showTwoFactor ? data.twoFactorCode : undefined
        }),
      });

      const result = await response.json();

      if (response.ok) {
        if (result.requiresTwoFactor) {
          setShowTwoFactor(true);
          toast({
            title: "2FA Code Sent",
            description: `A 6-digit verification code has been sent to ${result.email}`,
          });
          
          // For development, show the code
          if (result.codeForDev) {
            toast({
              title: "Development Code",
              description: `Your code is: ${result.codeForDev}`,
            });
          }
        } else {
          // Login successful - trigger auth state update
          loginMutation.mutate(data);
          toast({
            title: "Login Successful",
            description: "Welcome back!",
          });
        }
      } else {
        toast({
          title: "Login Failed",
          description: result.message || "Invalid credentials",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleRegister = (data) => {
    console.log("Registration form data:", data);
    console.log("Form errors:", registerForm.formState.errors);
    console.log("Form is valid:", registerForm.formState.isValid);
    console.log("Form validation details:", {
      username: data.username?.length,
      password: data.password?.length,
      fullName: data.fullName?.length,
      email: data.email,
      role: data.role
    });
    
    // Manually validate the data
    try {
      const validatedData = registerSchema.parse(data);
      console.log("Manual validation passed:", validatedData);
      registerMutation.mutate(validatedData);
    } catch (validationError) {
      console.log("Manual validation failed:", validationError);
      registerMutation.mutate(data);
    }
  };
  
  const handlePasswordReset = async (data) => {
    try {
      if (resetStep === 1) {
        // Request password reset code
        const response = await fetch('/api/request-password-reset', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: data.email }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to send verification code');
        }
        
        const result = await response.json();
        
        // If in development, show the reset code from response (for testing)
        if (result.resetCode) {
          toast({
            title: "Verification Code (For Testing)",
            description: `Code: ${result.resetCode}`,
          });
        }
        
        toast({
          title: "Verification Code Sent",
          description: "Please check your email for the verification code",
        });
        setResetStep(2);
      } else if (resetStep === 2) {
        // Store the code for the next step
        resetForm.setValue('verificationCode', data.verificationCode);
        setResetStep(3);
      } else if (resetStep === 3) {
        // Reset password
        const response = await fetch('/api/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            email: data.email,
            code: data.verificationCode,
            newPassword: data.newPassword
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to reset password');
        }
        
        toast({
          title: "Password Reset Successful",
          description: "Your password has been updated. Please login with your new credentials.",
        });
        setAuthMode("login");
        setResetStep(1);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    }
  };
  
  // Redirect if user is already logged in
  if (user) {
    return <Redirect to="/" />;
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
      <div className="mx-auto w-full max-w-6xl flex shadow-lg rounded-lg overflow-hidden">
        {/* Form section */}
        <div className="bg-white w-full md:w-1/2 p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-blue-600">InCloud</h1>
            <p className="text-gray-500 mt-2">Food Inventory Management System</p>
          </div>
          
          {authMode === "login" && (
            <>
              <h2 className="text-2xl font-semibold mb-6">Sign In</h2>
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    {...loginForm.register("username")}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Username"
                  />
                  {loginForm.formState.errors.username && (
                    <p className="text-red-500 text-xs mt-1">{loginForm.formState.errors.username.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    {...loginForm.register("password")}
                    type="password"
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Password"
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-red-500 text-xs mt-1">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>
                
                {showTwoFactor && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
                    <input
                      {...loginForm.register("twoFactorCode")}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter 6-digit code"
                    />
                  </div>
                )}
                
                <div className="flex justify-between items-center text-sm">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span>Remember me</span>
                  </label>
                  <button 
                    type="button"
                    onClick={() => switchAuthMode("reset")}
                    className="text-blue-600 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                
                <button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition flex justify-center"
                >
                  {loginMutation.isPending ? (
                    <span className="animate-spin rounded-full h-5 w-5 border-2 border-t-transparent border-white"></span>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>
              
              <div className="mt-6 text-center">
                <p>
                  Don't have an account?{" "}
                  <button 
                    onClick={() => switchAuthMode("register")}
                    className="text-blue-600 hover:underline"
                  >
                    Create an account
                  </button>
                </p>
              </div>
            </>
          )}
          
          {authMode === "register" && (
            <>
              <h2 className="text-2xl font-semibold mb-6">Create an Account</h2>
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    {...registerForm.register("fullName")}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your full name"
                  />
                  {registerForm.formState.errors.fullName && (
                    <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.fullName.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    {...registerForm.register("email")}
                    type="email"
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your email address"
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                  <input
                    {...registerForm.register("position")}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. Inventory Manager, Store Owner"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    {...registerForm.register("username")}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Choose a username"
                  />
                  {registerForm.formState.errors.username && (
                    <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.username.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    {...registerForm.register("password")}
                    type="password"
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Choose a password"
                  />
                  {registerForm.formState.errors.password && (
                    <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.password.message}</p>
                  )}
                </div>
                
                <button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition flex justify-center"
                >
                  {registerMutation.isPending ? (
                    <span className="animate-spin rounded-full h-5 w-5 border-2 border-t-transparent border-white"></span>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>
              
              <div className="mt-6 text-center">
                <p>
                  Already have an account?{" "}
                  <button 
                    onClick={() => switchAuthMode("login")}
                    className="text-blue-600 hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </>
          )}
          
          {authMode === "reset" && (
            <>
              <h2 className="text-2xl font-semibold mb-6">Reset Password</h2>
              <form onSubmit={resetForm.handleSubmit(handlePasswordReset)} className="space-y-4">
                {resetStep === 1 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                      <input
                        {...resetForm.register("username")}
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Your username"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        {...resetForm.register("email")}
                        type="email"
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Your registered email"
                      />
                      {resetForm.formState.errors.email && (
                        <p className="text-red-500 text-xs mt-1">{resetForm.formState.errors.email.message}</p>
                      )}
                    </div>
                  </>
                )}
                
                {resetStep === 2 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
                    <input
                      {...resetForm.register("verificationCode")}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter verification code"
                    />
                  </div>
                )}
                
                {resetStep === 3 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input
                      {...resetForm.register("newPassword")}
                      type="password"
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter new password"
                    />
                    {resetForm.formState.errors.newPassword && (
                      <p className="text-red-500 text-xs mt-1">{resetForm.formState.errors.newPassword.message}</p>
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      if (resetStep > 1) {
                        setResetStep(resetStep - 1);
                      } else {
                        setAuthMode("login");
                      }
                    }}
                    className="text-blue-600 hover:underline"
                  >
                    {resetStep > 1 ? "Back" : "Return to login"}
                  </button>
                  
                  <button
                    type="submit"
                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
                  >
                    {resetStep === 3 ? "Reset Password" : resetStep === 2 ? "Verify Code" : "Send Code"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
        
        {/* Hero section */}
        <div className="hidden md:block w-1/2 bg-blue-600 p-12 text-white">
          <div className="h-full flex flex-col justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-6">Optimize Your Food Inventory Management</h2>
              <p className="text-lg mb-8">
                InCloud helps you track inventory, reduce waste, and make data-driven decisions with powerful analytics.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-white p-1 rounded-full">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span>Real-time stock tracking</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="bg-white p-1 rounded-full">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span>Expiration date monitoring</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="bg-white p-1 rounded-full">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span>Low stock alerts</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="bg-white p-1 rounded-full">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span>Advanced analytics & reporting</span>
                </div>
              </div>
            </div>
            
            <div className="text-sm opacity-75">
              &copy; {new Date().getFullYear()} InCloud. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;