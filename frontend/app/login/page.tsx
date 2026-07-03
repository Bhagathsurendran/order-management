"use client";

// app/login/page.tsx
// Login page with animated form, validation, and gradient background.

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/api/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from "react";
import { BarChart2, Eye, EyeOff, Loader2, Lock, User } from "lucide-react";

const schema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [showPwd, setShowPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      const resp = await authApi.login(values.username, values.password);
      if (resp.success) {
        login(resp.data.user, resp.data.access_token, resp.data.refresh_token);
        toast.success(`Welcome back, ${resp.data.user.username}!`);
        router.push("/dashboard");
      } else {
        toast.error(resp.message || "Login failed");
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Invalid username or password"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated gradient blobs (softer for light mode) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-8 shadow-xl shadow-slate-100">
          {/* Logo Title (No Icon) */}
          <div className="flex flex-col items-center mb-8">
            <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-wider">OrderDash</h1>
            <p className="text-slate-400 text-sm mt-1">
              Sign in to your account
            </p>
          </div>

          {/* Default credentials hint */}
          <div className="mb-6 px-4 py-3 rounded-lg bg-violet-50 border border-violet-100">
            <p className="text-xs text-violet-600 text-center">
              Demo credentials:{" "}
              <span className="font-mono font-bold">admin</span> /{" "}
              <span className="font-mono font-bold">Admin@123</span>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Username */}
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-slate-600 text-sm">
                Username
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="username"
                  {...register("username")}
                  placeholder="admin"
                  autoComplete="username"
                  className="pl-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 h-11"
                />
              </div>
              {errors.username && (
                <p className="text-xs text-red-500">{errors.username.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-slate-600 text-sm">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="pl-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 h-11"
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-violet-500/25 transition-all duration-200 hover:shadow-violet-500/40"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
