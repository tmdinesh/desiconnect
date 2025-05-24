import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";

const checkoutSchema = z.object({
  shippingAddress: z.string().min(10, { message: "Shipping address must be at least 10 characters" })
    .max(200, { message: "Address too long, please be more concise" }),
  city: z.string().min(2, { message: "City is required" })
    .max(50, { message: "City name too long" }),
  state: z.string().min(2, { message: "State is required" })
    .max(50, { message: "State name too long" }),
  country: z.string().min(2, { message: "Country is required" })
    .max(50, { message: "Country name too long" }),
  zipCode: z.string()
    .regex(/^[0-9]{4,10}$/, { message: "Zip/Postal code must be 4-10 digits to support international formats" }),
  paymentMethod: z.string().min(1, { message: "Payment method is required" }),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

interface CartItem {
  id?: number;
  productId?: number;
  name?: string;
  price?: number | string;
  quantity: number;
  image?: string;
  sellerId?: number;
  product?: {
    id: number;
    name: string;
    price: number | string;
    image?: string;
  };
}

interface CartData {
  items: CartItem[];
}

export default function CustomerCheckout() {
  const { user, token } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState(0);

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      shippingAddress: "",
      city: "",
      state: "",
      country: "",
      zipCode: "",
      paymentMethod: "cash_on_delivery", // Default payment method
    },
  });

  // Fetch cart data
  const { data: cartData } = useQuery<CartData>({
    queryKey: ["/api/customer/cart"],
    enabled: !!token && !!user,
  });

  useEffect(() => {
    if (cartData && typeof cartData === 'object' && 'items' in cartData && cartData.items) {
      const items = Array.isArray(cartData.items) ? cartData.items : [];
      setCartItems(items);
      
      console.log("Raw cart items:", items);
      
      // Calculate total with enhanced debugging and proper type handling
      let total = 0;
      
      for (const item of items) {
        // Log each item for debugging
        console.log("Processing item:", item);
        
        // Extract price - could be stored in different properties depending on API
        let itemPrice = 0;
        if (typeof item.price === 'number') {
          itemPrice = item.price;
        } else if (typeof item.price === 'string') {
          itemPrice = parseFloat(item.price);
        } else if (item.product && typeof item.product.price === 'number') {
          itemPrice = item.product.price;
        } else if (item.product && typeof item.product.price === 'string') {
          itemPrice = parseFloat(item.product.price);
        }
        
        // Extract quantity with fallback
        const quantity = typeof item.quantity === 'number' ? item.quantity : 1;
        
        // Calculate line total
        const lineTotal = itemPrice * quantity;
        console.log(`Item ${item.name || 'unnamed'}: price=${itemPrice}, qty=${quantity}, total=${lineTotal}`);
        
        if (!isNaN(lineTotal)) {
          total += lineTotal;
        }
      }
      
      console.log("Final calculated total:", total);
      setCartTotal(total);
    } else {
      console.log("Cart data invalid or empty:", cartData);
      setCartTotal(0);
    }
  }, [cartData]);

  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      return fetch("/api/customer/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(data)
      }).then(res => res.json());
    },
    onSuccess: () => {
      // Clear cart by updating it to empty
      fetch("/api/customer/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ items: [] })
      }).then(() => {
        console.log("Cart cleared after order placement");
      }).catch(err => {
        console.error("Failed to clear cart after order:", err);
      });
      
      toast({
        title: "Order Placed Successfully",
        description: "Your order has been placed and is being processed.",
      });
      navigate("/orders");
    },
    onError: (error) => {
      toast({
        title: "Error Placing Order",
        description: "There was a problem placing your order. Please try again.",
        variant: "destructive",
      });
      console.error("Order creation error:", error);
    },
  });

  const onSubmit = (data: CheckoutForm) => {
    if (cartItems.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Your cart is empty. Please add items before checkout.",
        variant: "destructive",
      });
      return;
    }

    // Create full address string from form fields
    const fullAddress = `${data.shippingAddress}, ${data.city}, ${data.state}, ${data.zipCode}, ${data.country}`;
    
    // Prepare order data with the complete address and total amount
    const orderData = {
      address: fullAddress,
      total: cartTotal, // Include the total amount explicitly
      paymentMethod: data.paymentMethod,
      items: cartItems.map(item => ({
        productId: item.productId || item.id,
        quantity: item.quantity,
        price: item.price, // Include price to ensure correct calculation
        name: item.name,
        sellerId: item.sellerId
      }))
    };

    // Verify total matches calculated amount before submission
    if (orderData.total <= 0 || isNaN(orderData.total)) {
      toast({
        title: "Order Error",
        description: "There was an issue with your order total. Please try again.",
        variant: "destructive",
      });
      return;
    }

    createOrderMutation.mutate(orderData);
  };

  if (cartItems.length === 0 && !createOrderMutation.isPending) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Checkout</CardTitle>
            <CardDescription>Your cart is empty</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Please add items to your cart before proceeding to checkout.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate("/products")}>Browse Products</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Checkout</CardTitle>
              <CardDescription>Complete your order details</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="shippingAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shipping Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your shipping address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country*</FormLabel>
                          <FormControl>
                            <select 
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              {...field}
                            >
                              <option value="">Select your country</option>
                              <option value="India">India</option>
                              <option value="United States">United States</option>
                              <option value="United Kingdom">United Kingdom</option>
                              <option value="Canada">Canada</option>
                              <option value="Australia">Australia</option>
                              <option value="Singapore">Singapore</option>
                              <option value="United Arab Emirates">United Arab Emirates</option>
                              <option value="Saudi Arabia">Saudi Arabia</option>
                              <option value="Germany">Germany</option>
                              <option value="France">France</option>
                              <option value="Japan">Japan</option>
                              <option value="Malaysia">Malaysia</option>
                              <option value="Other">Other</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City*</FormLabel>
                          <FormControl>
                            <Input placeholder="City" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State*</FormLabel>
                          <FormControl>
                            <Input placeholder="State" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zip Code*</FormLabel>
                          <FormControl>
                            <Input placeholder="Zip Code (5-6 digits)" type="text" inputMode="numeric" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <FormControl>
                          <select 
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                          >
                            <option value="cash_on_delivery">Cash on Delivery</option>
                            <option value="credit_card">Credit Card</option>
                            <option value="upi">UPI</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={createOrderMutation.isPending}
                  >
                    {createOrderMutation.isPending ? "Processing..." : "Place Order"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cartItems.length > 0 ? (
                  <>
                    {cartItems.map((item, index) => {
                      // Handle different product data structures
                      const name = item.name || (item.product && item.product.name) || `Product #${index+1}`;
                      
                      // Extract price with fallbacks
                      let itemPrice = 0;
                      if (typeof item.price === 'number') {
                        itemPrice = item.price;
                      } else if (typeof item.price === 'string' && !isNaN(parseFloat(item.price))) {
                        itemPrice = parseFloat(item.price);
                      } else if (item.product && typeof item.product.price === 'number') {
                        itemPrice = item.product.price;
                      } else if (item.product && typeof item.product.price === 'string' && !isNaN(parseFloat(item.product.price))) {
                        itemPrice = parseFloat(item.product.price);
                      }
                      
                      const quantity = typeof item.quantity === 'number' ? item.quantity : 1;
                      const lineTotal = itemPrice * quantity;
                      
                      return (
                        <div key={index} className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{name}</p>
                            <p className="text-sm text-gray-500">Qty: {quantity}</p>
                          </div>
                          <p className="font-medium">₹{lineTotal.toFixed(2)}</p>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <p className="text-center text-gray-500">No items in cart</p>
                )}
                
                <Separator />
                
                <div className="flex justify-between font-medium">
                  <p>Subtotal</p>
                  <p>₹{cartTotal > 0 ? cartTotal.toFixed(2) : '0.00'}</p>
                </div>
                
                <div className="flex justify-between text-sm">
                  <p>Shipping</p>
                  <p>₹{cartItems.length > 0 ? '150.00' : '0.00'}</p>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-bold">
                  <p>Total</p>
                  <p>₹{cartItems.length > 0 ? (cartTotal + 150).toFixed(2) : '0.00'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}