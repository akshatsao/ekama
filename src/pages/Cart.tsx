import Header from "@/components/Header";
import { useCart } from "@/hooks/use-cart";
import { ShoppingCart, ChevronLeft, Ticket } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { apiFetch } from "@/lib/api";

const Cart = () => {
  const { items, addItem, decrementItem, removeItem, totalItems, clearCart } = useCart();
  const navigate = useNavigate();
  const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

  // Simple local state for UI demonstration
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isApplying, setIsApplying] = useState(false);

  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    try {
      setIsApplying(true);
      setCouponError(null);

      const response = await apiFetch('/api/customer/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({ code, cartTotal: subtotal }),
      });

      let calculatedDiscount = 0;
      if (response.discountType === 'percentage') {
        calculatedDiscount = Math.round(subtotal * (response.discountValue / 100));
      } else {
        calculatedDiscount = response.discountValue;
      }

      setDiscountAmount(calculatedDiscount);
      setAppliedCoupon(code);
      setCouponCode("");
    } catch (error: any) {
      setCouponError(error.message || "Invalid coupon code.");
      setAppliedCoupon(null);
      setDiscountAmount(0);
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponError(null);
  };

  const finalTotal = Math.max(0, subtotal - discountAmount);

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f3f6]">
      <Header />
      <main className="flex-1 w-full max-w-[1100px] mx-auto px-2 md:px-4 py-6 md:py-10">
        <button
          onClick={() => navigate("/")}
          className="flex items-center justify-center h-10 w-10 bg-white rounded-full text-slate-600 hover:text-orange-600 hover:bg-orange-50 mb-6 shadow-sm border border-slate-100 transition-all"
        >
          <ChevronLeft className="h-6 w-6 pr-0.5" />
        </button>

        <h1 className="text-xl md:text-2xl font-bold mb-6 text-slate-900 px-2">Your Cart ({totalItems} items)</h1>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm mx-2">
            <div className="mb-4 flex justify-center text-slate-300">
              <ShoppingCart className="h-16 w-16" />
            </div>
            <p className="mb-6 text-lg text-slate-600">Your cart is empty.</p>
            <Link
              to="/"
              className="inline-flex items-center justify-center bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6 relative">
            {/* items list */}
            <div className="lg:col-span-2 space-y-3 px-2">
              {items.map((it) => (
                <div key={it.id} className="flex items-center gap-3 md:gap-6 bg-white rounded-xl p-3 md:p-4 shadow-sm border border-slate-100 hover:border-orange-200 transition-all duration-300">
                  <div className="h-20 w-20 md:h-24 md:w-24 bg-slate-50 rounded-lg overflow-hidden flex-shrink-0 border border-slate-50">
                    <img src={it.image || "/placeholder.svg"} alt={it.name} className="h-full w-full object-contain" />
                  </div>
                  <div className="flex-1 flex flex-col min-w-0">
                    <h2 className="text-sm md:text-base font-semibold text-slate-900 line-clamp-1 mb-1">{it.name}</h2>
                    <p className="text-xs md:text-sm font-bold text-orange-700">₹ {it.price}/-</p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                        <button
                          onClick={() => decrementItem(it.id)}
                          className="px-2 md:px-3 py-1 hover:bg-slate-100 text-slate-600 transition-colors font-bold"
                        >
                          -
                        </button>
                        <span className="px-3 text-sm font-semibold text-slate-800 bg-white min-w-[32px] text-center">{it.quantity}</span>
                        <button
                          onClick={() => addItem(it)}
                          className="px-2 md:px-3 py-1 hover:bg-slate-100 text-slate-600 transition-colors font-bold"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(it.id)}
                        className="text-[10px] md:text-xs text-red-500 font-medium hover:text-red-700 underline transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="pt-2 text-right">
                <button onClick={clearCart} className="text-red-500 hover:text-red-700 text-xs font-medium underline transition-colors">Clear Entire Cart</button>
              </div>
            </div>

            {/* summary */}
            <div className="px-2">
              <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 h-fit sticky top-28">
                <h2 className="text-lg font-bold mb-4 text-slate-900 border-b pb-2">Order Summary</h2>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-slate-600">
                    <span className="text-sm">Price ({totalItems} items)</span>
                    <span className="text-sm font-semibold">₹ {subtotal}/-</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span className="text-sm">Discount ({appliedCoupon})</span>
                      <span className="text-sm font-semibold">- ₹ {discountAmount}/-</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span className="text-sm">Delivery Charges</span>
                    <span className="text-sm font-semibold text-emerald-600">FREE</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-slate-900 font-bold">
                    <span>Total Amount</span>
                    <span className="text-lg">₹ {finalTotal}/-</span>
                  </div>
                </div>

                {/* Coupon Block */}
                <div className="mb-6 pt-5 border-t border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-orange-600" /> Apply Coupon
                  </h3>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                      <div>
                        <div className="text-xs font-bold text-emerald-700 tracking-wide">{appliedCoupon}</div>
                        <div className="text-[11px] text-emerald-600 mt-0.5">Coupon applied successfully!</div>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-xs font-semibold text-rose-500 hover:text-rose-700 underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => {
                            setCouponCode(e.target.value);
                            setCouponError(null);
                          }}
                          placeholder="ENTER CODE (TRY NAMASTE)"
                          className={`flex-1 border rounded-[10px] px-3.5 py-2.5 text-[13px] font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all uppercase ${couponError ? 'border-rose-300' : 'border-slate-200'}`}
                          onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={!couponCode.trim() || isApplying}
                          className="bg-slate-500 text-white px-6 py-2.5 rounded-[10px] text-sm font-bold hover:bg-slate-600 disabled:opacity-50 transition-colors tracking-wide"
                        >
                          {isApplying ? 'Applying...' : 'Apply'}
                        </button>
                      </div>
                      {couponError && <div className="text-xs text-rose-500 mt-0.5 ml-1">{couponError}</div>}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => navigate('/payment')}
                  className="w-full bg-[#E84C22] hover:bg-[#D53B12] text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg transform active:scale-95 text-[15px]"
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Cart;
