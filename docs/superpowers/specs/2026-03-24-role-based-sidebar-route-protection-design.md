# Role-Based Sidebar & Route Protection

## Overview

Implement role-based menu visibility on the sidebar and route-level access protection. Users who don't have access to a menu won't see it in the sidebar, and direct URL access to restricted routes will show a 403 Forbidden page.

**Security note:** This is a client-side UX convenience only. API endpoints must still enforce authorization server-side. This feature prevents users from seeing menus they can't use and provides a clear 403 page, but is not a security boundary.

## Approach

**Config-Driven** — A single `ROUTE_ACCESS` config maps each route to allowed role IDs. Both the sidebar and route guard read from this config, ensuring they never go out of sync.

## Roles (from database `role_access` table)

| role_id | role_name        | Constant Key     |
|---------|------------------|------------------|
| 1       | Human Resources  | HUMAN_RESOURCES  |
| 2       | Employee         | EMPLOYEE         |
| 3       | Super Admin      | SUPER_ADMIN      |
| 4       | Auditor          | AUDITOR          |
| 5       | Finance          | FINANCE          |
| 6       | PC Head/Manager  | MANAGER          |
| 7       | Management       | MANAGEMENT       |
| 8       | HR Manager       | HR_MANAGER       |
| 9       | Candidates       | CANDIDATES       |
| 10      | Head Of Division | HOD              |

**Active roles for this feature:** SUPER_ADMIN (3), HUMAN_RESOURCES (1), MANAGER (6), HOD (10), MANAGEMENT (7), EMPLOYEE (2).

Roles 4, 5, 8, 9 are not yet used — will be handled in future enhancement. Users with these roles will see an empty sidebar and get 403 on all routes until their roles are added to `ROUTE_ACCESS`.

### Old-to-New Role Mapping

The existing codebase has two role definitions that will be replaced:

**`USER_ROLE` (numeric, in `lib/constants/user.ts`) — DIFFERENT IDs from database:**

| Old Key (user.ts) | Old ID | New Key (roles.ts) | New ID (database) |
|---|---|---|---|
| `USER_ROLE.ADMIN` | 1 | `ROLES.SUPER_ADMIN` | 3 |
| `USER_ROLE.HR` | 2 | `ROLES.HUMAN_RESOURCES` | 1 |
| `USER_ROLE.MANAGER` | 3 | `ROLES.MANAGER` | 6 |
| `USER_ROLE.EMPLOYEE` | 4 | `ROLES.EMPLOYEE` | 2 |

**`ROLES` (string, in `lib/constants/employeeRequest.ts`):**

| Old Key (employeeRequest.ts) | Old Value | New Key (roles.ts) | New ID |
|---|---|---|---|
| `ROLES.ADMIN` | `'admin'` | `ROLES.SUPER_ADMIN` | 3 |
| `ROLES.HR` | `'hr'` | `ROLES.HUMAN_RESOURCES` | 1 |
| `ROLES.MANAGER` | `'manager'` | `ROLES.MANAGER` | 6 |
| `ROLES.MANAGEMENT` | `'management'` | `ROLES.MANAGEMENT` | 7 |
| `ROLES.HOD` | `'hod'` | `ROLES.HOD` | 10 |

**This is a critical migration.** The old `USER_ROLE` numeric IDs do NOT match the database IDs. Every reference to `USER_ROLE.*` must be updated to use `ROLES.*` with the correct database IDs.

## Access Matrix

| Route                        | Super Admin | HR | Manager | HOD | Management | Employee |
|------------------------------|:-----------:|:--:|:-------:|:---:|:----------:|:--------:|
| /dashboard                   | Y | Y | Y | Y | Y | Y |
| /organization/obs            | Y | Y | Y | Y | Y | Y |
| /organization/divisions      | Y | Y | Y | Y | Y | Y |
| /organization/departments    | Y | Y | Y | Y | Y | Y |
| /organization/job-levels     | Y | Y | Y | Y | Y | Y |
| /organization/job-titles     | Y | Y | Y | Y | Y | Y |
| /employees                   | Y | Y | Y | Y | Y | Y |
| /employee-budget             | Y | Y | Y | Y | Y | - |
| /employee-request            | Y | Y | Y | Y | Y | - |
| /recruitment                 | Y | Y | Y | Y | Y | - |
| /onboarding                  | Y | Y | Y | Y | Y | - |
| /users                       | Y | Y | - | - | - | - |
| /roles-access                | Y | Y | - | - | - | - |

