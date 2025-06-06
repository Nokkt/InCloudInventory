import React from "react";
import { ResponsiveContainer } from "recharts";

// This component creates a consistent analytics card with title and optional insights
const AnalyticsCard = ({ 
  title, 
  children, 
  insight, 
  insightType = "info",
  className = ""
}) => {
  // Determine insight bubble background color
  const getBubbleStyle = () => {
    switch (insightType) {
      case "success":
        return "bg-green-100 border-green-300 text-green-800";
      case "warning":
        return "bg-orange-100 border-orange-300 text-orange-800";
      case "danger":
        return "bg-red-100 border-red-300 text-red-800";
      default:
        return "bg-blue-100 border-blue-300 text-blue-800";
    }
  };

  return (
    <div className={`bg-white p-6 rounded-lg shadow ${className}`}>
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
      
      {insight && (
        <div className={`p-4 rounded-lg ${getBubbleStyle()} border relative mt-6`}>
          <div className="absolute -top-2 left-4 transform rotate-45 w-4 h-4 ${getBubbleStyle()}"></div>
          <p className="text-sm">{insight}</p>
        </div>
      )}
    </div>
  );
};

export default AnalyticsCard;