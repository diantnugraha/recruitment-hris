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
    <div
      className="relative flex min-h-screen items-center justify-center px-4"
      style={{
        backgroundColor: "var(--hsd-ui-color-gray-100)",
        fontFamily: "Poppins, sans-serif",
      }}
    >
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
        {/* Card — TUV: 8px radius, 1px gray border, white bg */}
        <div
          className="bg-white p-8"
          style={{
            borderRadius: "8px",
            border: "1px solid rgba(120, 134, 127, 0.2)",
            boxShadow: "0px 4px 35px 0px rgba(112, 144, 176, 0.25)",
          }}
        >
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
            <h1
              className="text-lg"
              style={{
                color: "var(--hsd-ui-color-gray-900)",
                fontWeight: 500,
              }}
            >
              Reset Password
            </h1>
            <p
              className="mt-2 text-[13px] leading-relaxed"
              style={{
                color: "var(--hsd-ui-color-gray-500)",
                fontWeight: 300,
              }}
            >
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
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full"
                  style={{ backgroundColor: "var(--hsd-ui-color-green-50)" }}
                >
                  <CheckCircle
                    className="h-8 w-8"
                    style={{ color: "var(--hsd-ui-color-green-600)" }}
                  />
                </div>
                <div className="text-center">
                  <p
                    className="text-sm"
                    style={{
                      color: "var(--hsd-ui-color-gray-900)",
                      fontWeight: 400,
                    }}
                  >
                    Email Sent!
                  </p>
                  <p
                    className="mt-1 text-[13px]"
                    style={{
                      color: "var(--hsd-ui-color-gray-500)",
                      fontWeight: 300,
                    }}
                  >
                    We&apos;ve sent a password reset link to<br />
                    <span style={{ fontWeight: 400, color: "var(--hsd-ui-color-gray-900)" }}>
                      {email}
                    </span>
                  </p>
                </div>
              </div>

              <Link href="/login">
                <Button
                  variant="outline"
                  className="w-full"
                  style={{
                    height: "40px",
                    borderRadius: "4px",
                    fontSize: "0.875rem",
                    fontWeight: 400,
                    color: "var(--hsd-ui-color-gray-900)",
                    borderColor: "rgba(120, 134, 127, 0.2)",
                  }}
                >
                  <ArrowLeft />
                  Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label
                  htmlFor="email"
                  className="text-sm"
                  style={{
                    color: "var(--hsd-ui-color-gray-900)",
                    fontWeight: 400,
                  }}
                >
                  Email
                </Label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                    style={{ color: "var(--hsd-ui-color-gray-500)" }}
                  />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* TUV Primary Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                style={{
                  backgroundColor: "var(--hsd-ui-color-navy-500)",
                  color: "var(--hsd-ui-color-gray-50)",
                  borderColor: "var(--hsd-ui-color-navy-500)",
                  height: "40px",
                  borderRadius: "4px",
                  fontSize: "0.875rem",
                  fontWeight: 400,
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center text-sm transition-colors"
                  style={{
                    color: "var(--hsd-ui-color-navy-500)",
                    fontWeight: 300,
                  }}
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <p
          className="mt-8 text-center text-xs"
          style={{ color: "var(--hsd-ui-color-gray-500)", fontWeight: 300 }}
        >
          &copy; {new Date().getFullYear()} PT TÜV Nord Indonesia. All rights reserved.
        </p>
      </div>
    </div>
  );
}
