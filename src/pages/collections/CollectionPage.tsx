import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useCart } from "@/hooks/use-cart";
import { apiFetch, BASE_URL } from "@/lib/api";
import { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  images: string[];
}

const normalizeImage = (image?: string) => {
  if (!image) return "";
  if (image.startsWith("data:") || image.startsWith("http")) return image;
  if (image.startsWith("/uploads")) return `${BASE_URL}${image}`;
  return image;
};

const CollectionPage = () => {
  const params = useParams();
  const { pathname } = useLocation();

  // Determine if we are in a virtual category based on path
  const isTrending = pathname.includes("/trending");
  const isNewArrivals = pathname.includes("/new-arrivals");

  const collectionId = params.id || (isTrending ? "trending" : isNewArrivals ? "new-arrivals" : "rudraksha-bracelets");
  const { addItem, decrementItem, items } = useCart();
  const [heroIdx, setHeroIdx] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("Sacred Collection");

  useEffect(() => {
    if (!hovering) {
      setHeroIdx(0);
      return;
    }
    const t = setInterval(() => {
      setHeroIdx((prev) => (prev + 1) % 3);
    }, 1500);
    return () => clearInterval(t);
  }, [hovering]);

  useEffect(() => {
    let active = true;
    const fetchProducts = async () => {
      try {
        setLoading(true);
        let fetched: Product[] = [];

        if (isTrending) {
          setTitle("Trending Now");
          // Fetch settings to get trending product IDs
          const settings = await apiFetch("/api/settings/home_page_layout") as any;
          const ids = settings?.trendingProductIds || [];
          if (ids.length > 0) {
            const res = await apiFetch(`/api/products?ids=${ids.join(",")}&limit=${ids.length}`) as { data?: Product[] };
            fetched = res.data || [];
          } else {
            // Fallback: top rated products
            const res = await apiFetch("/api/products?limit=20&sortBy=rating&sortOrder=DESC") as { data?: Product[] };
            fetched = res.data || [];
          }
        } else if (isNewArrivals) {
          setTitle("New Arrivals");
          // Fetch settings to get new arrivals product IDs
          const settings = await apiFetch("/api/settings/home_page_layout") as any;
          const ids = settings?.newArrivalsProductIds || [];
          if (ids.length > 0) {
            const res = await apiFetch(`/api/products?ids=${ids.join(",")}&limit=${ids.length}`) as { data?: Product[] };
            fetched = res.data || [];
          } else {
            // Fallback: latest products
            const res = await apiFetch("/api/products?limit=20&sortBy=createdAt&sortOrder=DESC") as { data?: Product[] };
            fetched = res.data || [];
          }
        } else if (collectionId === "all") {
          setTitle("All Products");
          const res = await apiFetch("/api/products?limit=100") as { data?: Product[] };
          fetched = res.data || [];
        } else {
          // Normal collection
          const res = await apiFetch(`/api/collections/${collectionId}/products?limit=50`) as { data?: Product[] };
          fetched = res.data || [];
          // Try to capitalize collectionId for title
          setTitle(collectionId.split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" "));
        }

        if (!active) return;
        const mapped = fetched.map((item) => ({
          ...item,
          images: Array.isArray(item.images) ? item.images.map(normalizeImage) : [],
        }));
        setProducts(mapped);
        setError(mapped.length ? null : "No products found.");
      } catch (e) {
        if (!active) return;
        console.error(e);
        setProducts([]);
        setError("Failed to load products.");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchProducts();
    return () => {
      active = false;
    };
  }, [collectionId, isTrending, isNewArrivals]);

  const handleMouseEnter = () => setHovering(true);
  const handleMouseLeave = () => setHovering(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f3f6]">
      <Header />

      {/* Filters & Controls - Minimal Style */}
      <section className="w-full bg-white/0 pt-4 pb-2 md:pt-8">
        <div className="max-w-[1100px] mx-auto px-4">
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 mb-4">{title}</h1>
          <div className="flex items-center justify-between text-[10px] md:text-sm text-slate-500 mb-4 bg-white p-2 rounded-lg shadow-sm border border-slate-100 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <select className="bg-transparent border-none outline-none font-medium text-slate-700 cursor-pointer">
                <option>Availability</option>
                <option>In stock</option>
                <option>Out of stock</option>
              </select>
              <div className="h-4 w-px bg-slate-200"></div>
              <select className="bg-transparent border-none outline-none font-medium text-slate-700 cursor-pointer">
                <option>Price</option>
                <option>Low to High</option>
                <option>High to Low</option>
              </select>
              <div className="h-4 w-px bg-slate-200"></div>
              <select className="bg-transparent border-none outline-none font-medium text-slate-700 cursor-pointer">
                <option>Best Selling</option>
                <option>Newest</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <main className="flex-1 max-w-[1100px] mx-auto px-2 md:px-4 pb-16 w-full">
        {loading && <div className="py-20 text-center text-slate-500 font-medium">Loading sacred items…</div>}
        {error && !loading && (
          <div className="py-20 text-center text-red-600 bg-white rounded-2xl shadow-sm mx-2">{error}</div>
        )}
        {!loading && !error && (
          <div className="grid gap-3 md:gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p, i) => (
              <Link
                to={`/products/${p.id}`}
                key={p.id}
                onMouseEnter={i === 0 ? handleMouseEnter : undefined}
                onMouseLeave={i === 0 ? handleMouseLeave : undefined}
                className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden border border-slate-100 hover:border-orange-200 flex flex-col h-auto"
              >
                {/* Product Image - Framed Style */}
                <div className="relative aspect-square bg-slate-50/50 p-2 overflow-hidden">
                  {i === 0 && p.images.length > 1 ? (
                    <img
                      src={p.images[heroIdx]}
                      alt={p.name}
                      className="w-full h-full object-cover select-none transition-opacity duration-300"
                    />
                  ) : (
                    <img
                      src={p.images[0] || "/placeholder.svg"}
                      alt={p.name}
                      className="w-full h-full object-cover select-none group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                </div>

                {/* Content */}
                <div className="p-2 md:p-3 flex flex-col flex-1">
                  <h3 className="text-[10px] md:text-sm font-semibold text-slate-800 line-clamp-2 mb-1.5 min-h-[30px] md:min-h-[40px]">
                    {p.name}
                  </h3>

                  <div className="mt-auto flex items-center justify-between pt-1">
                    <span className="text-xs md:text-base font-bold text-orange-700">
                      ₹ {p.price}/-
                    </span>
                    {(() => {
                      const cartItem = items.find((it) => it.id === p.id);
                      const qty = cartItem ? cartItem.quantity : 0;
                      if (qty === 0) {
                        return (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              addItem({ id: p.id, name: p.name, price: p.price, image: p.images[0] });
                            }}
                            className="px-3 md:px-5 py-1 bg-white border border-orange-600 text-orange-600 font-bold text-[10px] md:text-xs rounded-lg hover:bg-orange-50 transition-all duration-300"
                          >
                            ADD +
                          </button>
                        );
                      }
                      return (
                        <div className="flex items-center border border-orange-600 text-orange-600 rounded-lg overflow-hidden bg-white">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              decrementItem(p.id);
                            }}
                            className="px-2 py-0.5 md:px-3 md:py-1 hover:bg-orange-50 font-bold text-[10px] md:text-xs"
                          >
                            -
                          </button>
                          <span className="px-2 select-none font-bold text-[10px] md:text-xs bg-orange-50">{qty}</span>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              addItem({ id: p.id, name: p.name, price: p.price, image: p.images[0] });
                            }}
                            className="px-2 py-0.5 md:px-3 md:py-1 hover:bg-orange-50 font-bold text-[10px] md:text-xs"
                          >
                            +
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default CollectionPage;
