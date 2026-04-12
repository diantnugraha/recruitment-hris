"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Menu as MenuIcon, LogOut, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useAppStore } from "@/stores/app-store";
import { useAuthStore } from "@/stores/auth-store";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { ROLE_LABELS, type RoleId } from "@/lib/constants/roles";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header(_props: HeaderProps) {
  const router = useRouter();
  const { toggleSidebarCollapse } = useAppStore();
  const { user, logout, isLoading } = useAuthStore();
  const [showLogoutDialog, setShowLogoutDialog] = React.useState(false);

  const handleSignOut = async () => {
    await logout();
    setShowLogoutDialog(false);
    router.push("/login");
  };

  const getUserInitials = () => {
    const displayName = user?.displayName || user?.name;
    if (displayName) {
      const names = displayName.split(" ");
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return displayName.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  const displayRoleName = user?.roleId
    ? ROLE_LABELS[user.roleId as RoleId] ?? user.roleName ?? null
    : null;

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-white"
      style={{
        height: "75px",
        padding: "0 24px",
        borderBottom: "1px solid #d0d6dd",
      }}
    >
      {/* Left side — hamburger + logo */}
      <div className="flex items-center" style={{ gap: "16px" }}>
        <button
          onClick={toggleSidebarCollapse}
          className="flex items-center justify-center cursor-pointer transition-colors"
          style={{ color: "rgba(120, 134, 127, 1)" }}
        >
          <MenuIcon style={{ width: "24px", height: "24px" }} />
        </button>
        <Link href="/dashboard" className="flex items-center">
          <Image
            src="/images/tuv-nord-logo.png"
            alt="TÜV NORD"
            width={140}
            height={40}
            priority
            style={{ objectPosition: "left center", cursor: "pointer" }}
          />
        </Link>
      </div>

      {/* Right side — role badge + notification + divider + user */}
      <div className="flex items-center" style={{ gap: "16px" }}>
        {/* Role Badge — TUV navy tokens */}
        {displayRoleName && (
          <span
            style={{
              color: "var(--hsd-ui-color-navy-500)",
              backgroundColor: "var(--hsd-ui-color-navy-50)",
              border: "1px solid var(--hsd-ui-color-navy-200)",
              borderRadius: "6px",
              padding: "4px 12px",
              fontSize: "0.75rem",
              fontWeight: 400,
            }}
          >
            {displayRoleName}
          </span>
        )}

        {/* Notification Bell */}
        <NotificationBell />

        {/* Divider — gray-300, 1.3px, 56px */}
        <div
          style={{
            width: "1.3px",
            height: "56px",
            backgroundColor: "var(--hsd-ui-color-gray-300)",
          }}
        />

        {/* User Section — avatar + name + dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex cursor-pointer items-center border-0 bg-transparent outline-none" style={{ gap: "8px" }}>
              {/* Avatar — blue-200 bg, 40px */}
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: "var(--hsd-ui-color-blue-200)",
                }}
              >
                <span
                  style={{
                    color: "rgba(35, 41, 51, 1)",
                    fontSize: "1rem",
                    fontWeight: 600,
                    fontFamily: "Poppins, sans-serif",
                  }}
                >
                  {getUserInitials()}
                </span>
              </div>
              {/* Name + Email */}
              <div className="hidden md:flex md:flex-col md:items-start">
                <span
                  style={{
                    fontSize: "1rem",
                    fontWeight: 400,
                    color: "rgba(35, 41, 51, 1)",
                    lineHeight: 1.4,
                  }}
                >
                  {user?.displayName || user?.name || "User"}
                </span>
                <span
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 300,
                    color: "rgba(147, 158, 153, 1)",
                    lineHeight: 1.4,
                  }}
                >
                  {user?.email || ""}
                </span>
              </div>
              {/* Chevron */}
              <ChevronDown
                className="hidden md:block"
                style={{
                  width: "20px",
                  height: "20px",
                  color: "rgba(120, 134, 127, 1)",
                }}
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="min-w-[160px]">
            <DropdownMenuItem
              onClick={() => setShowLogoutDialog(true)}
              className="cursor-pointer"
            >
              <LogOut
                className="mr-2"
                style={{
                  width: "16px",
                  height: "16px",
                  color: "var(--hsd-ui-color-red-600)",
                }}
              />
              <span
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--hsd-ui-color-red-600)",
                }}
              >
                Logout
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Logout Confirmation Dialog */}
        <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Confirmation Logout</DialogTitle>
              <DialogDescription>
                Are you sure you want to end the session and exit the page?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowLogoutDialog(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSignOut}
                disabled={isLoading}
                style={{
                  backgroundColor: "var(--hsd-ui-color-navy-500)",
                  borderColor: "var(--hsd-ui-color-navy-500)",
                }}
              >
                {isLoading ? "Logging out..." : "Yes, Sure"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
