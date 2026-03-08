import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";

export type StoreSettingsDoc = {
    heroTitle: string;
    heroVisible: boolean;
    trendingTitle: string;
    trendingVisible: boolean;
    newArrivalsTitle: string;
    newArrivalsVisible: boolean;
    collectionsTitle: string;
    collectionsVisible: boolean;
    reviewsTitle: string;
    reviewsVisible: boolean;
    featuresTitle: string;
    featuresVisible: boolean;
    heroCollectionIds: string[];
    trendingProductIds: string[];
    newArrivalsProductIds: string[];
    promoBannerTitle: string;
    promoBannerVisible: boolean;
    promoBannerImages: string[];
    videoPromoTitle: string;
    videoPromoVisible: boolean;
    videoPromoUrls: string[];
    testimonials: {
        id: string;
        name: string;
        location: string;
        rating: number;
        text: string;
        image: string;
        verified: boolean;
    }[];
};

const defaultSettings: StoreSettingsDoc = {
    heroTitle: "Hero Section",
    heroVisible: true,
    trendingTitle: "Trending Now",
    trendingVisible: true,
    newArrivalsTitle: "New Arrivals",
    newArrivalsVisible: true,
    collectionsTitle: "Shop Our Collections",
    collectionsVisible: true,
    reviewsTitle: "Customer Reviews",
    reviewsVisible: true,
    featuresTitle: "Why Choose Us",
    featuresVisible: true,
    heroCollectionIds: [],
    trendingProductIds: [],
    newArrivalsProductIds: [],
    promoBannerTitle: "Promotional Banner",
    promoBannerVisible: true,
    promoBannerImages: ["/images/banner.jpg"],
    videoPromoTitle: "Experience the Divine",
    videoPromoVisible: true,
    videoPromoUrls: [],
    testimonials: [
        {
            id: "1",
            name: "Priya Sharma",
            location: "Mumbai",
            rating: 5,
            text: "The quality of the rudraksha beads is exceptional. I can feel the positive energy every time I wear them.",
            image: "https://images.unsplash.com/photo-1605648813351-5b746813ac47?q=80&w=600&auto=format&fit=crop",
            verified: true,
        },
    ],
};

