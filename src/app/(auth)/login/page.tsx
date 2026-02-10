"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from "lucide-react";
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

  // Redirect if already authenticated
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
    <div className="flex min-h-screen">
      {/* Left Panel - Brand */}
      <div className="relative hidden w-1/2 overflow-hidden bg-foreground lg:block">
        {/* Decorative circles */}
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-accent/20" />
        <div className="absolute -bottom-48 -right-48 h-[500px] w-[500px] rounded-full bg-accent/10" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/5" />

        {/* Content */}
        <div className="relative flex h-full flex-col justify-between p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent">
              <span className="font-semibold text-xl font-semibold text-accent-foreground">Q</span>
            </div>
            <div>
              <span className="text-xl font-semibold text-background">QuoHRIS</span>
              <p className="text-xs uppercase tracking-widest text-background/50">HR Platform</p>
            </div>
          </div>

          {/* Main content */}
          <div className="max-w-md space-y-8">
            <div className="space-y-4">
              <h1 className="font-semibold text-5xl font-medium leading-tight text-background">
                Manage your workforce with confidence
              </h1>
              <p className="text-lg text-background/60">
                Streamline HR operations, recruitment, and employee management in one elegant platform.
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-12">
              <div>
                <p className="font-semibold text-4xl font-medium text-accent">1,284</p>
                <p className="text-sm text-background/50">Active Employees</p>
              </div>
              <div>
                <p className="font-semibold text-4xl font-medium text-accent">98%</p>
                <p className="text-sm text-background/50">Satisfaction Rate</p>
              </div>
              <div>
                <p className="font-semibold text-4xl font-medium text-accent">45</p>
                <p className="text-sm text-background/50">New Hires</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-sm text-background/40">
            <p>© 2024 QuoHRIS. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="#" className="transition-colors hover:text-background/70">Privacy</Link>
              <Link href="#" className="transition-colors hover:text-background/70">Terms</Link>
              <Link href="#" className="transition-colors hover:text-background/70">Support</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex w-full flex-col justify-center px-6 lg:w-1/2 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Logo */}
          <div className="mb-12 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
              <span className="font-semibold text-lg font-semibold text-accent-foreground">Q</span>
            </div>
            <span className="text-lg font-semibold">QuoHRIS</span>
          </div>

          {/* Header */}
          <div className="mb-10 space-y-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Welcome back</p>
            <h2 className="font-semibold text-3xl font-medium tracking-tight">
              Sign in to your account
            </h2>
            <p className="text-muted-foreground">
              Enter your credentials to access the dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message with smooth transition */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                error && !isLoading
                  ? "max-h-20 opacity-100"
                  : "max-h-0 opacity-0"
              }`}
            >
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-12 bg-secondary/30 px-4 transition-all duration-200 focus:bg-background"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Link
                    href="#"
                    className="text-sm text-accent transition-colors hover:text-accent/80"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="h-12 bg-secondary/30 px-4 pr-12 transition-all duration-200 focus:bg-background"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
              />
              <label htmlFor="remember" className="text-sm text-muted-foreground">
                Keep me signed in for 30 days
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="h-12 w-full text-base"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
