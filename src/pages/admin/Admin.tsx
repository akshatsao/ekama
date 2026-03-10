import adminBackground from '@/assets/bg_backend1.jpg';
import { categories as frontendCategories } from '@/components/Categories';
import { products as frontendProducts } from '@/components/ProductShowcase';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiFetch, BASE_URL, getImageUrl } from '@/lib/api';
import { ChevronDown, LayoutDashboard, Package, Search, Settings, ShoppingBag, Tags, Ticket, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import StoreSettings from './StoreSettings';
import CouponManager from './CouponManager';

type Collection = { id: string; name: string; category: string; description?: string; image?: string; featured?: boolean; slug?: string; createdAt?: string; updatedAt?: string, updatedBy?: string; };
type ProductRow = {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  images?: string[];
  collection: string;
  inStock: boolean;
  stockQuantity?: number;
  rating?: number;
  reviewCount?: number;
  tags?: string[];
  specifications?: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
  isEnabled?: boolean;
  adminProductId?: string;
  siddhAvailable?: boolean;
};

type AdminOrder = {
  id: string;
  userId: string;
  customerEmail?: string;
  customerName?: string;
  name?: string;
  items?: { id: string; name: string; quantity: number; price: number, adminProductId?: string }[];
  totalAmount: number;
  status: string;
  shippingAddress?: string | null;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  createdAt: string;
  updatedAt: string;
};

type SetupValues = {
  email: string;
  password: string;
  adminKey: string;
};

type ProductFormValues = {
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  collection: string;
  imageFile1?: FileList;
  imageFile2?: FileList;
  imageFile3?: FileList;
  imageFile4?: FileList;
  imageFile5?: FileList;
  inStock?: boolean;
  stockQuantity?: number;
  rating?: number;
  reviewCount?: number;
  adminProductId?: string;
  tags?: string;
  specifications?: string;
  siddhAvailable?: boolean;
};

const parseSpecifications = (input?: string) => {
  if (!input) return {};
  const trimmed = input.trim();
  if (!trimmed) return {};
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    parsed = null;
  }
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return parsed as Record<string, string>;
  }
  const entries = trimmed
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [key, ...rest] = line.split(':');
      if (!key || rest.length === 0) return null;
      return [key.trim(), rest.join(':').trim()];
    })
    .filter(Boolean) as [string, string][];
  return Object.fromEntries(entries);
};

const toUrlKey = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const buildFallbackCollections = () => {
  const now = new Date().toISOString();
  return frontendCategories.map((category, index) => {
    const id = toUrlKey(category.name) || `category-${category.id ?? index}`;
    return {
      id,
      name: category.name,
      category: category.name,
      description: '',
      image: '',
      slug: id,
      createdAt: now,
      updatedAt: now
    };
  });
};

const buildFallbackProducts = (collectionIds: string[]) => {
  const now = new Date().toISOString();
  const fallbackCollections = collectionIds.length > 0 ? collectionIds : ['featured'];
  return frontendProducts.map((product, index) => {
    const price = Number(String(product.price).replace(/[^0-9.]/g, '')) || 0;
    const collection = fallbackCollections[index % fallbackCollections.length];
    return {
      id: `frontend-${product.id}`,
      name: product.name,
      description: product.description,
      price,
      images: product.image ? [product.image] : [],
      collection,
      inStock: true,
      stockQuantity: 0,
      createdAt: now,
      updatedAt: now
    };
  });
};

