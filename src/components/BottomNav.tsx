import { Home, LayoutGrid, Heart, User, ShoppingCart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "@/hooks/use-cart";

const BottomNav = () => {
    const location = useLocation();
    const { totalItems } = useCart();

    const isActive = (path: string) => {
        const fullPath = location.pathname + location.search + location.hash;

        if (path === fullPath) return true;

        if (path === "/") {
            return location.pathname === "/" && !location.hash;
        }

        if (path === "/profile") {
            return location.pathname === "/profile" && !location.pathname.includes("wishlist");
        }

        if (path === "/collections/all") {
            return location.pathname.startsWith("/collections");
        }

        return location.pathname.startsWith(path);
    };

    const pathsToHideNav = [
        "/payment",
        "/cart",
        "/orders",
        "/profile/info",
        "/profile/addresses",
        "/profile/wishlist",
        "/profile/orders",
    ];

    const shouldHideNav = pathsToHideNav.some(path => location.pathname === path) || location.pathname.startsWith('/products/');

    if (shouldHideNav) return null;

    const navItems = [
        { label: "Home", icon: Home, path: "/" },
        { label: "Categories", icon: LayoutGrid, path: "/collections/all" },
        { label: "Wishlist", icon: Heart, path: "/profile/wishlist" },
        { label: "Account", icon: User, path: "/profile" },
        { label: "Cart", icon: ShoppingCart, path: "/cart", badge: totalItems },
    ];

    return (
        <div className="fixed bottom-0 left-0 w-full h-[60px] bg-white border-t border-orange-100 z-50 flex justify-between items-center shadow-[0_-4px_10px_rgba(0,0,0,0.05)] md:hidden m-0 p-0 transform-none">
            {navItems.map((item) => (
                <Link
                    key={item.label}
                    to={item.path}
                    className={`relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${isActive(item.path) ? "text-orange-600 font-semibold" : "text-slate-500 hover:text-orange-400"
                        }`}
                >
                    <item.icon className={`h-5 w-5 ${isActive(item.path) ? "fill-orange-600/10" : ""}`} />
                    <span className="text-[10px] sm:text-xs tracking-tight leading-none">{item.label}</span>

                    {item.badge !== undefined && item.badge > 0 && (
                        <span className="absolute top-1 right-1/2 translate-x-3 h-4 w-4 rounded-full bg-orange-600 text-[10px] font-bold text-white flex items-center justify-center border-2 border-white shadow-sm">
                            {item.badge}
                        </span>
                    )}
                </Link>
            ))}
        </div>
    );
};

export default BottomNav;
