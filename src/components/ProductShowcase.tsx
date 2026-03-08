import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch, BASE_URL } from "@/lib/api";
import { ShoppingCart, Star, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useWishlist } from "@/hooks/use-wishlist";

export const products = [
  {
    id: "1",
    name: "Energy Stones Collection",
    description: "Lab-certified healing crystals and energy stones",
    price: "₹499",
    rating: 4.8,
    image: "/images/energy-stones.jpg",
  },
  {
    id: "2",
    name: "Premium Mala Beads",
    description: "108 beads handcrafted sandalwood mala",
    price: "₹799",
    rating: 4.9,
    image: "/images/mala-beads.jpg",
  },
  {
    id: "3",
    name: "Meditation Essentials",
    description: "Complete meditation starter kit with accessories",
    price: "₹1,299",
    rating: 4.7,
    image: "/images/meditation-accessories.jpg",
  },
];

type ApiProduct = {
  id: string;
  name: string;
  description?: string;
  price: number;
  rating?: number;
  images?: string[];
};

const normalizeImage = (image?: string) => {
  if (!image) return "";
  if (image.startsWith("data:") || image.startsWith("http")) return image;
  if (image.startsWith("/uploads")) return `${BASE_URL}${image}`;
  return image;
};

const ProductShowcase = ({
  trendingTitle = "Trending Now",
  newArrivalsTitle = "New Arrivals",
  trendingVisible = true,
  newArrivalsVisible = true,
  trendingProductIds = [],
  newArrivalsProductIds = []
}: {
  trendingTitle?: string;
  newArrivalsTitle?: string;
  trendingVisible?: boolean;
  newArrivalsVisible?: boolean;
  trendingProductIds?: string[];
  newArrivalsProductIds?: string[];
}) => {
  const [trendingItems, setTrendingItems] = useState(products.slice(0, 3));
  const [newArrivals, setNewArrivals] = useState(products.slice(3, 6));
  const { toggleWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    let active = true;

    const mapProducts = (data: any[]) => {
      return data.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description || "",
        price: `₹${Number(item.price || 0).toFixed(2)}`,
        rating: Number(item.rating || 0),
        image: normalizeImage(item.images?.[0]) || "/placeholder.svg",
      }));
    };

    const fetchProducts = async () => {
      try {
        if (trendingProductIds.length > 0 || newArrivalsProductIds.length > 0) {
          const promises = [];
          if (trendingProductIds.length > 0) {
            promises.push(apiFetch(`/api/products?ids=${trendingProductIds.join(',')}&limit=${trendingProductIds.length}`).then(res => {
              if (active && (res as any)?.data) setTrendingItems(mapProducts((res as any).data));
            }));
          }
          if (newArrivalsProductIds.length > 0) {
            promises.push(apiFetch(`/api/products?ids=${newArrivalsProductIds.join(',')}&limit=${newArrivalsProductIds.length}`).then(res => {
              if (active && (res as any)?.data) setNewArrivals(mapProducts((res as any).data));
            }));
          }
          await Promise.all(promises);
        } else {
          const res = await apiFetch("/api/products?limit=6&sortBy=createdAt&sortOrder=DESC");
          if (active && (res as any)?.data && Array.isArray((res as any).data) && (res as any).data.length > 0) {
            const mapped = mapProducts((res as any).data);
            setTrendingItems(mapped.slice(0, 3));
            setNewArrivals(mapped.slice(3, 6));
          }
        }
      } catch (err) {
        console.error("Failed to fetch product showcase", err);
      }
    };

    fetchProducts();

    return () => {
      active = false;
    };
  }, [trendingProductIds, newArrivalsProductIds]);

  const ProductRow = ({ title, products }: { title: string; products: typeof trendingItems }) => (
    <div className="mb-10">
      <div className="flex items-center justify-between px-4 mb-4">
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <Link to={title.toLowerCase().includes("trending") ? "/trending" : "/new-arrivals"}>
          <Button variant="link" className="text-orange-600 font-semibold p-0 h-auto">
            View All
          </Button>
        </Link>
      </div>

      <div className="flex overflow-x-auto gap-4 px-4 no-scrollbar pb-4">
        {products.map((product) => (
          <Link
            key={product.id}
            to={`/products/${product.id}`}
            className="min-w-[140px] max-w-[140px] bg-white border border-slate-100 rounded-lg overflow-hidden shadow-sm flex flex-col transition-all duration-300 hover:shadow-md cursor-pointer"
          >
            <div className="relative aspect-square bg-slate-50/50 p-2">
              <img
                src={product.image}
                alt={product.name}
                className="object-cover w-full h-full"
              />
              <button
                className="absolute top-1.5 right-1.5 p-1 bg-white/90 rounded-full text-orange-600 shadow-sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleWishlist(String(product.id));
                }}
              >
                <Heart className={`h-3 w-3 ${isInWishlist(String(product.id)) ? "fill-orange-600" : ""}`} />
              </button>
            </div>

            <div className="p-2 flex flex-col flex-1">
              <h3 className="text-[10px] font-medium text-slate-800 line-clamp-2 mb-1 min-h-[24px]">
                {product.name}
              </h3>
              <div className="flex items-center gap-1 mb-1.5">
                <div className="flex items-center bg-green-600 text-white text-[9px] px-1 rounded gap-0.5">
                  <span>{product.rating}</span>
                  <Star className="h-2 w-2 fill-white" />
                </div>
              </div>
              <div className="mt-auto">
                <span className="text-xs font-bold text-slate-900">{product.price}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <section className="py-6 bg-white">
      <div className="container mx-auto">
        {trendingVisible && <ProductRow title={trendingTitle} products={trendingItems} />}
        {trendingVisible && newArrivalsVisible && <div className="h-2 bg-slate-50 my-2" />}
        {newArrivalsVisible && <ProductRow title={newArrivalsTitle} products={newArrivals} />}
      </div>
    </section>
  );
};

export default ProductShowcase;
