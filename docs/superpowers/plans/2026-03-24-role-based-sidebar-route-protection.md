# Role-Based Sidebar & Route Protection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement role-based sidebar menu filtering and route protection so users only see and access menus allowed for their role.

**Architecture:** Config-driven approach — a single `ROUTE_ACCESS` config maps routes to allowed role IDs. Sidebar reads this config to filter menu items; a `RouteGuard` component reads it to show 403 on unauthorized direct URL access. All role checks use numeric `roleId` matching the database `role_access` table.

**Tech Stack:** Next.js 16 (App Router), React, TypeScript, Zustand, shadcn/ui

**Spec:** `docs/superpowers/specs/2026-03-24-role-based-sidebar-route-protection-design.md`

**Pre-implementation:** Before starting, verify the API response shape for `/auth/login` and `/auth/me` endpoints. Confirm that `roleId` (number) and `roleName` (string) are available in the user object. The auth store mapping in Task 3 depends on this.

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/constants/roles.ts` | Create | Single source of truth for role IDs matching database |
| `src/lib/constants/routeAccess.ts` | Create | Route-to-roles mapping + `hasRouteAccess` helper |
| `src/components/shared/RouteGuard.tsx` | Create | Route guard component with inline 403 page |
| `src/types/index.ts` | Modify | User type: `role: string` → `roleId: number` + `roleName: string` |
| `src/stores/auth-store.ts` | Modify | Store roleId + roleName, add persist migration |
| `src/lib/constants/user.ts` | Delete | Remove entirely (replaced by roles.ts) |
| `src/lib/constants/employeeRequest.ts` | Modify | Remove string ROLES, update WORKFLOW_TRANSITIONS |
| `src/components/layout/sidebar.tsx` | Modify | Filter menu items by roleId |
| `src/app/(protected)/layout.tsx` | Modify | Integrate RouteGuard |
| `src/app/(protected)/employee-request/page.tsx` | Modify | Use roleId |
| `src/app/(protected)/employee-request/[id]/page.tsx` | Modify | Use roleId |
| `src/app/(protected)/employee-request/new/page.tsx` | Modify | Use roleId |
| `src/app/(protected)/users/page.tsx` | Modify | Replace hardcoded roleId checks + USER_ROLE_CONFIG |
| `src/app/(protected)/users/[id]/page.tsx` | Modify | Replace USER_ROLE_CONFIG |
| `src/components/users/UserDetailDialog.tsx` | Modify | Replace USER_ROLE_CONFIG |
| `src/components/users/UserFormDialog.tsx` | Modify | Verify no USER_ROLE references (uses dynamic role fetch) |

---

### Task 1: Create Role Constants

**Files:**
- Create: `src/lib/constants/roles.ts`

- [ ] **Step 1: Create `src/lib/constants/roles.ts`**

```typescript
// Role IDs matching database role_access table exactly
export const ROLES = {
  HUMAN_RESOURCES: 1,
  EMPLOYEE: 2,
  SUPER_ADMIN: 3,
  AUDITOR: 4,
  FINANCE: 5,
  MANAGER: 6,        // PC Head/Manager
  MANAGEMENT: 7,
  HR_MANAGER: 8,
  CANDIDATES: 9,
  HOD: 10,           // Head Of Division
} as const;

export type RoleId = typeof ROLES[keyof typeof ROLES];

export const ROLE_LABELS: Record<RoleId, string> = {
  [ROLES.HUMAN_RESOURCES]: 'Human Resources',
  [ROLES.EMPLOYEE]: 'Employee',
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.AUDITOR]: 'Auditor',
  [ROLES.FINANCE]: 'Finance',
  [ROLES.MANAGER]: 'PC Head/Manager',
  [ROLES.MANAGEMENT]: 'Management',
  [ROLES.HR_MANAGER]: 'HR Manager',
  [ROLES.CANDIDATES]: 'Candidates',
  [ROLES.HOD]: 'Head Of Division',
};

export const ROLE_CONFIG: Record<
  RoleId,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    description: string;
  }
