import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import SellerLayout from "@/components/layout/SellerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSellerProducts, createProduct, updateProduct, deleteSellerProduct } from "@/lib/api";
import { formatCurrency, getProductStatusBadgeColor } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Package,
  Plus,
  Pencil,
  Trash,
  Image,
  AlertCircle,
  Boxes,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { queryClient } from "@/lib/queryClient";

export default function SellerProducts() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [inventoryDialogOpen, setInventoryDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [inventoryQuantity, setInventoryQuantity] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { data: products, isLoading, refetch } = useQuery({
    queryKey: ["/api/seller/products"],
  });

  const resetFormState = () => {
    setName("");
    setDescription("");
    setCategory("");
    setPrice("");
    setQuantity("");
    setImageFile(null);
    setImagePreview(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const openCreateDialog = () => {
    resetFormState();
    setCreateDialogOpen(true);
  };

  const openEditDialog = (product: any) => {
    setSelectedProduct(product);
    setName(product.name);
    setDescription(product.description || "");
    setCategory(product.category);
    setPrice(String(product.price));
    setQuantity(String(product.quantity));
    setImagePreview(product.image || null);
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (product: any) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };
  
  const openInventoryDialog = (product: any) => {
    setSelectedProduct(product);
    setInventoryQuantity(String(product.quantity));
    setInventoryDialogOpen(true);
  };

  const handleCreateProduct = async () => {
    if (!name || !category || !price || !quantity) {
      toast({
        variant: "destructive",
        title: "Validation error",
        description: "Please fill in all required fields",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("price", price);
      formData.append("quantity", quantity);
      
      if (imageFile) {
        formData.append("image", imageFile);
      }

      await createProduct(formData);
      toast({
        title: "Success",
        description: "Product created successfully and pending approval",
      });
      setCreateDialogOpen(false);
      resetFormState();
      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create product",
      });
    }
  };

  const handleUpdateProduct = async () => {
    if (!name || !category || !price || !quantity) {
      toast({
        variant: "destructive",
        title: "Validation error",
        description: "Please fill in all required fields",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("price", price);
      formData.append("quantity", quantity);
      
      if (imageFile) {
        formData.append("image", imageFile);
      }

      await updateProduct(selectedProduct.id, formData);
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      setEditDialogOpen(false);
      resetFormState();
      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update product",
      });
    }
  };

  const handleDeleteProduct = async () => {
    try {
      await deleteSellerProduct(selectedProduct.id);
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      setDeleteDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete product",
      });
    }
  };
  
  const handleUpdateInventory = async () => {
    if (!inventoryQuantity || parseInt(inventoryQuantity) < 0) {
      toast({
        variant: "destructive",
        title: "Validation error",
        description: "Please enter a valid quantity (0 or higher)",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("quantity", inventoryQuantity);
      
      await updateProduct(selectedProduct.id, formData);
      
      toast({
        title: "Success",
        description: "Inventory updated successfully",
      });
      
      setInventoryDialogOpen(false);
      
      // Refresh the product list and also invalidate the public products data
      // so customer facing pages will show updated inventory
      await refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: [`/api/products/${selectedProduct.id}`] });
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update inventory",
      });
    }
  };

  return (
    <SellerLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Products</h1>
        <Button onClick={openCreateDialog} className="flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          Add New Product
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading products...</div>
      ) : !products || products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 mb-6">Start adding your products to showcase them to customers.</p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-5 w-5 mr-2" />
              Add Your First Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product: any) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="h-48 bg-gray-100 relative">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Package className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <Badge
                  className={`absolute top-2 right-2 ${getProductStatusBadgeColor(product.status)}`}
                >
                  {product.status}
                </Badge>
              </div>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-1 truncate">{product.name}</h3>
                <p className="text-sm text-gray-500 mb-2">Category: {product.category}</p>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-bold text-primary">{formatCurrency(product.price)}</span>
                  <div className="text-sm text-gray-600">Quantity: {product.quantity}</div>
                </div>
                <div className="flex flex-wrap justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openInventoryDialog(product)}
                    className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                  >
                    <Boxes className="h-4 w-4 mr-1" />
                    Update Stock
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(product)}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => openDeleteDialog(product)}
                  >
                    <Trash className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Product Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Product Name*</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter product name"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter product description"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="category">Category*</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apparel">Apparel</SelectItem>
                  <SelectItem value="accessories">Accessories</SelectItem>
                  <SelectItem value="festivities">Festivities</SelectItem>
                  <SelectItem value="home-decor">Home Decor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price (₹)*</Label>
                <Input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <Label htmlFor="quantity">Quantity*</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="image">Product Image</Label>
              <div className="mt-1 flex items-center">
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer bg-white px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                >
                  <span>Upload file</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
                <span className="ml-3 text-sm text-gray-500">
                  {imageFile ? imageFile.name : "No file chosen"}
                </span>
              </div>
              {imagePreview && (
                <div className="mt-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-32 w-auto object-cover rounded-md"
                  />
                </div>
              )}
            </div>
            <div className="text-sm text-gray-500">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              Products will be reviewed before they appear to customers
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProduct}>
              Create Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Product Name*</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter product name"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter product description"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Category*</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apparel">Apparel</SelectItem>
                  <SelectItem value="accessories">Accessories</SelectItem>
                  <SelectItem value="festivities">Festivities</SelectItem>
                  <SelectItem value="home-decor">Home Decor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-price">Price (₹)*</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <Label htmlFor="edit-quantity">Quantity*</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-image">Product Image</Label>
              <div className="mt-1 flex items-center">
                <label
                  htmlFor="edit-file-upload"
                  className="cursor-pointer bg-white px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                >
                  <span>Upload file</span>
                  <input
                    id="edit-file-upload"
                    name="edit-file-upload"
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
                <span className="ml-3 text-sm text-gray-500">
                  {imageFile ? imageFile.name : "Keep current image"}
                </span>
              </div>
              {imagePreview && (
                <div className="mt-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-32 w-auto object-cover rounded-md"
                  />
                </div>
              )}
            </div>
            <div className="text-sm text-gray-500">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              Major changes will require re-approval by admin
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProduct}>
              Update Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the product "{selectedProduct?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteProduct}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Inventory Update Dialog */}
      <Dialog open={inventoryDialogOpen} onOpenChange={setInventoryDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Inventory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            {selectedProduct && (
              <div className="flex items-center gap-3 border-b pb-3">
                <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                  {selectedProduct.image ? (
                    <img 
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-medium truncate">{selectedProduct.name}</h3>
                  <p className="text-xs text-gray-500">Current stock: {selectedProduct.quantity}</p>
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="inventory-quantity" className="text-base font-medium">Update Stock Quantity</Label>
              <div className="mt-2">
                <Input
                  id="inventory-quantity"
                  type="number"
                  value={inventoryQuantity}
                  onChange={(e) => setInventoryQuantity(e.target.value)}
                  placeholder="Enter new quantity"
                  min="0"
                  step="1"
                  className="text-lg"
                />
              </div>
            </div>
            
            <div className="pt-2 text-sm text-gray-500">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              Inventory changes will be immediately reflected across the platform
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setInventoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateInventory} className="bg-blue-600 hover:bg-blue-700">
              Update Inventory
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SellerLayout>
  );
}
