import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import AdminLayout from "@/layouts/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle2, Eye, FileWarning, Plus, XCircle } from "lucide-react";

const createSellerSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  businessName: z.string().min(3, { message: "Business name must be at least 3 characters" }),
  phoneNumber: z.string().min(10, { message: "Please enter a valid phone number" }),
  address: z.string().min(5, { message: "Address must be at least 5 characters" }),
  description: z.string().optional(),
  gstNumber: z.string().optional(),
});

type CreateSellerForm = z.infer<typeof createSellerSchema>;

export default function AdminSellersRevamp() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [selectedSeller, setSelectedSeller] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'approve' | 'reject';
    sellerId: number | null;
  }>({ type: 'approve', sellerId: null });
  
  // Fetch all sellers
  const { data: sellers, isLoading } = useQuery({
    queryKey: ["/api/admin/sellers"],
    enabled: !!token && !!user,
  });
  
  // Filtered sellers based on tab
  const filteredSellers = Array.isArray(sellers) 
    ? sellers.filter(seller => {
        if (selectedTab === 'all') return true;
        if (selectedTab === 'pending') return !seller.approved && !seller.rejected;
        if (selectedTab === 'approved') return seller.approved;
        if (selectedTab === 'rejected') return seller.rejected;
        return true;
      })
    : [];
  
  // Count of each seller status type
  const sellerCounts = {
    all: Array.isArray(sellers) ? sellers.length : 0,
    pending: Array.isArray(sellers) ? sellers.filter(s => !s.approved && !s.rejected).length : 0,
    approved: Array.isArray(sellers) ? sellers.filter(s => s.approved).length : 0,
    rejected: Array.isArray(sellers) ? sellers.filter(s => s.rejected).length : 0,
  };

  const form = useForm<CreateSellerForm>({
    resolver: zodResolver(createSellerSchema),
    defaultValues: {
      email: "",
      businessName: "",
      phoneNumber: "",
      address: "",
      description: "",
      gstNumber: "",
    },
  });

  // Create seller mutation
  const createSellerMutation = useMutation({
    mutationFn: async (data: CreateSellerForm) => {
      const response = await fetch("/api/admin/sellers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create seller");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Seller Created",
        description: "The seller account has been created successfully.",
      });
      
      setCreateDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sellers"] });
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create seller",
        variant: "destructive",
      });
    }
  });

  // Seller approval mutation
  const approveSellerMutation = useMutation({
    mutationFn: async (sellerId: number) => {
      const response = await fetch(`/api/admin/sellers/${sellerId}/approve`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to approve seller");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Seller Approved",
        description: "The seller has been approved successfully.",
      });
      
      setConfirmDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sellers"] });
    },
    onError: (error) => {
      toast({
        title: "Approval Failed",
        description: error instanceof Error ? error.message : "Failed to approve seller",
        variant: "destructive",
      });
    }
  });

  // Seller rejection mutation
  const rejectSellerMutation = useMutation({
    mutationFn: async (sellerId: number) => {
      const response = await fetch(`/api/admin/sellers/${sellerId}/reject`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to reject seller");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Seller Rejected",
        description: "The seller has been rejected successfully.",
      });
      
      setConfirmDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sellers"] });
    },
    onError: (error) => {
      toast({
        title: "Rejection Failed",
        description: error instanceof Error ? error.message : "Failed to reject seller",
        variant: "destructive",
      });
    }
  });

  const handleViewSeller = (seller: any) => {
    setSelectedSeller(seller);
    setViewDialogOpen(true);
  };

  const handleApproveConfirm = (sellerId: number) => {
    setConfirmAction({ type: 'approve', sellerId });
    setConfirmDialogOpen(true);
  };
  
  const handleRejectConfirm = (sellerId: number) => {
    setConfirmAction({ type: 'reject', sellerId });
    setConfirmDialogOpen(true);
  };
  
  const handleConfirmAction = () => {
    if (confirmAction.sellerId) {
      if (confirmAction.type === 'approve') {
        approveSellerMutation.mutate(confirmAction.sellerId);
      } else {
        rejectSellerMutation.mutate(confirmAction.sellerId);
      }
    }
  };

  const onCreateSellerSubmit = (data: CreateSellerForm) => {
    createSellerMutation.mutate(data);
  };
  
  const getStatusBadge = (seller: any) => {
    if (seller.approved) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-300">Approved</Badge>;
    } else if (seller.rejected) {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-300">Rejected</Badge>;
    } else {
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-300">Pending</Badge>;
    }
  };

  if (isLoading) {
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
          <h1 className="text-3xl font-bold tracking-tight">Seller Management</h1>
          <p className="text-muted-foreground">
            Manage and approve sellers on the platform
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Seller
        </Button>
      </div>
      
      <div className="mt-6">
        <Tabs defaultValue="all" value={selectedTab} onValueChange={(value) => setSelectedTab(value as any)}>
          <div className="border-b">
            <TabsList className="bg-transparent border-b-0">
              <TabsTrigger value="all" className="relative data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                All Sellers
                <Badge variant="outline" className="ml-2">{sellerCounts.all}</Badge>
                {selectedTab === 'all' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />}
              </TabsTrigger>
              <TabsTrigger value="pending" className="relative data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                Pending Approval
                <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-800 border-amber-200">{sellerCounts.pending}</Badge>
                {selectedTab === 'pending' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />}
              </TabsTrigger>
              <TabsTrigger value="approved" className="relative data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                Approved
                <Badge variant="outline" className="ml-2 bg-green-50 text-green-800 border-green-200">{sellerCounts.approved}</Badge>
                {selectedTab === 'approved' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />}
              </TabsTrigger>
              <TabsTrigger value="rejected" className="relative data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                Rejected
                <Badge variant="outline" className="ml-2 bg-red-50 text-red-800 border-red-200">{sellerCounts.rejected}</Badge>
                {selectedTab === 'rejected' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />}
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="mt-4">
            <div className="mb-4 flex items-center">
              <Input
                placeholder="Search sellers..."
                className="max-w-sm"
              />
            </div>
            
            <Card>
              <CardContent className="p-0">
                {filteredSellers.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">Business Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSellers.map((seller) => (
                        <TableRow key={seller.id}>
                          <TableCell className="font-medium">
                            {seller.businessName}
                          </TableCell>
                          <TableCell>{seller.email}</TableCell>
                          <TableCell>
                            {seller.createdAt 
                              ? new Date(seller.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                }) 
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(seller)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button 
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewSeller(seller)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              
                              {!seller.approved && !seller.rejected && (
                                <>
                                  <Button 
                                    size="sm"
                                    variant="default"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => handleApproveConfirm(seller.id)}
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button 
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleRejectConfirm(seller.id)}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    {selectedTab === 'pending' ? (
                      <>
                        <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                        <h3 className="text-lg font-semibold">No Pending Sellers</h3>
                        <p className="text-muted-foreground mt-2 mb-4 max-w-md">
                          Great job! All seller applications have been reviewed.
                        </p>
                      </>
                    ) : selectedTab === 'rejected' ? (
                      <>
                        <FileWarning className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold">No Rejected Sellers</h3>
                        <p className="text-muted-foreground mt-2 mb-4 max-w-md">
                          There are no rejected sellers at this time.
                        </p>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold">No Sellers Found</h3>
                        <p className="text-muted-foreground mt-2 mb-4 max-w-md">
                          No sellers match your current filter criteria.
                        </p>
                        <Button onClick={() => setCreateDialogOpen(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Seller
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </Tabs>
      </div>
      
      {/* Create Seller Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Seller</DialogTitle>
            <DialogDescription>
              Add a new seller to the platform
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onCreateSellerSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter business name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter business address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Description (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter business description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="gstNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GST Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter GST number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createSellerMutation.isPending}>
                  {createSellerMutation.isPending ? "Creating..." : "Create Seller"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Seller Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Seller Details</DialogTitle>
            <DialogDescription>
              Complete information about the seller
            </DialogDescription>
          </DialogHeader>
          
          {selectedSeller && (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{selectedSeller.businessName}</h2>
                  <div className="flex items-center mt-1">
                    {getStatusBadge(selectedSeller)}
                    <span className="text-sm ml-2 text-muted-foreground">
                      Joined on {new Date(selectedSeller.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    {!selectedSeller.approved && !selectedSeller.rejected && (
                      <>
                        <Button 
                          size="sm"
                          variant="default"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            setViewDialogOpen(false);
                            handleApproveConfirm(selectedSeller.id);
                          }}
                        >
                          Approve Seller
                        </Button>
                        <Button 
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setViewDialogOpen(false);
                            handleRejectConfirm(selectedSeller.id);
                          }}
                        >
                          Reject Seller
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Email Address</p>
                      <p className="font-medium">{selectedSeller.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone Number</p>
                      <p className="font-medium">{selectedSeller.phoneNumber || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Business Address</p>
                      <p className="font-medium">{selectedSeller.address || "Not provided"}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Business Information</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">GST Number</p>
                      <p className="font-medium">{selectedSeller.gstNumber || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Description</p>
                      <p>{selectedSeller.description || "No description provided"}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Business Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-muted-foreground text-sm">Total Products</p>
                        <p className="text-3xl font-bold">{selectedSeller.totalProducts || 0}</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-muted-foreground text-sm">Total Orders</p>
                        <p className="text-3xl font-bold">{selectedSeller.totalOrders || 0}</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-muted-foreground text-sm">Total Revenue</p>
                        <p className="text-3xl font-bold">₹{selectedSeller.totalRevenue?.toLocaleString() || 0}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmAction.type === 'approve' ? 'Approve Seller' : 'Reject Seller'}
            </DialogTitle>
            <DialogDescription>
              {confirmAction.type === 'approve' 
                ? 'This will approve the seller and allow them to list products on the platform.'
                : 'This will reject the seller and prevent them from listing products on the platform.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-3">
            <p>Are you sure you want to proceed with this action?</p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant={confirmAction.type === 'approve' ? 'default' : 'destructive'}
              className={confirmAction.type === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
              onClick={handleConfirmAction}
              disabled={approveSellerMutation.isPending || rejectSellerMutation.isPending}
            >
              {confirmAction.type === 'approve' 
                ? (approveSellerMutation.isPending ? 'Approving...' : 'Approve Seller')
                : (rejectSellerMutation.isPending ? 'Rejecting...' : 'Reject Seller')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}