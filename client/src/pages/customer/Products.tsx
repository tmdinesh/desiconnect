import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import CustomerLayout from "@/components/layout/CustomerLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { getApprovedProducts, getProductsByCategory, searchProducts, updateCart } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, getImageUrl } from "@/lib/utils";
import { queryClient } from "@/lib/queryClient";
import { Search, ShoppingCart, Filter, Package } from "lucide-react";

export default function CustomerProducts() {
  const [location, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [priceRange, setPriceRange] = useState("all");
  const [category, setCategory] = useState("all");
  
  // Extract category from URL if present
  const urlPathParts = location.split('/');
  const categoryFromUrl = urlPathParts.length > 3 && urlPathParts[2] === 'category' ? urlPathParts[3] : null;
  
  // Extract search query from URL if present
  const urlSearchParams = new URLSearchParams(window.location.search);
  const searchFromUrl = urlSearchParams.get('search');
  
  useEffect(() => {
    if (categoryFromUrl) {
      setCategory(categoryFromUrl);
    }
    
    if (searchFromUrl) {
      setSearchQuery(searchFromUrl);
    }
  }, [categoryFromUrl, searchFromUrl]);
  
  // Determine which API to call based on filters
  const { data: products, isLoading, error } = useQuery({
    queryKey: searchFromUrl 
      ? ['/api/products/search', searchFromUrl]
      : categoryFromUrl 
        ? [`/api/products/category/${categoryFromUrl}`]
        : ['/api/products'],
    queryFn: async () => {
      if (searchFromUrl) {
        console.log("Searching for products with query:", searchFromUrl);
        return searchProducts(searchFromUrl);
      } else if (categoryFromUrl) {
        return getProductsByCategory(categoryFromUrl);
      } else {
        return getApprovedProducts();
      }
    }
  });
  
  // We'll use the search bar in the header for searching
  
  // Function to handle category selection
  const handleCategoryChange = (value: string) => {
    setCategory(value);
    if (value === 'all') {
      navigate('/products');
    } else {
      navigate(`/products/category/${value}`);
    }
  };
  
  // Function to filter and sort products
  const getFilteredAndSortedProducts = () => {
    if (!products) return [];
    
    let filtered = [...products];
    
    // Apply price filter
    if (priceRange !== 'all') {
      const [min, max] = priceRange.split('-').map(Number);
      filtered = filtered.filter(product => {
        const price = Number(product.price);
        if (max) {
          return price >= min && price <= max;
        } else {
          return price >= min;
        }
      });
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'price-low-high':
        filtered.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case 'price-high-low':
        filtered.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case 'name-a-z':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-z-a':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default: // latest
        // Assuming the most recent products have higher IDs
        filtered.sort((a, b) => b.id - a.id);
    }
    
    return filtered;
  };
  
  const filteredProducts = getFilteredAndSortedProducts();
  
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
      // Get current cart with proper authorization
      const token = localStorage.getItem('desiconnect_token');
      
      if (!token) {
        toast({
          variant: "destructive",
          title: "Authentication error",
          description: "Please log in again to continue shopping",
        });
        navigate("/login");
        return;
      }
      
      const response = await fetch("/api/customer/cart", {
        credentials: "include",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          toast({
            variant: "destructive",
            title: "Session expired",
            description: "Your session has expired. Please log in again.",
          });
          navigate("/login");
          return;
        }
        throw new Error("Failed to fetch cart");
      }
      
      let currentCart;
      try {
        currentCart = await response.json();
      } catch (error) {
        console.error("Error parsing cart JSON:", error);
        currentCart = { items: [] };
      }
      
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
      
      // Update cart with better error handling
      try {
        await updateCart({ items: newItems });
        
        // Refresh products data to update quantities
        queryClient.invalidateQueries({queryKey: ["/api/products"]});
        
        toast({
          title: "Added to cart",
          description: "Item has been added to your cart",
        });
      } catch (updateError) {
        console.error("Failed to update cart:", updateError);
        toast({
          variant: "destructive",
          title: "Cart update failed",
          description: "Please try logging in again or refresh the page",
        });
        throw updateError;
      }
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
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {categoryFromUrl
              ? `${categoryFromUrl.charAt(0).toUpperCase() + categoryFromUrl.slice(1)}`
              : searchFromUrl
              ? `Search Results for "${searchFromUrl}"`
              : "All Products"}
          </h1>
          <p className="text-gray-600">
            Explore our collection of authentic Indian products
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Filters (desktop) */}
          <div className="hidden md:block w-64 space-y-6">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium text-lg mb-4">Filters</h3>

                {/* Category Filter */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <Select value={category} onValueChange={handleCategoryChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="apparel">Apparel</SelectItem>
                      <SelectItem value="accessories">Accessories</SelectItem>
                      <SelectItem value="festivities">Festivities</SelectItem>
                      <SelectItem value="home-decor">Home Decor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range Filter */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Price Range</label>
                  <Select value={priceRange} onValueChange={setPriceRange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select price range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Prices</SelectItem>
                      <SelectItem value="0-500">Under ₹500</SelectItem>
                      <SelectItem value="500-1000">₹500 - ₹1,000</SelectItem>
                      <SelectItem value="1000-5000">₹1,000 - ₹5,000</SelectItem>
                      <SelectItem value="5000-10000">₹5,000 - ₹10,000</SelectItem>
                      <SelectItem value="10000-">Above ₹10,000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium mb-2">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="latest">Latest</SelectItem>
                      <SelectItem value="price-low-high">Price: Low to High</SelectItem>
                      <SelectItem value="price-high-low">Price: High to Low</SelectItem>
                      <SelectItem value="name-a-z">Name: A to Z</SelectItem>
                      <SelectItem value="name-z-a">Name: Z to A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Products Grid */}
          <div className="flex-1">

            {/* Mobile Filters */}
            <div className="md:hidden mb-6">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest</SelectItem>
                  <SelectItem value="price-low-high">Price: Low to High</SelectItem>
                  <SelectItem value="price-high-low">Price: High to Low</SelectItem>
                  <SelectItem value="name-a-z">Name: A to Z</SelectItem>
                  <SelectItem value="name-z-a">Name: Z to A</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Product Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
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
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500 mb-6">Try adjusting your search or filter criteria</p>
                <Button onClick={() => navigate("/products")}>View All Products</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product: any) => (
                  <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition">
                    <div 
                      className="h-48 bg-center cursor-pointer flex items-center justify-center overflow-hidden"
                      onClick={() => navigate(`/products/${product.id}`)}
                    >
                      <img 
                        src={getImageUrl(product.image)} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Product+Image+Not+Available';
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <h3 
                        className="text-lg font-semibold mb-1 cursor-pointer hover:text-primary"
                        onClick={() => navigate(`/products/${product.id}`)}
                      >
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">Category: {product.category}</p>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                      <div className="flex justify-between items-center mt-auto">
                        <span className="text-primary font-bold">{formatCurrency(product.price)}</span>
                        <Button 
                          onClick={() => addToCart(product.id)}
                          className="bg-primary hover:bg-primary-dark text-white flex items-center"
                          size="sm"
                        >
                          <ShoppingCart className="h-4 w-4 mr-1" />
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
