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
import { authService } from "@/services/auth.service";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, isAuthenticated } = useAuthStore();
  const [showPassword, setShowPassword] = React.useState(false);
  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
  });

  React.useEffect(() => {
    const token = authService.getToken();
    if (token) {
      router.replace("/dashboard");
    }
  }, [router]);

  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
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
      {/* Left Panel — Brand & Illustration */}
      <div className="relative hidden w-[52%] overflow-hidden bg-[#0a1628] lg:flex lg:flex-col lg:justify-between">
        {/* Subtle grid pattern */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Gradient orbs for depth */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-indigo-500/8 blur-3xl" />
        <div className="pointer-events-none absolute right-1/4 top-1/3 h-64 w-64 rounded-full bg-cyan-400/5 blur-2xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-1 flex-col justify-between p-10 xl:p-14">
          {/* Logo */}
          <div>
            <Image
              src="/images/tuv-nord-logo.png"
              alt="TÜV NORD"
              width={120}
              height={32}
              className="brightness-0 invert"
              priority
            />
          </div>

          {/* Center illustration & text */}
          <div className="my-auto space-y-10">
            {/* HRIS Illustration */}
            <div className="flex justify-center">
              <svg
                width="280"
                height="220"
                viewBox="0 0 280 220"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="opacity-90"
              >
                {/* Dashboard frame */}
                <rect x="30" y="20" width="220" height="150" rx="12" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5" />
                <rect x="30" y="20" width="220" height="30" rx="12" fill="rgba(148,163,184,0.08)" />
                <rect x="30" y="38" width="220" height="12" fill="rgba(148,163,184,0.08)" />
                {/* Window dots */}
                <circle cx="48" cy="35" r="3.5" fill="rgba(248,113,113,0.6)" />
                <circle cx="60" cy="35" r="3.5" fill="rgba(251,191,36,0.6)" />
                <circle cx="72" cy="35" r="3.5" fill="rgba(74,222,128,0.6)" />

                {/* Sidebar */}
                <rect x="30" y="50" width="55" height="120" fill="rgba(148,163,184,0.05)" />
                <line x1="85" y1="50" x2="85" y2="170" stroke="rgba(148,163,184,0.15)" strokeWidth="1" />
                {/* Sidebar items */}
                <rect x="42" y="64" width="28" height="4" rx="2" fill="rgba(96,165,250,0.5)" />
                <rect x="42" y="78" width="22" height="4" rx="2" fill="rgba(148,163,184,0.2)" />
                <rect x="42" y="92" width="26" height="4" rx="2" fill="rgba(148,163,184,0.2)" />
                <rect x="42" y="106" width="20" height="4" rx="2" fill="rgba(148,163,184,0.2)" />
                <rect x="42" y="120" width="24" height="4" rx="2" fill="rgba(148,163,184,0.2)" />

                {/* Main content area — stat cards */}
                <rect x="98" y="60" width="44" height="36" rx="6" fill="rgba(96,165,250,0.12)" stroke="rgba(96,165,250,0.25)" strokeWidth="1" />
                <rect x="106" y="69" width="16" height="5" rx="2" fill="rgba(96,165,250,0.5)" />
                <rect x="106" y="79" width="24" height="3" rx="1.5" fill="rgba(148,163,184,0.2)" />

                <rect x="150" y="60" width="44" height="36" rx="6" fill="rgba(129,140,248,0.12)" stroke="rgba(129,140,248,0.25)" strokeWidth="1" />
                <rect x="158" y="69" width="16" height="5" rx="2" fill="rgba(129,140,248,0.5)" />
                <rect x="158" y="79" width="24" height="3" rx="1.5" fill="rgba(148,163,184,0.2)" />

                <rect x="202" y="60" width="44" height="36" rx="6" fill="rgba(52,211,153,0.12)" stroke="rgba(52,211,153,0.25)" strokeWidth="1" />
                <rect x="210" y="69" width="16" height="5" rx="2" fill="rgba(52,211,153,0.5)" />
                <rect x="210" y="79" width="24" height="3" rx="1.5" fill="rgba(148,163,184,0.2)" />

                {/* Chart area */}
                <rect x="98" y="106" width="92" height="54" rx="6" fill="rgba(148,163,184,0.05)" stroke="rgba(148,163,184,0.15)" strokeWidth="1" />
                {/* Bar chart */}
                <rect x="110" y="140" width="8" height="12" rx="2" fill="rgba(96,165,250,0.4)" />
                <rect x="122" y="130" width="8" height="22" rx="2" fill="rgba(96,165,250,0.5)" />
                <rect x="134" y="125" width="8" height="27" rx="2" fill="rgba(96,165,250,0.6)" />
                <rect x="146" y="134" width="8" height="18" rx="2" fill="rgba(96,165,250,0.45)" />
                <rect x="158" y="120" width="8" height="32" rx="2" fill="rgba(96,165,250,0.7)" />
                <rect x="170" y="128" width="8" height="24" rx="2" fill="rgba(96,165,250,0.55)" />

                {/* Table/list area */}
                <rect x="200" y="106" width="46" height="54" rx="6" fill="rgba(148,163,184,0.05)" stroke="rgba(148,163,184,0.15)" strokeWidth="1" />
                <rect x="208" y="116" width="30" height="3" rx="1.5" fill="rgba(148,163,184,0.25)" />
                <rect x="208" y="125" width="24" height="3" rx="1.5" fill="rgba(148,163,184,0.15)" />
                <rect x="208" y="134" width="28" height="3" rx="1.5" fill="rgba(148,163,184,0.15)" />
                <rect x="208" y="143" width="20" height="3" rx="1.5" fill="rgba(148,163,184,0.15)" />

                {/* People icons below dashboard */}
                <circle cx="100" cy="198" r="10" fill="rgba(96,165,250,0.15)" stroke="rgba(96,165,250,0.3)" strokeWidth="1" />
                <circle cx="100" cy="195" r="3.5" fill="rgba(96,165,250,0.4)" />
                <path d="M93 204a7 7 0 0114 0" stroke="rgba(96,165,250,0.4)" strokeWidth="1.2" fill="none" />

                <circle cx="140" cy="198" r="10" fill="rgba(129,140,248,0.15)" stroke="rgba(129,140,248,0.3)" strokeWidth="1" />
                <circle cx="140" cy="195" r="3.5" fill="rgba(129,140,248,0.4)" />
                <path d="M133 204a7 7 0 0114 0" stroke="rgba(129,140,248,0.4)" strokeWidth="1.2" fill="none" />

                <circle cx="180" cy="198" r="10" fill="rgba(52,211,153,0.15)" stroke="rgba(52,211,153,0.3)" strokeWidth="1" />
                <circle cx="180" cy="195" r="3.5" fill="rgba(52,211,153,0.4)" />
                <path d="M173 204a7 7 0 0114 0" stroke="rgba(52,211,153,0.4)" strokeWidth="1.2" fill="none" />

                {/* Connection lines */}
                <line x1="110" y1="198" x2="130" y2="198" stroke="rgba(148,163,184,0.2)" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="150" y1="198" x2="170" y2="198" stroke="rgba(148,163,184,0.2)" strokeWidth="1" strokeDasharray="3 3" />
              </svg>
            </div>

            {/* Heading */}
            <div className="space-y-3 text-center">
              <h1 className="text-2xl font-semibold tracking-tight text-white xl:text-3xl">
                Human Resource
                <br />
                Information System
              </h1>
              <p className="mx-auto max-w-sm text-sm leading-relaxed text-slate-400">
                A centralized platform to manage your workforce, streamline HR processes, and drive organizational growth.
              </p>
            </div>

          </div>

          {/* Footer */}
          <p className="text-xs text-slate-600">
            &copy; {new Date().getFullYear()} PT TÜV Nord Indonesia. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="relative flex flex-1 flex-col items-center justify-center bg-white px-6 py-12 sm:px-12 lg:px-16 xl:px-24">
        {/* Subtle background texture */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(225,231,244,0.4)_0%,transparent_60%)]" />

        <div className="relative w-full max-w-[400px]">
          {/* Mobile logo — shown only on small screens */}
          <div className="mb-8 text-center lg:hidden">
            <Image
              src="/images/tuv-nord-logo.png"
              alt="TÜV NORD"
              width={120}
              height={32}
              className="mx-auto mb-3"
              priority
            />
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Welcome back
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              Sign in to access the HRIS dashboard and manage your workforce.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-out ${
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
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-11"
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="h-11 pr-10"
                  required
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Submit */}
            <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>

            <div className="text-center">
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Forgot password?
              </Link>
            </div>
          </form>
        </div>

        {/* Mobile footer */}
        <p className="mt-12 text-center text-xs text-muted-foreground lg:hidden">
          &copy; {new Date().getFullYear()} PT TÜV Nord Indonesia. All rights reserved.
        </p>
      </div>
    </div>
  );
}
