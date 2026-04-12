"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

/* Match central-invoicing sidebar widths */
const SIDEBAR_WIDTH_EXPANDED = 256;
const SIDEBAR_WIDTH_COLLAPSED = 96;
const HEADER_HEIGHT = 75;

export function PageContainer({ children, className }: PageContainerProps) {
  const { sidebarCollapsed } = useAppStore();

  return (
    <main
      className={cn("transition-all duration-300", className)}
      style={{
        marginLeft: sidebarCollapsed ? `${SIDEBAR_WIDTH_COLLAPSED}px` : `${SIDEBAR_WIDTH_EXPANDED}px`,
        paddingTop: `${HEADER_HEIGHT}px`,
        minHeight: "100vh",
      }}
    >
      <div className="p-6">{children}</div>
    </main>
  );
}