> = {
  [ROLES.SUPER_ADMIN]: {
    label: 'Super Admin',
    variant: 'destructive',
    description: 'Full system access',
  },
  [ROLES.HUMAN_RESOURCES]: {
    label: 'Human Resources',
    variant: 'default',
    description: 'HR department access',
  },
  [ROLES.MANAGER]: {
    label: 'PC Head/Manager',
    variant: 'secondary',
    description: 'Manager level access',
  },
  [ROLES.EMPLOYEE]: {
    label: 'Employee',
    variant: 'outline',
    description: 'Basic employee access',
  },
  [ROLES.HOD]: {
    label: 'Head Of Division',
    variant: 'secondary',
    description: 'Division head access',
  },
  [ROLES.MANAGEMENT]: {
    label: 'Management',
    variant: 'secondary',
    description: 'Management level access',
  },
  [ROLES.AUDITOR]: {
    label: 'Auditor',
    variant: 'outline',
    description: 'Audit access',
  },
  [ROLES.FINANCE]: {
    label: 'Finance',
    variant: 'outline',
    description: 'Finance access',
  },
  [ROLES.HR_MANAGER]: {
    label: 'HR Manager',
    variant: 'default',
    description: 'HR Manager access',
  },
  [ROLES.CANDIDATES]: {
    label: 'Candidates',
    variant: 'outline',
    description: 'Candidate access',
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/constants/roles.ts
git commit -m "feat: add role constants matching database role_access table"
```

---

### Task 2: Create Route Access Config

**Files:**
- Create: `src/lib/constants/routeAccess.ts`

- [ ] **Step 1: Create `src/lib/constants/routeAccess.ts`**

```typescript
import { ROLES, RoleId } from './roles';

const ALL_ACTIVE_ROLES: RoleId[] = [
  ROLES.SUPER_ADMIN,
  ROLES.HUMAN_RESOURCES,
  ROLES.MANAGER,
  ROLES.HOD,
  ROLES.MANAGEMENT,
  ROLES.EMPLOYEE,
];

export const ROUTE_ACCESS: Record<string, RoleId[]> = {
  // All active roles
  '/dashboard':                ALL_ACTIVE_ROLES,
  '/organization/obs':         ALL_ACTIVE_ROLES,
  '/organization/divisions':   ALL_ACTIVE_ROLES,
  '/organization/departments': ALL_ACTIVE_ROLES,
  '/organization/job-levels':  ALL_ACTIVE_ROLES,
  '/organization/job-titles':  ALL_ACTIVE_ROLES,
  '/employees':                ALL_ACTIVE_ROLES,

  // Not Employee
  '/employee-budget':  [ROLES.SUPER_ADMIN, ROLES.HUMAN_RESOURCES, ROLES.MANAGER, ROLES.HOD, ROLES.MANAGEMENT],
  '/employee-request': [ROLES.SUPER_ADMIN, ROLES.HUMAN_RESOURCES, ROLES.MANAGER, ROLES.HOD, ROLES.MANAGEMENT],
  '/recruitment':      [ROLES.SUPER_ADMIN, ROLES.HUMAN_RESOURCES, ROLES.MANAGER, ROLES.HOD, ROLES.MANAGEMENT],
  '/onboarding':       [ROLES.SUPER_ADMIN, ROLES.HUMAN_RESOURCES, ROLES.MANAGER, ROLES.HOD, ROLES.MANAGEMENT],

  // Admin + HR only
  '/users':        [ROLES.SUPER_ADMIN, ROLES.HUMAN_RESOURCES],
  '/roles-access': [ROLES.SUPER_ADMIN, ROLES.HUMAN_RESOURCES],
};

/**
 * Check if a user with the given roleId can access the given pathname.
 * Supports exact match and longest-prefix match for dynamic routes.
 */
export function hasRouteAccess(pathname: string, roleId: number): boolean {
  // Exact match first
  if (ROUTE_ACCESS[pathname]) {
    return ROUTE_ACCESS[pathname].includes(roleId as RoleId);
  }

  // Longest prefix match for dynamic routes (e.g. /recruitment/123)
  const matchingRoute = Object.keys(ROUTE_ACCESS)
    .filter(route => pathname.startsWith(route + '/'))
    .sort((a, b) => b.length - a.length)[0];

  if (matchingRoute) {
    return ROUTE_ACCESS[matchingRoute].includes(roleId as RoleId);
  }

  // No config = deny access
  return false;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/constants/routeAccess.ts
git commit -m "feat: add route access config and hasRouteAccess helper"
```

---

### Task 3: Update User Type and Auth Store

**Files:**
- Modify: `src/types/index.ts` (lines 1-12, User interface)
- Modify: `src/stores/auth-store.ts` (lines 37-42 login mapping, lines 104-113 checkAuth mapping, persist config lines 133-140)

- [ ] **Step 1: Update User interface in `src/types/index.ts`**

Change the `User` interface:
```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  roleId: number;       // was: role: string — now numeric for access control
  roleName: string;     // human-readable role name for display
  avatar?: string;
  employeeId?: number | null;
  managedDepartments?: { id: number; name: string }[];
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 2: Update auth store login mapping in `src/stores/auth-store.ts`**

Replace lines 37-47 (inside `login` success block). The API response may have `roleId` as a top-level field or nested. Check actual response and adjust accordingly:
```typescript
const userData = response.data.user;
set({
  user: {
    ...userData,
    roleId: (userData as unknown as { roleId?: number }).roleId ?? 0,
    roleName: (userData as unknown as { roleName?: string }).roleName ?? '',
  },
  token: response.data.token,
  isAuthenticated: true,
  isLoading: false,
  error: null,
});
```

- [ ] **Step 3: Update auth store checkAuth mapping in `src/stores/auth-store.ts`**

Replace lines 104-113 (inside `checkAuth` success block):
```typescript
const userData = response.data;
set({
  user: {
    ...userData,
    roleId: (userData as unknown as { roleId?: number }).roleId ?? 0,
    roleName: (userData as unknown as { roleName?: string }).roleName ?? '',
  },
  token,
  isAuthenticated: true,
});
```

- [ ] **Step 4: Add persist migration in `src/stores/auth-store.ts`**

Update the persist config (lines 133-140) to add version and migrate:
```typescript
{
  name: "auth-store",
  version: 2,
  migrate: (persistedState: unknown, version: number) => {
    if (version < 2) {
      // Force re-login to get roleId
      return {
        user: null,
        token: null,
        isAuthenticated: false,
      };
    }
    return persistedState as AuthStore;
  },
  partialize: (state) => ({
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
  }),
}
```

- [ ] **Step 5: Run TypeScript check**

Run: `npx tsc --noEmit 2>&1 | head -50`

Expected broken files (will be fixed in Tasks 4-7):
- `src/app/(protected)/employee-request/page.tsx` — `user.role` no longer exists
- `src/app/(protected)/employee-request/[id]/page.tsx` — `user.role` no longer exists
- `src/app/(protected)/employee-request/new/page.tsx` — `user.role` no longer exists
- `src/app/(protected)/users/page.tsx` — `USER_ROLE_CONFIG` import from deleted file
- `src/app/(protected)/users/[id]/page.tsx` — `USER_ROLE_CONFIG` import from deleted file
- `src/components/users/UserDetailDialog.tsx` — `USER_ROLE_CONFIG` import from deleted file

- [ ] **Step 6: Commit**

```bash
git add src/types/index.ts src/stores/auth-store.ts
git commit -m "feat: update User type and auth store to use roleId + roleName"
```

---

### Task 4: Delete `lib/constants/user.ts`

**Files:**
- Delete: `src/lib/constants/user.ts`

- [ ] **Step 1: Delete `src/lib/constants/user.ts`**

The entire file contains only `USER_ROLE`, `USER_ROLE_LABELS`, `USER_ROLE_OPTIONS`, `USER_ROLE_CONFIG` — all replaced by `ROLES`, `ROLE_LABELS`, `ROLE_CONFIG` from `src/lib/constants/roles.ts`.

Delete the file entirely.

- [ ] **Step 2: Commit**

```bash
git rm src/lib/constants/user.ts
git commit -m "refactor: delete user.ts constants (replaced by roles.ts)"
```

---

### Task 5: Migrate `lib/constants/employeeRequest.ts`

**Files:**
- Modify: `src/lib/constants/employeeRequest.ts` (lines 1-10 remove ROLES/Role, lines 226-240 update WORKFLOW_TRANSITIONS)

- [ ] **Step 1: Remove string ROLES and Role type**

Delete lines 1-10 (the `ROLES` object and `Role` type export).

- [ ] **Step 2: Add import for ROLES from roles.ts**

Add at top of file:
```typescript
import { ROLES } from './roles';
```

- [ ] **Step 3: Update WORKFLOW_TRANSITIONS**

Change `allowedRoles` type from `string[]` to `number[]` and update values:

```typescript
export const WORKFLOW_TRANSITIONS: Record<EmployeeRequestStatus, {
  nextStatuses: EmployeeRequestStatus[];
  allowedRoles: number[];
}> = {
  draft:          { nextStatuses: ['created'],                         allowedRoles: [ROLES.MANAGER, ROLES.SUPER_ADMIN] },
  created:        { nextStatuses: ['hod_reviewed', 'revise'],          allowedRoles: [ROLES.HOD, ROLES.SUPER_ADMIN] },
  hod_reviewed:   { nextStatuses: ['reviewed', 'revise'],              allowedRoles: [ROLES.HUMAN_RESOURCES, ROLES.SUPER_ADMIN] },
  reviewed:       { nextStatuses: ['approved', 'rejected', 'revise'],  allowedRoles: [ROLES.MANAGEMENT, ROLES.SUPER_ADMIN] },
  approved:       { nextStatuses: ['in_recruitment'],                  allowedRoles: [ROLES.HUMAN_RESOURCES, ROLES.SUPER_ADMIN] },
  rejected:       { nextStatuses: [],                                  allowedRoles: [] },
  revise:         { nextStatuses: ['created'],                         allowedRoles: [ROLES.MANAGER, ROLES.SUPER_ADMIN] },
  in_recruitment: { nextStatuses: ['completed'],                       allowedRoles: [ROLES.HUMAN_RESOURCES, ROLES.SUPER_ADMIN] },
  completed:      { nextStatuses: [],                                  allowedRoles: [] },
};
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/constants/employeeRequest.ts
git commit -m "refactor: migrate employeeRequest ROLES to numeric IDs from roles.ts"
```

---

### Task 6: Migrate Employee Request Pages

**Files:**
- Modify: `src/app/(protected)/employee-request/page.tsx` (lines 38, 119-120)
- Modify: `src/app/(protected)/employee-request/[id]/page.tsx` (lines 58-73, 155-161, 438, 452, 466, 488, 502)
- Modify: `src/app/(protected)/employee-request/new/page.tsx` (lines 47, 78-85, 148)

**Key renames (old string → new numeric):**
- `ROLES.ADMIN` → `ROLES.SUPER_ADMIN`
- `ROLES.HR` → `ROLES.HUMAN_RESOURCES`
- `ROLES.MANAGER` → `ROLES.MANAGER` (same key, value changes from `'manager'` to `6`)
- `ROLES.MANAGEMENT` → `ROLES.MANAGEMENT` (same key, value changes from `'management'` to `7`)
- `ROLES.HOD` → `ROLES.HOD` (same key, value changes from `'hod'` to `10`)
- `user?.role` → `user?.roleId`

- [ ] **Step 1: Update `employee-request/page.tsx`**

Change import (line 38): replace `ROLES` import from `employeeRequest` with import from `roles`:
```typescript
import { ROLES } from '@/lib/constants/roles';
```

Replace lines 119-120:
```typescript
const userRoleId = user?.roleId ?? 0;
const canCreate = userRoleId === ROLES.MANAGER || userRoleId === ROLES.SUPER_ADMIN;
```

- [ ] **Step 2: Update `employee-request/[id]/page.tsx`**

Change import: replace `ROLES` import from `employeeRequest` with import from `roles`:
```typescript
import { ROLES } from '@/lib/constants/roles';
```

Replace lines 155-161 (all 4 lines must change):
```typescript
// Line 155: user?.role → user?.roleId
const userRoleId = user?.roleId ?? 0;
// Line 156: ROLES.ADMIN → ROLES.SUPER_ADMIN
const isAdmin = userRoleId === ROLES.SUPER_ADMIN;
// Lines 158-161: string[] → number[], userRole → userRoleId
const canPerformAction = (allowedRoles: number[]) => {
  if (isAdmin) return true;
  return allowedRoles.includes(userRoleId);
};
```

Update all `ROLES.HR` → `ROLES.HUMAN_RESOURCES` in action buttons (3 occurrences):
- Line 452: `canPerformAction([ROLES.HR])` → `canPerformAction([ROLES.HUMAN_RESOURCES])`
- Line 488: `canPerformAction([ROLES.HR])` → `canPerformAction([ROLES.HUMAN_RESOURCES])`
- Line 502: `canPerformAction([ROLES.HR])` → `canPerformAction([ROLES.HUMAN_RESOURCES])`

Lines 438 (`ROLES.HOD`) and 466 (`ROLES.MANAGEMENT`) keep their key names — values auto-change to numbers.

- [ ] **Step 3: Update `employee-request/new/page.tsx`**

Change import: replace `ROLES` import from `employeeRequest` with import from `roles`:
```typescript
import { ROLES } from '@/lib/constants/roles';
```

Replace line 78:
```typescript
const userRoleId = user?.roleId ?? 0;
```

Replace line 82 (`ROLES.ADMIN` → `ROLES.SUPER_ADMIN`):
```typescript
if (userRoleId && userRoleId !== ROLES.SUPER_ADMIN && userRoleId !== ROLES.MANAGER) {
```

Replace line 148:
```typescript
const isManager = userRoleId === ROLES.MANAGER;
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(protected\)/employee-request/
git commit -m "refactor: migrate employee-request pages from string roles to numeric roleId"
```

---

### Task 7: Migrate Users Pages and Components

**Files:**
- Modify: `src/app/(protected)/users/page.tsx` (lines 44, 105, 120-122, 200)
- Modify: `src/app/(protected)/users/[id]/page.tsx` (lines 28, 98, 185, 228)
- Modify: `src/components/users/UserDetailDialog.tsx` (lines 29, 134, 172, 196)
- Verify: `src/components/users/UserFormDialog.tsx` (no USER_ROLE imports — uses dynamic role fetch)

**Important context:** These files use `UserManagement` type (not auth `User` type). `UserManagement` has `role?: UserRole` relation with `{ roleId: number, roleName: string | null }`. The `user.role?.roleName` pattern here is accessing the **relation object**, not the old string field. This pattern stays valid. Only `USER_ROLE_CONFIG` references need updating.

- [ ] **Step 1: Update `users/page.tsx`**

Replace import (line 44):
```typescript
import { ROLES, ROLE_CONFIG } from '@/lib/constants/roles';
```

Replace hardcoded roleId checks (lines 120-122) with correct database IDs:
```typescript
// Old: u.roleId === 1 (was Admin in old mapping, but 1 = HR in database!)
// New: use ROLES constants with correct database IDs
const adminCount = users.filter((u) => u.roleId === ROLES.SUPER_ADMIN).length;
const hrCount = users.filter((u) => u.roleId === ROLES.HUMAN_RESOURCES).length;
const managerCount = users.filter((u) => u.roleId === ROLES.MANAGER).length;
```

Replace `USER_ROLE_CONFIG` with `ROLE_CONFIG` in `getRoleBadge` function (line 200):
```typescript
const config = ROLE_CONFIG[roleId as RoleId];
```

Line 105 (`user.role?.roleName`) — **no change needed**. This accesses `UserManagement.role` relation, not the auth user field.

- [ ] **Step 2: Update `users/[id]/page.tsx`**

Replace import (line 28):
```typescript
import { ROLE_CONFIG, RoleId } from '@/lib/constants/roles';
```

Replace `USER_ROLE_CONFIG` with `ROLE_CONFIG` (line 98):
```typescript
const config = ROLE_CONFIG[roleId as RoleId];
```

Lines 185 and 228 (`user.role?.roleName`) — **no change needed**. These access `UserManagement.role` relation.

Replace `USER_ROLE_CONFIG` fallback on line 228:
```typescript
value={user.role?.roleName || ROLE_CONFIG[user.roleId as RoleId]?.label || `Role ${user.roleId}`}
```

- [ ] **Step 3: Update `UserDetailDialog.tsx`**

Replace import (line 29):
```typescript
import { ROLE_CONFIG, RoleId } from '@/lib/constants/roles';
```

Replace `USER_ROLE_CONFIG` with `ROLE_CONFIG` (line 134):
```typescript
const config = ROLE_CONFIG[roleId as RoleId];
```

Line 172 (`user.role?.roleName`) — **no change needed**. Accesses `UserManagement.role` relation.

Replace `USER_ROLE_CONFIG` fallback on line 196:
```typescript
value={user.role?.roleName || ROLE_CONFIG[user.roleId as RoleId]?.label || `Role ${user.roleId}`}
```

- [ ] **Step 4: Verify `UserFormDialog.tsx`**

Check that `src/components/users/UserFormDialog.tsx` has no `USER_ROLE` imports. It fetches roles dynamically from `roleService.fetchAll()` — no changes needed. Just verify this is true.

- [ ] **Step 5: Run TypeScript check**

Run: `npx tsc --noEmit 2>&1 | head -50`
Expected: No errors related to USER_ROLE, role types, or user.role.

- [ ] **Step 6: Commit**

```bash
git add src/app/\(protected\)/users/ src/components/users/
git commit -m "refactor: migrate users pages from USER_ROLE_CONFIG to ROLE_CONFIG"
```

---

### Task 8: Filter Sidebar by Role

**Files:**
- Modify: `src/components/layout/sidebar.tsx` (add auth store import, filter navigation sections)

- [ ] **Step 1: Add imports**

Add to sidebar.tsx:
```typescript
import { useAuthStore } from '@/stores/auth-store';
import { hasRouteAccess } from '@/lib/constants/routeAccess';
```

- [ ] **Step 2: Add role filtering inside `Sidebar` component**

After `const { sidebarCollapsed, toggleSidebarCollapse } = useAppStore();` (line 119), add:

```typescript
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
```

- [ ] **Step 3: Replace `navigation` with `filteredNavigation`**

In the render (line 185), change:
```typescript
// Before
{navigation.map((section) => (
// After
{filteredNavigation.map((section) => (
```

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/sidebar.tsx
git commit -m "feat: filter sidebar menu items by user roleId"
```

---

### Task 9: Create RouteGuard Component

**Files:**
- Create: `src/components/shared/RouteGuard.tsx`

- [ ] **Step 1: Create `src/components/shared/RouteGuard.tsx`**

Note: The 403 page renders inside the sidebar layout (next to sidebar). Uses `flex-1` height instead of `min-h-screen` to fit correctly within the existing layout structure.

```typescript
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ShieldX } from 'lucide-react';

import { useAuthStore } from '@/stores/auth-store';
import { hasRouteAccess } from '@/lib/constants/routeAccess';
import { Button } from '@/components/ui/button';

interface RouteGuardProps {
  children: React.ReactNode;
}

export function RouteGuard({ children }: RouteGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const userRoleId = user?.roleId ?? 0;

  if (!hasRouteAccess(pathname, userRoleId)) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldX className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">403 — Access Denied</h1>
          <p className="text-muted-foreground">
            You don&apos;t have permission to access this page.
          </p>
          <Button onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/shared/RouteGuard.tsx
git commit -m "feat: add RouteGuard component with 403 forbidden page"
```

---

### Task 10: Integrate RouteGuard in Protected Layout

**Files:**
- Modify: `src/app/(protected)/layout.tsx` (add import, wrap children)

- [ ] **Step 1: Add import**

Add to layout.tsx:
```typescript
import { RouteGuard } from '@/components/shared/RouteGuard';
```

- [ ] **Step 2: Wrap children with RouteGuard**

Replace lines 89-93:
```typescript
return (
  <div className="relative min-h-screen bg-background">
    <Sidebar />
    <RouteGuard>
      {children}
    </RouteGuard>
  </div>
);
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(protected\)/layout.tsx
git commit -m "feat: integrate RouteGuard in protected layout"
```

---

### Task 11: Final Verification

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Manual test checklist**

Test in browser:
1. Login as Employee (roleId=2) → sidebar should NOT show Employee Budget, Employee Request, Recruitment, Users, Roles Access
2. Login as Employee → navigate directly to `/employee-budget` → should see 403 page
3. Login as Manager (roleId=6) → sidebar should NOT show Users, Roles Access
4. Login as Manager → navigate directly to `/users` → should see 403 page
5. Login as HR (roleId=1) → sidebar should show ALL menus
6. Login as Super Admin (roleId=3) → sidebar should show ALL menus
7. Click "Back to Dashboard" on 403 page → should redirect to dashboard
8. Verify employee-request workflow buttons still work correctly for each role

- [ ] **Step 4: Final commit (if any cleanup needed)**

```bash
git add -A
git commit -m "feat: complete role-based sidebar filtering and route protection"
```
