import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import CustomerLayout from "@/components/layout/CustomerLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { getCart, updateCart, getProductDetails } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import {
  ShoppingCart,
  Trash,
  ChevronLeft,
  MessageSquare,
  Plus,
  Minus,
  Package,
  ShoppingBag,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function Cart() {
  const [_, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [itemMessage, setItemMessage] = useState("");

  const { data: cart, isLoading, isError } = useQuery({
    queryKey: ["/api/customer/cart"],
    enabled: isAuthenticated,
  });

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  const updateItemQuantity = async (productId: number, change: number) => {
    try {
      const currentItems = cart?.items || [];
      const itemIndex = currentItems.findIndex((item: any) => item.productId === productId);
      
      if (itemIndex === -1) return;
      
      const newQuantity = currentItems[itemIndex].quantity + change;
      
      // Remove item if quantity becomes 0
      if (newQuantity <= 0) {
        removeItem(productId);
        return;
      }
      
      // Check product's available quantity
      const productResponse = await fetch(`/api/products/${productId}`, {
        credentials: "include",
      });
      
      if (!productResponse.ok) {
        throw new Error("Failed to fetch product details");
      }
      
      const product = await productResponse.json();
      
      if (newQuantity > product.quantity) {
        toast({
          variant: "destructive",
          title: "Invalid quantity",
          description: `Only ${product.quantity} items available in stock.`,
        });
        return;
      }
      
      const updatedItems = [...currentItems];
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        quantity: newQuantity,
      };
      
      await updateCart({ items: updatedItems });
      
      // Invalidate both cart and product queries to ensure product quantities stay in sync
      queryClient.invalidateQueries({queryKey: ["/api/customer/cart"]});
      queryClient.invalidateQueries({queryKey: ["/api/products"]});
      
      toast({
        title: "Cart updated",
        description: "Item quantity has been updated",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update item quantity",
      });
    }
  };

  const removeItem = async (productId: number) => {
    try {
      const currentItems = cart?.items || [];
      const updatedItems = currentItems.filter((item: any) => item.productId !== productId);
      
      await updateCart({ items: updatedItems });
      
      // Invalidate both cart and product queries to ensure product quantities stay in sync
      queryClient.invalidateQueries({queryKey: ["/api/customer/cart"]});
      queryClient.invalidateQueries({queryKey: ["/api/products"]});
      queryClient.invalidateQueries({queryKey: [`/api/products/${productId}`]});
      
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to remove item",
      });
    }
  };

  const openMessageDialog = (item: any) => {
    setSelectedItem(item);
    setItemMessage(item.message || "");
    setMessageDialogOpen(true);
  };

  const saveItemMessage = async () => {
    try {
      if (!selectedItem) return;
      
      const currentItems = cart?.items || [];
      const updatedItems = currentItems.map((item: any) => 
        item.productId === selectedItem.productId
          ? { ...item, message: itemMessage }
          : item
      );
      
      await updateCart({ items: updatedItems });
      queryClient.invalidateQueries({queryKey: ["/api/customer/cart"]});
      
      setMessageDialogOpen(false);
      
      toast({
        title: "Message saved",
        description: "Your message to the seller has been saved",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save message",
      });
    }
  };

  // Calculate totals
  const calculateSubtotal = () => {
    if (!cart?.items || cart.items.length === 0) return 0;
    
    return cart.items.reduce((sum: number, item: any) => {
      return sum + (item.product?.price * item.quantity || 0);
    }, 0);
  };
  
  const subtotal = calculateSubtotal();
  const shipping = 150; // Fixed shipping rate of ₹150 for all orders
  const total = subtotal + shipping;

  if (isLoading) {
    return (
      <CustomerLayout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
          <div className="text-center py-12">Loading cart items...</div>
        </div>
      </CustomerLayout>
    );
  }

  if (isError) {
    return (
      <CustomerLayout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-4">
                <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">Error Loading Cart</p>
                <p className="text-gray-500 mb-4">We encountered an error while loading your cart. Please try again.</p>
                <Button onClick={() => queryClient.invalidateQueries({queryKey: ["/api/customer/cart"]})}>
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
        
        {!cart?.items || cart.items.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Your cart is empty</h3>
              <p className="text-gray-500 mb-6">Start adding items to your cart to see them here.</p>
              <Button onClick={() => navigate("/products")}>
                Continue Shopping
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left pb-4">Product</th>
                        <th className="text-center pb-4">Quantity</th>
                        <th className="text-right pb-4">Price</th>
                        <th className="text-right pb-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {cart.items.map((item: any) => (
                        <tr key={item.productId} className="py-4">
                          <td className="py-4">
                            <div className="flex items-center">
                              <div className="h-16 w-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                                {item.product?.image ? (
                                  <img 
                                    src={item.product.image} 
                                    alt={item.product.name} 
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center">
                                    <Package className="h-8 w-8 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div 
                                  className="font-medium text-gray-900 hover:text-primary cursor-pointer"
                                  onClick={() => navigate(`/products/${item.productId}`)}
                                >
                                  {item.product?.name || "Product"}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {item.product?.category || "Category"}
                                </div>
                                {item.message && (
                                  <button 
                                    className="text-xs text-primary flex items-center mt-1"
                                    onClick={() => openMessageDialog(item)}
                                  >
                                    <MessageSquare className="h-3 w-3 mr-1" />
                                    View message
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center justify-center">
                              <button 
                                className="p-1 rounded-l border border-r-0 border-gray-300 hover:bg-gray-50"
                                onClick={() => updateItemQuantity(item.productId, -1)}
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="px-3 py-1 border-y border-gray-300 text-center min-w-[40px]">
                                {item.quantity}
                              </span>
                              <button 
                                className="p-1 rounded-r border border-l-0 border-gray-300 hover:bg-gray-50"
                                onClick={() => updateItemQuantity(item.productId, 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                          <td className="py-4 text-right font-medium">
                            {formatCurrency(item.product?.price * item.quantity || 0)}
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-primary border-primary hover:bg-primary/10"
                                onClick={() => openMessageDialog(item)}
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-500 border-red-500 hover:bg-red-50"
                                onClick={() => removeItem(item.productId)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
              
              <div className="mt-6">
                <Button
                  variant="outline"
                  className="flex items-center"
                  onClick={() => navigate('/products')}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Continue Shopping
                </Button>
              </div>
            </div>
            
            {/* Order Summary */}
            <div>
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold mb-4">Order Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-medium">{formatCurrency(shipping)}</span>
                    </div>
                    <div className="border-t pt-3 mt-3 flex justify-between">
                      <span className="font-bold">Total</span>
                      <span className="font-bold text-primary text-xl">{formatCurrency(total)}</span>
                    </div>
                    
                    <Button
                      className="w-full mt-6 bg-primary hover:bg-primary-dark flex items-center justify-center"
                      onClick={() => navigate('/checkout')}
                    >
                      <ShoppingBag className="h-5 w-5 mr-2" />
                      Proceed to Checkout
                    </Button>
                    
                    <p className="text-xs text-gray-500 mt-4 text-center">
                      Standard shipping rate of ₹150 applies to all orders
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        
        {/* Message Dialog */}
        <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Message to Seller</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-3">
              <p className="text-sm text-gray-500">
                Add a personalized message or special instructions for this item.
              </p>
              <Textarea
                value={itemMessage}
                onChange={(e) => setItemMessage(e.target.value)}
                placeholder="E.g., 'I'd prefer a darker shade' or 'Please gift wrap this item'"
                rows={5}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMessageDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveItemMessage}>
                Save Message
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CustomerLayout>
  );
}
