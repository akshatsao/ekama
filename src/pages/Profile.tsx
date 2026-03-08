import Header from "@/components/Header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useWishlist } from "@/hooks/use-wishlist";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, BASE_URL } from "@/lib/api";
import { CreditCard, Settings, ShoppingBag, Sparkles, Heart, ChevronLeft, User } from "lucide-react";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f1f3f6]">
        <Header />
        <main className="flex-1 max-w-[1100px] mx-auto px-4 py-20 text-center">
          <div className="bg-white rounded-3xl p-12 shadow-sm border border-slate-100 max-w-lg mx-auto">
            <User className="h-16 w-16 text-slate-200 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Your Account</h1>
            <p className="text-slate-500 mb-8">Please login to manage your sacred items and orders.</p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center bg-orange-600 text-white font-bold py-4 px-10 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              Login to Profile
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const menuItems = [
    {
      label: "My Orders",
      icon: ShoppingBag,
      path: "/profile/orders",
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      label: "Profile Information",
      icon: User,
      path: "/profile/info",
      color: "text-orange-600",
      bg: "bg-orange-50"
    },
    {
      label: "Manage Addresses",
      icon: CreditCard,
      path: "/profile/addresses",
      color: "text-purple-600",
      bg: "bg-purple-50"
    },
    {
      label: "My Wishlist",
      icon: Heart,
      path: "/profile/wishlist",
      color: "text-rose-600",
      bg: "bg-rose-50"
    },
    {
      label: "Support",
      icon: Sparkles,
      path: "/#support",
      color: "text-teal-600",
      bg: "bg-teal-50"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f3f6]">
      <Header />
      <main className="flex-1 max-w-[1100px] mx-auto w-full px-4 py-8 md:py-12">

        <button
          onClick={() => navigate("/")}
          className="flex items-center justify-center h-10 w-10 bg-white rounded-full text-slate-600 hover:text-orange-600 hover:bg-orange-50 mb-6 shadow-sm border border-slate-100 transition-all"
        >
          <ChevronLeft className="h-6 w-6 pr-0.5" />
        </button>

        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row items-center gap-6">
          <Avatar className="h-20 w-20 ring-4 ring-orange-50">
            <AvatarImage src="/images/avatar-placeholder.png" alt="User" />
            <AvatarFallback className="text-xl bg-orange-100 text-orange-700 font-bold">
              {user?.firstName?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="text-center md:text-left flex-1">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Welcome back,</p>
            <h2 className="text-2xl font-bold text-slate-900">
              {user?.firstName ? `${user.firstName} ${user.lastName ?? ""}` : "Guest"}
            </h2>
            <p className="text-sm text-orange-600 font-medium">{user?.phone || user?.email}</p>
          </div>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="text-xs font-bold text-red-500 hover:text-red-700 underline underline-offset-4 transition-colors px-4 py-2"
          >
            Logout from Account
          </button>
        </div>

        {/* Navigation Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="flex items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-50 hover:border-orange-200 hover:shadow-md transition-all group group-active:scale-[0.98]"
            >
              <div className={`${item.bg} ${item.color} p-3 rounded-xl group-hover:scale-110 transition-transform`}>
                <item.icon className="h-6 w-6" />
              </div>
              <div className="text-left flex-1">
                <p className="text-base font-bold text-slate-900">{item.label}</p>
              </div>
              <ChevronLeft className="h-5 w-5 text-slate-300 rotate-180 group-hover:text-orange-600 transition-colors" />
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Profile;
