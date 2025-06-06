import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Bell, Settings, Moon, Sun, Download, Upload, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header({ title, description }) {
  const { showSearch = true, onSearch, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  return (
    <header className="p-4 border-b bg-white flex flex-col gap-4">
      {/* Top Section */}
      <div className="flex items-center justify-between">
        {/* Title (mobile view or small) */}
        {title && <h1 className="text-xl font-semibold">{title}</h1>}

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Theme Switcher */}
          <Button variant="ghost" size="icon">
            <Sun className="h-5 w-5" />
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Avatar>
                {user?.profileImageUrl ? (
                  <AvatarImage src={user.profileImageUrl} />
                ) : (
                  <AvatarFallback>{user?.fullName?.[0] || "U"}</AvatarFallback>
                )}
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user?.fullName || "User"}</DropdownMenuLabel>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                {user?.role || "Role"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <Input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
      )}

      {/* Optional Page Description */}
      {description && (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}
    </header>
  );
}
