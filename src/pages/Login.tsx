import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";

type FormValues = {
  email: string;
  password: string;
};

const Login = () => {
  const { login, user, isAuthenticated, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit } = useForm<FormValues>();

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      toast({ title: "Signed in", description: "Checking account access..." });
    } catch (e) {
      toast({ title: "Login failed", description: String(e) });
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    if (user?.role === "admin") {
      toast({ title: "Customer access only", description: "Please use the admin login page." });
      logout();
      setLoading(false);
      return;
    }
    navigate("/");
  }, [isAuthenticated, user, navigate, toast, logout]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f9f4e5]">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-orange-900">Login</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input type="email" placeholder="you@example.com" {...register("email", { required: true })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <Input type="password" placeholder="••••••••" {...register("password", { required: true })} />
          </div>
          <Button type="submit" disabled={loading} className="bg-orange-700 hover:bg-orange-800 text-white">
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>
        <p className="text-sm mt-4">
          Don't have an account? <Link to="/signup" className="text-orange-700 underline">Sign up</Link>
        </p>
      </main>
      <Footer />
    </div>
  );
};

export default Login;
