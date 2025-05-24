import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import CustomerLayout from "@/components/layout/CustomerLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getProductDetails, updateCart, getApprovedProducts, getCart } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, getImageUrl } from "@/lib/utils";
import {
  ShoppingCart,
  Truck,
  ShieldCheck,
  Package,
  Star,
  ChevronLeft,
  Minus,
  Plus,
  AlertCircle,
} from "lucide-react";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";

export default function ProductDetail() {
  const [location, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { refetchCart } = useCart();
  const { toast } = useToast();
  const productId = parseInt(location.split('/').pop() || '0');
  
  const [quantity, setQuantity] = useState(1);
  const [customerMessage, setCustomerMessage] = useState("");
  
  const { data: product, isLoading, isError } = useQuery({
    queryKey: [`/api/products/${productId}`],
    enabled: !!productId,
  });
  
  // Related products query
  const { data: relatedProducts } = useQuery({
    queryKey: ['/api/products'],
    select: (data) => {
      if (!product) return [];
      return data
        .filter((p: any) => 
          p.id !== product.id && 
          p.category === product.category
        )
        .slice(0, 4);
    },
    enabled: !!product,
  });
  
  const incrementQuantity = () => {
    if (product && quantity < product.quantity) {
      setQuantity(quantity + 1);
    } else {
      toast({
        title: "Maximum quantity reached",
        description: "You've reached the maximum available quantity for this product",
      });
    }
  };
  
  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };
  
  const addToCart = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Please login",
        description: "You need to be logged in to add items to your cart",
      });
      navigate("/customer/login");
      return;
    }

    try {
      // Use the API client to get current cart with proper authentication
      let currentCart;
      try {
        currentCart = await getCart();
      } catch (error) {
        // If cart doesn't exist or there's an error, start with an empty cart
        console.log("Creating new cart");
        currentCart = { items: [] };
      }
      
      // Ensure we have a valid items array
      if (!currentCart.items) {
        currentCart.items = [];
      }
      
      // Check if product is already in cart
      const existingItemIndex = currentCart.items.findIndex((item: any) => item.productId === productId);
      
      let newItems;
      if (existingItemIndex >= 0) {
        // Update existing item
        newItems = [...currentCart.items];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + quantity,
          message: customerMessage || newItems[existingItemIndex].message
        };
      } else {
        // Add new item
        newItems = [
          ...(Array.isArray(currentCart.items) ? currentCart.items : []),
          { 
            productId, 
            quantity, 
            message: customerMessage 
          }
        ];
      }
      
      // Update cart with better error handling
      try {
        await updateCart({ items: newItems });
        console.log("Cart updated successfully");
        
        // Refresh cart count in the header
        await refetchCart();
        
        // Invalidate the products cache to refresh product quantities
        queryClient.invalidateQueries({ queryKey: ['/api/products'] });
        queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}`] });
      } catch (cartError) {
        console.error("Error updating cart:", cartError);
        toast({
          variant: "destructive",
          title: "Cart update failed",
          description: "Please try logging in again or refresh the page",
        });
        throw cartError;
      }
      
      toast({
        title: "Added to cart",
        description: `${quantity} item${quantity > 1 ? 's' : ''} added to your cart`,
      });
      
      // Reset message field
      setCustomerMessage("");
    } catch (error: any) {
      console.error("Cart error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add item to cart",
      });
    }
  };
  
  if (isLoading) {
    return (
      <CustomerLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-200 rounded"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-10 bg-gray-200 rounded w-full mt-6"></div>
              </div>
            </div>
          </div>
        </div>
      </CustomerLayout>
    );
  }
  
  if (isError || !product) {
    return (
      <CustomerLayout>
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Product not found or an error occurred while loading the product details.
            </AlertDescription>
          </Alert>
          <div className="mt-6 text-center">
            <Button onClick={() => navigate("/products")}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Button 
            variant="link" 
            className="text-gray-500 hover:text-primary p-0"
            onClick={() => navigate("/products")}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Products
          </Button>
        </div>

        {/* Product Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Product Image */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <img 
              src={getImageUrl(product.image)} 
              alt={product.name} 
              className="w-full h-auto object-contain rounded-md max-h-96"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://via.placeholder.com/500x400?text=Product+Image+Not+Available';
              }}
            />
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <p className="text-sm text-gray-500 mb-4">Category: {product.category}</p>
            
            <div className="flex items-center mb-4">
              <div className="text-yellow-400 flex mr-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-current" />
                ))}
              </div>
              <span className="text-sm text-gray-500">(Customer Reviews)</span>
            </div>
            
            <p className="text-3xl font-bold text-primary mb-6">
              {formatCurrency(product.price)}
            </p>
            
            <div className="prose prose-sm mb-6">
              <p>{product.description}</p>
            </div>
            
            <div className="border-t border-gray-200 pt-6 mb-6">
              <div className="flex items-center mb-6">
                <label className="text-gray-700 mr-4">Quantity:</label>
                <div className="flex items-center border rounded-md">
                  <button 
                    className="px-3 py-1 hover:bg-gray-100"
                    onClick={decrementQuantity}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-4 py-1 border-x">{quantity}</span>
                  <button 
                    className="px-3 py-1 hover:bg-gray-100"
                    onClick={incrementQuantity}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <span className="ml-4 text-sm text-gray-500">
                  {product.quantity} available
                </span>
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">
                  Message to Seller (Optional):
                </label>
                <Textarea
                  placeholder="Add a note for customization, special requests, etc."
                  value={customerMessage}
                  onChange={(e) => setCustomerMessage(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            
            {product.quantity > 0 ? (
              <Button 
                className="w-full md:w-auto mb-4 bg-primary hover:bg-primary-dark flex items-center justify-center"
                onClick={addToCart}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart
              </Button>
            ) : (
              <Button 
                className="w-full md:w-auto mb-4 flex items-center justify-center"
                variant="outline"
                disabled
              >
                <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
                Out of Stock
              </Button>
            )}
            
            {product.quantity > 0 && product.quantity <= 5 && (
              <p className="text-sm text-amber-600 mt-2 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                Only {product.quantity} item{product.quantity !== 1 ? 's' : ''} left
              </p>
            )}
            
            <div className="mt-8 space-y-4">

              <div className="flex items-start text-sm">
                <ShieldCheck className="h-5 w-5 text-gray-500 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Authentic Products</p>
                  <p className="text-gray-500">100% genuine, handcrafted items</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Description */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Product Description</h2>
          <Card>
            <CardContent className="p-6">
              <div className="prose max-w-none">
                <p>{product.description}</p>
                <p>
                  This product is crafted by artisans from {product.seller?.businessName || "our verified sellers"}.
                  Each piece is unique and showcases traditional Indian craftsmanship.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct: any) => (
                <div 
                  key={relatedProduct.id} 
                  className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition cursor-pointer"
                  onClick={() => navigate(`/products/${relatedProduct.id}`)}
                >
                  <div 
                    className="h-48 bg-cover bg-center"
                    style={{ backgroundImage: `url(${relatedProduct.image || 'https://via.placeholder.com/300x200?text=No+Image'})` }}
                  ></div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2 truncate">{relatedProduct.name}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{relatedProduct.description}</p>
                    <div className="text-primary font-bold">{formatCurrency(relatedProduct.price)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
