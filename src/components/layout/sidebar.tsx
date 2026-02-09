"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  Settings,
  HelpCircle,
  LogOut,
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

const navigation: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Employees",
    href: "/employees",
    icon: Users,
  },
  {
    title: "Organization",
    icon: Building2,
    children: [
      { title: "OBS Structure", href: "/organization/obs", icon: Network },
      { title: "Divisions", href: "/organization/divisions", icon: Layers },
      { title: "Departments", href: "/organization/departments", icon: Building },
      { title: "Job Levels", href: "/organization/job-levels", icon: Award },
      { title: "Job Titles", href: "/organization/job-titles", icon: Briefcase },
    ],
  },
  {
    title: "Recruitment",
    href: "/recruitment",
    icon: UserPlus,
  },
];

const bottomNavigation: NavItem[] = [
  { title: "Settings", href: "/settings", icon: Settings },
  { title: "Help", href: "/help", icon: HelpCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarCollapsed, toggleSidebarCollapse } = useAppStore();
  const [openMenus, setOpenMenus] = React.useState<string[]>(["Organization"]);

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

  const handleSignOut = () => {
    router.push("/login");
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-sidebar-background transition-all duration-500 ease-out",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent transition-transform duration-300 hover:scale-105">
              <span className="text-lg font-bold text-accent-foreground">Q</span>
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col">
                <span className="text-base font-semibold tracking-tight">QuoHRIS</span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  HR Platform
                </span>
              </div>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebarCollapse}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform duration-300",
                sidebarCollapsed && "rotate-180"
              )}
            />
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="flex flex-col gap-1">
            {navigation.map((item, index) => (
              <div
                key={item.title}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
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
                              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                              isParentActive(item)
                                ? "bg-accent/10 font-medium text-accent"
                                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                            )}
                          >
                            <item.icon className="h-[18px] w-[18px] shrink-0" />
                            {!sidebarCollapsed && (
                              <>
                                <span className="flex-1 text-left">{item.title}</span>
                                <ChevronDown
                                  className={cn(
                                    "h-3.5 w-3.5 transition-transform duration-300",
                                    openMenus.includes(item.title) && "rotate-180"
                                  )}
                                />
                              </>
                            )}
                          </button>
                        </CollapsibleTrigger>
                      </TooltipTrigger>
                      {sidebarCollapsed && (
                        <TooltipContent side="right" className="font-medium">
                          {item.title}
                        </TooltipContent>
                      )}
                    </Tooltip>
                    <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                      <div className="ml-5 mt-1 flex flex-col gap-0.5 border-l border-border pl-3">
                        {item.children.map((child) => (
                          <Link
                            key={child.title}
                            href={child.href || "#"}
                            className={cn(
                              "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-all duration-200",
                              isActive(child.href)
                                ? "font-medium text-accent"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <child.icon className="h-3.5 w-3.5 shrink-0" />
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
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                          isActive(item.href)
                            ? "bg-accent font-medium text-accent-foreground"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        )}
                      >
                        <item.icon className="h-[18px] w-[18px] shrink-0" />
                        {!sidebarCollapsed && <span>{item.title}</span>}
                      </Link>
                    </TooltipTrigger>
                    {sidebarCollapsed && (
                      <TooltipContent side="right" className="font-medium">
                        {item.title}
                      </TooltipContent>
                    )}
                  </Tooltip>
                )}
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Bottom */}
        <div className="border-t border-sidebar-border px-3 py-4">
          <nav className="flex flex-col gap-1">
            {bottomNavigation.map((item) => (
              <Tooltip key={item.title}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href || "#"}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                      isActive(item.href)
                        ? "bg-secondary font-medium text-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-[18px] w-[18px] shrink-0" />
                    {!sidebarCollapsed && <span>{item.title}</span>}
                  </Link>
                </TooltipTrigger>
                {sidebarCollapsed && (
                  <TooltipContent side="right" className="font-medium">
                    {item.title}
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </nav>

          {/* User */}
          <div className="mt-4 border-t border-sidebar-border pt-4">
            <div
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2",
                sidebarCollapsed && "justify-center px-0"
              )}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent">
                AD
              </div>
              {!sidebarCollapsed && (
                <>
                  <div className="flex flex-1 flex-col overflow-hidden">
                    <span className="truncate text-sm font-medium">Admin</span>
                    <span className="truncate text-xs text-muted-foreground">
                      admin@quohris.com
                    </span>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSignOut}
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Sign out</TooltipContent>
                  </Tooltip>
                </>
              )}
            </div>
            {sidebarCollapsed && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSignOut}
                    className="mt-2 h-8 w-8 w-full text-muted-foreground hover:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Sign out</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
