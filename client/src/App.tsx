import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { CartProvider } from "@/hooks/use-cart";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";

// Admin Pages
import AdminLogin from "@/pages/admin/Login";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminSellers from "@/pages/admin/SimpleSellersList";
import AdminProducts from "@/pages/admin/Products";
import AdminOrders from "@/pages/admin/Orders";

// Seller Pages
import SellerLogin from "@/pages/seller/Login";
import SellerRegister from "@/pages/seller/Register";
import SellerForgotPassword from "@/pages/seller/ForgotPassword";
import SellerDashboard from "@/pages/seller/Dashboard";
import SellerProducts from "@/pages/seller/Products";
import SellerOrders from "@/pages/seller/Orders";
import SellerProfile from "@/pages/seller/Profile";

// Customer Pages
import CustomerHome from "@/pages/customer/Home";
import CustomerProducts from "@/pages/customer/Products";
import CustomerProductDetail from "@/pages/customer/ProductDetail";
import CustomerCart from "@/pages/customer/Cart";
import CustomerCheckout from "@/pages/customer/Checkout";
import CustomerOrders from "@/pages/customer/Orders";
import OrderDetails from "@/pages/customer/OrderDetails";
import CustomerLogin from "@/pages/customer/Login";
import CustomerRegister from "@/pages/customer/Register";
import CustomerForgotPassword from "@/pages/customer/ForgotPassword";

function Router() {
  return (
    <Switch>
      {/* Landing Page */}
      <Route path="/" component={Landing} />

      {/* Admin Routes */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/sellers" component={AdminSellers} />
      <Route path="/admin/products" component={AdminProducts} />
      <Route path="/admin/orders" component={AdminOrders} />

      {/* Seller Routes */}
      <Route path="/seller/login" component={SellerLogin} />
      <Route path="/seller/register" component={SellerRegister} />
      <Route path="/seller/forgot-password" component={SellerForgotPassword} />
      <Route path="/seller" component={SellerDashboard} />
      <Route path="/seller/products" component={SellerProducts} />
      <Route path="/seller/orders" component={SellerOrders} />
      <Route path="/seller/profile" component={SellerProfile} />

      {/* Customer Routes */}
      <Route path="/customer" component={CustomerHome} />
      <Route path="/products" component={CustomerProducts} />
      <Route path="/products/category/:category" component={CustomerProducts} />
      <Route path="/products/:id" component={CustomerProductDetail} />
      <Route path="/cart" component={CustomerCart} />
      <Route path="/checkout" component={CustomerCheckout} />
      <Route path="/orders" component={CustomerOrders} />
      <Route path="/orders/:id" component={OrderDetails} />
      <Route path="/login" component={CustomerLogin} />
      <Route path="/register" component={CustomerRegister} />
      <Route path="/forgot-password" component={CustomerForgotPassword} />

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
