import Header from "@/components/Header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ProfileInfo = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

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

                <div className="max-w-2xl mx-auto space-y-6">
                    <h1 className="text-2xl font-bold text-slate-900 px-1">Profile Information</h1>

                    <Card className="bg-white rounded-2xl shadow-md border-none overflow-hidden">
                        <CardContent className="p-8 space-y-8">
                            <div className="flex flex-col items-center gap-4 pb-4 border-b border-slate-100">
                                <Avatar className="h-24 w-24 ring-4 ring-orange-50">
                                    <AvatarImage src="/images/avatar-placeholder.png" alt="User" />
                                    <AvatarFallback className="text-2xl bg-orange-100 text-orange-700 font-bold">
                                        {user?.firstName?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="text-center">
                                    <p className="text-xl font-bold text-slate-900">
                                        {user?.firstName ? `${user.firstName} ${user.lastName ?? ""}` : "Guest User"}
                                    </p>
                                    <p className="text-sm text-slate-500">Sacred Customer</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Full Name</p>
                                    <p className="text-base font-semibold text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        {user?.firstName ? `${user.firstName} ${user.lastName ?? ""}` : "Not provided"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Email Address</p>
                                    <p className="text-base font-semibold text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        {user?.email ?? "Not provided"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Mobile Number</p>
                                    <p className="text-base font-semibold text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        {user?.phone || "+91 0000000000"}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button
                                    type="button"
                                    className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-4 rounded-xl border border-red-100 transition-all active:scale-95"
                                    onClick={() => {
                                        logout();
                                        navigate("/login");
                                    }}
                                >
                                    Logout from Account
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default ProfileInfo;
