import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import { ChevronLeft, MapPin, MoreVertical, Trash2, Edit2, Plus } from "lucide-react";
import { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";

interface Address {
    id: string;
    label: "HOME" | "WORK";
    name: string;
    phone: string;
    pincode: string;
    locality: string;
    addressLine: string;
    city: string;
    state: string;
    landmark?: string;
    altPhone?: string;
}

const ManageAddresses = () => {
    const { token, user, logout } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isAddingAddress, setIsAddingAddress] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
    const [openAddressMenuId, setOpenAddressMenuId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [addressForm, setAddressForm] = useState({
        name: "",
        phone: "",
        pincode: "",
        locality: "",
        addressLine: "",
        city: "",
        state: "",
        landmark: "",
        altPhone: "",
        label: "HOME" as Address["label"],
    });

    const fetchAddresses = async () => {
        if (!token) return;
        try {
            setLoading(true);
            const res = await apiFetch('/api/users/addresses', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res?.data?.addresses) {
                setAddresses(res.data.addresses as Address[]);
            }
        } catch (e) {
            console.error("Failed to fetch addresses", e);
            toast({ title: "Failed to load addresses", description: String(e) });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAddresses();
    }, [token]);

    const updateAddressField = (field: keyof typeof addressForm) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setAddressForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

    const handleSaveAddress = async () => {
        if (!token) return;
        try {
            if (editingAddressId) {
                const res = await apiFetch(`/api/users/addresses/${editingAddressId}`, {
                    method: "PATCH",
                    headers: { Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ address: addressForm }),
                });
                if (res?.data?.addresses) setAddresses(res.data.addresses as Address[]);
            } else {
                const res = await apiFetch('/api/users/addresses', {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ address: addressForm }),
                });
                if (res?.data?.addresses) setAddresses(res.data.addresses as Address[]);
            }
            toast({ title: editingAddressId ? "Address updated" : "Address saved" });
            setIsAddingAddress(false);
            setEditingAddressId(null);
            setAddressForm({
                name: "", phone: "", pincode: "", locality: "", addressLine: "",
                city: "", state: "", landmark: "", altPhone: "", label: "HOME"
            });
        } catch (e) {
            toast({ title: "Error", description: String(e) });
        }
    };

    const handleDeleteAddress = async (id: string) => {
        if (!token) return;
        try {
            await apiFetch(`/api/users/addresses/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            setAddresses(prev => prev.filter(a => a.id !== id));
            toast({ title: "Address deleted" });
        } catch (e) {
            toast({ title: "Error", description: String(e) });
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen flex flex-col bg-[#f1f3f6]">
            <Header />
            <main className="flex-1 max-w-[1100px] mx-auto w-full px-4 py-8 md:py-12">
                <button
                    onClick={() => navigate("/profile")}
                    className="flex items-center justify-center h-10 w-10 bg-white rounded-full text-slate-600 hover:text-orange-600 hover:bg-orange-50 mb-6 shadow-sm border border-slate-100 transition-all"
                >
                    <ChevronLeft className="h-6 w-6 pr-0.5" />
                </button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <h1 className="text-2xl font-bold text-slate-900">Manage Addresses</h1>
                    {!isAddingAddress && (
                        <Button
                            onClick={() => setIsAddingAddress(true)}
                            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-all active:scale-95"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Add New Address
                        </Button>
                    )}
                </div>

                {isAddingAddress ? (
                    <Card className="bg-white rounded-2xl shadow-lg border-none mb-8">
                        <CardContent className="p-6 md:p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</p>
                                    <input
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                                        placeholder="Recipient's Name"
                                        value={addressForm.name}
                                        onChange={updateAddressField("name")}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</p>
                                    <input
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                                        placeholder="10-digit mobile number"
                                        value={addressForm.phone}
                                        onChange={updateAddressField("phone")}
                                        maxLength={10}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pincode</p>
                                    <input
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                                        placeholder="6-digit pincode"
                                        value={addressForm.pincode}
                                        onChange={updateAddressField("pincode")}
                                        maxLength={6}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Locality</p>
                                    <input
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                                        placeholder="e.g. Sector 12, Area Name"
                                        value={addressForm.locality}
                                        onChange={updateAddressField("locality")}
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Address Line</p>
                                    <textarea
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                                        placeholder="House No, Building, Street Name"
                                        rows={3}
                                        value={addressForm.addressLine}
                                        onChange={updateAddressField("addressLine")}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">City</p>
                                    <input
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                                        placeholder="City/District/Town"
                                        value={addressForm.city}
                                        onChange={updateAddressField("city")}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">State</p>
                                    <input
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                                        placeholder="State"
                                        value={addressForm.state}
                                        onChange={updateAddressField("state")}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Address Type</p>
                                <div className="flex gap-4">
                                    {["HOME", "WORK"].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setAddressForm(prev => ({ ...prev, label: type as any }))}
                                            className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all font-bold text-xs ${addressForm.label === type
                                                ? "border-orange-600 bg-orange-50 text-orange-700"
                                                : "border-slate-100 bg-slate-50 text-slate-500"
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button
                                    onClick={handleSaveAddress}
                                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all"
                                >
                                    {editingAddressId ? "Update Address" : "Save Address"}
                                </Button>
                                <button
                                    onClick={() => setIsAddingAddress(false)}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-4 rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                ) : null}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {loading ? (
                        <div className="col-span-full py-20 text-center text-slate-400 font-medium">Loading your addresses...</div>
                    ) : addresses.length === 0 ? (
                        <div className="col-span-full bg-white rounded-2xl p-20 text-center border-2 border-dashed border-slate-200">
                            <MapPin className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-500 font-medium">No addresses saved yet.</p>
                        </div>
                    ) : (
                        addresses.map((addr) => (
                            <Card key={addr.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 relative group overflow-hidden">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="px-3 py-1 bg-orange-50 text-orange-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                                            {addr.label}
                                        </span>
                                        <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => {
                                                    setAddressForm(addr as any);
                                                    setEditingAddressId(addr.id);
                                                    setIsAddingAddress(true);
                                                }}
                                                className="p-2 text-slate-400 hover:text-orange-600 transition-colors"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteAddress(addr.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-base font-bold text-slate-900">{addr.name}</p>
                                        <p className="text-sm font-semibold text-orange-700">{addr.phone}</p>
                                        <p className="text-sm text-slate-600 line-clamp-2 mt-2">
                                            {addr.addressLine}, {addr.locality}, {addr.city}, {addr.state} - {addr.pincode}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
};

export default ManageAddresses;
