import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingBag,
  LogOut,
  Menu,
  AlertCircle,
  Bell,
  Search,
} from "lucide-react";
//import adminLogo from "@/assets/admin-logo.png";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location, navigate] = useLocation();
  const { logout, user } = useAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out of the admin panel.",
    });
  };

  const navigation = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      current: location === "/admin",
    },
    {
      name: "Sellers",
      href: "/admin/sellers",
      icon: Users,
      current: location.startsWith("/admin/sellers"),
    },
    {
      name: "Products",
      href: "/admin/products",
      icon: Package,
      current: location.startsWith("/admin/products"),
    },
    {
      name: "Orders",
      href: "/admin/orders",
      icon: ShoppingBag,
      current: location.startsWith("/admin/orders"),
    },
  ];

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="mt-2 text-gray-600">
            You need to be logged in as an admin to access this page.
          </p>
          <Button
            className="mt-4"
            onClick={() => navigate("/admin/login")}
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col bg-gray-800">
          <div className="flex h-16 items-center px-4 bg-gray-900">
            <div className="flex items-center">
              <img src="/admin-logo.png" alt="DesiConnect Admin" className="h-10" />
            </div>
          </div>

          <div className="flex flex-1 flex-col overflow-y-auto">
            <nav className="flex-1 space-y-1 px-2 py-4">
              {navigation.map((item) => (
                <Link key={item.name} href={item.href}>
                  <a
                    className={cn(
                      "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                      item.current
                        ? "bg-gray-900 text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "mr-3 h-6 w-6 flex-shrink-0",
                        item.current ? "text-white" : "text-gray-400 group-hover:text-gray-300"
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </a>
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center border-t border-gray-700 p-4">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-gray-500 flex items-center justify-center text-white">
                {user.email.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user.email}</p>
              <button
                onClick={handleLogout}
                className="text-xs font-medium text-gray-400 hover:text-gray-300 flex items-center mt-1"
              >
                <LogOut className="h-3 w-3 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-gray-800">
            <div className="flex h-16 items-center justify-between px-4 bg-gray-900">
              <div className="flex items-center">
                <img src="/admin-logo.png" alt="DesiConnect Admin" className="h-10" />
              </div>
              <button
                className="text-gray-300 hover:text-white"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-1 flex-col overflow-y-auto">
              <nav className="flex-1 space-y-1 px-2 py-4">
                {navigation.map((item) => (
                  <Link key={item.name} href={item.href}>
                    <a
                      className={cn(
                        "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                        item.current
                          ? "bg-gray-900 text-white"
                          : "text-gray-300 hover:bg-gray-700 hover:text-white"
                      )}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon
                        className={cn(
                          "mr-3 h-6 w-6 flex-shrink-0",
                          item.current ? "text-white" : "text-gray-400 group-hover:text-gray-300"
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </a>
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center border-t border-gray-700 p-4">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-gray-500 flex items-center justify-center text-white">
                  {user.email.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{user.email}</p>
                <button
                  onClick={handleLogout}
                  className="text-xs font-medium text-gray-400 hover:text-gray-300 flex items-center mt-1"
                >
                  <LogOut className="h-3 w-3 mr-1" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top navigation */}
        <div className="bg-white shadow-sm z-10">
          <div className="flex h-16 items-center justify-between px-4">
            <button
              type="button"
              className="text-gray-500 md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>

            <div className="flex flex-1 justify-between">
              <div className="flex flex-1">
                <div className="flex w-full max-w-lg md:ml-0">
                  <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Search className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <input
                      className="block w-full rounded-md border-0 bg-white py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                      placeholder="Search"
                      type="search"
                    />
                  </div>
                </div>
              </div>

              <div className="ml-4 flex items-center md:ml-6 space-x-4">
                <Button 
                  onClick={handleLogout}
                  variant="destructive" 
                  className="flex items-center gap-2"
                  size="sm"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