## Design

### 1. Role Constants (`lib/constants/roles.ts`)

New file — single source of truth for all role IDs, matching database exactly.

```typescript
export const ROLES = {
  HUMAN_RESOURCES: 1,
  EMPLOYEE: 2,
  SUPER_ADMIN: 3,
  AUDITOR: 4,
  FINANCE: 5,
  MANAGER: 6,
  MANAGEMENT: 7,
  HR_MANAGER: 8,
  CANDIDATES: 9,
  HOD: 10,
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
```

**Migration:**
- Remove `USER_ROLE`, `USER_ROLE_LABELS`, `USER_ROLE_OPTIONS`, `USER_ROLE_CONFIG` from `lib/constants/user.ts`
- Remove `ROLES` (string-based) and `Role` type from `lib/constants/employeeRequest.ts`
- Replace all imports across the codebase using the old-to-new mapping table above

### 2. Route Access Config (`lib/constants/routeAccess.ts`)

```typescript
import { ROLES, RoleId } from './roles';

const ALL_ACTIVE_ROLES: RoleId[] = [
  ROLES.SUPER_ADMIN, ROLES.HUMAN_RESOURCES,
  ROLES.MANAGER, ROLES.HOD, ROLES.MANAGEMENT, ROLES.EMPLOYEE,
];

export const ROUTE_ACCESS: Record<string, RoleId[]> = {
  '/dashboard':                ALL_ACTIVE_ROLES,
  '/organization/obs':         ALL_ACTIVE_ROLES,
  '/organization/divisions':   ALL_ACTIVE_ROLES,
  '/organization/departments': ALL_ACTIVE_ROLES,
  '/organization/job-levels':  ALL_ACTIVE_ROLES,
  '/organization/job-titles':  ALL_ACTIVE_ROLES,
  '/employees':                ALL_ACTIVE_ROLES,
  '/employee-budget':          [ROLES.SUPER_ADMIN, ROLES.HUMAN_RESOURCES, ROLES.MANAGER, ROLES.HOD, ROLES.MANAGEMENT],
  '/employee-request':         [ROLES.SUPER_ADMIN, ROLES.HUMAN_RESOURCES, ROLES.MANAGER, ROLES.HOD, ROLES.MANAGEMENT],
  '/recruitment':              [ROLES.SUPER_ADMIN, ROLES.HUMAN_RESOURCES, ROLES.MANAGER, ROLES.HOD, ROLES.MANAGEMENT],
  '/onboarding':               [ROLES.SUPER_ADMIN, ROLES.HUMAN_RESOURCES, ROLES.MANAGER, ROLES.HOD, ROLES.MANAGEMENT],
  '/users':                    [ROLES.SUPER_ADMIN, ROLES.HUMAN_RESOURCES],
  '/roles-access':             [ROLES.SUPER_ADMIN, ROLES.HUMAN_RESOURCES],
};
```

Helper function for route matching (supports dynamic routes like `/recruitment/123`). Uses longest-prefix matching to avoid ambiguity:

