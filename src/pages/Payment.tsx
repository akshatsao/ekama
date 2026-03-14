import Header from "@/components/Header";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import { AlertCircle, ChevronLeft, MapPin, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

type RazorpayHandlerResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature?: string;
};

type RazorpayOptions = {
  key: string;
  amount: string;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayHandlerResponse) => void | Promise<void>;
  modal?: {
    ondismiss: () => void;
  };
  theme?: {
    color: string;
  };
};

type RazorpayConstructor = new (options: RazorpayOptions) => {
  open: () => void;
};

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

type Address = {
  id: string;
  label: string;
  name: string;
  phone: string;
  addressLine: string;
  locality?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
};

const Payment = () => {
  const { items, totalItems, clearCart } = useCart();
  const { user, token } = useAuth();
  const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const { toast } = useToast();
  const navigate = useNavigate();

  // Address state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [addressLoading, setAddressLoading] = useState(true);

  // If cart is empty, redirect back to cart page
  useEffect(() => {
    if (totalItems === 0) {
      navigate("/cart");
    }
  }, [totalItems, navigate]);

  // Fetch user addresses
  useEffect(() => {
    if (!user || !token) {
      setAddressLoading(false);
      return;
    }
    const fetchAddresses = async () => {
      setAddressLoading(true);
      try {
        const res = await apiFetch('/api/users/addresses', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const fetched: Address[] = res?.data?.addresses || [];
        setAddresses(fetched);
        if (fetched.length > 0) {
          setSelectedAddressId(fetched[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch addresses:', err);
      } finally {
        setAddressLoading(false);
      }
    };
    fetchAddresses();
  }, [user, token]);

  const loadScript = (src: string) => {
    return new Promise<boolean>((resolve) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const selectedAddress = addresses.find(a => a.id === selectedAddressId);

  const formatAddress = (addr: Address) =>
    [addr.addressLine, addr.locality, addr.city, addr.state, addr.pincode]
      .filter(Boolean)
      .join(', ');

  const handlePay = async () => {
    if (loading) return;

    // Guard: must have an address selected
    if (addresses.length === 0) {
      toast({
        title: "Delivery address required",
        description: "Please add a delivery address in your profile before placing an order.",
        variant: "destructive"
      });
      return;
    }

    if (!selectedAddressId) {
      toast({
        title: "Select a delivery address",
        description: "Please select one of your saved addresses to continue.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Check if user is authenticated
      if (!user) {
        toast({ title: "Authentication required", description: "Please login to complete your purchase" });
        navigate("/login");
        return;
      }

      const shippingAddress = selectedAddress ? formatAddress(selectedAddress) : '';
      const shippingDetails = selectedAddress
        ? {
          name: selectedAddress.name,
          phone: selectedAddress.phone,
          addressLine: selectedAddress.addressLine,
          locality: selectedAddress.locality,
          city: selectedAddress.city,
          state: selectedAddress.state,
          pincode: selectedAddress.pincode
        }
        : null;

      // 1. Create order with items in database
      const orderResponse = await apiFetch("/api/payments/create-order-with-items", {
        method: "POST",
        body: JSON.stringify({
          items: items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            adminProductId: item.adminProductId,
            image: item.image
          })),
          totalAmount: subtotal,
          userId: user.id,
          customerEmail: user.email,
          customerName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          paymentMethod: paymentMethod,
          shippingAddress,
          shippingDetails
        }),
      }) as { orderId: string; status: string };

      if (paymentMethod === 'cod') {
        // Cash on delivery scenario - just complete the order
        await apiFetch("/api/payments/update-order-status", {
          method: "POST",
          body: JSON.stringify({
            orderId: orderResponse.orderId,
            status: 'Processing',
            paymentStatus: 'pending'
          }),
        });

        toast({ title: "Order placed successfully", description: "You have chosen Pay on Delivery." });
        clearCart();
        navigate("/payment-success", { state: { orderId: orderResponse.orderId, paymentId: 'COD' } });
        return;
      }

      // 2. Create Razorpay order (Online payment only)
      const currency = "INR";
      const { orderId, amount } = await apiFetch("/api/payments/create-order", {
        method: "POST",
        body: JSON.stringify({ amount: subtotal, currency }),
      }) as { orderId: string; amount: number; currency: string };

      // 3. Ensure Razorpay script is loaded
      if (!window.Razorpay) {
        const ok = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
        if (!ok) {
          toast({ title: "Payment failed", description: "Unable to load Razorpay SDK" });
          return;
        }
      }

      const options: RazorpayOptions = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: amount.toString(),
        currency,
        name: "Ekama",
        description: "Order Payment",
        order_id: orderId,
        handler: async function (response: RazorpayHandlerResponse) {
          try {
            const verifyRes = await apiFetch("/api/payments/verify", {
              method: "POST",
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            if (!verifyRes || verifyRes.status !== "ok") {
              throw new Error("Signature verification failed");
            }

            await apiFetch("/api/payments/update-order-status", {
              method: "POST",
              body: JSON.stringify({
                orderId: orderResponse.orderId,
                status: 'completed',
                paymentStatus: 'paid',
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id
              }),
            });

            toast({ title: "Payment successful" });
            clearCart();
            navigate("/payment-success", { state: { orderId: response.razorpay_order_id, paymentId: response.razorpay_payment_id } });
          } catch (error) {
            console.error('Payment verification failed:', error);
            toast({ title: "Payment failed", description: "Verification failed. Please contact support." });
          }
        },
        modal: {
          ondismiss: function () {
            toast({ title: "Payment cancelled" });
          },
        },
        theme: { color: "#ff6600" },
      };

      const RazorpayCtor = window.Razorpay;
      if (!RazorpayCtor) {
        toast({ title: "Payment failed", description: "Unable to load Razorpay SDK" });
        return;
      }
      const rzpay = new RazorpayCtor(options);
      rzpay.open();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast({ title: "Payment error", description: message });
    } finally {
      setLoading(false);
    }
  };

  const hasNoAddress = !addressLoading && addresses.length === 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f3f6]">
      <Header />
      <main className="flex-1 max-w-[1100px] mx-auto w-full px-4 py-8 md:py-12">
        <button
          onClick={() => navigate("/cart")}
          className="flex items-center justify-center h-10 w-10 bg-white rounded-full text-slate-600 hover:text-orange-600 hover:bg-orange-50 mb-6 shadow-sm border border-slate-100 transition-all"
        >
          <ChevronLeft className="h-6 w-6 pr-0.5" />
        </button>

        <h1 className="text-2xl font-bold mb-8 text-slate-900">Payment</h1>
        <div className="bg-white p-8 rounded-xl shadow-md space-y-6">
          <h2 className="text-xl font-semibold text-center text-orange-900">Order Summary</h2>
          <ul className="divide-y">
            {items.map((it) => (
              <li key={it.id} className="py-2 flex justify-between text-sm">
                <span>
                  {it.name} <span className="text-muted-foreground">× {it.quantity}</span>
                </span>
                <span>₹ {it.price * it.quantity}</span>
              </li>
            ))}
          </ul>

          {/* Delivery Address Section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-orange-900 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Delivery Address
              </h3>
              <Link
                to="/profile"
                className="flex items-center gap-1 text-xs text-orange-700 hover:text-orange-900 font-medium underline"
              >
                <Plus className="h-3 w-3" />
                {addresses.length === 0 ? 'Add Address' : 'Manage Addresses'}
              </Link>
            </div>

            {addressLoading ? (
              <p className="text-sm text-slate-400">Loading your addresses...</p>
            ) : hasNoAddress ? (
              <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-700">No delivery address found</p>
                  <p className="text-sm text-red-600 mt-0.5">
                    You must add a delivery address before placing an order.{' '}
                    <Link to="/profile" className="underline font-semibold">
                      Go to Profile → Add Address
                    </Link>
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`flex items-start gap-3 cursor-pointer rounded-lg border p-3 transition-colors ${selectedAddressId === addr.id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    <input
                      type="radio"
                      name="deliveryAddress"
                      value={addr.id}
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="mt-1 text-orange-600 focus:ring-orange-500"
                    />
                    <div className="text-sm">
                      <p className="font-semibold text-slate-800">
                        {addr.name}{' '}
                        <span className="ml-1 text-xs font-medium text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded">
                          {addr.label}
                        </span>
                      </p>
                      <p className="text-slate-600 mt-0.5">{formatAddress(addr)}</p>
                      <p className="text-slate-500 mt-0.5">{addr.phone}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="py-4 border-t border-b">
            <h3 className="font-semibold text-orange-900 mb-3">Payment Method</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-orange-50 transition-colors">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="razorpay"
                  checked={paymentMethod === 'razorpay'}
                  onChange={() => setPaymentMethod('razorpay')}
                  className="text-orange-600 focus:ring-orange-500"
                />
                <span className="font-medium text-slate-700">Pay Online (Card, UPI, NetBanking)</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-orange-50 transition-colors">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="text-orange-600 focus:ring-orange-500"
                />
                <span className="font-medium text-slate-700">Pay on Delivery (COD)</span>
              </label>
            </div>
          </div>

          <div className="flex justify-between font-bold border-t pt-4">
            <span>Total</span>
            <span>₹ {subtotal}</span>
          </div>

          {hasNoAddress && (
            <p className="text-center text-sm text-red-600 font-medium">
              ⚠️ Add a delivery address to enable payment
            </p>
          )}

          <button
            onClick={handlePay}
            className="w-full bg-orange-700 hover:bg-orange-800 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || subtotal === 0 || hasNoAddress || !selectedAddressId}
          >
            {loading ? "Processing..." : "Pay Now"}
          </button>
        </div>
      </main>
    </div>
  );
};

export default Payment;
