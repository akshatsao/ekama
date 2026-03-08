import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { CartProvider } from "@/hooks/use-cart";
import { WishlistProvider } from "@/hooks/use-wishlist";
import BottomNav from "./components/BottomNav";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Admin from "./pages/admin/Admin";
import AdminLogin from "./pages/admin/AdminLogin";
import Cart from "./pages/Cart";
import CollectionPage from "./pages/collections/CollectionPage";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Orders from "./pages/Orders";
import Payment from "./pages/Payment";
import PaymentSuccess from "./pages/PaymentSuccess";
import Profile from "./pages/Profile";
import ProductDetails from "./pages/ProductDetails";
import Signup from "./pages/Signup";
import ProfileInfo from "./pages/ProfileInfo";
import ManageAddresses from "./pages/ManageAddresses";
import MyWishlist from "./pages/MyWishlist";

const queryClient = new QueryClient();

const AdminRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated && user?.role === "admin") return children;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <Navigate to="/admin" replace />;
};

const CustomerRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated && user?.role === "admin") return <Navigate to="/admin" replace />;
  return children;
};

const App = () => (
  <AuthProvider>
    <WishlistProvider>
      <CartProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <div className="w-full min-h-screen bg-[#f1f3f6] relative overflow-x-hidden flex flex-col pb-16">
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<CustomerRoute><Index /></CustomerRoute>} />
                  <Route path="/admin" element={<AdminLogin />} />
                  <Route path="/admin/dashboard" element={<AdminRoute><Admin /></AdminRoute>} />
                  <Route path="/admin/categories/:id" element={<AdminRoute><Admin /></AdminRoute>} />
                  <Route path="/admin-login" element={<Admin />} />
                  <Route path="/cart" element={<CustomerRoute><Cart /></CustomerRoute>} />
                  <Route path="/login" element={<CustomerRoute><Login /></CustomerRoute>} />
                  <Route path="/signup" element={<CustomerRoute><Signup /></CustomerRoute>} />
                  <Route path="/payment" element={<CustomerRoute><Payment /></CustomerRoute>} />
                  <Route path="/orders" element={<CustomerRoute><Orders /></CustomerRoute>} />
                  <Route path="/collections/all" element={<CustomerRoute><CollectionPage /></CustomerRoute>} />
                  <Route path="/collections/:id" element={<CustomerRoute><CollectionPage /></CustomerRoute>} />
                  <Route path="/trending" element={<CustomerRoute><CollectionPage /></CustomerRoute>} />
                  <Route path="/new-arrivals" element={<CustomerRoute><CollectionPage /></CustomerRoute>} />
                  <Route path="/products/rudraksha-bracelet" element={<CustomerRoute><ProductDetails /></CustomerRoute>} />
                  <Route path="/products/:id" element={<CustomerRoute><ProductDetails /></CustomerRoute>} />
                  <Route path="/profile" element={<CustomerRoute><Profile /></CustomerRoute>} />
                  <Route path="/profile/info" element={<CustomerRoute><ProfileInfo /></CustomerRoute>} />
                  <Route path="/profile/addresses" element={<CustomerRoute><ManageAddresses /></CustomerRoute>} />
                  <Route path="/profile/wishlist" element={<CustomerRoute><MyWishlist /></CustomerRoute>} />
                  <Route path="/profile/orders" element={<CustomerRoute><Orders /></CustomerRoute>} />
                  <Route path="/payment-success" element={<CustomerRoute><PaymentSuccess /></CustomerRoute>} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                </Routes>
                <BottomNav />
              </BrowserRouter>
            </div>
          </TooltipProvider>
        </QueryClientProvider>
      </CartProvider>
    </WishlistProvider>
  </AuthProvider>
);

export default App;
