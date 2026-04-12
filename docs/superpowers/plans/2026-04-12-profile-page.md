# Profile Page & Header Click Area Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a profile page with user info and password change, and split the header user section into separate click areas (avatar/name → profile, chevron → logout dropdown).

**Architecture:** Modify `header.tsx` to separate avatar/name as a `<Link>` from chevron as a `DropdownMenuTrigger`. Create a new profile page at `app/(protected)/profile/page.tsx` with two cards (read-only info + change password form). Add a thin `profile.service.ts` for the password change API call.

**Tech Stack:** Next.js App Router, React Hook Form + Zod, Axios, Zustand (auth store), shadcn/ui (Card, Input, Button, Label), Lucide icons, Sonner toast, TUV design tokens.

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/components/layout/header.tsx` | Split click areas: Link for avatar/name, DropdownMenu for chevron only |
| Create | `src/services/profile.service.ts` | `changePassword()` API call |
| Create | `src/app/(protected)/profile/page.tsx` | Profile info card + change password form |

---

### Task 1: Create profile service

**Files:**
- Create: `src/services/profile.service.ts`

- [ ] **Step 1: Create the service file**

Create `src/services/profile.service.ts` with the change password function:

```typescript
import { put } from "@/lib/axios";
import { ApiResponse } from "@/types";

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const profileService = {
  async changePassword(
    userId: string,
    data: ChangePasswordRequest
  ): Promise<ApiResponse<unknown>> {
    try {
      const response = await put<ApiResponse<unknown>, ChangePasswordRequest>(
        `/v1/users/${userId}/password`,
        data
      );
      return response;
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<unknown> } };
      if (err.response?.data) return err.response.data;
      return { success: false, message: "Failed to update password" };
    }
  },
};

export default profileService;
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit --pretty 2>&1 | grep "profile.service" || echo "No errors in profile.service.ts"`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/services/profile.service.ts
git commit -m "feat(profile): add profile service with changePassword API"
```

---

### Task 2: Modify header — split click areas

**Files:**
- Modify: `src/components/layout/header.tsx`

- [ ] **Step 1: Update imports**

Add `Link` import (already imported) and `User` icon from lucide-react. Remove the wrapping of the entire user section in a single `DropdownMenuTrigger`. The file already imports `Link` from `next/link`.

In `header.tsx`, replace the entire User Section block (lines 125–207) — from `{/* User Section */}` through the closing `</DropdownMenu>` — with the new split layout:

```typescript
        {/* User Section — avatar+name as Link, chevron as dropdown trigger */}
        <div className="flex items-center" style={{ gap: "0px" }}>
          {/* Avatar + Name/Email → Link to /profile */}
          <Link
            href="/profile"
            className="flex items-center transition-opacity hover:opacity-80"
            style={{ gap: "8px" }}
          >
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
          </Link>

          {/* Chevron → Dropdown with Logout */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex cursor-pointer items-center justify-center border-0 bg-transparent outline-none transition-opacity hover:opacity-70"
                style={{
                  width: "32px",
                  height: "32px",
                  marginLeft: "4px",
                }}
              >
                <ChevronDown
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
        </div>
```

Key changes:
- Avatar + name/email wrapped in `<Link href="/profile">` with `hover:opacity-80`
- Chevron is its own `DropdownMenuTrigger` in a 32x32px button — always visible (no `hidden md:block`)
- Name/email still `hidden md:flex` (only shown on desktop)
- On mobile: avatar → profile link, chevron → logout dropdown

- [ ] **Step 2: Verify the header renders correctly**

Run: `npx tsc --noEmit --pretty 2>&1 | grep "header.tsx" || echo "No errors in header.tsx"`

Expected: No TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/header.tsx
git commit -m "feat(header): split user section into profile link and logout dropdown"
```

---

### Task 3: Create profile page

**Files:**
- Create: `src/app/(protected)/profile/page.tsx`

- [ ] **Step 1: Create the profile page**

Create `src/app/(protected)/profile/page.tsx`:

```typescript
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, KeyRound, UserCircle } from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { useAuthStore } from "@/stores/auth-store";
import { employeeService } from "@/services/employee.service";
import profileService from "@/services/profile.service";
import { showToast } from "@/lib/utils/toast-messages";
import { ROLE_LABELS, type RoleId } from "@/lib/constants/roles";

import type { EmployeeWithRelations } from "@/types";

// --- Validation schema ---

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// --- Styles (TUV design tokens) ---

const labelStyle: React.CSSProperties = {
  fontFamily: "'Poppins', sans-serif",
  fontSize: "0.875rem",
  fontWeight: 300,
  color: "var(--hsd-ui-color-gray-500)",
};

const valueStyle: React.CSSProperties = {
  fontFamily: "'Poppins', sans-serif",
  fontSize: "0.875rem",
  fontWeight: 400,
  color: "var(--hsd-ui-color-gray-900)",
};

const headingStyle: React.CSSProperties = {
  fontFamily: "'Poppins', sans-serif",
  fontSize: "1.125rem",
  fontWeight: 500,
  color: "var(--hsd-ui-color-gray-900)",
};

