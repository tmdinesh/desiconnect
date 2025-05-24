import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Eye, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function AdminSellers() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<number | null>(null);
  
  // Fetch all sellers
  const { data: sellers, isLoading } = useQuery({
    queryKey: ["/api/admin/sellers"],
    enabled: !!token && !!user,
  });
  
  // Filter out rejected sellers
  const activeSellers = Array.isArray(sellers) 
    ? sellers.filter(seller => !seller.rejected)
    : [];

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
      
      setProcessingId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sellers"] });
    },
    onError: (error) => {
      toast({
        title: "Approval Failed",
        description: error instanceof Error ? error.message : "Failed to approve seller",
        variant: "destructive",
      });
      setProcessingId(null);
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
        description: "The seller has been rejected and removed from the list.",
      });
      
      setProcessingId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sellers"] });
    },
    onError: (error) => {
      toast({
        title: "Rejection Failed",
        description: error instanceof Error ? error.message : "Failed to reject seller",
        variant: "destructive",
      });
      setProcessingId(null);
    }
  });

  const handleApproveSeller = (sellerId: number) => {
    if (confirm("Are you sure you want to approve this seller?")) {
      setProcessingId(sellerId);
      approveSellerMutation.mutate(sellerId);
    }
  };

  const handleRejectSeller = (sellerId: number) => {
    if (confirm("Are you sure you want to reject this seller? They will be removed from the list.")) {
      setProcessingId(sellerId);
      rejectSellerMutation.mutate(sellerId);
    }
  };

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sellers Management</h1>
          <p className="text-muted-foreground">
            Manage and onboard sellers on the platform
          </p>
        </div>
        <Button className="flex items-center" onClick={() => window.location.href = "/admin/sellers/new"}>
          Add Seller
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Sellers</CardTitle>
          <CardDescription>
            View and manage all sellers on the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Array.isArray(activeSellers) && activeSellers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Total Products</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeSellers.map((seller: any) => (
                  <TableRow key={seller.id}>
                    <TableCell className="font-medium">{seller.businessName}</TableCell>
                    <TableCell>{seller.email}</TableCell>
                    <TableCell>{seller.phoneNumber || "N/A"}</TableCell>
                    <TableCell>
                      {seller.createdAt 
                        ? new Date(seller.createdAt).toLocaleDateString() 
                        : "N/A"}
                    </TableCell>
                    <TableCell>{seller.totalProducts || 0}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="icon"
                          title="Edit seller"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button 
                          variant="default"
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleApproveSeller(seller.id)}
                          disabled={processingId === seller.id || seller.approved}
                        >
                          {processingId === seller.id ? "Processing..." : "Approve"}
                        </Button>
                        
                        <Button 
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRejectSeller(seller.id)}
                          disabled={processingId === seller.id}
                        >
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-24 flex flex-col items-center justify-center text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No sellers found</h3>
              <p className="text-muted-foreground">
                There are no active sellers on the platform yet. Add your first seller using the "Add Seller" button.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}