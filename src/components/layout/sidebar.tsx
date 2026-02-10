"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  UserPlus,
  ChevronDown,
  ChevronLeft,
  Network,
  Layers,
  Building,
  Award,
  Briefcase,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface NavItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
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
    title: "People",
    items: [
      {
        title: "Employees",
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
    title: "Organization",
    items: [
      {
        title: "Structure",
        icon: Building2,
        children: [
          { title: "OBS Structure", href: "/organization/obs", icon: Network },
          { title: "Divisions", href: "/organization/divisions", icon: Layers },
          { title: "Departments", href: "/organization/departments", icon: Building },
          { title: "Job Levels", href: "/organization/job-levels", icon: Award },
          { title: "Job Titles", href: "/organization/job-titles", icon: Briefcase },
        ],
      },
    ],
  },
  {
    title: "Talent",
    items: [
      {
        title: "Recruitment",
        href: "/recruitment",
        icon: UserPlus,
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebarCollapse } = useAppStore();
  const [openMenus, setOpenMenus] = React.useState<string[]>(["Structure"]);

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) =>
      prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]
    );
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    return pathname === href || pathname.startsWith(href + "/");
  };

  const isParentActive = (item: NavItem) => {
    if (item.children) {
      return item.children.some((child) => isActive(child.href));
    }
    return isActive(item.href);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col bg-white border-r border-gray-200 transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-60"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex h-16 items-center border-b border-gray-100",
          sidebarCollapsed ? "justify-center px-2" : "justify-between px-4"
        )}>
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
              <span className="text-base font-semibold text-white">Q</span>
            </div>
            {!sidebarCollapsed && (
              <span className="text-base font-semibold text-gray-900">QuoHRIS</span>
            )}
          </Link>
          {!sidebarCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebarCollapse}
              className="h-8 w-8 text-gray-400 hover:text-gray-600"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Expand button when collapsed */}
        {sidebarCollapsed && (
          <div className="flex justify-center py-3 border-b border-gray-100">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebarCollapse}
              className="h-8 w-8 text-gray-400 hover:text-gray-600"
            >
              <ChevronLeft className="h-4 w-4 rotate-180" />
            </Button>
          </div>
        )}

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className={cn(
            "flex flex-col gap-4",
            sidebarCollapsed ? "px-2" : "px-3"
          )}>
            {navigation.map((section) => (
              <div key={section.title} className="flex flex-col gap-1">
                {/* Section Title */}
                {!sidebarCollapsed && (
                  <span className="px-3 pb-1 text-xs font-medium uppercase tracking-wider text-gray-400">
                    {section.title}
                  </span>
                )}

                {section.items.map((item) => (
                  <div key={item.title}>
                    {item.children ? (
                      <Collapsible
                        open={!sidebarCollapsed && openMenus.includes(item.title)}
                        onOpenChange={() => toggleMenu(item.title)}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <CollapsibleTrigger asChild>
                              <button
                                className={cn(
                                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                                  sidebarCollapsed && "justify-center px-0",
                                  isParentActive(item)
                                    ? "text-accent font-medium"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                )}
                              >
                                <item.icon className="h-5 w-5 shrink-0" />
                                {!sidebarCollapsed && (
                                  <>
                                    <span className="flex-1 text-left">{item.title}</span>
                                    <ChevronDown
                                      className={cn(
                                        "h-4 w-4 text-gray-400 transition-transform duration-200",
                                        openMenus.includes(item.title) && "rotate-180"
                                      )}
                                    />
                                  </>
                                )}
                              </button>
                            </CollapsibleTrigger>
                          </TooltipTrigger>
                          {sidebarCollapsed && (
                            <TooltipContent side="right">{item.title}</TooltipContent>
                          )}
                        </Tooltip>

                        <CollapsibleContent>
                          <div className="ml-5 mt-1 flex flex-col gap-0.5 border-l border-gray-200 pl-3">
                            {item.children.map((child) => (
                              <Link
                                key={child.title}
                                href={child.href || "#"}
                                className={cn(
                                  "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                                  isActive(child.href)
                                    ? "text-accent font-medium"
                                    : "text-gray-500 hover:text-gray-900"
                                )}
                              >
                                <span>{child.title}</span>
                              </Link>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href={item.href || "#"}
                            className={cn(
                              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                              sidebarCollapsed && "justify-center px-0",
                              isActive(item.href)
                                ? "bg-accent text-white font-medium"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                            )}
                          >
                            <item.icon className="h-5 w-5 shrink-0" />
                            {!sidebarCollapsed && <span>{item.title}</span>}
                          </Link>
                        </TooltipTrigger>
                        {sidebarCollapsed && (
                          <TooltipContent side="right">{item.title}</TooltipContent>
                        )}
                      </Tooltip>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </nav>
        </ScrollArea>
      </aside>
    </TooltipProvider>
  );
}
