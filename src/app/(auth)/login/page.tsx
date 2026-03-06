"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, isAuthenticated } = useAuthStore();
  const [showPassword, setShowPassword] = React.useState(false);
  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
  });

  React.useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login({
      email: formData.email,
      password: formData.password,
    });
    if (success) {
      router.push("/dashboard");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#f5f5f7] px-4">
      {/* Geometric background pattern */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden bg-gradient-to-br from-[#f0f0f0] to-[#e8e8e8]">
        <svg
          className="absolute inset-0 h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#f5f5f5" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="grad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e0e0e0" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#f8f8f8" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="grad3" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#d8d8d8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.7" />
            </linearGradient>
          </defs>
          {/* Large diagonal shapes covering full area */}
          <polygon points="0,0 60,0 0,50" fill="url(#grad1)" />
          <polygon points="60,0 100,0 100,40 30,70 0,50 0,30" fill="#ffffff" fillOpacity="0.7" />
          <polygon points="100,0 100,40 70,60 50,40 70,0" fill="url(#grad2)" />
          <polygon points="0,50 30,70 20,100 0,100" fill="#f0f0f0" fillOpacity="0.6" />
          <polygon points="30,70 100,40 100,100 20,100" fill="url(#grad3)" />
          <polygon points="50,40 70,60 100,40 100,70 80,90 40,60" fill="#ffffff" fillOpacity="0.5" />
          <polygon points="0,70 20,60 35,80 20,100 0,100" fill="#e8e8e8" fillOpacity="0.4" />
          <polygon points="80,90 100,70 100,100 60,100" fill="#ffffff" fillOpacity="0.6" />
        </svg>
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl bg-white p-8 shadow-sm shadow-black/[0.04] ring-1 ring-black/[0.06]">
          {/* Logo & Header */}
          <div className="mb-8 text-center">
            <Image
              src="/images/tuv-nord-logo.png"
              alt="TÜV NORD"
              width={140}
              height={36}
              className="mx-auto mb-4"
              priority
            />
            <h1 className="text-lg font-semibold text-foreground">HRIS Portal</h1>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              Sign in to access the HRIS dashboard and manage your workforce.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error */}
            <div
              className={`overflow-hidden transition-all duration-300 ${
                error && !isLoading ? "max-h-16 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-11"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="h-11 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button type="submit" className="h-11 w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>

            <div className="text-center">
              <Link
                href="/forgot-password"
                className="text-sm text-[#004B93] hover:text-[#003d7a] transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} PT TÜV Nord Indonesia. All rights reserved.
        </p>
      </div>
    </div>
  );
}
