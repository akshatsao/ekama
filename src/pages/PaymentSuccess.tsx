import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLocation, Link } from "react-router-dom";

const PaymentSuccess = () => {
  const location = useLocation();
  const state = location.state as { orderId?: string; paymentId?: string } | null;
  const orderId = state?.orderId;
  const paymentId = state?.paymentId;

  return (
    <div className="min-h-screen flex flex-col bg-[#f9f4e5]">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-orange-900 mb-4">Thank you for your purchase! 🙏</h1>
        <p className="text-lg mb-6">Your payment was successful.</p>
        {orderId && (
          <div className="bg-white inline-block px-6 py-4 rounded-xl shadow">
            <p className="font-semibold">Order ID: {orderId}</p>
            {paymentId && <p className="text-sm text-muted-foreground">Payment ID: {paymentId}</p>}
          </div>
        )}
        <div className="mt-8">
          <Link to="/" className="text-orange-700 underline font-medium">Continue Shopping</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentSuccess;
