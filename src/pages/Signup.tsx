import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";

type FormValues = {
  firstName: string;
  lastName?: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const Signup = () => {
  const { signup } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch } = useForm<FormValues>();

  const onSubmit = async (values: FormValues) => {
    if (values.password !== values.confirmPassword) {
      toast({ title: "Passwords do not match" });
      return;
    }
    setLoading(true);
    try {
      await signup({ email: values.email, password: values.password, firstName: values.firstName, lastName: values.lastName, phone: values.phone });
      toast({ title: "Account created", description: "Welcome!" });
      navigate("/");
    } catch (e) {
      toast({ title: "Signup failed", description: String(e) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f9f4e5]">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-orange-900">Sign Up</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">First Name</label>
            <Input placeholder="First name" {...register("firstName", { required: true })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Last Name</label>
            <Input placeholder="Last name" {...register("lastName")} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mobile Number</label>
            <Input type="tel" placeholder="Mobile number" {...register("phone", { required: true, pattern: /^[0-9]{10}$/ })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input type="email" placeholder="you@example.com" {...register("email", { required: true })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <Input type="password" placeholder="Create password" {...register("password", { required: true, minLength: 6 })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <Input type="password" placeholder="Repeat password" {...register("confirmPassword", { required: true, validate: (val) => val === watch("password") })} />
          </div>
          <Button type="submit" disabled={loading} className="bg-orange-700 hover:bg-orange-800 text-white">
            {loading ? "Signing up..." : "Sign Up"}
          </Button>
        </form>
        <p className="text-sm mt-4">
          Already have an account? <Link to="/login" className="text-orange-700 underline">Login</Link>
        </p>
      </main>
      <Footer />
    </div>
  );
};

export default Signup;
