// Create a simple toast hook implementation
import React, { createContext, useContext, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = ({ title, description, variant }) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prevToasts) => [...prevToasts, { id, title, description, variant }]);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    }, 5000);
  };

  return (
    <ToastContext.Provider value={{ toast, toasts, setToasts }}>
      {children}
      {/* We'll implement a simple toast display system here */}
      <div className="fixed bottom-0 right-0 p-4 space-y-2 z-50">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`p-4 rounded-md shadow-md ${
              t.variant === "destructive" ? "bg-red-100 text-red-800" : "bg-white"
            }`}
          >
            {t.title && <h4 className="font-medium">{t.title}</h4>}
            {t.description && <p className="text-sm">{t.description}</p>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}