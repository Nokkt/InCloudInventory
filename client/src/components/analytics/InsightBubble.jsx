import React from "react";

/**
 * A speech bubble component for analytics insights
 * Used to provide descriptive and prescriptive analysis in reports
 */
const InsightBubble = ({ title, content, type = "info" }) => {
  // Determine bubble style based on type
  const getBubbleStyle = () => {
    switch (type) {
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

  const bubbleStyle = getBubbleStyle();
  
  return (
    <div className={`p-4 rounded-lg ${bubbleStyle} border relative mb-6`}>
      {/* Triangle pointer */}
      <div className={`absolute -top-2 left-4 w-4 h-4 transform rotate-45 ${bubbleStyle}`}></div>
      
      {/* Content */}
      <h4 className="font-medium mb-1">{title}</h4>
      <p className="text-sm">{content}</p>
    </div>
  );
};

export default InsightBubble;