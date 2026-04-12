"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Network,
  Layers,
  Building,
  Award,
  Briefcase,
  Wallet,
  ClipboardList,
  Shield,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import { useAuthStore } from "@/stores/auth-store";
import { hasRouteAccess } from "@/lib/constants/routeAccess";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navigation: NavSection[] = [
  {
    title: "Main",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Organization",
    items: [
      { title: "OBS", href: "/organization/obs", icon: Network },
      { title: "Division", href: "/organization/divisions", icon: Layers },
      { title: "Department", href: "/organization/departments", icon: Building },
    ],
  },
  {
    title: "Position",
    items: [
      { title: "Job Level", href: "/organization/job-levels", icon: Award },
      { title: "Job Title", href: "/organization/job-titles", icon: Briefcase },
    ],
  },
  {
    title: "Employee",
    items: [
      { title: "Employee List", href: "/employees", icon: Users },
      { title: "Employee Budget", href: "/employee-budget", icon: Wallet },
    ],
  },
  {
    title: "Recruitment",
    items: [
      { title: "Employee Request", href: "/employee-request", icon: ClipboardList },
      { title: "Recruitment", href: "/recruitment", icon: UserPlus },
    ],
  },
  {
    title: "User Management",
    items: [
      { title: "Roles Access", href: "/roles-access", icon: Shield },
    ],
  },
];

/* central-invoicing exact values */
const HEADER_HEIGHT = 75;
const SIDEBAR_WIDTH_EXPANDED = 256;
const SIDEBAR_WIDTH_COLLAPSED = 96;

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed } = useAppStore();
  const user = useAuthStore((state) => state.user);
  const userRoleId = user?.roleId ?? 0;

  const filteredNavigation = React.useMemo(() => {
    return navigation
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => hasRouteAccess(item.href, userRoleId)),
      }))
      .filter((section) => section.items.length > 0);
  }, [userRoleId]);

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  const renderNavItem = (item: NavItem) => {
    const active = isActive(item.href);

    const linkContent = (
      <Link
        href={item.href}
        className="group flex items-center transition-all duration-150"
        style={sidebarCollapsed ? {
          width: "48px",
          height: "48px",
          borderRadius: "4px",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: active ? "rgba(230, 233, 251, 1)" : "transparent",
        } : {
          height: "40px",
          gap: "8px",
          paddingLeft: "14px",
          paddingRight: "16px",
          borderRadius: "4px",
          backgroundColor: active ? "rgba(230, 233, 251, 1)" : "transparent",
          color: active ? "rgba(0, 30, 210, 1)" : "rgba(35, 41, 51, 1)",
          fontSize: "0.875rem",
          fontWeight: active ? 500 : 400,
        }}
      >
        <span
          style={{
            color: active ? "rgba(0, 30, 210, 1)" : "rgba(120, 134, 127, 1)",
            display: "flex",
            alignItems: "center",
          }}
        >
          <item.icon className="h-5 w-5 shrink-0" />
        </span>
        {!sidebarCollapsed && (
          <span className="flex-1 truncate">{item.title}</span>
        )}
      </Link>
    );

    if (sidebarCollapsed) {
      return (
        <TooltipProvider key={item.title} delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
            <TooltipContent side="right">{item.title}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return <React.Fragment key={item.title}>{linkContent}</React.Fragment>;
  };

  return (
    <aside
      className="fixed left-0 z-40 flex flex-col bg-white transition-all duration-300 overflow-y-auto"
      style={{
        top: `${HEADER_HEIGHT}px`,
        width: sidebarCollapsed ? `${SIDEBAR_WIDTH_COLLAPSED}px` : `${SIDEBAR_WIDTH_EXPANDED}px`,
        height: `calc(100vh - ${HEADER_HEIGHT}px)`,
        borderRight: "1px solid #d0d6dd",
      }}
    >
      <nav
        className="flex flex-1 flex-col"
        style={{
          gap: sidebarCollapsed ? "4px" : "8px",
          paddingTop: "16px",
          paddingBottom: "16px",
          paddingLeft: sidebarCollapsed ? "20px" : "12px",
          paddingRight: sidebarCollapsed ? "20px" : "12px",
        }}
      >
        {filteredNavigation.map((section) => (
          <div
            key={section.title}
            className="flex flex-col"
            style={{
              gap: "2px",
              alignItems: sidebarCollapsed ? "center" : "stretch",
            }}
          >
            {!sidebarCollapsed && (
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 400,
                  color: "rgba(35, 41, 51, 1)",
                  padding: "8px 14px",
                }}
              >
                {section.title}
              </span>
            )}
            {section.items.map(renderNavItem)}
          </div>
        ))}
      </nav>
    </aside>
  );
}
