"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Sidebar } from "@/components/layout/sidebar";
import { useAuthStore } from "@/stores/auth-store";
import { authService } from "@/services/auth.service";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if token exists in localStorage (source of truth)
    const token = authService.getToken();

    if (!token) {
      // Token gone (cleared storage, expired, etc.) — force logout state & redirect
      useAuthStore.setState({
        user: null,
        token: null,
        isAuthenticated: false,
      });
      router.replace("/login");
      return;
    }

    setIsChecking(false);
  }, [router]);

  // Listen for storage changes (e.g. user clears localStorage from another tab or devtools)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // If auth_token or the zustand persist key is removed/cleared
      if (
        e.key === "auth_token" ||
        e.key === "auth-store" ||
        e.key === null // null means storage was cleared entirely
      ) {
        const token = authService.getToken();
        if (!token) {
          useAuthStore.setState({
            user: null,
            token: null,
            isAuthenticated: false,
          });
          router.replace("/login");
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [router]);

  // Also poll localStorage periodically to catch in-tab clearing (devtools, manual clear)
  useEffect(() => {
    const interval = setInterval(() => {
      const token = authService.getToken();
      if (!token) {
        useAuthStore.setState({
          user: null,
          token: null,
          isAuthenticated: false,
        });
        router.replace("/login");
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [router]);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background">
      <Sidebar />
      {children}
    </div>
  );
}
