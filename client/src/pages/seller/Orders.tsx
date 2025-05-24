import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import SellerLayout from "@/components/layout/SellerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { getSellerOrders, markOrderReady } from "@/lib/api";
import { formatCurrency, formatDate, getOrderStatusBadgeColor } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Package,
  ShoppingBag,
  User,
  MapPin,
  Calendar,
  CheckCircle,
  Truck,
  MessageSquare,
  AlertCircle,
} from "lucide-react";

interface OrderItem {
  id: number;
  name: string;
  price: number | string;
  quantity: number;
  image?: string;
  product?: {
    id: number;
    name: string;
    image: string;
  };
}

interface Order {
  id: number;
  status: string;
  createdAt: string;
  customerName: string;
  customerMessage?: string;
  address?: string;
  total: number;
  items: OrderItem[];
  trackingNumber?: string;
  totalPrice?: number;
  quantity?: number;
  product?: {
    id: number;
    name: string;
    image: string;
  };
}

export default function SellerOrders() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [confirmReadyDialogOpen, setConfirmReadyDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data: orders, isLoading, refetch } = useQuery<Order[]>({
    queryKey: ["/api/seller/orders"],
  });

  const openConfirmReadyDialog = (order: any) => {
    setSelectedOrder(order);
    setConfirmReadyDialogOpen(true);
  };
  
  const handleMarkReady = async () => {
    if (!selectedOrder) return;
    
    try {
      setConfirmReadyDialogOpen(false);
      
      await markOrderReady(selectedOrder.id);
      
      toast({
        title: "Order Sent for Admin Approval",
        description: "Order has been marked as ready and sent to admin with all details for final approval",
      });
      
      // Refresh the orders list
      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update order status",
      });
    }
  };

  const viewCustomerMessage = (order: any) => {
    setSelectedOrder(order);
    setMessageDialogOpen(true);
  };

  // Filter orders based on status
  const filteredOrders = Array.isArray(orders)
    ? statusFilter === "all"
      ? orders
      : orders.filter((order) => order.status === statusFilter)
    : [];

  return (
    <SellerLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <div className="w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="placed">Placed</SelectItem>
              <SelectItem value="ready">Ready for Pickup</SelectItem>
              <SelectItem value="fulfilled">Fulfilled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading orders...</div>
      ) : !orders || orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-500">Orders from customers will appear here.</p>
          </CardContent>
        </Card>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No {statusFilter} orders</h3>
            <p className="text-gray-500">No orders with the selected status.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tracking ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order: any) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="flex-shrink-0 h-4 w-4 text-gray-400 mr-2" />
                          <div className="text-sm text-gray-900">
                            {order.customerName}
                            <div className="text-xs text-gray-500 flex items-center mt-1">
                              <MapPin className="h-3 w-3 mr-1" />
                              {order.address ? (
                                order.address.length > 20 
                                  ? order.address.substring(0, 20) + "..." 
                                  : order.address
                              ) : "No address provided"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {order.product?.image ? (
                            <img 
                              src={order.product.image} 
                              alt={order.product.name} 
                              className="h-10 w-10 object-cover rounded-md mr-2"
                            />
                          ) : (
                            <Package className="h-10 w-10 text-gray-300 mr-2" />
                          )}
                          <div>
                            <div className="text-sm text-gray-900">{order.product?.name || "Unknown Product"}</div>
                            <div className="text-xs text-gray-500 font-medium">Qty: {order.quantity}</div>
                            <button 
                              onClick={() => viewCustomerMessage(order)}
                              className="text-xs text-primary-600 flex items-center mt-1 bg-blue-50 px-2 py-1 rounded-md"
                            >
                              <MessageSquare className="h-3 w-3 mr-1" />
                              View customer details
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(order.totalPrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.trackingNumber ? (
                          <div className="text-sm text-blue-600 font-medium flex items-center">
                            <Truck className="h-4 w-4 mr-1" />
                            {order.trackingNumber}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Not assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getOrderStatusBadgeColor(order.status)}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {order.status === "placed" ? (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => openConfirmReadyDialog(order)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Mark Ready
                          </Button>
                        ) : order.status === "ready" ? (
                          <div className="text-sm text-gray-500">Awaiting admin</div>
                        ) : (
                          <div className="text-sm flex items-center text-green-600">
                            <Truck className="h-4 w-4 mr-1" />
                            {order.trackingNumber || "Fulfilled"}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer Details Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-md border border-blue-100">
              <div className="flex items-center mb-2">
                <User className="h-4 w-4 text-blue-600 mr-2" />
                <p className="font-medium text-blue-900">Customer: {selectedOrder?.customerName}</p>
              </div>
              <div className="flex items-start mb-2">
                <MapPin className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-gray-700">Shipping Address: {selectedOrder?.address}</p>
              </div>
              {selectedOrder?.customerMessage && (
                <div>
                  <p className="font-medium text-blue-900 mb-1">Message:</p>
                  <p className="text-gray-700 italic bg-white p-2 rounded border border-blue-100">"{selectedOrder.customerMessage}"</p>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-gray-50 rounded-md border border-gray-100">
              <h4 className="text-sm font-medium mb-2 flex items-center">
                <Package className="h-4 w-4 mr-2 text-gray-600" />
                Order Details
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-500">Order ID:</div>
                <div className="font-medium">#{selectedOrder?.id}</div>
                <div className="text-gray-500">Product:</div>
                <div className="font-medium">{selectedOrder?.product?.name}</div>
                <div className="text-gray-500">Quantity:</div>
                <div className="font-medium">{selectedOrder?.quantity} units</div>
                <div className="text-gray-500">Address:</div>
                <div className="font-medium">{selectedOrder?.address}</div>
                <div className="text-gray-500">Tracking ID:</div>
                <div className="font-medium text-blue-600">{selectedOrder?.trackingNumber || "Not assigned yet"}</div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setMessageDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Mark Ready Dialog */}
      <Dialog open={confirmReadyDialogOpen} onOpenChange={setConfirmReadyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send to Admin for Approval</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 rounded-md border border-amber-100">
              <div className="flex items-center mb-2">
                <CheckCircle className="h-4 w-4 text-amber-600 mr-2" />
                <p className="font-medium text-amber-900">Order Approval Process</p>
              </div>
              <p className="text-gray-700 text-sm">
                This order will be marked as "Ready" and sent to the admin with complete order details including:
              </p>
              <ul className="mt-2 text-sm text-gray-700 space-y-1 pl-5 list-disc">
                <li>Full customer information and address</li>
                <li>Your seller details and contact information</li>
                <li>Complete product and order information</li>
                <li>Any customer messages and special requests</li>
              </ul>
            </div>
            
            {selectedOrder && (
              <div className="p-4 bg-gray-50 rounded-md border border-gray-100">
                <h4 className="text-sm font-medium mb-2 flex items-center">
                  <Package className="h-4 w-4 mr-2 text-gray-600" />
                  Order Details
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-500">Order ID:</div>
                  <div className="font-medium">#{selectedOrder.id}</div>
                  <div className="text-gray-500">Customer:</div>
                  <div className="font-medium">{selectedOrder.customerName}</div>
                  <div className="text-gray-500">Product:</div>
                  <div className="font-medium">{selectedOrder.product?.name}</div>
                  <div className="text-gray-500">Quantity:</div>
                  <div className="font-medium">{selectedOrder.quantity} units</div>
                  <div className="text-gray-500">Amount:</div>
                  <div className="font-medium">{formatCurrency(selectedOrder.totalPrice || 0)}</div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmReadyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleMarkReady} className="bg-green-600 hover:bg-green-700">
              Confirm & Send to Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SellerLayout>
  );
}
