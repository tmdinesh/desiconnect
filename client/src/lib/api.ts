import { apiRequest } from "./queryClient";

export interface ApiErrorResponse {
  message: string;
}

// Auth API
export const loginAdmin = async (email: string, password: string) => {
  const res = await apiRequest("POST", "/api/auth/admin/login", { email, password });
  return res.json();
};

export const registerAdmin = async (email: string, password: string) => {
  const res = await apiRequest("POST", "/api/auth/admin/register", { email, password });
  return res.json();
};

export const resetAdminPassword = async (email: string) => {
  const res = await apiRequest("POST", "/api/auth/admin/reset-password", { email });
  return res.json();
};

export const loginSeller = async (email: string, password: string) => {
  const res = await apiRequest("POST", "/api/auth/seller/login", { email, password });
  return res.json();
};

export const resetSellerPassword = async (email: string) => {
  const res = await apiRequest("POST", "/api/auth/seller/reset-password", { email });
  return res.json();
};

export const registerCustomer = async (name: string, email: string, password: string, address?: string) => {
  const res = await apiRequest("POST", "/api/auth/customer/register", { name, email, password, address });
  return res.json();
};

export const loginCustomer = async (email: string, password: string) => {
  const res = await apiRequest("POST", "/api/auth/customer/login", { email, password });
  return res.json();
};

export const resetCustomerPassword = async (email: string) => {
  const res = await apiRequest("POST", "/api/auth/customer/reset-password", { email });
  return res.json();
};

// Admin API
export const getAdminStats = async () => {
  const res = await apiRequest("GET", "/api/admin/stats");
  return res.json();
};

export const createSeller = async (sellerData: any) => {
  const res = await apiRequest("POST", "/api/admin/sellers", sellerData);
  return res.json();
};

export const getAllSellers = async () => {
  const res = await apiRequest("GET", "/api/admin/sellers");
  return res.json();
};

export const getSeller = async (id: number) => {
  const res = await apiRequest("GET", `/api/admin/sellers/${id}`);
  return res.json();
};

export const updateSeller = async (id: number, sellerData: any) => {
  const res = await apiRequest("PUT", `/api/admin/sellers/${id}`, sellerData);
  return res.json();
};

export const getPendingProducts = async () => {
  const res = await apiRequest("GET", "/api/admin/products/pending");
  return res.json();
};

export const approveProduct = async (id: number) => {
  const res = await apiRequest("PUT", `/api/admin/products/${id}/approve`);
  return res.json();
};

export const rejectProduct = async (id: number) => {
  const res = await apiRequest("PUT", `/api/admin/products/${id}/reject`);
  return res.json();
};

export const deleteProduct = async (id: number) => {
  const res = await apiRequest("DELETE", `/api/admin/products/${id}`);
  return res.json();
};

export const getAllOrders = async () => {
  const res = await apiRequest("GET", "/api/admin/orders");
  return res.json();
};

export const getOrdersByStatus = async (status: string) => {
  const res = await apiRequest("GET", `/api/admin/orders/status/${status}`);
  return res.json();
};

export const addTrackingToOrder = async (id: number, trackingNumber: string) => {
  const res = await apiRequest("PUT", `/api/admin/orders/${id}/tracking`, { trackingNumber });
  return res.json();
};

// Seller API
export const getSellerProfile = async () => {
  const res = await apiRequest("GET", "/api/seller/profile");
  return res.json();
};

export const updateSellerProfile = async (profileData: any) => {
  const res = await apiRequest("PUT", "/api/seller/profile", profileData);
  return res.json();
};

export const getSellerStats = async () => {
  const res = await apiRequest("GET", "/api/seller/stats");
  return res.json();
};

export const getSellerProducts = async () => {
  const res = await apiRequest("GET", "/api/seller/products");
  return res.json();
};

export const createProduct = async (formData: FormData) => {
  // Get the auth token from localStorage
  const token = localStorage.getItem('desiconnect_token');
  
  const res = await fetch("/api/seller/products", {
    method: "POST",
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
    },
    body: formData,
    credentials: "include",
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || res.statusText);
  }
  
  return res.json();
};

export const updateProduct = async (id: number, formData: FormData) => {
  // Get the auth token from localStorage
  const token = localStorage.getItem('desiconnect_token');
  
  const res = await fetch(`/api/seller/products/${id}`, {
    method: "PUT",
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
    },
    body: formData,
    credentials: "include",
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || res.statusText);
  }
  
  return res.json();
};

export const deleteSellerProduct = async (id: number) => {
  const res = await apiRequest("DELETE", `/api/seller/products/${id}`);
  return res.json();
};

export const getSellerOrders = async () => {
  const res = await apiRequest("GET", "/api/seller/orders");
  return res.json();
};

export const markOrderReady = async (id: number) => {
  const res = await apiRequest("PUT", `/api/seller/orders/${id}/ready`);
  return res.json();
};

// Customer API
export const getCustomerProfile = async () => {
  const res = await apiRequest("GET", "/api/customer/profile");
  return res.json();
};

export const updateCustomerProfile = async (profileData: any) => {
  const res = await apiRequest("PUT", "/api/customer/profile", profileData);
  return res.json();
};

export const getCart = async () => {
  try {
    const res = await apiRequest("GET", "/api/customer/cart");
    return res.json();
  } catch (error) {
    console.error("Error fetching cart:", error);
    // Return an empty cart structure rather than throwing
    return { items: [] };
  }
};

export const updateCart = async (cartData: any) => {
  try {
    // Use the apiRequest function which handles auth token consistently
    const res = await apiRequest("POST", "/api/customer/cart", cartData);
    return res.json();
  } catch (error) {
    console.error("Error updating cart:", error);
    throw error;
  }
};

export const createOrder = async (orderData: any) => {
  const res = await apiRequest("POST", "/api/customer/orders", orderData);
  return res.json();
};

export const getCustomerOrders = async () => {
  const res = await apiRequest("GET", "/api/customer/orders");
  return res.json();
};

export const getCustomerOrderDetails = async (id: number) => {
  const res = await apiRequest("GET", `/api/customer/orders/${id}`);
  return res.json();
};

// Product API (Public)
export const getApprovedProducts = async () => {
  const res = await apiRequest("GET", "/api/products");
  return res.json();
};

export const getProductsByCategory = async (category: string) => {
  const res = await apiRequest("GET", `/api/products/category/${category}`);
  return res.json();
};

export const getProductDetails = async (id: number) => {
  const res = await apiRequest("GET", `/api/products/${id}`);
  return res.json();
};

export const searchProducts = async (query: string) => {
  try {
    const res = await apiRequest("GET", `/api/products/search?query=${encodeURIComponent(query)}`);
    
    if (!res.ok) {
      console.error('Search request failed with status:', res.status);
      throw new Error(`Search request failed: ${res.statusText}`);
    }
    
    return res.json();
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
};

// Order API
export const getOrderDetails = async (id: number) => {
  const res = await apiRequest("GET", `/api/orders/${id}`);
  return res.json();
};
