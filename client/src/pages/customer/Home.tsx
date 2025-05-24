import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import CustomerLayout from "@/components/layout/CustomerLayout";
import { Button } from "@/components/ui/button";
import { getApprovedProducts, getProductsByCategory } from "@/lib/api";
import { updateCart } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  formatCurrency
} from "@/lib/utils";
import {
  ShoppingCart,
  Star,
  ArrowRight
} from "lucide-react";
import bannerImage from "@/assets/banner.png";

export default function CustomerHome() {
  const [_, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  // Query for featured products (we'll use the first 4 products)
  const { data: featuredProducts, isLoading: loadingFeatured } = useQuery({
    queryKey: ["/api/products"],
    select: (data) => data?.slice(0, 4),
  });

  const addToCart = async (productId: number) => {
    if (!isAuthenticated) {
      toast({
        title: "Please login",
        description: "You need to be logged in to add items to your cart",
      });
      navigate("/login");
      return;
    }

    try {
      // Get current cart
      const response = await fetch("/api/customer/cart", {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch cart");
      }
      
      const currentCart = await response.json();
      
      // Check if product is already in cart
      const existingItem = currentCart.items.find((item: any) => item.productId === productId);
      
      let newItems;
      if (existingItem) {
        // Increase quantity if already in cart
        newItems = currentCart.items.map((item: any) => 
          item.productId === productId 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        // Add new item if not in cart
        newItems = [
          ...currentCart.items,
          { productId, quantity: 1, message: "" }
        ];
      }
      
      // Update cart
      await updateCart({ items: newItems });
      
      toast({
        title: "Added to cart",
        description: "Item has been added to your cart",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add item to cart",
      });
    }
  };

  return (
    <CustomerLayout>
      {/* Hero Section */}
      <div className="relative mb-8 rounded-lg overflow-hidden">
        <div className="w-full">
          <img 
            src={bannerImage} 
            alt="DESI CONNECT - HOUSE OF INDIAN ECSTASY" 
            className="w-full object-cover"
          />
        </div>
        <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10">
          <Button
            onClick={() => navigate("/products")}
            className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-6 rounded-lg transition"
          >
            Shop Now
          </Button>
        </div>
      </div>

      {/* Featured Products */}
      <div className="container mx-auto px-4 mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold font-heading">Featured Products</h2>
          <Button
            variant="link"
            onClick={() => navigate("/products")}
            className="flex items-center text-primary"
          >
            View All <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        
        {loadingFeatured ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                  <div className="h-8 bg-gray-200 rounded w-full mt-2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : !featuredProducts || featuredProducts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No products available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product: any) => (
              <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition">
                <div 
                  className="h-48 bg-cover bg-center cursor-pointer"
                  style={{ backgroundImage: `url(${product.image || 'https://via.placeholder.com/300x200?text=No+Image'})` }}
                  onClick={() => navigate(`/products/${product.id}`)}
                ></div>
                <div className="p-4">
                  <h3 
                    className="text-lg font-semibold mb-2 cursor-pointer hover:text-primary"
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    {product.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                  <div className="flex justify-between items-center mt-auto">
                    <span className="text-primary-600 font-bold">{formatCurrency(product.price)}</span>
                    <Button 
                      onClick={() => navigate(`/products/${product.id}`)}
                      className="bg-primary hover:bg-primary-dark text-white flex items-center"
                      size="sm"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Categories Section */}
      <div className="container mx-auto px-4 mb-12">
        <h2 className="text-2xl font-bold mb-6 font-heading">Shop by Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Category 1 - Apparel */}
          <div className="relative rounded-lg overflow-hidden h-64 group bg-gray-50 flex flex-col justify-center items-center">
            <h3 className="text-xl font-semibold mb-4">Apparel</h3>
            <Button
              variant="default" 
              size="sm"
              onClick={() => navigate("/products/category/apparel")}
              className="bg-primary hover:bg-primary-dark text-white"
            >
              Shop Now
            </Button>
          </div>

          {/* Category 2 - Accessories */}
          <div className="relative rounded-lg overflow-hidden h-64 group bg-gray-50 flex flex-col justify-center items-center">
            <h3 className="text-xl font-semibold mb-4">Accessories</h3>
            <Button
              variant="default" 
              size="sm"
              onClick={() => navigate("/products/category/accessories")}
              className="bg-primary hover:bg-primary-dark text-white"
            >
              Shop Now
            </Button>
          </div>

          {/* Category 3 - Festivities */}
          <div className="relative rounded-lg overflow-hidden h-64 group bg-gray-50 flex flex-col justify-center items-center">
            <h3 className="text-xl font-semibold mb-4">Festivities</h3>
            <Button
              variant="default" 
              size="sm"
              onClick={() => navigate("/products/category/festivities")}
              className="bg-primary hover:bg-primary-dark text-white"
            >
              Shop Now
            </Button>
          </div>
        </div>
      </div>



      {/* Why Choose Us */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-8 text-center font-heading">Why Choose DesiConnect</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="inline-block p-4 rounded-full bg-primary/10 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">Authentic Products</h3>
            <p className="text-gray-600">Verified sellers offering genuine Indian goods</p>
          </div>
          
          <div className="text-center">
            <div className="inline-block p-4 rounded-full bg-primary/10 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">Fast Delivery</h3>
            <p className="text-gray-600">Trackable shipping for all your orders</p>
          </div>
          
          <div className="text-center">
            <div className="inline-block p-4 rounded-full bg-primary/10 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">Support Local Artisans</h3>
            <p className="text-gray-600">Help sustain traditional crafts and communities</p>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
