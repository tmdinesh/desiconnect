import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  AlertCircle, 
  Eye,
  Truck,
  CheckCircle
} from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";

const trackingSchema = z.object({
  trackingNumber: z.string()
    .min(5, { message: "Tracking number must be at least 5 characters" })
    .refine(
      (val) => /^TR-\d{6}-\d{8}$/.test(val),
      { message: "Tracking number must follow format: TR-XXXXXX-YYYYMMDD" }
    ),
  carrier: z.string().min(2, { message: "Carrier name is required" }),
});

type TrackingForm = z.infer<typeof trackingSchema>;

// Helper function to generate a properly formatted tracking number
const generateTrackingNumber = (): string => {
  const random = Math.floor(100000 + Math.random() * 900000); // 6-digit random number
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `TR-${random}-${year}${month}${day}`;
};

export default function AdminOrders() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
  
  // Fetch all orders
  const { data: allOrders, isLoading: isAllOrdersLoading } = useQuery({
    queryKey: ["/api/admin/orders"],
    enabled: !!token && !!user,
  });

  // Fetch pending orders
  const { data: pendingOrders, isLoading: isPendingOrdersLoading } = useQuery({
    queryKey: ["/api/admin/orders/status/placed"],
    enabled: !!token && !!user,
  });

  // Fetch ready to ship orders
  const { data: readyOrders, isLoading: isReadyOrdersLoading } = useQuery({
    queryKey: ["/api/admin/orders/status/ready"],
    enabled: !!token && !!user,
  });

  const form = useForm<TrackingForm>({
    resolver: zodResolver(trackingSchema),
    defaultValues: {
      trackingNumber: "",
      carrier: "",
    },
  });

  // Add tracking mutation
  const addTrackingMutation = useMutation({
    mutationFn: async ({ orderId, data }: { orderId: number, data: TrackingForm }) => {
      const response = await fetch(`/api/admin/orders/${orderId}/tracking`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add tracking information");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Tracking Info Added",
        description: "Tracking information has been added to the order successfully.",
      });
      
      setTrackingDialogOpen(false);
      form.reset();
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders/status/ready"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders/status/placed"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Add Tracking",
        description: error instanceof Error ? error.message : "Failed to add tracking information",
        variant: "destructive",
      });
    }
  });

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setViewDialogOpen(true);
  };

  const handleAddTracking = (order: any) => {
    setSelectedOrder(order);
    setTrackingDialogOpen(true);
  };

  const onAddTrackingSubmit = (data: TrackingForm) => {
    if (selectedOrder) {
      addTrackingMutation.mutate({ orderId: selectedOrder.id, data });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "placed":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Processing</Badge>;
      case "ready":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Ready to Ship</Badge>;
      case "fulfilled":
        return <Badge variant="outline" className="bg-green-100 text-green-800">Fulfilled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isLoading = isAllOrdersLoading && isPendingOrdersLoading && isReadyOrdersLoading;

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex flex-col space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Orders Management</h1>
        <p className="text-muted-foreground">
          Track and manage customer orders across the platform
        </p>
      </div>

      <Tabs defaultValue="ready" className="mt-6">
        <TabsList className="grid w-full grid-cols-1 mb-4">
          <TabsTrigger value="ready">Ready to Ship ({Array.isArray(readyOrders) ? readyOrders.length : 0})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Orders</CardTitle>
              <CardDescription>
                View and manage all orders on the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Array.isArray(allOrders) && allOrders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allOrders.map((order: any) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">#{order.id}</TableCell>
                        <TableCell>{order.user?.name || "Unknown"}</TableCell>
                        <TableCell>
                          {order.createdAt 
                            ? format(new Date(order.createdAt), 'MMM dd, yyyy') 
                            : 'N/A'}
                        </TableCell>
                        <TableCell>₹{order.total_price?.toFixed(2) || order.total?.toFixed(2) || order.totalAmount?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleViewOrder(order)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            {order.status === "ready" && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-blue-600"
                                onClick={() => handleAddTracking(order)}
                              >
                                <Truck className="h-4 w-4 mr-1" />
                                Add Tracking
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-24 flex flex-col items-center justify-center text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No orders found</h3>
                  <p className="text-muted-foreground">
                    There are no orders on the platform yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Processing Orders</CardTitle>
              <CardDescription>
                Orders that are currently being processed by sellers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Array.isArray(pendingOrders) && pendingOrders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingOrders.map((order: any) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">#{order.id}</TableCell>
                        <TableCell>{order.user?.name || "Unknown"}</TableCell>
                        <TableCell>
                          {order.createdAt 
                            ? format(new Date(order.createdAt), 'MMM dd, yyyy') 
                            : 'N/A'}
                        </TableCell>
                        <TableCell>₹{parseFloat(String(order.totalPrice)).toFixed(2) || '0.00'}</TableCell>
                        <TableCell>{order.seller?.businessName || "Unknown"}</TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleViewOrder(order)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-24 flex flex-col items-center justify-center text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No processing orders</h3>
                  <p className="text-muted-foreground">
                    There are no orders currently being processed.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="ready">
          <Card>
            <CardHeader>
              <CardTitle>Ready to Ship Orders</CardTitle>
              <CardDescription>
                Orders that are ready for shipping
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Array.isArray(readyOrders) && readyOrders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Tracking</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {readyOrders.map((order: any) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">#{order.id}</TableCell>
                        <TableCell>
                          {order.createdAt 
                            ? format(new Date(order.createdAt), 'MMM dd, yyyy') 
                            : 'N/A'}
                        </TableCell>
                        <TableCell>₹{order.total_price?.toFixed(2) || order.total?.toFixed(2) || order.totalAmount?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>{order.seller?.businessName || "Unknown Seller"}</TableCell>
                        <TableCell>
                          {order.trackingNumber ? (
                            <span className="text-green-600 font-medium">{order.trackingNumber}</span>
                          ) : (
                            <span className="text-gray-400">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleViewOrder(order)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-24 flex flex-col items-center justify-center text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No ready orders</h3>
                  <p className="text-muted-foreground">
                    There are no orders ready for shipping.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Order Detail Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order #{selectedOrder?.id || ""}</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              {selectedOrder.status === "ready" && (
                <div className="bg-green-50 border border-green-100 rounded-md p-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <h3 className="text-green-800 font-medium">Ready for Shipping</h3>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    This order has been prepared by the seller and is ready to be shipped.
                  </p>
                </div>
              )}
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Customer Information</h3>
                  <div className="border rounded-md p-3 bg-gray-50">
                    <p className="font-medium">{selectedOrder.customerName || selectedOrder.user?.name || "Unknown"}</p>
                    {selectedOrder.user?.email && (
                      <p className="text-sm">{selectedOrder.user.email}</p>
                    )}
                    <p className="mt-2 text-xs font-medium text-gray-500">Shipping Address:</p>
                    <p className="text-sm">{selectedOrder.address || "Shipping address not available"}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Seller Information</h3>
                  <div className="border rounded-md p-3 bg-gray-50">
                    <p className="font-medium">{selectedOrder.product?.seller?.businessName || selectedOrder.seller?.businessName || selectedOrder.sellerName || "Unknown Seller"}</p>
                    {selectedOrder.seller?.email && (
                      <p className="text-sm">{selectedOrder.seller.email}</p>
                    )}
                    {selectedOrder.seller?.phoneNumber && (
                      <p className="text-sm">Phone: {selectedOrder.seller.phoneNumber}</p>
                    )}
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-500">Business Address:</p>
                      <p className="text-sm">{selectedOrder.seller?.address || selectedOrder.seller?.businessAddress || "Address not available"}</p>
                    </div>
                    {selectedOrder.seller?.gstNumber && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-500">GST Number:</p>
                        <p className="text-sm">{selectedOrder.seller.gstNumber}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Order Information</h3>
                  <div className="border rounded-md p-3">
                    <div className="flex justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Product:</p>
                      <p className="font-medium">{selectedOrder.product?.name || 'Product Name Not Available'}</p>
                    </div>
                    <div className="flex justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Quantity:</p>
                      <p className="font-medium">{selectedOrder.quantity || 1}</p>
                    </div>
                    <div className="flex justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Status:</p>
                      <div>{getStatusBadge(selectedOrder.status)}</div>
                    </div>
                    <div className="flex justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Order Date:</p>
                      <p>{selectedOrder.createdAt 
                        ? format(new Date(selectedOrder.createdAt), 'MMM dd, yyyy') 
                        : 'N/A'}</p>
                    </div>
                    <div className="flex justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Total Amount:</p>
                      <p className="font-medium">₹{selectedOrder.totalPrice || selectedOrder.total_price || '0.00'}</p>
                    </div>
                    {selectedOrder.trackingNumber && (
                      <div className="flex justify-between mb-2">
                        <p className="text-sm text-muted-foreground">Tracking:</p>
                        <p>{selectedOrder.trackingNumber}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {selectedOrder.status === "ready" && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Process Order</h3>
                    <div className="border rounded-md p-3 bg-green-50 border-green-100">
                      <div className="flex flex-col space-y-4">
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium">Tracking Number*</label>
                            <div className="mt-1">
                              <Input 
                                placeholder="Enter tracking number (Format: TR-XXXXXX-YYYYMMDD)" 
                                value={form.watch("trackingNumber")} 
                                onChange={(e) => form.setValue("trackingNumber", e.target.value)}
                                className="w-full"
                              />
                            </div>
                            {form.formState.errors.trackingNumber && (
                              <p className="text-sm font-medium text-red-500 mt-1">
                                {form.formState.errors.trackingNumber.message}
                              </p>
                            )}
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium">Shipping Carrier*</label>
                            <Input 
                              placeholder="Enter shipping carrier name" 
                              className="mt-1"
                              value={form.watch("carrier")} 
                              onChange={(e) => form.setValue("carrier", e.target.value)}
                            />
                            {form.formState.errors.carrier && (
                              <p className="text-sm font-medium text-red-500 mt-1">
                                {form.formState.errors.carrier.message}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <Button 
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => {
                            const trackingData = form.getValues();
                            
                            // Check if tracking number matches format
                            if (!/^TR-\d{6}-\d{8}$/.test(trackingData.trackingNumber)) {
                              toast({
                                title: "Invalid Tracking Number",
                                description: "Tracking number must follow format: TR-XXXXXX-YYYYMMDD",
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            if (!trackingData.carrier || trackingData.carrier.length < 2) {
                              toast({
                                title: "Missing Information",
                                description: "Please enter a valid carrier name",
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            // Call API to update order status with tracking info
                            fetch(`/api/admin/orders/${selectedOrder.id}/tracking`, {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                              },
                              body: JSON.stringify({ 
                                trackingNumber: trackingData.trackingNumber,
                                carrier: trackingData.carrier,
                                status: 'fulfilled'
                              })
                            })
                            .then(() => {
                                // Close the dialog and show success message
                              setViewDialogOpen(false);
                              toast({
                                title: "Order Approved",
                                description: "The order has been approved and fulfilled successfully.",
                              });
                              // Invalidate queries to refresh data and remove the order from the list
                              queryClient.invalidateQueries({ queryKey: ["/api/admin/orders/status/ready"] });
                              queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
                            })
                            .catch(error => {
                              toast({
                                title: "Error",
                                description: "Failed to approve order. Please try again.",
                                variant: "destructive"
                              });
                            });
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve Order
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {selectedOrder.customerMessage && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Customer Message</h3>
                  <div className="p-4 bg-blue-50 rounded-md border border-blue-100">
                    <p className="text-gray-700 italic">"{selectedOrder.customerMessage}"</p>
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Order Items</h3>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!Array.isArray(selectedOrder.items) && (
                        <TableRow>
                          <TableCell className="font-medium">{selectedOrder.product?.name || "Product"}</TableCell>
                          <TableCell>₹{selectedOrder.product?.price?.toFixed(2) || "0.00"}</TableCell>
                          <TableCell>{selectedOrder.quantity || 1}</TableCell>
                          <TableCell className="text-right">
                            ₹{((selectedOrder.product?.price || 0) * (selectedOrder.quantity || 1)).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      )}
                      {Array.isArray(selectedOrder.items) && selectedOrder.items.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.product?.name || "Product"}</TableCell>
                          <TableCell>₹{item.price?.toFixed(2) || "0.00"}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell className="text-right">₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-gray-50">
                        <TableCell colSpan={3} className="text-right font-medium">Total Amount</TableCell>
                        <TableCell className="text-right font-bold">₹{selectedOrder.totalPrice || selectedOrder.total_price || '0.00'}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Tracking Dialog */}
      <Dialog open={trackingDialogOpen} onOpenChange={setTrackingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tracking Information</DialogTitle>
            <DialogDescription>
              Add tracking details for order #{selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onAddTrackingSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="trackingNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tracking Number</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter tracking number" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="carrier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carrier/Shipping Company</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter carrier name" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={addTrackingMutation.isPending}
                >
                  {addTrackingMutation.isPending ? "Adding..." : "Add Tracking"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}