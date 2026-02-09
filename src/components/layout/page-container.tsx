"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  const { sidebarCollapsed } = useAppStore();

  return (
    <main
      className={cn(
        "min-h-[calc(100vh-3.5rem)] transition-all duration-300",
        sidebarCollapsed ? "ml-16" : "ml-64",
        className
      )}
    >
      <div className="p-6">{children}</div>
    </main>
  );
}