const StoreSettings = () => {
    const { token } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<StoreSettingsDoc>(defaultSettings);
    const [products, setProducts] = useState<{ id: string, name: string, image: string }[]>([]);
    const [collections, setCollections] = useState<{ id: string, name: string, image: string }[]>([]);

    useEffect(() => {
        const fetchSettingsAndProducts = async () => {
            try {
                const [settingsRes, productsRes, collectionsRes] = await Promise.all([
                    apiFetch("/api/settings/home_page_layout"),
                    apiFetch("/api/products?limit=100"), // Fetch a reasonable number of products for selection
                    apiFetch("/api/collections?limit=100") // Fetch collections for hero selection
                ]);

                if (settingsRes && (settingsRes as StoreSettingsDoc).heroTitle !== undefined) {
                    setSettings({
                        ...defaultSettings,
                        ...(settingsRes as StoreSettingsDoc),
                    });
                }

                if (productsRes && (productsRes as any).data) {
                    const mapped = ((productsRes as any).data || []).map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        image: p.images?.[0] || '/placeholder.svg'
                    }));
                    setProducts(mapped);
                }

                if (collectionsRes && (collectionsRes as any).data) {
                    const mappedCol = ((collectionsRes as any).data || []).map((c: any) => ({
                        id: c.slug || c.id,
                        name: c.name,
                        image: c.image || '/placeholder.svg'
                    }));
                    setCollections(mappedCol);
                }

            } catch (err) {
                toast({ title: "Failed to load data", description: String(err), variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        fetchSettingsAndProducts();
    }, [toast]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setSettings((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleProductToggle = (section: 'trending' | 'newArrivals', productId: string) => {
        setSettings(prev => {
            const key = `${section}ProductIds` as keyof StoreSettingsDoc;
            const currentList = (prev[key] as string[]) || [];
            if (currentList.includes(productId)) {
                return { ...prev, [key]: currentList.filter(id => id !== productId) };
            } else {
                return { ...prev, [key]: [...currentList, productId] };
            }
        });
    };

    const handleCollectionToggle = (collectionId: string) => {
        setSettings(prev => {
            const currentList = prev.heroCollectionIds || [];
            if (currentList.includes(collectionId)) {
                return { ...prev, heroCollectionIds: currentList.filter(id => id !== collectionId) };
            } else {
                return { ...prev, heroCollectionIds: [...currentList, collectionId] };
            }
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        // Limiting to 5 total images
        const currentImages = settings.promoBannerImages || [];
        if (currentImages.length + files.length > 5) {
            toast({ title: "Too many images", description: "You can only upload up to 5 promo images.", variant: "destructive" });
            return;
        }

        const formData = new FormData();
        files.forEach((file) => formData.append("images", file));

        try {
            toast({ title: "Uploading images...", description: "Please wait.", duration: 2000 });
            const res = await apiFetch("/api/settings/upload", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData,
            });

            if (res && (res as any).urls) {
                setSettings(prev => ({
                    ...prev,
                    promoBannerImages: [...(prev.promoBannerImages || []), ...(res as any).urls]
                }));
                toast({ title: "Upload successful", description: "Images uploaded! Remember to save changes." });
            }
        } catch (err) {
            toast({ title: "Upload failed", description: String(err), variant: "destructive" });
        }
    };

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 50 * 1024 * 1024) {
            toast({ title: "File too large", description: "Video must be under 50MB.", variant: "destructive" });
            return;
        }

        const formData = new FormData();
        formData.append("video", file);

        try {
            toast({ title: "Uploading video...", description: "Please wait.", duration: 3000 });
            const res = await apiFetch("/api/settings/upload/video", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData,
            });

            if (res && (res as any).url) {
                setSettings(prev => ({
                    ...prev,
                    videoPromoUrls: [...(prev.videoPromoUrls || []), (res as any).url].slice(0, 3)
                }));
                toast({ title: "Upload successful", description: "Video uploaded! Remember to save changes." });
            }
        } catch (err) {
            toast({ title: "Upload failed", description: String(err), variant: "destructive" });
        }
    };

    const removePromoImage = (indexToRemove: number) => {
        setSettings(prev => ({
            ...prev,
            promoBannerImages: (prev.promoBannerImages || []).filter((_, i) => i !== indexToRemove)
        }));
    };

    const removePromoVideo = (indexToRemove: number) => {
        setSettings(prev => ({
            ...prev,
            videoPromoUrls: (prev.videoPromoUrls || []).filter((_, i) => i !== indexToRemove)
        }));
    };

    const handleTestimonialChange = (id: string, field: string, value: any) => {
        setSettings(prev => ({
            ...prev,
            testimonials: (prev.testimonials || []).map(t => t.id === id ? { ...t, [field]: value } : t)
        }));
    };

    const addTestimonial = () => {
        setSettings(prev => ({
            ...prev,
            testimonials: [...(prev.testimonials || []), {
                id: Date.now().toString(),
                name: "New Customer",
                location: "Location",
                rating: 5,
                text: "Great product!",
                image: "",
                verified: true
            }]
        }));
    };

    const removeTestimonial = (id: string) => {
        setSettings(prev => ({
            ...prev,
            testimonials: (prev.testimonials || []).filter(t => t.id !== id)
        }));
    };

    const handleTestimonialImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("images", file);

        try {
            toast({ title: "Uploading image...", duration: 2000 });
            const res = await apiFetch("/api/settings/upload", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (res && (res as any).urls && (res as any).urls.length > 0) {
                handleTestimonialChange(id, 'image', (res as any).urls[0]);
                toast({ title: "Upload successful" });
            }
        } catch (err) {
            toast({ title: "Upload failed", description: String(err), variant: "destructive" });
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (!token) throw new Error("Not authenticated");
            const res = await apiFetch("/api/settings/home_page_layout", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(settings),
            });
            if (res && res.heroTitle !== undefined) {
                setSettings(res as StoreSettingsDoc);
                toast({ title: "Settings Saved", description: "Home page configuration updated." });
            }
        } catch (err) {
            toast({ title: "Failed to save settings", description: String(err), variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center bg-white rounded-3xl m-6">Loading configuration...</div>;
    }

    const sections = [
        { key: "hero", label: "Hero Banner Section" },
        { key: "promoBanner", label: "Promo Banner Section" },
        { key: "trending", label: "Trending Now Section" },
        { key: "newArrivals", label: "New Arrivals Section" },
        { key: "videoPromo", label: "Video Promo Section" },
        { key: "collections", label: "Collections List Section" },
        { key: "reviews", label: "Testimonials/Reviews Section" },
        { key: "features", label: "Features Section" },
    ];

    return (
        <div className="p-6">
            <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl shadow-lg overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Home Page Configuration
                    </h2>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-medium hover:shadow-lg transition-all"
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-6">
                    <p className="text-gray-600 text-sm mb-2">
                        Customize the visibility and titles of sections featured on the home page.
                    </p>

                    <div className="grid gap-6">
                        {sections.map((sec) => (
                            <div key={sec.key} className="flex flex-col gap-4">
                                <div className="bg-gray-50 p-4 border rounded-xl flex items-center justify-between gap-6">
                                    <div className="flex-1">
                                        <label className="block text-sm font-semibold text-gray-800 mb-1">{sec.label} Title</label>
                                        <input
                                            type="text"
                                            name={`${sec.key}Title`}
                                            value={(settings as any)[`${sec.key}Title`]}
                                            onChange={handleChange}
                                            className="w-full sm:w-80 border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-3 py-2 border"
                                        />
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <label className="text-xs font-semibold text-gray-500 mb-2">Visible?</label>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name={`${sec.key}Visible`}
                                                checked={(settings as any)[`${sec.key}Visible`]}
                                                onChange={handleChange}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>
                                </div>

                                {sec.key === 'promoBanner' && (
                                    <div className="bg-gray-50 p-4 border rounded-xl border-t-0 -mt-8 pt-8">
                                        <label className="block text-sm font-semibold text-gray-800 mb-3">Promo Banner Images</label>
                                        <div className="flex flex-col gap-4">
                                            {settings.promoBannerImages && settings.promoBannerImages.length > 0 && (
                                                <div className="flex flex-wrap gap-4">
                                                    {settings.promoBannerImages.map((img, i) => (
                                                        <div key={i} className="w-48 h-28 rounded-lg overflow-hidden border border-gray-200 shadow-sm relative group bg-white">
                                                            <img
                                                                src={img.startsWith('http') || img.startsWith('/') ? img : `/uploads/${img}`}
                                                                alt={`Promo Banner ${i + 1}`}
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <button
                                                                onClick={(e) => { e.preventDefault(); removePromoImage(i); }}
                                                                className="absolute top-2 right-2 bg-white/90 text-red-600 p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                                                                title="Remove Image"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <div>
                                                <label className="cursor-pointer bg-white px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 max-w-max transition-colors inline-flex">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-upload"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                                                    Upload Images
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        multiple
                                                        className="hidden"
                                                        onChange={handleImageUpload}
                                                    />
                                                </label>
                                                <p className="text-xs text-gray-500 mt-2">Recommended size: 1920x400px. Max 5 images, up to 5MB each.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {sec.key === 'videoPromo' && (
                                    <div className="bg-gray-50 p-4 border rounded-xl border-t-0 -mt-8 pt-8">
                                        <label className="block text-sm font-semibold text-gray-800 mb-3">Promotional Video Details</label>
                                        <div className="flex flex-col gap-4">
                                            {settings.videoPromoUrls && settings.videoPromoUrls.length > 0 && (
                                                <div className="flex flex-col gap-3">
                                                    {settings.videoPromoUrls.map((url, i) => (
                                                        <div key={i} className="flex flex-col sm:flex-row gap-3 items-center bg-white p-3 rounded-lg border shadow-sm">
                                                            <input
                                                                type="text"
                                                                value={url}
                                                                onChange={(e) => {
                                                                    const newUrls = [...settings.videoPromoUrls];
                                                                    newUrls[i] = e.target.value;
                                                                    setSettings(prev => ({ ...prev, videoPromoUrls: newUrls }));
                                                                }}
                                                                placeholder="e.g. https://www.w3schools.com/html/mov_bbb.mp4"
                                                                className="flex-1 border-gray-300 rounded-md text-sm px-3 py-1.5 border shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                            />
                                                            <button
                                                                onClick={(e) => { e.preventDefault(); removePromoVideo(i); }}
                                                                className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-md text-sm font-semibold border border-red-200 transition-colors whitespace-nowrap"
                                                            >
                                                                Remove Video
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {(!settings.videoPromoUrls || settings.videoPromoUrls.length < 3) && (
                                                <div>
                                                    <div className="flex flex-col sm:flex-row gap-3">
                                                        <label className="cursor-pointer bg-white px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors inline-flex max-w-max">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-upload"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                                                            Upload New Video
                                                            <input
                                                                type="file"
                                                                accept="video/mp4,video/webm,video/ogg"
                                                                className="hidden"
                                                                onChange={handleVideoUpload}
                                                            />
                                                        </label>
                                                        <div className="flex items-center text-sm font-medium text-gray-500 px-2">OR</div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                setSettings(prev => ({
                                                                    ...prev,
                                                                    videoPromoUrls: [...(prev.videoPromoUrls || []), ""]
                                                                }));
                                                            }}
                                                            className="bg-indigo-50 text-indigo-700 px-4 py-2 border border-indigo-200 rounded-lg shadow-sm text-sm font-medium hover:bg-indigo-100 transition-colors inline-flex justify-center max-w-max"
                                                        >
                                                            Paste URL Manually
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-2">Add up to 3 videos. Upload a file directly (Max 50MB, .mp4 recommended) or paste a direct video link.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {sec.key === 'hero' && (() => {
                                    const selectedIds = settings.heroCollectionIds || [];
                                    const selectedCollections = selectedIds.map((id: string) => collections.find(c => c.id === id)).filter(Boolean);
                                    const availableCollections = collections.filter(c => !selectedIds.includes(c.id));

                                    return (
                                        <div className="bg-gray-50 p-4 border rounded-xl border-t-0 -mt-8 pt-8">
                                            <label className="block text-sm font-semibold text-gray-800 mb-3">Select Collections for Home Slider</label>

                                            <div className="flex gap-2 mb-4">
                                                <select
                                                    className="flex-1 border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-3 py-2 border bg-white"
                                                    onChange={(e) => {
                                                        if (e.target.value) {
                                                            handleCollectionToggle(e.target.value);
                                                            e.target.value = "";
                                                        }
                                                    }}
                                                    defaultValue=""
                                                >
                                                    <option value="" disabled>-- Select a collection to add --</option>
                                                    {availableCollections.map(c => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {selectedCollections.length > 0 ? (
                                                <div className="flex flex-col gap-2">
                                                    {selectedCollections.map((col: any) => (
                                                        <div key={col.id} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-200">
                                                            <img src={col.image.startsWith('http') || col.image.startsWith('/') || col.image.startsWith('data:') ? col.image : `/uploads/${col.image}`} alt={col.name} className="w-10 h-10 object-cover rounded-md border" />
                                                            <span className="text-sm flex-1 font-medium text-gray-700">{col.name}</span>
                                                            <button
                                                                onClick={() => handleCollectionToggle(col.id)}
                                                                className="text-red-500 hover:bg-red-50 px-3 py-1 rounded-md text-xs font-semibold border border-red-200 transition-colors"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500 italic">No collections specifically selected. Will default dynamically to latest 5 collections.</p>
                                            )}
                                        </div>
                                    );
                                })()}

                                {(sec.key === 'trending' || sec.key === 'newArrivals') && (() => {
                                    const selectedIds = (settings as any)[`${sec.key}ProductIds`] || [];
                                    const selectedProducts = selectedIds.map((id: string) => products.find(p => p.id === id)).filter(Boolean);
                                    const availableProducts = products.filter(p => !selectedIds.includes(p.id));

                                    return (
                                        <div className="bg-gray-50 p-4 border rounded-xl border-t-0 -mt-8 pt-8">
                                            <label className="block text-sm font-semibold text-gray-800 mb-3">Select Products for {sec.label}</label>

                                            <div className="flex gap-2 mb-4">
                                                <select
                                                    className="flex-1 border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-3 py-2 border bg-white"
                                                    onChange={(e) => {
                                                        if (e.target.value) {
                                                            handleProductToggle(sec.key as any, e.target.value);
                                                            e.target.value = "";
                                                        }
                                                    }}
                                                    defaultValue=""
                                                >
                                                    <option value="" disabled>-- Select a product to add --</option>
                                                    {availableProducts.map(p => (
                                                        <option key={p.id} value={p.id}>{p.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {selectedProducts.length > 0 ? (
                                                <div className="flex flex-col gap-2">
                                                    {selectedProducts.map((product: any) => (
                                                        <div key={product.id} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-200">
                                                            <img src={product.image.startsWith('http') || product.image.startsWith('/') ? product.image : `/uploads/${product.image}`} alt={product.name} className="w-10 h-10 object-cover rounded-md border" />
                                                            <span className="text-sm flex-1 font-medium text-gray-700">{product.name}</span>
                                                            <button
                                                                onClick={() => handleProductToggle(sec.key as any, product.id)}
                                                                className="text-red-500 hover:bg-red-50 px-3 py-1 rounded-md text-xs font-semibold border border-red-200 transition-colors"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500 italic">No products selected for {sec.label}. Will display latest products automatically.</p>
                                            )}
                                        </div>
                                    );
                                })()}

                                {sec.key === 'reviews' && (
                                    <div className="bg-gray-50 p-4 border rounded-xl border-t-0 -mt-8 pt-8">
                                        <div className="flex justify-between items-center mb-4">
                                            <label className="block text-sm font-semibold text-gray-800">Edit Testimonials & Backgrounds</label>
                                            <button onClick={addTestimonial} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                                                + Add Testimonial
                                            </button>
                                        </div>
                                        <div className="space-y-4">
                                            {(settings.testimonials || []).map((t, idx) => (
                                                <div key={t.id} className="bg-white border rounded-xl p-4 flex flex-col md:flex-row gap-6 shadow-sm relative">
                                                    <button onClick={() => removeTestimonial(t.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                                    </button>
                                                    {/* Image Uploader */}
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="w-32 h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50 relative group">
                                                            {t.image ? (
                                                                <img src={t.image.startsWith('http') || t.image.startsWith('/') ? t.image : `/uploads/${t.image}`} alt={t.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="text-gray-400 flex flex-col items-center text-xs"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>No Image</div>
                                                            )}
                                                            <label className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center cursor-pointer text-white text-xs font-semibold">
                                                                Change
                                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleTestimonialImageUpload(e, t.id)} />
                                                            </label>
                                                        </div>
                                                        <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Background Cover</span>
                                                    </div>

                                                    {/* Text Details */}
                                                    <div className="flex-1 space-y-3">
                                                        <div className="grid grid-cols-2 gap-3 pr-8">
                                                            <div>
                                                                <label className="text-xs font-semibold text-gray-600">Customer Name</label>
                                                                <input type="text" value={t.name} onChange={e => handleTestimonialChange(t.id, 'name', e.target.value)} className="w-full border-gray-300 rounded-lg text-sm px-3 py-1.5 border" />
                                                            </div>
                                                            <div>
                                                                <label className="text-xs font-semibold text-gray-600">Location</label>
                                                                <input type="text" value={t.location} onChange={e => handleTestimonialChange(t.id, 'location', e.target.value)} className="w-full border-gray-300 rounded-lg text-sm px-3 py-1.5 border" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-semibold text-gray-600">Review Text</label>
                                                            <textarea value={t.text} onChange={e => handleTestimonialChange(t.id, 'text', e.target.value)} rows={2} className="w-full border-gray-300 rounded-lg text-sm px-3 py-1.5 border resize-none"></textarea>
                                                        </div>
                                                        <div className="flex items-center gap-6">
                                                            <div>
                                                                <label className="text-xs font-semibold text-gray-600 mr-2">Stars Cast:</label>
                                                                <select value={t.rating} onChange={e => handleTestimonialChange(t.id, 'rating', Number(e.target.value))} className="border-gray-300 rounded-lg text-sm px-2 py-1 border bg-white">
                                                                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Stars</option>)}
                                                                </select>
                                                            </div>
                                                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                                                                <input type="checkbox" checked={t.verified} onChange={e => handleTestimonialChange(t.id, 'verified', e.target.checked)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" />
                                                                Verified Buyer?
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!settings.testimonials || settings.testimonials.length === 0) && (
                                                <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 text-sm">No testimonials added yet.</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div >
    );
};

export default StoreSettings;
