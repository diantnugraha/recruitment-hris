"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Loader2, Mail, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // TODO: Implement actual API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsLoading(false);
    setIsSubmitted(true);
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
            <h1 className="text-lg font-semibold text-foreground">Reset Password</h1>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              {isSubmitted
                ? "Check your email for reset instructions."
                : "Enter your email address and we'll send you a link to reset your password."
              }
            </p>
          </div>

          {isSubmitted ? (
            /* Success State */
            <div className="space-y-5">
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">Email Sent!</p>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    We've sent a password reset link to<br />
                    <span className="font-medium text-foreground">{email}</span>
                  </p>
                </div>
              </div>

              <Link href="/login">
                <Button variant="outline" className="h-11 w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="h-11 w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} PT TÜV Nord Indonesia. All rights reserved.
        </p>
      </div>
    </div>
  );
}
