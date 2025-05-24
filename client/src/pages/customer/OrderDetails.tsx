import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import CustomerLayout from "@/components/layout/CustomerLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  AlertCircle,
  ShoppingBag,
  MapPin,
  Clock,
  CalendarIcon,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function OrderDetails() {
  const [, navigate] = useLocation();
  const [location] = useLocation();
  const { user, token } = useAuth();
  const { toast } = useToast();
  
  // Extract the order ID from the URL
  const orderId = location.split("/").pop();
  
  // Fetch order details
  const { 
    data: order, 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: [`/api/customer/orders/${orderId}`],
    enabled: !!token && !!user && !!orderId,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "placed":
        return (
          <div className="flex items-center">
            <Package className="h-4 w-4 mr-1 text-yellow-600" />
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Processing</Badge>
          </div>
        );
      case "ready":
        return (
          <div className="flex items-center">
            <Truck className="h-4 w-4 mr-1 text-blue-600" />
            <Badge variant="outline" className="bg-blue-100 text-blue-800">Ready to Ship</Badge>
          </div>
        );
      case "fulfilled":
        return (
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
            <Badge variant="outline" className="bg-green-100 text-green-800">Delivered</Badge>
          </div>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <CustomerLayout>
        <div className="container mx-auto py-8">
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <Button 
                  variant="ghost" 
                  className="mr-2 p-0 h-8 w-8"
                  onClick={() => navigate("/orders")}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <CardTitle>Order Details</CardTitle>
                  <CardDescription>Loading order information...</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center p-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CustomerLayout>
    );
  }

  if (error) {
    return (
      <CustomerLayout>
        <div className="container mx-auto py-8">
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <Button 
                  variant="ghost" 
                  className="mr-2 p-0 h-8 w-8"
                  onClick={() => navigate("/orders")}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <CardTitle className="flex items-center">
                    <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
                    Order Details
                  </CardTitle>
                  <CardDescription>There was a problem loading the order details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-red-500 mb-4">Error: {(error as Error).message}</p>
              <Button onClick={() => refetch()} className="mr-2">
                Try Again
              </Button>
              <Button variant="outline" onClick={() => navigate("/orders")}>
                Back to Orders
              </Button>
            </CardContent>
          </Card>
        </div>
      </CustomerLayout>
    );
  }

  if (!order) {
    return (
      <CustomerLayout>
        <div className="container mx-auto py-8">
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <Button 
                  variant="ghost" 
                  className="mr-2 p-0 h-8 w-8"
                  onClick={() => navigate("/orders")}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <CardTitle>Order Not Found</CardTitle>
                  <CardDescription>The order you're looking for doesn't exist or you don't have permission to view it.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/orders")}>
                Back to Orders
              </Button>
            </CardContent>
          </Card>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                className="mr-2 p-0 h-8 w-8"
                onClick={() => navigate("/orders")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Order #{order.id}</CardTitle>
                    <CardDescription>Placed on {formatDate(order.createdAt)}</CardDescription>
                  </div>
                  <div>
                    {getStatusBadge(order.status)}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Product Information */}
              <div>
                <h3 className="font-medium text-lg mb-4">Product Information</h3>
                <div className="flex items-start space-x-4 p-4 border rounded-md">
                  <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                    {order.product && order.product.image ? (
                      <img 
                        src={order.product.image} 
                        alt={order.product.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{order.product?.name || 'Product'}</h4>
                    <p className="text-sm text-gray-500 mb-2">Quantity: {order.quantity}</p>
                    <p className="font-medium">{formatCurrency(order.totalPrice)}</p>
                    
                    {order.customerMessage && (
                      <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
                        <p className="font-medium mb-1">Your Message:</p>
                        <p className="text-gray-700">{order.customerMessage}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {order.trackingNumber && (
                  <div className="mt-6 p-4 border rounded-md">
                    <h3 className="font-medium mb-2">Tracking Information</h3>
                    <p className="text-sm flex items-center text-blue-600">
                      <Truck className="h-4 w-4 mr-2" />
                      Tracking Number: {order.trackingNumber}
                    </p>
                  </div>
                )}
                
                <div className="mt-6">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(`/products/${order.productId}`)}
                    className="w-full"
                  >
                    View Product
                  </Button>
                </div>
              </div>
              
              {/* Order Information */}
              <div>
                <h3 className="font-medium text-lg mb-4">Order Details</h3>
                <div className="p-4 border rounded-md space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-gray-500">Order Date</span>
                    <span className="font-medium flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1 text-gray-500" />
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-gray-500">Order Status</span>
                    <span>{getStatusBadge(order.status)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-gray-500">Item Price</span>
                    <span className="font-medium">{formatCurrency(order.totalPrice / order.quantity)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-gray-500">Quantity</span>
                    <span className="font-medium">{order.quantity}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-gray-900 font-bold">Total Amount</span>
                    <span className="font-bold text-lg">{formatCurrency(order.totalPrice)}</span>
                  </div>
                </div>
                
                <div className="mt-6 p-4 border rounded-md">
                  <h3 className="font-medium mb-2">Shipping Address</h3>
                  <p className="text-sm flex items-start">
                    <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-gray-500" />
                    <span>{order.address || "No shipping address provided"}</span>
                  </p>
                </div>
                
                <div className="mt-6">
                  <Button 
                    onClick={() => navigate(`/products`)}
                    className="w-full"
                  >
                    Continue Shopping
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between border-t pt-6">
            <Button 
              variant="outline" 
              onClick={() => navigate("/orders")}
            >
              Back to Orders
            </Button>
            
            {order.status === "placed" && (
              <div className="flex items-center text-sm text-amber-600">
                <Clock className="h-4 w-4 mr-1" />
                Order is being processed
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </CustomerLayout>
  );
}