import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  User,
  LogOut,
  Menu,
  AlertCircle,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SellerLayoutProps {
  children: React.ReactNode;
}

export default function SellerLayout({ children }: SellerLayoutProps) {
  const [location, navigate] = useLocation();
  const { logout, user } = useAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/seller/login");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out of the seller dashboard.",
    });
  };

  const navigation = [
    {
      name: "Dashboard",
      href: "/seller",
      icon: LayoutDashboard,
      current: location === "/seller",
    },
    {
      name: "Products",
      href: "/seller/products",
      icon: Package,
      current: location === "/seller/products",
    },
    {
      name: "Orders",
      href: "/seller/orders",
      icon: ShoppingBag,
      current: location === "/seller/orders",
    },
    {
      name: "Update Profile",
      href: "/seller/profile",
      icon: User,
      current: location === "/seller/profile",
    },
  ];

  if (!user || user.role !== 'seller') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="mt-2 text-gray-600">
            You need to be logged in as a seller to access this page.
          </p>
          <Button
            className="mt-4"
            onClick={() => navigate("/seller/login")}
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
        <div className="flex flex-col bg-white shadow-sm">
          <div className="flex h-16 items-center px-4 border-b">
            <div className="flex items-center">
              <div className="text-xl font-bold text-primary">DesiConnect</div>
              <span className="ml-2 text-gray-500">Seller Dashboard</span>
            </div>
          </div>

          <div className="flex flex-1 flex-col overflow-y-auto">
            <nav className="flex-1 space-y-1 px-2 py-4">
              {navigation.map((item) => (
                <Link key={item.name} href={item.href}>
                  <a
                    className={cn(
                      "group flex items-center px-2 py-3 text-sm font-medium rounded-md",
                      item.current
                        ? "bg-gray-100 text-primary"
                        : "text-gray-700 hover:bg-gray-50 hover:text-primary"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "mr-3 h-5 w-5 flex-shrink-0",
                        item.current ? "text-primary" : "text-gray-400 group-hover:text-primary"
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </a>
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center border-t p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center text-sm font-medium text-gray-500 hover:text-primary"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white">
            <div className="flex h-16 items-center justify-between px-4 border-b">
              <div className="flex items-center">
                <div className="text-xl font-bold text-primary">DesiConnect</div>
                <span className="ml-2 text-gray-500">Seller</span>
              </div>
              <button
                className="text-gray-400 hover:text-gray-500"
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
                        "group flex items-center px-2 py-3 text-sm font-medium rounded-md",
                        item.current
                          ? "bg-gray-100 text-primary"
                          : "text-gray-700 hover:bg-gray-50 hover:text-primary"
                      )}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon
                        className={cn(
                          "mr-3 h-5 w-5 flex-shrink-0",
                          item.current ? "text-primary" : "text-gray-400 group-hover:text-primary"
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </a>
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center border-t p-4">
              <button
                onClick={handleLogout}
                className="flex w-full items-center text-sm font-medium text-gray-500 hover:text-primary"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Logout
              </button>
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

            <div className="flex items-center">
              <div className="flex items-center">
                <span className="text-gray-700 mr-2">{user.businessName || user.email}</span>
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700">
                  {(user.businessName || user.email).charAt(0).toUpperCase()}
                </div>
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
