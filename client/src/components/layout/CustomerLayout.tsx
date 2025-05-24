import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  ChevronDown,
  LogOut,
} from "lucide-react";
import logoImage from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface CustomerLayoutProps {
  children: React.ReactNode;
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
  const [location, navigate] = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const { cartCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const categories = [
    { name: "All Products", path: "/products" },
    { name: "Apparel", path: "/products/category/apparel" },
    { name: "Accessories", path: "/products/category/accessories" },
    { name: "Festivities", path: "/products/category/festivities" },
    { name: "Home Decor", path: "/products/category/home-decor" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex justify-between items-center">
              <Link href="/">
                <a className="flex items-center">
                  <img src={logoImage} alt="DesiConnect Logo" className="h-12 mr-2" />
                </a>
              </Link>
              
              <div className="flex items-center space-x-2 md:hidden">
                <Link href="/cart">
                  <a className="text-gray-700 relative">
                    <ShoppingCart className="h-6 w-6" />
                  </a>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="text-gray-700"
                >
                  {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>
            </div>
            
            <div className="flex md:w-1/3 order-3 md:order-2">
              <form onSubmit={handleSearch} className="relative w-full">
                <Input
                  type="text"
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Search className="h-5 w-5" />
                </div>
              </form>
            </div>
            
            <div className="hidden md:flex items-center space-x-6 order-2 md:order-3">
              <div className="relative">
                {isAuthenticated ? (
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center text-gray-700 hover:text-primary"
                    >
                      <User className="h-5 w-5 mr-2" />
                      <span>{user?.name || 'Account'}</span>
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </button>
                    
                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                        <Link href="/orders">
                          <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            My Orders
                          </a>
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link href="/login">
                    <a className="flex items-center text-gray-700 hover:text-primary">
                      <User className="h-5 w-5 mr-2" />
                      <span>Login</span>
                    </a>
                  </Link>
                )}
              </div>
              
              <Link href="/cart">
                <a className="text-gray-700 hover:text-primary relative">
                  <ShoppingCart className="h-5 w-5 mr-2 inline-block" />
                  <span>Cart</span>
                </a>
              </Link>
            </div>
          </div>
          
          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 py-2 border-t">
              <nav className="flex flex-col space-y-3">
                {categories.map((category) => (
                  <Link key={category.name} href={category.path}>
                    <a 
                      className={cn(
                        "text-gray-600 hover:text-primary py-1",
                        location === category.path && "text-primary font-medium"
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {category.name}
                    </a>
                  </Link>
                ))}
                
                {isAuthenticated ? (
                  <>
                    <Link href="/orders">
                      <a className="text-gray-600 hover:text-primary py-1">
                        My Orders
                      </a>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="text-left text-gray-600 hover:text-primary py-1 flex items-center"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </button>
                  </>
                ) : (
                  <Link href="/login">
                    <a className="text-gray-600 hover:text-primary py-1">
                      Login / Register
                    </a>
                  </Link>
                )}
              </nav>
            </div>
          )}
          
          {/* Category Navigation - Desktop */}
          <nav className="hidden md:flex mt-4">
            <ul className="flex space-x-6 overflow-x-auto pb-2">
              {categories.map((category) => (
                <li key={category.name}>
                  <Link href={category.path}>
                    <a 
                      className={cn(
                        "whitespace-nowrap text-gray-600 hover:text-primary",
                        location === category.path && "text-primary font-medium"
                      )}
                    >
                      {category.name}
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">DesiConnect</h3>
              <p className="text-gray-300">Connecting you with authentic Indian craftsmanship and culture.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Shop</h4>
              <ul className="space-y-2">
                <li><Link href="/products"><a className="text-gray-300 hover:text-white">All Products</a></Link></li>
                <li><Link href="/products/category/apparel"><a className="text-gray-300 hover:text-white">Apparel</a></Link></li>
                <li><Link href="/products/category/accessories"><a className="text-gray-300 hover:text-white">Accessories</a></Link></li>
                <li><Link href="/products/category/festivities"><a className="text-gray-300 hover:text-white">Festivities</a></Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Account</h4>
              <ul className="space-y-2">
                {isAuthenticated ? (
                  <>
                    <li><Link href="/orders"><a className="text-gray-300 hover:text-white">My Orders</a></Link></li>
                    <li><button onClick={handleLogout} className="text-gray-300 hover:text-white">Logout</button></li>
                  </>
                ) : (
                  <>
                    <li><Link href="/login"><a className="text-gray-300 hover:text-white">Login</a></Link></li>
                    <li><Link href="/register"><a className="text-gray-300 hover:text-white">Register</a></Link></li>
                  </>
                )}
                <li><Link href="/cart"><a className="text-gray-300 hover:text-white">Cart</a></Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-300">support@desiconnect.com</span>
                </li>

              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-700 text-gray-400 text-sm text-center">
            <p>&copy; {new Date().getFullYear()} DesiConnect. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
