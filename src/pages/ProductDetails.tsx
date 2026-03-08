import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { apiFetch, BASE_URL } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Heart, Star, ChevronLeft, ChevronRight, Check, ChevronDown, ShieldCheck, Truck, RotateCcw, ShoppingCart, Percent, Sparkles, Tag, FileText } from "lucide-react";
import { useWishlist } from "@/hooks/use-wishlist";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";


type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  reviewCount?: number;
  images: string[];
  specifications?: Record<string, string>;
  tags?: string[];
  collection?: string;
  siddhAvailable?: boolean;
};

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [isEnergized, setIsEnergized] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
  const [qty, setQty] = useState<number>(1);
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addItem } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const productId = id || "rudraksha-bracelet-sample-1";
        const res = await apiFetch(`/api/products/${productId}`) as { data: Product };
        if (!active) return;
        const raw = res.data;
        const images = Array.isArray(raw.images)
          ? raw.images.map((image) => {
            if (!image) return "";
            if (image.startsWith("data:") || image.startsWith("http")) return image;
            if (image.startsWith("/uploads")) return `${BASE_URL}${image}`;
            return image;
          })
          : [];
        setProduct({ ...raw, images: images.filter(Boolean) });
      } catch (e) {
        if (!active) return;
        const message = e instanceof Error ? e.message : "Failed to load product";
        setError(message);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchProduct();
    return () => {
      active = false;
    };
  }, [id]);

  const mainImage = useMemo(() => {
    const imgs = product?.images || [];
    return imgs[selectedImageIdx] || imgs[0] || "/placeholder.svg";
  }, [product, selectedImageIdx]);

  const images = useMemo(() => product?.images || [], [product]);

  const handlePrevImage = () => {
    if (images.length <= 1) return;
    setSelectedImageIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    if (images.length <= 1) return;
    setSelectedImageIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const currentPrice = product?.price || 0;
  const oldPrice = product?.originalPrice || currentPrice;
  const energizedPrice = isEnergized ? 49 : 0;
  const finalPrice = currentPrice + energizedPrice;
  const finalOldPrice = oldPrice + energizedPrice;
  const discountPercent = oldPrice > currentPrice ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100) : 0;

  const handleAddToCart = () => {
    if (!product) return;
    setAdding(true);
    addItem({
      id: product.id,
      name: `${product.name}${isEnergized ? " (Energized)" : ""}`,
      price: finalPrice,
      image: images[0],
    });
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });
    setTimeout(() => setAdding(false), 500);
  };

  const toggleAccordion = (id: string) => {
    setActiveAccordion(prev => prev === id ? null : id);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate("/cart");
  };

  if (loading) {
    return <div className="container mx-auto py-10">Loading bracelet…</div>;
  }

  if (error || !product) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold">Rudraksha Bracelet</h1>
        <p className="mt-2 text-muted-foreground">{error || "Product not found"}</p>
        <div className="mt-6">
          <Link to="/collections/rudraksha-bracelets" className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90">
            Explore Collection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center h-10 w-10 bg-white rounded-full text-slate-600 hover:text-orange-600 hover:bg-orange-50 mb-6 shadow-sm border border-slate-100 transition-all"
        >
          <ChevronLeft className="h-6 w-6 pr-0.5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column: Image Gallery */}
          <div className="flex flex-col-reverse md:flex-row gap-4">
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto md:w-20 md:max-h-[600px] pb-2 md:pb-0 snap-x hide-scrollbar">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`relative min-w-[64px] w-16 h-16 md:w-full md:h-20 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 snap-start ${idx === selectedImageIdx ? "border-indigo-600 ring-2 ring-indigo-600/20" : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Main Image */}
            <div className="relative flex-1 aspect-[4/5] bg-white rounded-2xl overflow-hidden shadow-sm group">
              <img
                src={mainImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-slate-800 hover:bg-white transition-transform active:scale-95 opacity-0 group-hover:opacity-100 disabled:opacity-0"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-slate-800 hover:bg-white transition-transform active:scale-95 opacity-0 group-hover:opacity-100 disabled:opacity-0"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right Column: Product Details */}
          <div className="flex flex-col">
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 leading-tight mb-2">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center text-yellow-500">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`w-4 h-4 ${(product.rating || 4.8) >= s ? "_fill-current_" : "text-slate-300"}`} fill="currentColor" />
                ))}
              </div>
              <span className="text-sm font-medium text-slate-600">
                {product.rating || 4.8} ({product.reviewCount || 257} reviews)
              </span>
            </div>

            <div className="flex items-end gap-3 mb-5">
              <div className="text-2xl font-bold text-slate-900">₹ {finalPrice.toFixed(2)}</div>
              {finalOldPrice > finalPrice && (
                <div className="text-base text-slate-400 line-through mb-1">₹ {finalOldPrice.toFixed(2)}</div>
              )}
              {discountPercent > 0 && (
                <div className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded mb-1.5 ml-1">
                  {discountPercent}% OFF
                </div>
              )}
            </div>

            {/* Exclusive Offers */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-rose-600 rounded-full p-1 shadow-sm">
                  <Percent className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm tracking-wide">EXCLUSIVE OFFERS</h3>
              </div>

              <div className="flex overflow-x-auto gap-3 pb-2 snap-x hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                {/* Offer 1 */}
                <div className="min-w-[200px] flex-shrink-0 snap-center rounded-xl border border-dashed border-slate-300 bg-white p-3.5 shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-slate-700" />
                      <span className="font-bold text-sm text-slate-800">Free Rudraksha</span>
                    </div>
                    <p className="text-[13px] text-slate-600 leading-relaxed min-h-[40px]">
                      Complimentary 5 Mukhi certified Rudraksha
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-700 tracking-wide">NAMASTE</span>
                    <button onClick={() => { navigator.clipboard.writeText('NAMASTE'); toast({ title: 'Code copied!' }); }} className="text-xs font-medium text-slate-600 hover:text-indigo-600 cursor-pointer">Copy</button>
                  </div>
                </div>

                {/* Offer 2 */}
                <div className="min-w-[200px] flex-shrink-0 snap-center rounded-xl border border-dashed border-slate-300 bg-white p-3.5 shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <ShoppingCart className="w-4 h-4 text-slate-700" />
                      <span className="font-bold text-sm text-slate-800">Buy 2 Get 1 Free</span>
                    </div>
                    <p className="text-[13px] text-slate-600 leading-relaxed min-h-[40px]">
                      Add 3 items to cart.<br />Min value item is free
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-700 tracking-wide uppercase">Auto applied</span>
                  </div>
                </div>

                {/* Offer 3 */}
                <div className="min-w-[200px] flex-shrink-0 snap-center rounded-xl border border-dashed border-slate-300 bg-white p-3.5 shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="w-4 h-4 text-slate-700" />
                      <span className="font-bold text-sm text-slate-800">Get ₹100 Off</span>
                    </div>
                    <p className="text-[13px] text-slate-600 leading-relaxed min-h-[40px]">
                      On minimum cart value of ₹999
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-700 tracking-wide">NAMASTE100</span>
                    <button onClick={() => { navigator.clipboard.writeText('NAMASTE100'); toast({ title: 'Code copied!' }); }} className="text-xs font-medium text-slate-600 hover:text-indigo-600 cursor-pointer">Copy</button>
                  </div>
                </div>

                {/* Offer 4 */}
                <div className="min-w-[200px] flex-shrink-0 snap-center rounded-xl border border-dashed border-slate-300 bg-white p-3.5 shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-slate-700" />
                      <span className="font-bold text-sm text-slate-800">Prepaid Offer</span>
                    </div>
                    <p className="text-[13px] text-slate-600 leading-relaxed min-h-[40px]">
                      ₹20 off when you pay with UPI/Cards
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-700 tracking-wide uppercase">Auto applied</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Upsell Checkbox */}
            {product.siddhAvailable && (
              <div className="mb-5 bg-amber-50/50 border border-amber-200/50 rounded-lg p-3 cursor-pointer hover:bg-amber-50 transition-colors" onClick={() => setIsEnergized(!isEnergized)}>
                <div className="flex items-start gap-2.5">
                  <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border transition-colors ${isEnergized ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'}`}>
                    {isEnergized && <Check className="w-3 h-3" />}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Get Siddh/Energized Product (+ ₹ 49.00)</div>
                    <div className="text-[11px] text-slate-600 mt-0.5">Receive a mantra-infused product for maximum spiritual benefit.</div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3 mb-8">
              <div className="flex gap-3 h-12">
                <div className="flex-1 flex items-center justify-between border-2 border-slate-200 rounded-lg px-4 bg-white">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="text-slate-500 hover:text-indigo-600 text-base font-medium">−</button>
                  <span className="font-semibold text-slate-900">{qty}</span>
                  <button onClick={() => setQty(qty + 1)} className="text-slate-500 hover:text-indigo-600 text-base font-medium">+</button>
                </div>
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className="w-12 h-12 flex items-center justify-center rounded-lg border-2 border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                >
                  <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? "fill-rose-500 text-rose-500" : ""}`} />
                </button>
              </div>

              <button
                onClick={handleBuyNow}
                className="w-full h-12 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold text-base shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all active:scale-[0.98]"
              >
                ORDER NOW
              </button>
            </div>

            {/* Delivery Features */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-200">
              <div className="flex flex-col items-center text-center gap-1.5">
                <Truck className="w-5 h-5 text-slate-400" />
                <span className="text-[10px] font-medium text-slate-600 uppercase tracking-wide">Free Delivery</span>
              </div>
              <div className="flex flex-col items-center text-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-slate-400" />
                <span className="text-[10px] font-medium text-slate-600 uppercase tracking-wide">Secure Payment</span>
              </div>
              <div className="flex flex-col items-center text-center gap-1.5">
                <RotateCcw className="w-5 h-5 text-slate-400" />
                <span className="text-[10px] font-medium text-slate-600 uppercase tracking-wide">Easy Returns</span>
              </div>
            </div>

          </div>
        </div>

        {/* Below Fold: Product Info & Accordions */}
        <div className="mt-12 max-w-3xl mx-auto space-y-8 mb-24">

          {/* Why Japam / Description */}
          <div className="prose prose-slate max-w-none">
            <h2 className="text-xl font-bold text-slate-900 mb-4 uppercase">Why Choose {product.collection ? product.collection.replace('-', ' ') : 'Our Beads'}:</h2>
            <div className="text-[13px] text-slate-600 leading-relaxed mb-6 whitespace-pre-line">
              {product.description || "Crafted with authentic beads carefully selected for their energetic properties. Our products undergo rigorous quality checks to ensure durability and excellence, highlighted by a natural luster and earthy tones."}
            </div>
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 list-none p-0">
                {Object.entries(product.specifications).map(([k, v]) => (
                  <li key={k} className="flex gap-2 text-[13px] text-slate-600">
                    <span className="font-semibold text-slate-900 capitalize min-w-[120px]">{k}:</span>
                    <span>{v}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Accordions */}
          <div className="border-t border-slate-200 divide-y divide-slate-200">
            <div className="py-3">
              <button onClick={() => toggleAccordion('wear')} className="flex items-center justify-between w-full text-left font-semibold text-slate-900 text-sm focus:outline-none">
                <span className="flex items-center gap-2">
                  <div className="w-6 flex justify-center"><Check className="w-4 h-4 text-indigo-600" /></div>
                  How To Wear & Recharge
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${activeAccordion === 'wear' ? 'rotate-180' : ''}`} />
              </button>
              {activeAccordion === 'wear' && (
                <div className="mt-3 pl-8 pr-4 text-[13px] text-slate-600 leading-relaxed">
                  To preserve its natural beauty, keep your bracelet away from water, soaps, lotions, perfumes, and harsh chemicals. Wear it as the finishing touch of your outfit and store it separately in a dry, moisture-free zip-lock bag to maintain its shine and energy.
                </div>
              )}
            </div>

            <div className="py-3">
              <button onClick={() => toggleAccordion('questions')} className="flex items-center justify-between w-full text-left font-semibold text-slate-900 text-sm focus:outline-none">
                <span className="flex items-center gap-2">
                  <div className="w-6 flex justify-center"><Check className="w-4 h-4 text-indigo-600" /></div>
                  Got Questions?
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${activeAccordion === 'questions' ? 'rotate-180' : ''}`} />
              </button>
              {activeAccordion === 'questions' && (
                <div className="mt-3 pl-8 pr-4 text-[13px] text-slate-600 leading-relaxed">
                  Our customer support team is available Monday to Saturday to answer any questions you may have regarding our products or your order.
                </div>
              )}
            </div>

            <div className="py-3">
              <button onClick={() => toggleAccordion('shipping')} className="flex items-center justify-between w-full text-left font-semibold text-slate-900 text-sm focus:outline-none">
                <span className="flex items-center gap-2">
                  <div className="w-6 flex justify-center"><Truck className="w-4 h-4 text-indigo-600" /></div>
                  Delivery and Shipping
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${activeAccordion === 'shipping' ? 'rotate-180' : ''}`} />
              </button>
              {activeAccordion === 'shipping' && (
                <div className="mt-3 pl-8 pr-4 text-[13px] text-slate-600 leading-relaxed">
                  We usually process and dispatch orders within 24-48 hours. Standard delivery takes 3-7 business days depending on your location.
                </div>
              )}
            </div>

            <div className="py-3">
              <button onClick={() => toggleAccordion('returns')} className="flex items-center justify-between w-full text-left font-semibold text-slate-900 text-sm focus:outline-none">
                <span className="flex items-center gap-2">
                  <div className="w-6 flex justify-center"><RotateCcw className="w-4 h-4 text-indigo-600" /></div>
                  Returns & Replacement
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${activeAccordion === 'returns' ? 'rotate-180' : ''}`} />
              </button>
              {activeAccordion === 'returns' && (
                <div className="mt-3 pl-8 pr-4 text-[13px] text-slate-600 leading-relaxed">
                  We offer a 7-day hassle-free return and replacement policy for defective or damaged items. Please contact our support team within 7 days of delivery.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Sticky Bottom Bar (Mobile/Desktop) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] transform transition-transform duration-300">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="hidden sm:flex items-center gap-3 flex-1">
            <img src={mainImage} className="w-10 h-10 rounded object-cover border" alt="Thumbnail" />
            <div>
              <div className="font-semibold text-[13px] text-slate-900 truncate max-w-[200px] lg:max-w-xs">{product.name}</div>
              <div className="text-[11px] text-indigo-600 font-medium">Namaste Offer: Authentic Quality Guaranteed</div>
            </div>
          </div>
          <div className="flex flex-col sm:items-end justify-center flex-1 sm:flex-none">
            <div className="text-base font-bold text-slate-900">₹ {finalPrice.toFixed(2)}</div>
            {finalOldPrice > finalPrice && (
              <div className="text-[11px] text-slate-500 line-through">₹ {finalOldPrice.toFixed(2)}</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center border border-slate-200 rounded-md bg-slate-50 mr-2">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-7 h-9 flex justify-center items-center text-slate-500 hover:text-indigo-600 font-medium">−</button>
              <div className="w-7 h-9 flex justify-center items-center font-medium text-slate-900 text-[13px]">{qty}</div>
              <button onClick={() => setQty(qty + 1)} className="w-7 h-9 flex justify-center items-center text-slate-500 hover:text-indigo-600 font-medium">+</button>
            </div>
            <button
              onClick={handleBuyNow}
              className="h-10 px-5 lg:px-8 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold text-sm whitespace-nowrap shadow-sm shadow-orange-500/20 active:scale-95 transition-transform"
            >
              ORDER NOW
            </button>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default ProductDetails;