// --- Component ---

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [employee, setEmployee] = React.useState<EmployeeWithRelations | null>(null);
  const [loadingEmployee, setLoadingEmployee] = React.useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Fetch employee data if user has employeeId
  const fetchEmployee = React.useCallback(async (employeeId: number) => {
    setLoadingEmployee(true);
    try {
      const res = await employeeService.getById(employeeId);
      if (res.success && res.data) {
        setEmployee(res.data);
      }
    } catch {
      // Non-critical — profile info still shows auth data
    } finally {
      setLoadingEmployee(false);
    }
  }, []);

  React.useEffect(() => {
    if (user?.employeeId) {
      fetchEmployee(user.employeeId);
    }
  }, [user?.employeeId, fetchEmployee]);

  // Change password handler
  const onSubmitPassword = async (data: ChangePasswordFormData) => {
    if (!user?.id) return;

    try {
      const res = await profileService.changePassword(user.id, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      if (res.success) {
        showToast.success("Password updated successfully");
        reset();
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
      } else {
        showToast.error(res.message || "Failed to update password");
      }
    } catch (error: unknown) {
      showToast.updateError("Password", error);
    }
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
    <>
      <Header />
      <PageContainer>
        <div className="mx-auto" style={{ maxWidth: "720px" }}>
          <div className="flex flex-col" style={{ gap: "24px" }}>
            {/* ── Card 1: Profile Information ── */}
            <Card
              style={{
                border: "1px solid var(--hsd-ui-color-gray-300)",
                borderRadius: "var(--hsd-ui-radii-md)",
              }}
            >
              <CardHeader className="flex flex-row items-center" style={{ gap: "12px" }}>
                <UserCircle
                  style={{
                    width: "24px",
                    height: "24px",
                    color: "var(--hsd-ui-color-navy-500)",
                  }}
                />
                <CardTitle style={headingStyle}>Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col" style={{ gap: "24px" }}>
                  {/* Avatar + basic info */}
                  <div className="flex items-center" style={{ gap: "16px" }}>
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "50%",
                        backgroundColor: "var(--hsd-ui-color-blue-200)",
                      }}
                    >
                      <span
                        style={{
                          color: "rgba(35, 41, 51, 1)",
                          fontSize: "1.5rem",
                          fontWeight: 600,
                          fontFamily: "Poppins, sans-serif",
                        }}
                      >
                        {getUserInitials()}
                      </span>
                    </div>
                    <div className="flex flex-col" style={{ gap: "2px" }}>
                      <span
                        style={{
                          fontFamily: "'Poppins', sans-serif",
                          fontSize: "1.125rem",
                          fontWeight: 500,
                          color: "var(--hsd-ui-color-gray-900)",
                        }}
                      >
                        {user?.displayName || user?.name || "User"}
                      </span>
                      <span
                        style={{
                          fontFamily: "'Poppins', sans-serif",
                          fontSize: "0.875rem",
                          fontWeight: 300,
                          color: "var(--hsd-ui-color-gray-500)",
                        }}
                      >
                        {user?.email || ""}
                      </span>
                      {displayRoleName && (
                        <span
                          style={{
                            display: "inline-block",
                            width: "fit-content",
                            marginTop: "4px",
                            color: "var(--hsd-ui-color-navy-500)",
                            backgroundColor: "var(--hsd-ui-color-navy-50)",
                            border: "1px solid var(--hsd-ui-color-navy-200)",
                            borderRadius: "6px",
                            padding: "2px 10px",
                            fontSize: "0.75rem",
                            fontWeight: 400,
                          }}
                        >
                          {displayRoleName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Employee details (conditional) */}
                  {user?.employeeId && (
                    <>
                      <Separator />
                      {loadingEmployee ? (
                        <div className="flex flex-col" style={{ gap: "12px" }}>
                          {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-5 w-3/4" />
                          ))}
                        </div>
                      ) : employee ? (
                        <div
                          className="grid grid-cols-1 md:grid-cols-2"
                          style={{ gap: "16px" }}
                        >
                          <InfoRow label="Employee ID" value={employee.employeeNik || employee.employeeId || "-"} />
                          <InfoRow
                            label="Department"
                            value={employee.department?.name || "-"}
                          />
                          <InfoRow
                            label="Division"
                            value={employee.division?.name || "-"}
                          />
                          <InfoRow
                            label="Job Title"
                            value={employee.jobTitle?.name || "-"}
                          />
                          <InfoRow
                            label="Job Level"
                            value={employee.jobLevel?.name || "-"}
                          />
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* ── Card 2: Change Password ── */}
            <Card
              style={{
                border: "1px solid var(--hsd-ui-color-gray-300)",
                borderRadius: "var(--hsd-ui-radii-md)",
              }}
            >
              <CardHeader className="flex flex-row items-center" style={{ gap: "12px" }}>
                <KeyRound
                  style={{
                    width: "24px",
                    height: "24px",
                    color: "var(--hsd-ui-color-navy-500)",
                  }}
                />
                <CardTitle style={headingStyle}>Change Password</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleSubmit(onSubmitPassword)}
                  className="flex flex-col"
                  style={{ gap: "20px" }}
                >
                  {/* Current Password */}
                  <div className="flex flex-col" style={{ gap: "6px" }}>
                    <Label style={labelStyle}>Current Password</Label>
                    <div className="relative">
                      <Input
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder="Enter current password"
                        className="pr-10"
                        {...register("currentPassword")}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: "var(--hsd-ui-color-gray-500)" }}
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff style={{ width: "16px", height: "16px" }} />
                        ) : (
                          <Eye style={{ width: "16px", height: "16px" }} />
                        )}
                      </button>
                    </div>
                    {errors.currentPassword && (
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "rgba(250, 55, 70, 1)",
                          margin: 0,
                        }}
                      >
                        {errors.currentPassword.message}
                      </p>
                    )}
                  </div>

                  {/* New Password */}
                  <div className="flex flex-col" style={{ gap: "6px" }}>
                    <Label style={labelStyle}>New Password</Label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Minimum 8 characters"
                        className="pr-10"
                        {...register("newPassword")}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: "var(--hsd-ui-color-gray-500)" }}
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff style={{ width: "16px", height: "16px" }} />
                        ) : (
                          <Eye style={{ width: "16px", height: "16px" }} />
                        )}
                      </button>
                    </div>
                    {errors.newPassword && (
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "rgba(250, 55, 70, 1)",
                          margin: 0,
                        }}
                      >
                        {errors.newPassword.message}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="flex flex-col" style={{ gap: "6px" }}>
                    <Label style={labelStyle}>Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter new password"
                        className="pr-10"
                        {...register("confirmPassword")}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: "var(--hsd-ui-color-gray-500)" }}
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff style={{ width: "16px", height: "16px" }} />
                        ) : (
                          <Eye style={{ width: "16px", height: "16px" }} />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "rgba(250, 55, 70, 1)",
                          margin: 0,
                        }}
                      >
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div
                    className="flex justify-end"
                    style={{ gap: "12px", paddingTop: "4px" }}
                  >
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        reset();
                        setShowCurrentPassword(false);
                        setShowNewPassword(false);
                        setShowConfirmPassword(false);
                      }}
                      disabled={isSubmitting}
                      style={{
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 400,
                        fontSize: "var(--hsd-ui-fontSizes-md)",
                        borderRadius: "var(--hsd-ui-radii-xs)",
                        backgroundColor: "var(--hsd-ui-color-gray-50)",
                        color: "var(--hsd-ui-color-gray-900)",
                        borderColor: "rgba(120, 134, 127, 0.2)",
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      style={{
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 400,
                        fontSize: "var(--hsd-ui-fontSizes-md)",
                        borderRadius: "var(--hsd-ui-radii-xs)",
                        backgroundColor: "var(--hsd-ui-color-navy-500)",
                        color: "var(--hsd-ui-color-gray-50)",
                        borderColor: "var(--hsd-ui-color-navy-500)",
                      }}
                    >
                      {isSubmitting ? "Updating..." : "Update Password"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </>
  );
}

// --- Helper component ---

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col" style={{ gap: "2px" }}>
      <span
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: "0.75rem",
          fontWeight: 300,
          color: "var(--hsd-ui-color-gray-500)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: "0.875rem",
          fontWeight: 400,
          color: "var(--hsd-ui-color-gray-900)",
        }}
      >
        {value}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit --pretty 2>&1 | grep -E "(profile|error TS)" | head -20 || echo "No errors"`

Expected: No errors.

- [ ] **Step 3: Test in browser**

Run: `npm run dev`

Verify:
1. Navigate to `/profile` — page renders with user info card and change password card
2. If user has employeeId, employee details (department, division, job title, job level) are shown
3. If user has no employeeId, only auth data is shown (no employee section)
4. Password form validates: empty fields show errors, mismatched passwords show error, short password shows error
5. Eye/EyeOff toggles work for all 3 password fields
6. Cancel button resets the form

- [ ] **Step 4: Commit**

```bash
git add src/app/\(protected\)/profile/page.tsx
git commit -m "feat(profile): add profile page with user info and change password"
```

---

### Task 4: Verify full integration

- [ ] **Step 1: Test header click areas**

Run: `npm run dev`

Verify in browser:
1. Click on avatar or name/email in header → navigates to `/profile`
2. Click on chevron (▼) icon → opens dropdown with "Logout"
3. Click "Logout" in dropdown → opens confirmation dialog
4. Confirm logout → redirects to `/login`
5. On mobile viewport (< 768px): avatar → profile link, chevron → logout dropdown

- [ ] **Step 2: Test change password flow**

1. Fill in current password, new password (8+ chars), confirm password (matching)
2. Submit → success toast if correct, error toast if wrong current password
3. After success, form resets to empty
4. Submit with empty fields → validation errors shown

- [ ] **Step 3: Run type check**

Run: `npx tsc --noEmit --pretty`

Expected: No TypeScript errors.

- [ ] **Step 4: Final commit (if any fixes were needed)**

```bash
git add -A
git commit -m "fix(profile): integration fixes"
```

Only commit if there were fixes. Skip if all tests passed.
