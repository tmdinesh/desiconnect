import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import CustomerLayout from "@/components/layout/CustomerLayout";
import { 
  Package,
  Truck,
  CheckCircle,
  AlertCircle,
  ShoppingBag,
  Plus,
  ExternalLink
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";

export default function CustomerOrders() {
  const { user, token } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch orders data
  const { data: orders, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/customer/orders"],
    enabled: !!token && !!user,
  });
  


  if (isLoading) {
    return (
      <CustomerLayout>
        <div className="container mx-auto py-8">
          <Card>
            <CardHeader>
              <CardTitle>My Orders</CardTitle>
              <CardDescription>Loading your order history...</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center p-8">
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
              <CardTitle className="flex items-center">
                <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
                My Orders
              </CardTitle>
              <CardDescription>There was a problem loading your orders</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-red-500 mb-4">Error: {(error as Error).message}</p>
              <Button onClick={() => refetch()} className="mr-2">
                Try Again
              </Button>
              <Button variant="outline" onClick={() => navigate("/products")}>
                Browse Products
              </Button>
            </CardContent>
          </Card>
        </div>
      </CustomerLayout>
    );
  }

  if (!orders || !Array.isArray(orders) || orders.length === 0) {
    return (
      <CustomerLayout>
        <div className="container mx-auto py-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingBag className="mr-2 h-5 w-5 text-primary" />
                My Orders
              </CardTitle>
              <CardDescription>You haven't placed any orders yet</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="py-8">
                <Package className="h-20 w-20 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 mb-6">Browse our products and place your first order!</p>
                <div className="flex flex-col md:flex-row gap-4 justify-center">
                  <Button onClick={() => navigate("/products")} size="lg">
                    Shop Now
                  </Button>

                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CustomerLayout>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "placed":
        return (
          <div className="flex items-center">
            <Package className="h-4 w-4 mr-1 text-yellow-600" />
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Placed</Badge>
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
            <Badge variant="outline" className="bg-green-100 text-green-800">Fulfilled</Badge>
          </div>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <CustomerLayout>
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingBag className="mr-2 h-5 w-5 text-primary" />
              My Orders
            </CardTitle>
            <CardDescription>View your order history</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tracking ID</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(orders) && orders.map((order: any) => (
                  <TableRow key={order.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell className="font-medium">#{order.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                          {order.product && order.product.image ? (
                            <img 
                              src={order.product.image} 
                              alt={order.product.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm line-clamp-1">{order.product?.name || 'Product'}</p>
                          <p className="text-xs text-gray-500">Qty: {order.quantity}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.createdAt 
                        ? format(new Date(order.createdAt), 'MMM dd, yyyy') 
                        : 'N/A'}
                    </TableCell>
                    <TableCell>{formatCurrency(order.totalPrice)}</TableCell>
                    <TableCell>
                      {getStatusBadge(order.status || 'placed')}
                    </TableCell>
                    <TableCell>
                      {order.trackingNumber ? (
                        <div className="flex items-center">
                          <Truck className="h-4 w-4 mr-1 text-blue-600" />
                          <span className="text-blue-600 font-medium">{order.trackingNumber}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Not available</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/orders/${order.id}`)}
                        >
                          View Details
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/products/${order.productId}`)}
                        >
                          Reorder
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => navigate("/products")}>
                  Continue Shopping
                </Button>

                <Button 
                  variant="default"
                  className="bg-primary hover:bg-primary-dark"
                  onClick={() => window.open("https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx", "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" /> Track Order
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={() => refetch()}>
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </CustomerLayout>
  );
}