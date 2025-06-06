import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Archive,
  RefreshCw,
  Calendar,
  AlertTriangle,
  BarChart2,
  ShoppingCart,
  UserCog,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useMobile } from "@/hooks/use-mobile";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const isMobile = useMobile();
  const [isOpen, setIsOpen] = useState(!isMobile);

  useEffect(() => {
    const handleResize = () => {
      setIsOpen(window.innerWidth >= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const items = [
    {
      title: "Dashboard",
      href: "/",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: "Products",
      href: "/products",
      icon: <Archive className="h-5 w-5" />,
    },
    {
      title: "Stock In/Out",
      href: "/stock",
      icon: <RefreshCw className="h-5 w-5" />,
    },
    {
      title: "Expiration",
      href: "/expiration",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      title: "Low Stock",
      href: "/low-stock",
      icon: <AlertTriangle className="h-5 w-5" />,
    },
    {
      title: "Reports",
      href: "/reports",
      icon: <BarChart2 className="h-5 w-5" />,
    },
    {
      title: "Orders",
      href: "/orders",
      icon: <ShoppingCart className="h-5 w-5" />,
    },
    {
      title: "User Profile",
      href: "/user",
      icon: <UserCog className="h-5 w-5" />,
    },
    {
      title: "Admin Panel",
      href: "/admin",
      icon: <ShieldCheck className="h-5 w-5" />,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  return (
    <div className="relative">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={toggleSidebar}
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* Sidebar Backdrop */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out z-40",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b border-gray-200">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Archive className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">InCloud</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-2">
            {items.filter(item => {
              // Hide admin panel from non-admin users
              if (item.href === "/admin" && user?.role !== "admin") {
                return false;
              }
              return true;
            }).map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={closeSidebar}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    location === item.href
                      ? "bg-primary text-primary-foreground"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <span className="flex-shrink-0">
                    {item.icon}
                  </span>
                  <span>{item.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-gray-700 hover:bg-gray-100"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Log Out
          </Button>
        </div>
      </aside>
    </div>
  );
}