```typescript
export function hasRouteAccess(pathname: string, roleId: number): boolean {
  // Exact match first
  if (ROUTE_ACCESS[pathname]) {
    return ROUTE_ACCESS[pathname].includes(roleId as RoleId);
  }
  // Longest prefix match for dynamic routes
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

### 3. Sidebar Filtering (`components/layout/sidebar.tsx`)

- Read `user.roleId` from auth store
- Filter each menu item: `items.filter(item => hasRouteAccess(item.href, userRoleId))`
- Filter sections: if all items in a section are filtered out, do not render the section title or wrapper
- Implementation: filter items array first, then conditionally render section only if `filteredItems.length > 0`

### 4. Route Guard (`components/shared/RouteGuard.tsx`)

Client component wrapping protected layout children:

- Reads `pathname` from `usePathname()`
- Reads `user.roleId` from auth store
- Calls `hasRouteAccess(pathname, roleId)`
- If denied: renders 403 Forbidden page inline (shield icon, "403 - Access Denied" title, "You don't have permission to access this page" message, "Back to Dashboard" button)
- If allowed: renders `children`

Integrated in `app/(protected)/layout.tsx` after existing token check.

### 5. Auth Store Migration (`stores/auth-store.ts`)

- Update `User` type in `types/index.ts`: change `role: string` to `roleId: number` and keep `roleName: string` for display purposes
- Update login mapping: extract both `roleId` (number) and `roleName` (string) from API response
- Update `checkAuth` similarly
- **Zustand persist migration:** Add `version: 2` to persist config with a `migrate` function that clears stale auth state, forcing re-login to get the correct `roleId`

```typescript
// User type becomes:
interface User {
  id: string;
  email: string;
  name: string;
  roleId: number;      // For access control
  roleName: string;    // For display (badge, comments, etc.)
  avatar?: string;
  employeeId?: number | null;
  managedDepartments?: { id: number; name: string }[];
  createdAt: string;
  updatedAt: string;
}
```

### 6. Employee Request Flow Migration

Update 3 files + workflow transitions from string-based to roleId-based:

**Files:**
- `app/(protected)/employee-request/page.tsx`
- `app/(protected)/employee-request/[id]/page.tsx`
- `app/(protected)/employee-request/new/page.tsx`
- `lib/constants/employeeRequest.ts` (WORKFLOW_TRANSITIONS `allowedRoles` from `string[]` to `number[]`)

**Changes:**
- `userRole === ROLES.MANAGER` (string `'manager'`) becomes `user.roleId === ROLES.MANAGER` (number `6`)
- `userRole === ROLES.ADMIN` (string `'admin'`) becomes `user.roleId === ROLES.SUPER_ADMIN` (number `3`)
- `allowedRoles: ['manager', 'admin']` becomes `allowedRoles: [ROLES.MANAGER, ROLES.SUPER_ADMIN]`
- `canPerformAction` function: compare `user.roleId` against `allowedRoles: number[]`

## Files Changed

| File | Action |
|------|--------|
| `lib/constants/roles.ts` | **Create** — new role constants with database IDs |
| `lib/constants/routeAccess.ts` | **Create** — route access config + helper |
| `components/shared/RouteGuard.tsx` | **Create** — route guard component with 403 page |
| `types/index.ts` | **Modify** — User type: `role: string` → `roleId: number` + `roleName: string` |
| `stores/auth-store.ts` | **Modify** — store roleId + roleName, add persist migration |
| `components/layout/sidebar.tsx` | **Modify** — filter menu items by roleId |
| `components/layout/header.tsx` | **Modify** — update `user.role` references to `user.roleName` |
| `app/(protected)/layout.tsx` | **Modify** — integrate RouteGuard |
| `lib/constants/user.ts` | **Modify** — remove USER_ROLE and related exports (replaced by roles.ts) |
| `lib/constants/employeeRequest.ts` | **Modify** — remove ROLES string constants, update WORKFLOW_TRANSITIONS to use numeric roleId |
| `app/(protected)/employee-request/page.tsx` | **Modify** — use roleId |
| `app/(protected)/employee-request/[id]/page.tsx` | **Modify** — use roleId |
| `app/(protected)/employee-request/new/page.tsx` | **Modify** — use roleId |
| `app/(protected)/users/page.tsx` | **Modify** — update hardcoded roleId checks and USER_ROLE references |
| `app/(protected)/users/[id]/page.tsx` | **Modify** — update USER_ROLE_CONFIG references |
| `components/users/UserDetailDialog.tsx` | **Modify** — update USER_ROLE_CONFIG references |
| `components/users/UserFormDialog.tsx` | **Modify** — update roleId references |

## Out of Scope

- Roles Auditor (4), Finance (5), HR Manager (8), Candidates (9) — future enhancement
- Server-side middleware route protection (client-side only — API must enforce its own authorization)
- Permission granularity beyond menu/route level (e.g., per-button permissions)
