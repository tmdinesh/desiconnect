import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  Package,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useAuth();
  
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };
  
  const toggleMobileSidebar = () => {
    setMobileOpen(!mobileOpen);
  };
  
  const sidebarLinks = [
    {
      name: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      href: "/admin/dashboard",
    },
    {
      name: "Products",
      icon: <Package className="h-5 w-5" />,
      href: "/admin/products",
    },
    {
      name: "Orders",
      icon: <ShoppingBag className="h-5 w-5" />,
      href: "/admin/orders",
    },
    {
      name: "Sellers",
      icon: <Users className="h-5 w-5" />,
      href: "/admin/sellers",
    },
    {
      name: "Settings",
      icon: <Settings className="h-5 w-5" />,
      href: "/admin/settings",
    },
  ];
  
  const renderSidebarContent = () => (
    <>
      <div className="flex items-center justify-between px-4 pt-5 pb-2">
        {!collapsed && (
          <div className="flex items-center">
            <h1 className="text-xl font-bold">DesiConnect</h1>
            <p className="text-xs ml-2 text-muted-foreground">Admin</p>
          </div>
        )}
        
        <Button 
          variant="ghost" 
          size="icon"
          className="hidden md:flex" 
          onClick={toggleSidebar}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={toggleMobileSidebar}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="mt-5 px-3">
        {sidebarLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <a className={cn(
              "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
              location === link.href ? "bg-accent" : "transparent",
              collapsed ? "justify-center" : "justify-start"
            )}>
              {link.icon}
              {!collapsed && <span className="ml-3">{link.name}</span>}
            </a>
          </Link>
        ))}
      </div>
      
      <div className="mt-auto px-3 py-4">
        <Link href="/login">
          <Button 
            variant="ghost" 
            className={cn(
              "w-full flex items-center rounded-md px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10",
              collapsed ? "justify-center" : "justify-start"
            )}
            onClick={(e) => {
              e.preventDefault();
              logout();
              window.location.href = "/login";
            }}
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span className="ml-3">Log Out</span>}
          </Button>
        </Link>
      </div>
      
      {!collapsed && (
        <div className="border-t pt-4 px-3">
          <div className="flex items-center">
            <Avatar>
              <AvatarFallback>A</AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="text-sm font-medium">Admin</p>
              <p className="text-xs text-muted-foreground truncate w-36">
                {user?.email || "admin@desiconnect.com"}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Mobile sidebar backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={toggleMobileSidebar}
        />
      )}
      
      {/* Mobile sidebar menu button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button 
          variant="outline" 
          size="icon"
          onClick={toggleMobileSidebar}
          className={cn(mobileOpen ? "hidden" : "flex")}
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Sidebar for mobile */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform ease-in-out duration-300 bg-background border-r md:hidden",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {renderSidebarContent()}
      </div>
      
      {/* Sidebar for desktop */}
      <div className={cn(
        "hidden md:flex flex-col h-screen bg-background border-r transition-all",
        collapsed ? "w-16" : "w-64"
      )}>
        {renderSidebarContent()}
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="md:px-8 px-4 py-6">
          {children}
        </div>
      </div>
    </div>
  );
}