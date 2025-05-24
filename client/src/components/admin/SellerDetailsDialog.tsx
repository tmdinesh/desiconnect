import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SellerDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seller: any | null;
  onApproveSeller?: (id: number) => void;
  onRejectSeller?: (id: number) => void;
}

export function SellerDetailsDialog({
  open,
  onOpenChange,
  seller,
  onApproveSeller,
  onRejectSeller,
}: SellerDetailsDialogProps) {
  if (!seller) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Seller Business Details</DialogTitle>
          <DialogDescription>
            Complete information about the seller and their business
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="bg-gray-50 border p-6 rounded-md">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold">{seller.businessName}</h3>
                <div className="flex items-center mt-2">
                  <div className={`h-3 w-3 rounded-full mr-2 ${
                    seller.approved ? 'bg-green-500' : 
                    seller.rejected ? 'bg-red-500' : 'bg-amber-500'
                  }`}></div>
                  <p className="text-sm font-bold">
                    STATUS: {seller.approved ? 'APPROVED' : 
                     seller.rejected ? 'REJECTED' : 'PENDING APPROVAL'}
                  </p>
                </div>
              </div>
              <div className="bg-white px-4 py-2 rounded border text-sm">
                <p>Member since:</p>
                <p className="font-bold">{seller.createdAt 
                  ? new Date(seller.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long', 
                      day: 'numeric'
                    })
                  : "N/A"}
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6 mt-6">
            <div className="border rounded-md p-4">
              <h4 className="font-bold text-gray-700 border-b pb-2 mb-4">Contact Information</h4>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Email Address</p>
                  <p className="font-medium text-gray-900">{seller.email}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone Number</p>
                  <p className="font-medium text-gray-900">{seller.phoneNumber || "Not provided"}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Business Address</p>
                  <p className="font-medium text-gray-900">{seller.address || "Not provided"}</p>
                </div>
              </div>
            </div>
            
            <div className="border rounded-md p-4">
              <h4 className="font-bold text-gray-700 border-b pb-2 mb-4">Business Information</h4>
              <div className="space-y-4">
                {seller.description && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Description</p>
                    <p className="text-gray-900">{seller.description}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm font-medium text-gray-500">GST Number</p>
                  <p className="font-medium text-gray-900">{seller.gstNumber || "Not provided"}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Registration Status</p>
                  <p className="font-medium text-gray-900">{
                    seller.approved 
                      ? "Fully Registered" 
                      : seller.rejected 
                      ? "Registration Rejected" 
                      : "Pending Registration"
                  }</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-6 rounded-md border border-blue-100">
            <h4 className="font-bold text-blue-800 border-b border-blue-200 pb-2 mb-4">Business Performance</h4>
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white p-4 rounded-md border">
                <p className="text-sm text-gray-500">Total Products</p>
                <p className="text-2xl font-bold text-blue-600">{seller.totalProducts || 0}</p>
              </div>
              
              <div className="bg-white p-4 rounded-md border">
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold text-blue-600">{seller.totalOrders || 0}</p>
              </div>
              
              <div className="bg-white p-4 rounded-md border">
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-blue-600">₹{seller.totalRevenue?.toLocaleString() || "0"}</p>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="border-t pt-4 flex justify-between">
            <div>
              {!seller.approved && !seller.rejected && onApproveSeller && onRejectSeller && (
                <div className="flex space-x-3">
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => {
                      onOpenChange(false);
                      onApproveSeller(seller.id);
                    }}
                  >
                    Approve Seller
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      onOpenChange(false);
                      onRejectSeller(seller.id);
                    }}
                  >
                    Reject Seller
                  </Button>
                </div>
              )}
            </div>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}