"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  ChevronRight,
  ChevronLeft,
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
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
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
      {
        title: "Employee List",
        href: "/employees",
        icon: Users,
      },
      {
        title: "Employee Budget",
        href: "/employee-budget",
        icon: Wallet,
      },
    ],
  },
  {
    title: "Recruitment",
    items: [
      {
        title: "Employee Request",
        href: "/employee-request",
        icon: ClipboardList,
      },
      {
        title: "Recruitment",
        href: "/recruitment",
        icon: UserPlus,
      },
    ],
  },
  {
    title: "User Management",
    items: [
      {
        title: "Roles Access",
        href: "/roles-access",
        icon: Shield,
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebarCollapse } = useAppStore();
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

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col bg-white border-r border-gray-100 transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "flex items-center border-b border-gray-100",
            sidebarCollapsed ? "justify-center px-2 h-16" : "justify-between px-5 h-16"
          )}
        >
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent">
              <Users className="h-5 w-5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-900">HRIS System</span>
                <span className="text-xs text-gray-400">PT TÜV Nord Indonesia</span>
              </div>
            )}
          </Link>
          {!sidebarCollapsed && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleSidebarCollapse}
              className="text-gray-400 hover:text-gray-600"
            >
              <ChevronLeft />
            </Button>
          )}
        </div>

        {/* Expand button when collapsed */}
        {sidebarCollapsed && (
          <div className="flex justify-center py-3 border-b border-gray-100">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleSidebarCollapse}
              className="text-gray-400 hover:text-gray-600"
            >
              <ChevronLeft className="rotate-180" />
            </Button>
          </div>
        )}

        {/* Navigation */}
        <ScrollArea className="flex-1 py-5">
          <nav
            className={cn(
              "flex flex-col gap-6",
              sidebarCollapsed ? "px-2" : "px-4"
            )}
          >
            {filteredNavigation.map((section) => (
              <div key={section.title} className="flex flex-col gap-1">
                {/* Section Title */}
                {!sidebarCollapsed && (
                  <span className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-widest text-accent">
                    {section.title}
                  </span>
                )}

                {section.items.map((item) => (
                  <Tooltip key={item.title}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                          sidebarCollapsed && "justify-center px-0",
                          isActive(item.href)
                            ? "bg-accent/10 text-accent font-medium"
                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-5 w-5 shrink-0 transition-colors",
                            isActive(item.href)
                              ? "text-accent"
                              : "text-gray-400 group-hover:text-gray-600"
                          )}
                        />
                        {!sidebarCollapsed && (
                          <>
                            <span className="flex-1">{item.title}</span>
                            {isActive(item.href) && (
                              <ChevronRight className="h-4 w-4 text-accent" />
                            )}
                          </>
                        )}
                      </Link>
                    </TooltipTrigger>
                    {sidebarCollapsed && (
                      <TooltipContent side="right">{item.title}</TooltipContent>
                    )}
                  </Tooltip>
                ))}
              </div>
            ))}
          </nav>
        </ScrollArea>
      </aside>
    </TooltipProvider>
  );
}