const Admin = () => {
  const { register: registerSetup, handleSubmit: handleSubmitSetup, reset: resetSetup } = useForm<SetupValues>();
  const { register, handleSubmit, reset, watch } = useForm<ProductFormValues>({
    defaultValues: { inStock: true, stockQuantity: 0, rating: 0, reviewCount: 0 }
  });
  const { toast } = useToast();
  const { user, token, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { id: categoryRouteId } = useParams();
  const [setupLoading, setSetupLoading] = useState(false);
  const [activeProducts, setActiveProducts] = useState(0);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [addingProduct, setAddingProduct] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Orders State
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    enabled: true,
    urlKey: '',
    metaTitle: '',
    metaKeywords: '',
    metaDescription: '',
    imageFile: null as File | null,
    existingImage: null as string | null
  });

  const isAdmin = isAuthenticated && user?.role === 'admin';

  const navItems = useMemo(() => ([
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'products', label: 'Products', icon: Package },
    { key: 'categories', label: 'Collections', icon: Tags },
    { key: 'customers', label: 'Customers', icon: Users },
    { key: 'coupons', label: 'Coupons', icon: Ticket },
    { key: 'orders', label: 'Orders', icon: ShoppingBag },
    { key: 'configuration', label: 'Configuration', icon: Settings }
  ]), []);
  const activeLabel = navItems.find((item) => item.key === activeSection)?.label || 'Dashboard';
  const isCategoryEdit = typeof categoryRouteId === 'string';
  const isEditingProduct = Boolean(editingProductId);
  const editingProduct = products.find((product) => product.id === editingProductId) || null;
  const glassCard = 'rounded-3xl border border-white/25 bg-white/10 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.65)] backdrop-blur-2xl ring-1 ring-white/20';
  const glassPanel = 'border border-white/25 bg-white/10 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.65)] backdrop-blur-2xl ring-1 ring-white/20';
  const glassTable = 'overflow-x-auto rounded-3xl border border-white/25 bg-white/10 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.65)] backdrop-blur-2xl ring-1 ring-white/20';

  const handleSectionChange = (sectionKey: string) => {
    setActiveSection(sectionKey);
    if (categoryRouteId) {
      navigate('/admin');
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      try {
        const res = await apiFetch('/api/products?limit=1');
        const total = typeof res?.pagination?.total === 'number' ? res.pagination.total : 0;
        if (total > 0) {
          setActiveProducts(total);
        } else {
          setActiveProducts(frontendProducts.length);
        }
      } catch (e) {
        setActiveProducts(frontendProducts.length);
        toast({ title: 'Failed to load dashboard data', description: String(e) });
      }
    })();
  }, [isAdmin, toast]);

  useEffect(() => {
    if (!isAdmin) return;
    if (!isCategoryEdit) return;
    setActiveSection('categories');
  }, [isAdmin, isCategoryEdit]);

  useEffect(() => {
    if (!isCategoryEdit) return;
    if (categoryRouteId === 'new') {
      setCategoryForm({
        name: '',
        description: '',
        enabled: true,
        urlKey: '',
        metaTitle: '',
        metaKeywords: '',
        metaDescription: '',
        imageFile: null,
        existingImage: null
      });
      return;
    }
    const existing = collections.find((item) => item.id === categoryRouteId);
    if (existing) {
      setCategoryForm({
        name: existing.name || '',
        description: existing.description || '',
        enabled: true,
        urlKey: existing.slug || existing.id || '',
        metaTitle: existing.name || '',
        metaKeywords: existing.name || '',
        metaDescription: existing.name || '',
        imageFile: null,
        existingImage: existing.image || null
      });
    }
  }, [categoryRouteId, collections, isCategoryEdit]);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      try {
        const res = await apiFetch('/api/collections?limit=100');
        const data = Array.isArray(res?.data) ? res.data : [];
        if (data.length > 0) {
          setCollections(data.map((c: Collection) => ({
            id: c.id,
            name: c.name,
            category: c.category,
            description: c.description,
            image: c.image,
            featured: c.featured,
            slug: c.slug,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
            updatedBy: c.updatedBy
          })));
        } else {
          setCollections(buildFallbackCollections());
        }
      } catch (e) {
        setCollections(buildFallbackCollections());
        toast({ title: 'Failed to load collections', description: String(e) });
      }
    })();
  }, [isAdmin, toast]);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchProducts = async () => {
      setProductsLoading(true);
      try {
        const query = selectedCollection === 'all'
          ? '/api/products?limit=10'
          : `/api/products?limit=10&collection=${encodeURIComponent(selectedCollection)}`;
        const res = await apiFetch(query);
        const rows = Array.isArray(res?.data) ? res.data : [];
        if (rows.length > 0) {
          setProducts(rows as ProductRow[]);
        } else {
          const collectionIds = collections.map((item) => item.id);
          setProducts(buildFallbackProducts(collectionIds));
        }
      } catch (e) {
        const collectionIds = collections.map((item) => item.id);
        setProducts(buildFallbackProducts(collectionIds));
        toast({ title: 'Failed to load products', description: String(e) });
      } finally {
        setProductsLoading(false);
      }
    };
    fetchProducts();
  }, [isAdmin, selectedCollection, toast, collections]);

  useEffect(() => {
    if (!isAdmin) return;
    if (activeSection !== 'orders' && activeSection !== 'dashboard') return;

    let eventSource: EventSource | null = null;
    let fallbackInterval: NodeJS.Timeout | null = null;
    let isMounted = true;

    const fetchOrders = async (silent = false) => {
      if (!silent) setOrdersLoading(true);
      try {
        const res = await apiFetch('/api/payments/admin/orders');
        if (isMounted && res?.success && Array.isArray(res.data)) {

          setOrders(prev => {
            const data = res.data as AdminOrder[];
            // If length is different, we definitely have new orders
            if (prev.length !== data.length) return data;
            // Otherwise, simple check is good enough
            const prevIds = prev.map(p => p.id).sort().join(',');
            const newIds = data.map(d => d.id).sort().join(',');
            return prevIds === newIds ? prev : data;
          });
        }
      } catch (err) {
        console.error('Failed to fetch initial orders:', err);
      } finally {
        if (isMounted && !silent) setOrdersLoading(false);
      }
    };

    const setupSSE = () => {
      // Setup SSE Connection
      const streamUrl = `${BASE_URL}/api/payments/admin/orders/stream`;
      eventSource = new EventSource(streamUrl);

      eventSource.onopen = () => {
        // If SSE connects successfully, clear the polling fallback
        if (fallbackInterval) {
          clearInterval(fallbackInterval);
          fallbackInterval = null;
        }
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'new_order' && data.order) {
            setOrders((prev) => {
              if (prev.some((o) => o.id === data.order.id)) return prev;
              const newOrder = {
                ...data.order,
                createdAt: data.order.createdAt || new Date().toISOString()
              };
              return [newOrder, ...prev];
            });
            toast({
              title: "🆕 New Order Received!",
              description: `Order #${data.order.id} for ₹${Number(data.order.totalAmount || 0).toFixed(2)}`,
              className: "bg-indigo-600 text-white border-none",
            });
          }
        } catch (e) {
          console.error("Failed to parse SSE message", e);
        }
      };

      eventSource.onerror = (error) => {
        console.error("SSE connection error", error);
        // If SSE fails (often due to development HTTP proxies buffering the stream), 
        // fallback to polling every 10 seconds
        if (!fallbackInterval) {
          fallbackInterval = setInterval(() => fetchOrders(true), 10000);
        }
      };
    };

    fetchOrders().then(setupSSE);

    return () => {
      isMounted = false;
      if (eventSource) {
        eventSource.close();
      }
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
      }
    };
  }, [isAdmin, activeSection, toast]);

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await apiFetch("/api/payments/update-order-status", {
        method: "POST",
        body: JSON.stringify({ orderId, status }),
      });
      if (res.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
        toast({ title: 'Success', description: `Order status updated to ${status}.` });
      }
    } catch (e) {
      toast({ title: 'Error', description: String(e), variant: 'destructive' });
    }
  };

  const onSubmit = async (values: ProductFormValues) => {
    setAddingProduct(true);
    try {
      if (!token) {
        toast({ title: 'Authentication required', description: 'Please log in as admin to add products.' });
        return;
      }
      const tags = values.tags
        ? values.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];
      const specifications = parseSpecifications(values.specifications);
      const stockQuantity = Number.isFinite(values.stockQuantity) ? values.stockQuantity : 0;
      const originalPrice = Number.isFinite(values.originalPrice) ? values.originalPrice : undefined;
      const collection = values.collection;
      const collectionRow = collections.find((c) => c.id === collection);
      const existingImages = editingProduct?.images || [];
      const imagesFiles = [
        values.imageFile1?.[0],
        values.imageFile2?.[0],
        values.imageFile3?.[0],
        values.imageFile4?.[0],
        values.imageFile5?.[0]
      ].filter(Boolean) as File[];
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('description', values.description || '');
      formData.append('price', String(values.price));
      if (typeof originalPrice !== 'undefined') {
        formData.append('originalPrice', String(originalPrice));
      }
      formData.append('category', collectionRow?.category || '');
      formData.append('collection', collection);
      formData.append('inStock', String(Boolean(values.inStock)));
      if (typeof values.siddhAvailable !== 'undefined') {
        formData.append('siddhAvailable', String(Boolean(values.siddhAvailable)));
      }
      formData.append('stockQuantity', String(stockQuantity));
      if (typeof values.rating === 'number') formData.append('rating', String(values.rating));
      if (typeof values.reviewCount === 'number') formData.append('reviewCount', String(values.reviewCount));

      if (values.adminProductId) {
        formData.append('adminProductId', values.adminProductId);
      }
      formData.append('tags', JSON.stringify(tags));
      formData.append('specifications', JSON.stringify(specifications));
      if (editingProductId) {
        formData.append('existingImages', JSON.stringify(existingImages));
      }
      imagesFiles.forEach((file) => {
        formData.append('images', file);
      });
      if (editingProductId) {
        await apiFetch(`/api/products/${editingProductId}`, {
          method: 'PATCH',
          body: formData,
          headers: { Authorization: `Bearer ${token}` }
        });
        toast({ title: 'Product updated', description: `${values.name} updated successfully.` });
      } else {
        await apiFetch('/api/products', {
          method: 'POST',
          body: formData,
          headers: { Authorization: `Bearer ${token}` }
        });
        toast({ title: 'Product added', description: `${values.name} created successfully.` });
      }
      reset();
      setEditingProductId(null);
      setShowAddProduct(false);
      if (!editingProductId) {
        const res = await apiFetch('/api/products?limit=1');
        const total = typeof res?.pagination?.total === 'number' ? res.pagination.total : 0;
        setActiveProducts(total);
      }
      const listQuery = selectedCollection === 'all'
        ? '/api/products?limit=10'
        : `/api/products?limit=10&collection=${encodeURIComponent(selectedCollection)}`;
      const listRes = await apiFetch(listQuery);
      setProducts(Array.isArray(listRes?.data) ? listRes.data : []);
    } catch (e) {
      toast({ title: 'Error adding product', description: String(e) });
    } finally {
      setAddingProduct(false);
    }
  };

  const onSetupSubmit = async (values: SetupValues) => {
    setSetupLoading(true);
    try {
      await apiFetch('/api/users/make-admin', { method: 'POST', body: JSON.stringify(values) });
      toast({ title: 'Admin updated', description: 'Please log in again to refresh your role.' });
      resetSetup();
    } catch (e) {
      toast({ title: 'Setup failed', description: String(e) });
    } finally {
      setSetupLoading(false);
    }
  };

  const formatSpecifications = (specs?: Record<string, string>) => {
    if (!specs) return '';
    return Object.entries(specs)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  };

  const startProductEdit = (product: ProductRow) => {
    setEditingProductId(product.id);
    setShowAddProduct(true);
    reset({
      name: product.name || '',
      description: product.description || '',
      price: Number.isFinite(product.price) ? product.price : 0,
      originalPrice: typeof product.originalPrice === 'number' ? product.originalPrice : undefined,
      collection: product.collection || '',
      inStock: Boolean(product.inStock),
      stockQuantity: Number.isFinite(product.stockQuantity) ? product.stockQuantity : 0,
      rating: Number.isFinite(product.rating) ? product.rating : 0,
      reviewCount: Number.isFinite(product.reviewCount) ? product.reviewCount : 0,
      adminProductId: product.adminProductId || '',
      siddhAvailable: Boolean(product.siddhAvailable),
      tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
      specifications: formatSpecifications(product.specifications)
    });
  };

  const deleteProductById = async (id: string, name?: string) => {
    const label = name || 'this product';
    const confirmed = window.confirm(`Delete ${label}?`);
    if (!confirmed) return;
    try {
      if (!token) {
        toast({ title: 'Authentication required', description: 'Please log in as admin to delete products.' });
        return;
      }
      await apiFetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({ title: 'Product deleted', description: `${label} deleted successfully.` });
      setProducts((prev) => prev.filter((item) => item.id !== id));
      if (editingProductId === id) {
        setEditingProductId(null);
        setShowAddProduct(false);
        reset({
          name: '',
          description: '',
          price: 0,
          originalPrice: undefined,
          collection: '',
          inStock: true,
          stockQuantity: 0,
          rating: 0,
          reviewCount: 0,
          adminProductId: '',
          siddhAvailable: false,
          tags: '',
          specifications: ''
        });
      }
      const res = await apiFetch('/api/products?limit=1');
      const total = typeof res?.pagination?.total === 'number' ? res.pagination.total : 0;
      setActiveProducts(total);
    } catch (e) {
      toast({ title: 'Failed to delete product', description: String(e) });
    }
  };

  const toggleProductEnabled = async (id: string, isEnabled: boolean) => {
    try {
      if (!token) {
        toast({ title: 'Authentication required', description: 'Please log in as admin to update products.' });
        return;
      }
      await apiFetch(`/api/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isEnabled: !isEnabled }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isEnabled: !isEnabled } : p))
      );
      toast({
        title: `Product ${!isEnabled ? 'enabled' : 'disabled'}`,
        description: `Product has been successfully ${!isEnabled ? 'enabled' : 'disabled'}.`
      });
    } catch (e) {
      toast({ title: 'Failed to update product', description: String(e) });
    }
  };

  const toggleAddProduct = () => {
    setEditingProductId(null);
    setShowAddProduct((prev) => {
      const next = !prev;
      if (next) {
        reset({
          name: '',
          description: '',
          price: 0,
          originalPrice: undefined,
          collection: '',
          inStock: true,
          stockQuantity: 0,
          adminProductId: '',
          tags: '',
          specifications: ''
        });
      }
      return next;
    });
  };

  const readImageFile = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.readAsDataURL(file);
  });

  const saveCategory = async (keepEditing: boolean) => {
    const name = categoryForm.name.trim();
    if (!name) {
      toast({ title: 'Collection name required', description: 'Please enter a collection name.' });
      return;
    }
    if (!token) {
      toast({ title: 'Authentication required', description: 'Please log in as admin to save collections.' });
      return;
    }
    const urlKey = categoryForm.urlKey.trim() || toUrlKey(name);
    const description = categoryForm.description.trim();

    let image = categoryForm.existingImage || '';
    if (categoryForm.imageFile) {
      try {
        const formData = new FormData();
        formData.append('image', categoryForm.imageFile);

        const uploadRes = await apiFetch('/api/collections/upload', {
          method: 'POST',
          body: formData,
          headers: { Authorization: `Bearer ${token}` }
        });

        if (uploadRes && uploadRes.url) {
          image = uploadRes.url;
        }
      } catch (error) {
        toast({ title: 'Image upload error', description: String(error), variant: 'destructive' });
        return;
      }
    }

    const payload = {
      name,
      description,
      image,
      category: name,
      featured: false,
      slug: urlKey
    };
    try {
      let res: unknown;
      if (categoryRouteId && categoryRouteId !== 'new') {
        res = await apiFetch(`/api/collections/${categoryRouteId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        res = await apiFetch('/api/collections', {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      const saved = (res as { data?: Collection })?.data;
      if (saved) {
        setCollections((prev) => {
          const next = prev.filter((item) => item.id !== saved.id);
          return [...next, saved];
        });
      }
      toast({ title: 'Collection saved', description: `${name} updated successfully.` });
      setCategoryForm((prev) => ({ ...prev, imageFile: null, existingImage: saved?.image || null }));
      if (!keepEditing) {
        navigate('/admin');
      }
    } catch (error) {
      toast({ title: 'Collection save failed', description: String(error) });
    }
  };

  const deleteCategory = async (id: string, name: string) => {
    const confirmed = window.confirm(`Delete collection "${name}"?`);
    if (!confirmed) return;
    try {
      if (!token) {
        toast({ title: 'Authentication required', description: 'Please log in as admin to delete collections.' });
        return;
      }
      await apiFetch(`/api/collections/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({ title: 'Collection deleted', description: `${name} deleted successfully.` });
      setCollections((prev) => prev.filter((item) => item.id !== id));
      navigate('/admin');
    } catch (error) {
      toast({ title: 'Failed to delete collection', description: String(error) });
    }
  };

  if (!isAdmin) {
    return (
      <div
        className="admin-theme min-h-screen flex flex-col bg-slate-100 relative overflow-hidden"
        style={{ backgroundImage: `url(${adminBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />
          <div className="absolute top-24 right-10 h-80 w-80 rounded-full bg-purple-200/40 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
        </div>
        <main className="flex-1 container mx-auto px-4 py-12 relative z-10">
          <div className={`max-w-xl mx-auto ${glassCard} p-6`}>
            <h1 className="text-2xl font-semibold text-slate-900 mb-2">Admin Access</h1>
            <p className="text-sm text-slate-500">Please sign in with an admin account to add products.</p>
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Make My Account Admin</h2>
              <form onSubmit={handleSubmitSetup(onSetupSubmit)} className="grid gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input className="w-full border border-slate-200 rounded-xl px-4 py-2" type="email" {...registerSetup('email', { required: true })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input className="w-full border border-slate-200 rounded-xl px-4 py-2" type="password" {...registerSetup('password', { required: true })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Admin Setup Key</label>
                  <input className="w-full border border-slate-200 rounded-xl px-4 py-2" type="password" {...registerSetup('adminKey', { required: true })} />
                </div>
                <button type="submit" disabled={setupLoading} className="bg-indigo-600 text-white px-5 py-2 rounded-full">
                  {setupLoading ? 'Saving...' : 'Make Admin'}
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const formCollection = watch('collection');
  const formCategory = collections.find((c) => c.id === formCollection)?.category || '';

  return (
    <div
      className="admin-theme min-h-screen bg-slate-100 flex relative overflow-hidden"
      style={{ backgroundImage: `url(${adminBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="absolute inset-0">
        <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="absolute top-12 right-8 h-80 w-80 rounded-full bg-purple-200/40 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
      </div>
      <aside
        className="w-72 border-r border-white/25 backdrop-blur-2xl flex flex-col relative z-10 bg-white/10 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.65)] ring-1 ring-white/10"
        style={{ backgroundImage: `url(${adminBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="px-6 py-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-lg font-semibold">
            E
          </div>
          <div>
            <div className="text-base font-semibold text-slate-900">Ekama Admin</div>
            <div className="text-xs text-slate-500">Workspace overview</div>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.key;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => handleSectionChange(item.key)}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm transition ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
                  }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="px-6 py-4 text-xs text-slate-400">Ekama admin console</div>
      </aside>

      <div className="flex-1 flex flex-col relative z-10">
        <div className="h-18 bg-white/20 border-b border-white/30 backdrop-blur-2xl shadow-[0_16px_40px_-30px_rgba(15,23,42,0.65)] flex items-center justify-between px-8 py-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-slate-400">Overview</div>
            <div className="text-xl font-semibold text-slate-900">{activeLabel}</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                className="h-10 w-72 rounded-full border border-white/40 bg-white/20 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-500 backdrop-blur-xl"
                placeholder="Search for..."
              />
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-3 text-sm text-slate-600">
                <span className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold">
                  {user?.firstName?.[0] || 'A'}
                </span>
                <div className="text-left">
                  <div className="text-xs text-slate-400">Admin</div>
                  <div className="text-sm font-medium text-slate-700">{user?.firstName || 'Admin'}</div>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/admin');
                }}
                className="h-10 rounded-full border border-white/20 bg-slate-900/10 px-4 text-sm font-medium text-slate-700 backdrop-blur-2xl ring-1 ring-white/10"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <main className="flex-1 px-8 py-6">

          {activeSection === 'dashboard' && (
            <>
              <div className="flex flex-col gap-6 lg:flex-row">
                <div className="flex-1 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className={`${glassCard} p-4`}>
                      <div className="text-xs uppercase tracking-wider text-slate-400">Today</div>
                      <div className="mt-3 text-2xl font-semibold text-slate-900">₹ 0.00</div>
                      <div className="mt-2 text-sm text-slate-500">Sales today</div>
                    </div>
                    <div className={`${glassCard} p-4`}>
                      <div className="text-xs uppercase tracking-wider text-slate-400">Monthly</div>
                      <div className="mt-3 text-2xl font-semibold text-slate-900">₹ 0.00</div>
                      <div className="mt-2 text-sm text-slate-500">Sales this month</div>
                    </div>
                    <div className={`${glassCard} p-4`}>
                      <div className="text-xs uppercase tracking-wider text-slate-400">Customers</div>
                      <div className="mt-3 text-2xl font-semibold text-slate-900">0</div>
                      <div className="mt-2 text-sm text-slate-500">New customers</div>
                    </div>
                    <div className={`${glassCard} p-4`}>
                      <div className="text-xs uppercase tracking-wider text-slate-400">Inventory</div>
                      <div className="mt-3 text-2xl font-semibold text-slate-900">{activeProducts}</div>
                      <div className="mt-2 text-sm text-slate-500">Active products</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className={`${glassCard} p-5`}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Orders overview</div>
                          <div className="text-xs text-slate-500">Last 30 days</div>
                        </div>
                        <button className="h-9 rounded-full border border-slate-200 px-4 text-xs font-semibold text-slate-500">
                          View report
                        </button>
                      </div>
                      <div className="h-52 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-sm text-slate-400">
                        No data to display
                      </div>
                    </div>
                    <div className={`${glassCard} p-5`}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Revenue trend</div>
                          <div className="text-xs text-slate-500">Weekly snapshot</div>
                        </div>
                        <button className="h-9 rounded-full border border-slate-200 px-4 text-xs font-semibold text-slate-500">
                          Download
                        </button>
                      </div>
                      <div className="h-52 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-sm text-slate-400">
                        No data to display
                      </div>
                    </div>
                  </div>

                  <div className={`${glassCard} p-5`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Recent orders</div>
                        <div className="text-xs text-slate-500">Last 10 entries</div>
                      </div>
                      <input className="h-9 w-56 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 placeholder:text-slate-400" placeholder="Search..." />
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-left text-slate-400">
                          <tr>
                            <th className="py-2">Id</th>
                            <th className="py-2">Date Created</th>
                            <th className="py-2">Full Name</th>
                            <th className="py-2">Name</th>
                            <th className="py-2">Admin ID</th>
                            <th className="py-2">Address</th>
                            <th className="py-2">Total</th>
                            <th className="py-2">Action</th>
                          </tr>
                        </thead>
                        <tbody className="text-slate-700">
                          {ordersLoading ? (
                            <tr>
                              <td colSpan={7} className="py-6 text-center text-slate-400">Loading orders...</td>
                            </tr>
                          ) : orders.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-6 text-center text-slate-400">No entries found</td>
                            </tr>
                          ) : (
                            orders.slice(0, 10).map((order) => {
                              const created = new Date(order.createdAt).toLocaleString();
                              const customerEmail = order.customerEmail || '';
                              const customerName = order.customerName || order.name || customerEmail || 'Guest';
                              const customerEmailLabel = customerEmail || 'Not provided';
                              const total = `₹ ${Number(order.totalAmount || 0).toFixed(2)}`;
                              const address = order.shippingAddress || '-';
                              return (
                                <tr key={order.id} className="border-t border-slate-100">
                                  <td className="py-3 pr-4 font-medium text-slate-900">#{order.id.slice(-6)}</td>
                                  <td className="py-3 px-4 text-slate-500">{created}</td>
                                  <td className="py-3 px-4">
                                    <div className="font-medium">{customerName}</div>
                                    <div className="text-xs text-slate-400">{customerEmailLabel}</div>
                                  </td>
                                  <td className="py-3 px-4 truncate max-w-[150px]">{order.items?.[0]?.name || '-'}</td>
                                  <td className="py-3 px-4">
                                    {order.items?.map(it => (it as any).adminProductId).filter(Boolean).join(', ') || '-'}
                                  </td>
                                  <td className="py-3 px-4 max-w-[200px] truncate">{address}</td>
                                  <td className="py-3 px-4 font-semibold">{total}</td>
                                  <td className="py-3 px-4">
                                    <button
                                      onClick={() => setSelectedOrder(order)}
                                      className="text-indigo-600 hover:text-indigo-700 font-medium"
                                    >
                                      View
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <div className="w-full lg:w-80 space-y-6">
                  <div className="rounded-2xl bg-indigo-600 p-5 text-white shadow-sm">
                    <div className="text-sm font-semibold">Today at a glance</div>
                    <div className="mt-3 text-3xl font-semibold">₹ 0.00</div>
                    <div className="mt-2 text-sm text-indigo-100">Daily revenue target</div>
                  </div>
                  <div className={`${glassCard} p-5`}>
                    <div className="text-sm font-semibold text-slate-900 mb-4">Upcoming tasks</div>
                    <div className="space-y-3 text-sm text-slate-600">
                      <div className="flex items-center justify-between">
                        <span>Review new orders</span>
                        <span className="text-xs text-slate-400">Today</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Update featured products</span>
                        <span className="text-xs text-slate-400">Tomorrow</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Plan promotions</span>
                        <span className="text-xs text-slate-400">This week</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeSection === 'orders' && (
            <div
              className={`${glassPanel} rounded-2xl p-5`}
              style={{ backgroundImage: `url(${adminBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                  <ShoppingBag className="h-4 w-4 text-slate-500" />
                  <span>Orders</span>
                </div>
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <input
                    className="h-10 w-56 rounded-full border border-slate-200 bg-white/50 px-4 text-sm text-slate-700 placeholder:text-slate-400 backdrop-blur-md"
                    placeholder="Search orders..."
                  />
                </div>
              </div>

              <div className={glassTable}>
                <table className="w-full text-sm">
                  <thead className="text-left text-slate-400 bg-white/50">
                    <tr>
                      <th className="py-3 px-4">Order ID</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Admin ID(s)</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-700">
                    {ordersLoading ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400">Loading orders...</td>
                      </tr>
                    ) : orders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400">No orders found</td>
                      </tr>
                    ) : (
                      orders.map((order) => {
                        const created = new Date(order.createdAt).toLocaleString();
                        const customerEmail = order.customerEmail || '';
                        const customerName = order.customerName || order.name || customerEmail || 'Guest';
                        const customerEmailLabel = customerEmail || 'Not provided';
                        const total = `₹ ${Number(order.totalAmount || 0).toFixed(2)}`;
                        return (
                          <tr key={order.id} className="border-t border-white/30">
                            <td className="py-3 px-4 font-medium text-slate-900">#{order.id.slice(-6)}</td>
                            <td className="py-3 px-4 text-slate-500">{created}</td>
                            <td className="py-3 px-4">
                              <div className="font-medium">{customerName}</div>
                              <div className="text-xs text-slate-400">{customerEmailLabel}</div>
                            </td>
                            <td className="py-3 px-4">
                              {order.items?.map(it => (it as any).adminProductId).filter(Boolean).join(', ') || '-'}
                            </td>
                            <td className="py-3 px-4 font-semibold">{total}</td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${order.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'pending' ? 'bg-slate-100 text-slate-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                order.paymentMethod === 'cod' ? 'bg-blue-100 text-blue-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                {order.paymentMethod === 'cod' ? 'COD' : order.paymentStatus}
                              </span>
                            </td>
                            <td className="py-3 px-4 flex gap-2">
                              {order.status !== 'Confirmed' && order.status !== 'Cancelled' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, 'Confirmed')}
                                  className="text-xs font-medium bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full hover:bg-indigo-100"
                                >
                                  Confirm
                                </button>
                              )}
                              {order.status !== 'Cancelled' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, 'Cancelled')}
                                  className="text-xs font-medium bg-rose-50 text-rose-700 px-3 py-1 rounded-full hover:bg-rose-100"
                                >
                                  Cancel
                                </button>
                              )}
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="text-xs font-medium bg-slate-900 text-white px-3 py-1 rounded-full hover:bg-slate-800"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === 'products' && (
            <div
              className={`${glassPanel} rounded-2xl p-5`}
              style={{ backgroundImage: `url(${adminBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                  <Package className="h-4 w-4 text-slate-500" />
                  <span>Products</span>
                </div>
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <select
                    value={selectedCollection}
                    onChange={(event) => setSelectedCollection(event.target.value)}
                    className="h-10 rounded-full border border-white/40 bg-white/20 px-4 text-sm text-slate-800 backdrop-blur-xl"
                  >
                    <option value="all">All collections</option>
                    {collections.map((collection) => (
                      <option key={collection.id} value={collection.id}>{collection.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={toggleAddProduct}
                    className="h-10 rounded-full bg-indigo-600 px-5 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    {showAddProduct ? 'Close' : 'Add new product'}
                  </button>
                </div>
              </div>

              <div className={glassTable}>
                <table className="w-full text-sm">
                  <thead className="text-left text-slate-400 bg-white/50">
                    <tr>
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Admin ID</th>
                      <th className="py-3 px-4">Collection</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4">In Stock</th>
                      <th className="py-3 px-4">Date Created</th>
                      <th className="py-3 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-700">
                    {productsLoading ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400">Loading products...</td>
                      </tr>
                    ) : products.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400">No products found</td>
                      </tr>
                    ) : (
                      products.map((product) => {
                        const collectionLabel = collections.find((c) => c.id === product.collection)?.name || product.collection;
                        const created = product.createdAt ? new Date(product.createdAt).toLocaleDateString() : '-';
                        return (
                          <tr key={product.id} className="border-t border-white/30">
                            <td className="py-3 px-4">{product.name}</td>
                            <td className="py-3 px-4">{product.adminProductId || '-'}</td>
                            <td className="py-3 px-4">{collectionLabel}</td>
                            <td className="py-3 px-4">₹ {Number(product.price).toFixed(2)}</td>
                            <td className="py-3 px-4">{product.inStock ? 'Yes' : 'No'}</td>
                            <td className="py-3 px-4">{created}</td>
                            <td className="py-3 px-4">
                              <button
                                type="button"
                                onClick={() => startProductEdit(product)}
                                className="text-indigo-600 hover:text-indigo-700"
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {showAddProduct && (
                <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-slate-700">Product Name</label>
                      <input className="w-full border border-slate-200 rounded-xl px-4 py-2" {...register('name', { required: true })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-slate-700">Collection</label>
                      <select className="w-full border border-slate-200 rounded-xl px-4 py-2" {...register('collection', { required: true })}>
                        <option value="">Select a collection</option>
                        {collections.map((collection) => (
                          <option key={collection.id} value={collection.id}>{collection.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">Collection</label>
                    <input className="w-full border border-slate-200 rounded-xl px-4 py-2 bg-slate-50 text-slate-600" value={formCategory} readOnly />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">Description</label>
                    <textarea className="w-full border border-slate-200 rounded-xl px-4 py-2 min-h-[120px]" {...register('description')} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-slate-700">Price</label>
                      <input type="number" step="0.01" className="w-full border border-slate-200 rounded-xl px-4 py-2" {...register('price', { required: true, valueAsNumber: true })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-slate-700">Original Price</label>
                      <input type="number" step="0.01" className="w-full border border-slate-200 rounded-xl px-4 py-2" {...register('originalPrice', { valueAsNumber: true })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-slate-700">Product Image 1</label>
                      <input type="file" accept="image/*" className="w-full border border-slate-200 rounded-xl px-4 py-2" {...register('imageFile1')} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-slate-700">Product Image 2</label>
                      <input type="file" accept="image/*" className="w-full border border-slate-200 rounded-xl px-4 py-2" {...register('imageFile2')} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-slate-700">Product Image 3</label>
                      <input type="file" accept="image/*" className="w-full border border-slate-200 rounded-xl px-4 py-2" {...register('imageFile3')} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-slate-700">Product Image 4</label>
                      <input type="file" accept="image/*" className="w-full border border-slate-200 rounded-xl px-4 py-2" {...register('imageFile4')} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-slate-700">Product Image 5</label>
                      <input type="file" accept="image/*" className="w-full border border-slate-200 rounded-xl px-4 py-2" {...register('imageFile5')} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">Stock Quantity</label>
                    <input type="number" className="w-full border border-slate-200 rounded-xl px-4 py-2" {...register('stockQuantity', { valueAsNumber: true })} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-slate-700">Star Rating (0.0 to 5.0)</label>
                      <input type="number" step="0.1" min="0" max="5" className="w-full border border-slate-200 rounded-xl px-4 py-2" {...register('rating', { valueAsNumber: true })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-slate-700">Number of Reviews</label>
                      <input type="number" min="0" className="w-full border border-slate-200 rounded-xl px-4 py-2" {...register('reviewCount', { valueAsNumber: true })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">Admin Product ID</label>
                    <input className="w-full border border-slate-200 rounded-xl px-4 py-2" placeholder="SKU or internal ID" {...register('adminProductId')} />
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="h-4 w-4" {...register('inStock')} />
                      <span className="text-sm font-medium text-slate-700">In Stock</span>
                    </div>
                    <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                      <input type="checkbox" className="h-4 w-4 text-amber-600 focus:ring-amber-500 rounded border-amber-300" {...register('siddhAvailable')} />
                      <span className="text-sm font-medium text-amber-900">Siddh / Energized Available (+ ₹49)</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">Tags (comma separated)</label>
                    <input className="w-full border border-slate-200 rounded-xl px-4 py-2" placeholder="rudraksha, bracelet, spiritual" {...register('tags')} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">Specifications</label>
                    <textarea className="w-full border border-slate-200 rounded-xl px-4 py-2 min-h-[120px]" placeholder="size: 8mm&#10;origin: Nepal" {...register('specifications')} />
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button type="submit" disabled={addingProduct} className="bg-indigo-600 text-white px-5 py-2 rounded-full w-full md:w-auto">
                      {addingProduct ? 'Saving...' : isEditingProduct ? 'Update Product' : 'Save Product'}
                    </button>
                    {isEditingProduct && editingProductId && (
                      <button
                        type="button"
                        onClick={() => deleteProductById(editingProductId, editingProduct?.name)}
                        className="bg-rose-50 text-rose-700 px-5 py-2 rounded-full w-full md:w-auto"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}

          {activeSection === 'categories' && (
            <div
              className={`${glassPanel} rounded-2xl p-5`}
              style={{ backgroundImage: `url(${adminBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                  <Tags className="h-4 w-4 text-slate-500" />
                  <span>Collections</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/admin/categories/new')}
                  className="h-10 rounded-full bg-indigo-600 px-5 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Add new collection
                </button>
              </div>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <select className="h-10 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700">
                    <option>10</option>
                    <option>25</option>
                    <option>50</option>
                  </select>
                  <span>entries per page</span>
                </div>
                <input
                  className="h-10 w-56 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 placeholder:text-slate-400"
                  placeholder="Search..."
                />
              </div>
              <div className={glassTable}>
                <table className="w-full text-sm">
                  <thead className="text-left text-slate-400 bg-white/50">
                    <tr>
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Enabled</th>
                      <th className="py-3 px-4">URL Key</th>
                      <th className="py-3 px-4">Date Created</th>
                      <th className="py-3 px-4">Date Modified</th>
                      <th className="py-3 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-700">
                    {collections.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400">No collections found</td>
                      </tr>
                    ) : (
                      [...collections]
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((collection) => {
                          const created = collection.createdAt ? new Date(collection.createdAt).toLocaleString() : '-';
                          const updated = collection.updatedAt ? new Date(collection.updatedAt).toLocaleString() : '-';
                          const urlKey = collection.slug || collection.id;
                          return (
                            <tr key={collection.id} className="border-t border-white/30">
                              <td className="py-3 px-4">{collection.name}</td>
                              <td className="py-3 px-4">
                                <input type="checkbox" checked disabled className="h-4 w-4 accent-indigo-600" />
                              </td>
                              <td className="py-3 px-4">{urlKey}</td>
                              <td className="py-3 px-4">{created}</td>
                              <td className="py-3 px-4">{updated}</td>
                              <td className="py-3 px-4">
                                <button
                                  type="button"
                                  onClick={() => navigate(`/admin/categories/${collection.id}`)}
                                  className="text-indigo-600 hover:text-indigo-700"
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {isCategoryEdit && (
            <div
              className={glassCard}
              style={{ backgroundImage: `url(${adminBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-white/40 px-6 py-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  {categoryRouteId === 'new' ? 'Add collection' : 'Edit collection'}
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => saveCategory(false)}
                    className="h-10 rounded-full bg-indigo-600 px-5 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => saveCategory(true)}
                    className="h-10 rounded-full bg-indigo-50 px-5 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
                  >
                    Save and continue to edit
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/admin')}
                    className="h-10 rounded-full border border-slate-300 px-5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  {categoryRouteId !== 'new' && (
                    <button
                      type="button"
                      onClick={() => {
                        const target = collections.find(x => x.id === categoryRouteId);
                        if (target) deleteCategory(target.id, target.name);
                      }}
                      className="h-10 rounded-full bg-rose-50 px-5 text-sm font-medium text-rose-700 hover:bg-rose-100 ml-auto"
                    >
                      Delete Collection
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-xl">
                  <div className="flex items-center gap-2 border-b border-white/40 px-5 py-3 text-sm font-medium text-slate-700">
                    <span>Info</span>
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                      <input
                        className="w-full border border-slate-200 rounded-xl px-4 py-2"
                        value={categoryForm.name}
                        onChange={(event) => setCategoryForm((prev) => ({ ...prev, name: event.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                      <textarea
                        className="w-full border border-slate-200 rounded-xl px-4 py-2 min-h-[90px]"
                        value={categoryForm.description}
                        onChange={(event) => setCategoryForm((prev) => ({ ...prev, description: event.target.value }))}
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={categoryForm.enabled}
                        onChange={(event) => setCategoryForm((prev) => ({ ...prev, enabled: event.target.checked }))}
                        className="h-4 w-4 accent-indigo-600"
                      />
                      Enabled
                    </label>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-xl">
                  <div className="flex items-center gap-2 border-b border-white/40 px-5 py-3 text-sm font-medium text-slate-700">
                    <span>Search Engine Optimization</span>
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">URL Key</label>
                      <input
                        className="w-full border border-slate-200 rounded-xl px-4 py-2"
                        value={categoryForm.urlKey}
                        onChange={(event) => setCategoryForm((prev) => ({ ...prev, urlKey: event.target.value }))}
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        Allowed characters: letters, digits, dashes (-), dots (.), underscores (_) and tildes (~).
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Meta Title</label>
                      <input
                        className="w-full border border-slate-200 rounded-xl px-4 py-2"
                        value={categoryForm.metaTitle}
                        onChange={(event) => setCategoryForm((prev) => ({ ...prev, metaTitle: event.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Meta Keywords</label>
                      <input
                        className="w-full border border-slate-200 rounded-xl px-4 py-2"
                        value={categoryForm.metaKeywords}
                        onChange={(event) => setCategoryForm((prev) => ({ ...prev, metaKeywords: event.target.value }))}
                      />
                      <p className="text-xs text-slate-400 mt-1">Use a comma-separated list of values.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Meta Description</label>
                      <textarea
                        className="w-full border border-slate-200 rounded-xl px-4 py-2 min-h-[110px]"
                        value={categoryForm.metaDescription}
                        onChange={(event) => setCategoryForm((prev) => ({ ...prev, metaDescription: event.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-xl">
                  <div className="flex items-center gap-2 border-b border-white/40 px-5 py-3 text-sm font-medium text-slate-700">
                    <span>Collection Image</span>
                  </div>
                  <div className="p-5 flex flex-col gap-4">
                    {categoryForm.existingImage && !categoryForm.imageFile && (
                      <div className="w-32 h-32 rounded bg-slate-100 overflow-hidden relative group">
                        <img
                          src={getImageUrl(categoryForm.existingImage)}
                          alt="Current collection"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <input
                        type="file"
                        className="text-sm"
                        onChange={(event) => setCategoryForm((prev) => ({ ...prev, imageFile: event.target.files?.[0] || null }))}
                      />
                      <button
                        type="button"
                        onClick={() => setCategoryForm((prev) => ({ ...prev, imageFile: null, existingImage: null }))}
                        className="h-10 rounded-full border border-slate-300 px-5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                      >
                        Delete Image
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'coupons' && <CouponManager />}
          {activeSection === 'configuration' && <StoreSettings />}
          <Dialog open={Boolean(selectedOrder)} onOpenChange={(open) => !open && setSelectedOrder(null)}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Order Details</DialogTitle>
                <DialogDescription>
                  {selectedOrder ? `Order #${selectedOrder.id.slice(-6)}` : ''}
                </DialogDescription>
              </DialogHeader>
              {selectedOrder && (
                <div className="grid gap-4 text-sm text-slate-700">
                  <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-1">
                        <div className="text-xs uppercase tracking-wider text-slate-400">Customer</div>
                        <div className="text-base font-medium text-slate-900">
                          {selectedOrder.customerName || selectedOrder.name || selectedOrder.customerEmail || 'Guest'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {selectedOrder.customerEmail || 'Not provided'}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs uppercase tracking-wider text-slate-400">Order Date</div>
                        <div className="text-base font-medium text-slate-900">
                          {new Date(selectedOrder.createdAt).toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-500">Updated {new Date(selectedOrder.updatedAt).toLocaleString()}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs uppercase tracking-wider text-slate-400">Status</div>
                        <div className="text-base font-medium text-slate-900">{selectedOrder.status}</div>
                        <div className="text-xs text-slate-500">
                          {selectedOrder.paymentMethod === 'cod' ? 'COD' : selectedOrder.paymentStatus || 'pending'}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs uppercase tracking-wider text-slate-400">Total</div>
                        <div className="text-base font-medium text-slate-900">
                          ₹ {Number(selectedOrder.totalAmount || 0).toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-500">{selectedOrder.paymentMethod || 'razorpay'}</div>
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <div className="text-xs uppercase tracking-wider text-slate-400">Shipping Address</div>
                        <div className="text-base font-medium text-slate-900">
                          {selectedOrder.shippingAddress || 'Not provided'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
                    <div className="text-xs uppercase tracking-wider text-slate-400 mb-3">Items</div>
                    <div className="grid gap-3">
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                        selectedOrder.items.map((item, index) => {
                          const quantity = Number(item.quantity || 0);
                          const price = Number(item.price || 0);
                          const lineTotal = `₹ ${(quantity * price).toFixed(2)}`;
                          return (
                            <div key={item.id || `${item.name}-${index}`} className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                              <div className="flex items-center justify-between gap-3">
                                <div className="font-medium text-slate-900">{item.name}</div>
                                <div className="font-semibold text-slate-900">{lineTotal}</div>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                <span>Qty {quantity}</span>
                                <span>₹ {price.toFixed(2)}</span>
                                {item.adminProductId && <span>Admin ID {item.adminProductId}</span>}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-sm text-slate-500">No items found for this order.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
};

export default Admin;
