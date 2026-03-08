import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Edit, Plus, Ticket } from 'lucide-react';

interface Coupon {
    id: string;
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    minCartValue: number;
    isActive: boolean;
    createdAt: string;
}

const CouponManager = () => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const { toast } = useToast();

    const [form, setForm] = useState({
        code: '',
        discountType: 'percentage',
        discountValue: '',
        minCartValue: '0',
        isActive: true
    });

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const data = await apiFetch('/api/admin/coupons');
            setCoupons(data);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load coupons.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                code: form.code,
                discountType: form.discountType,
                discountValue: Number(form.discountValue),
                minCartValue: Number(form.minCartValue),
                isActive: form.isActive
            };

            if (editingId) {
                await apiFetch(`/api/admin/coupons/${editingId}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
                toast({ title: "Success", description: "Coupon updated." });
            } else {
                await apiFetch('/api/admin/coupons', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                toast({ title: "Success", description: "Coupon created." });
            }

            setEditingId(null);
            setShowForm(false);
            resetForm();
            fetchCoupons();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to save coupon.",
                variant: "destructive"
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this coupon?")) return;
        try {
            await apiFetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
            toast({ title: "Success", description: "Coupon deleted." });
            fetchCoupons();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete coupon.",
                variant: "destructive"
            });
        }
    };

    const handleEdit = (c: Coupon) => {
        setEditingId(c.id);
        setForm({
            code: c.code,
            discountType: c.discountType,
            discountValue: c.discountValue.toString(),
            minCartValue: c.minCartValue.toString(),
            isActive: c.isActive
        });
        setShowForm(true);
    };

    const resetForm = () => {
        setForm({
            code: '',
            discountType: 'percentage',
            discountValue: '',
            minCartValue: '0',
            isActive: true
        });
        setEditingId(null);
    };

    if (loading) return <div>Loading coupons...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900 drop-shadow-sm flex items-center gap-2">
                    <Ticket className="w-6 h-6 text-orange-600" /> Coupon Management
                </h2>
                <button
                    onClick={() => {
                        resetForm();
                        setShowForm(!showForm);
                    }}
                    className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-rose-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:shadow-lg transition-all"
                >
                    {showForm ? 'Cancel' : <><Plus className="w-4 h-4" /> Add Coupon</>}
                </button>
            </div>

            {showForm && (
                <div className="bg-white/40 backdrop-blur-xl p-6 rounded-3xl border border-white/40 shadow-xl">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">{editingId ? 'Edit Coupon' : 'Create New Coupon'}</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Coupon Code</label>
                            <input
                                required
                                type="text"
                                placeholder="e.g. SUMMER50"
                                value={form.code}
                                onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                className="w-full bg-white/60 border border-slate-200 rounded-xl px-4 py-2 uppercase"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Discount Type</label>
                            <select
                                value={form.discountType}
                                onChange={e => setForm({ ...form, discountType: e.target.value as 'percentage' | 'fixed' })}
                                className="w-full bg-white/60 border border-slate-200 rounded-xl px-4 py-2"
                            >
                                <option value="percentage">Percentage (%)</option>
                                <option value="fixed">Fixed Amount (₹)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Discount Value</label>
                            <input
                                required
                                type="number"
                                min="1"
                                placeholder={form.discountType === 'percentage' ? "e.g. 10 (for 10%)" : "e.g. 100"}
                                value={form.discountValue}
                                onChange={e => setForm({ ...form, discountValue: e.target.value })}
                                className="w-full bg-white/60 border border-slate-200 rounded-xl px-4 py-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Minimum Cart Value (₹)</label>
                            <input
                                required
                                type="number"
                                min="0"
                                value={form.minCartValue}
                                onChange={e => setForm({ ...form, minCartValue: e.target.value })}
                                className="w-full bg-white/60 border border-slate-200 rounded-xl px-4 py-2"
                            />
                        </div>

                        <div className="flex items-center gap-2 mt-6">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={form.isActive}
                                onChange={e => setForm({ ...form, isActive: e.target.checked })}
                                className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500"
                            />
                            <label htmlFor="isActive" className="text-sm font-medium text-slate-700">Active / Enabled</label>
                        </div>

                        <div className="md:col-span-2 flex justify-end gap-3 mt-4 border-t border-slate-200/50 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-6 py-2 rounded-xl text-slate-600 bg-white/60 border border-slate-200 font-medium hover:bg-slate-100"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800"
                            >
                                {editingId ? 'Update Coupon' : 'Save Coupon'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white/40 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900/5 text-slate-700 text-sm border-b border-slate-200">
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Code</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Discount</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Min Cart</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/50">
                            {coupons.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        No coupons found. Create your first coupon above!
                                    </td>
                                </tr>
                            ) : (
                                coupons.map((c) => (
                                    <tr key={c.id} className="hover:bg-white/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-slate-900 px-3 py-1 bg-slate-100 rounded-md tracking-wider">
                                                {c.code}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 font-medium">
                                            {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {c.minCartValue > 0 ? `₹${c.minCartValue}` : 'None'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${c.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                {c.isActive ? 'Active' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleEdit(c)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors mr-2">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(c.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CouponManager;
