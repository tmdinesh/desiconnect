import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import AdminLayout from "@/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  ShoppingBag, 
  Package, 
  PackageCheck,
  ShoppingCart,
  Store
} from "lucide-react";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { user, token } = useAuth();
  
  // Fetch dashboard statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: !!token && !!user,
  });
  
  const defaultStats = {
    totalSellers: 0,
    totalProducts: 0,
    pendingProducts: 0,
    totalOrders: 0,
    pendingApprovalSellers: 0,
    totalRevenue: 0,
    recentOrders: []
  };
  
  const dashboardStats = stats || defaultStats;
  
  if (statsLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to DesiConnect Admin Portal
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button>
            <Link href="/admin/orders">
              Manage Orders
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Quick Access Cards */}
      <div className="grid gap-6 mt-8">
        <h2 className="text-xl font-semibold">Quick Access</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow">
            <Link href="/admin/sellers">
              <CardContent className="p-6 cursor-pointer">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Store className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-bold">Manage Sellers</h3>
                    <p className="text-sm text-muted-foreground">
                      Approve and manage seller accounts
                    </p>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <Link href="/admin/products">
              <CardContent className="p-6 cursor-pointer">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <Package className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-bold">Product Approvals</h3>
                    <p className="text-sm text-muted-foreground">
                      Review and approve seller products
                    </p>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <Link href="/admin/orders">
              <CardContent className="p-6 cursor-pointer">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <ShoppingBag className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-bold">Order Management</h3>
                    <p className="text-sm text-muted-foreground">
                      View and process customer orders
                    </p>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>
        </div>
      </div>
      
      {/* Action Required Section */}
      <div className="mt-8 grid gap-6">
        <h2 className="text-xl font-semibold">Required Actions</h2>
        <Card>
          <CardHeader>
            <CardTitle>Items Requiring Your Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardStats.pendingApprovalSellers > 0 && (
                <div className="flex items-start">
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center mr-3 flex-shrink-0">
                    <Users className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Seller Approval Pending</h4>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {dashboardStats.pendingApprovalSellers} new sellers awaiting approval
                    </p>
                    <Button size="sm" variant="outline" className="mt-2">
                      <Link href="/admin/sellers?tab=pending">Review Sellers</Link>
                    </Button>
                  </div>
                </div>
              )}
              
              {dashboardStats.pendingProducts > 0 && (
                <div className="flex items-start">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mr-3 flex-shrink-0">
                    <Package className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Products Pending Approval</h4>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {dashboardStats.pendingProducts} products awaiting review
                    </p>
                    <Button size="sm" variant="outline" className="mt-2">
                      <Link href="/admin/products?status=pending">Review Products</Link>
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="flex items-start">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium">Orders Ready for Fulfillment</h4>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Check orders that need tracking information
                  </p>
                  <Button size="sm" variant="outline" className="mt-2">
                    <Link href="/admin/orders?status=ready">Process Orders</Link>
                  </Button>
                </div>
              </div>
              
              {dashboardStats.pendingApprovalSellers === 0 && dashboardStats.pendingProducts === 0 && (
                <div className="flex items-start bg-green-50 p-3 rounded-lg">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-3 flex-shrink-0">
                    <PackageCheck className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">All Caught Up!</h4>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      No pending approvals at this time
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Platform Overview */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-6">Platform Overview</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <Users className="h-8 w-8 text-blue-500 mb-2" />
                <p className="text-muted-foreground text-sm">Total Sellers</p>
                <p className="text-3xl font-bold">{dashboardStats.totalSellers}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <Package className="h-8 w-8 text-green-500 mb-2" />
                <p className="text-muted-foreground text-sm">Total Products</p>
                <p className="text-3xl font-bold">{dashboardStats.totalProducts}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <ShoppingBag className="h-8 w-8 text-purple-500 mb-2" />
                <p className="text-muted-foreground text-sm">Total Orders</p>
                <p className="text-3xl font-bold">{dashboardStats.totalOrders}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <ShoppingCart className="h-8 w-8 text-orange-500 mb-2" />
                <p className="text-muted-foreground text-sm">Recent Orders</p>
                <p className="text-3xl font-bold">{dashboardStats.recentOrders?.length || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}