"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { authService } from "@/services/auth.service";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = authService.getToken();
    if (token) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
