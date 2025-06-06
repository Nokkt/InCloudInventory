import { useState, useEffect } from "react";

/**
 * Custom hook to detect if the user is on a mobile device
 * Used by the sidebar to provide responsive behavior
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      // Check if screen width is below tablet breakpoint (768px)
      setIsMobile(window.innerWidth < 768);
    };

    // Check on initial load
    checkIsMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkIsMobile);

    // Cleanup event listener
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  return isMobile;
}
