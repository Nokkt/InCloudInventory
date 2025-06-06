import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "./hooks/use-toast";
import NotFound from "./pages/not-found";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute, AdminProtectedRoute } from "./lib/protected-route";
import AuthPage from "./pages/auth-page";
import Dashboard from "./pages/dashboard";
import ProductsPage from "./pages/products-page";
import ProductForm from "./pages/product-form";
import StockPage from "./pages/stock-page";
import ExpirationPage from "./pages/expiration-page";
import LowStockPage from "./pages/low-stock-page";
import OrdersPage from "./pages/orders-page";
import UserPage from "./pages/user-page";
import SettingsPage from "./pages/settings-page";
import AdminPage from "./pages/admin-page";
import ReportsPage from "./pages/reports-page";

// For the remaining pages that haven't been fully implemented yet
const SimplePageComponent = ({ title }) => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">{title}</h1>
    <p>This page is under construction.</p>
  </div>
);

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/products" component={ProductsPage} />
      <ProtectedRoute path="/products/add" component={ProductForm} />
      <ProtectedRoute path="/products/edit/:id" component={ProductForm} />
      <ProtectedRoute path="/stock" component={StockPage} />
      <ProtectedRoute path="/expiration" component={ExpirationPage} />
      <ProtectedRoute path="/low-stock" component={LowStockPage} />
      <ProtectedRoute path="/reports" component={ReportsPage} />
      <ProtectedRoute path="/orders" component={OrdersPage} />
      <ProtectedRoute path="/user" component={UserPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <AdminProtectedRoute path="/admin" component={AdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <Router />
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;