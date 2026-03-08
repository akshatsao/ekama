import { apiFetch } from "@/lib/api";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export interface WishlistContextType {
    wishlistItems: string[];
    isLoading: boolean;
    toggleWishlist: (productId: string) => Promise<void>;
    isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

export const WishlistProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const { user, token } = useAuth();
    const [wishlistItems, setWishlistItems] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user && token) {
            fetchWishlist();
        } else {
            setWishlistItems([]);
        }
    }, [user, token]);

    const fetchWishlist = useCallback(async () => {
        if (!user || !token) return;
        setIsLoading(true);
        try {
            const res = await apiFetch("/api/users/wishlist", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res?.data && Array.isArray(res.data)) {
                setWishlistItems(res.data);
            }
        } catch (err) {
            console.error("Failed to load wishlist", err);
        } finally {
            setIsLoading(false);
        }
    }, [user, token]);

    const toggleWishlist = useCallback(async (productId: string) => {
        if (!user || !token) {
            // If the user tries to add to wishlist without being logged in, we could redirect to login
            // But for now, we just silently fail or show a console message.
            console.warn("User must be logged in to use wishlist");
            return;
        }

        try {
            // Optimistic upate
            setWishlistItems(prev =>
                prev.includes(productId)
                    ? prev.filter(id => id !== productId)
                    : [...prev, productId]
            );

            const res = await apiFetch(`/api/users/wishlist/${productId}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res?.data?.wishlist) {
                setWishlistItems(res.data.wishlist);
            }
        } catch (err) {
            console.error("Failed to toggle wishlist item", err);
            // Revert optimism by re-fetching
            await fetchWishlist();
        }
    }, [user, token, fetchWishlist]);

    const isInWishlist = useCallback((productId: string) => {
        return wishlistItems.includes(productId);
    }, [wishlistItems]);

    const value: WishlistContextType = {
        wishlistItems,
        isLoading,
        toggleWishlist,
        isInWishlist
    };

    return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export function useWishlist() {
    const ctx = useContext(WishlistContext);
    if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
    return ctx;
}
