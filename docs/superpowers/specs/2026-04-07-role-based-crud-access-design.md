# Role-Based CRUD Access — Master Data & Employee List

**Date:** 2026-04-07
**Status:** Draft — pending implementation
**Repos affected:** `recruitment-hris` (frontend), `recruitment-hris-api` (backend)

---

## 1. Purpose

Restrict create/update/delete operations on the master data and employee list modules to HR personnel only. All other authenticated roles retain read access (view-only).

The six affected resources are:

- OBS (Organization Breakdown Structure)
- Division
- Department
- Job Level
- Job Title
- Employee List

---

## 2. Roles

The "HR" set is identical on both layers and contains exactly three role IDs:

| Role ID | Constant | Display |
|---|---|---|
| 1 | `HUMAN_RESOURCES` | Human Resources |
| 8 | `HR_MANAGER` | HR Manager |
| 3 | `SUPER_ADMIN` | Super Admin |

These three roles can create, read, update, and delete on all six resources. Every other authenticated role (Manager, HOD, Management, Employee, Auditor, Finance, Candidates) gets read-only access.

This set matches the existing precedent in `src/hooks/useAssessmentPermission.ts`.

---

## 3. Permission table

Single rule applied uniformly to all six resources:

| Resource | GET (read) | POST / PUT / PATCH / DELETE |
|---|---|---|
| OBS | All authenticated roles | HR set only |
| Division | All authenticated roles | HR set only |
| Department | All authenticated roles | HR set only |
| Job Level | All authenticated roles | HR set only |
| Job Title | All authenticated roles | HR set only |
| Employee | All authenticated roles | HR set only |

**Sub-action endpoints:**

- Mutation sub-actions (e.g. `divisions/:id/assign-head`, `departments/:id/assign-manager`) follow the **mutation** column — HR-only.
- Read-only sub-actions (e.g. `employees/:id/check-structural`) follow the **read** column — open to all authenticated roles.

---

## 4. Architecture

Two layers, one rule, one source of truth per layer:

```
┌─────────────────── Frontend ────────────────────┐    ┌─────── Backend ────────┐
│                                                  │    │                         │
│  HR_ROLES constant ──┬─→ useIsHr() hook ──┬─→ Pages (hide buttons)              │
│                      │                    │      │    │                         │
│                      ├─→ <RequireHr>  ────┴─→ Action pages (/new, /edit) → 403  │
│                      │                          │    │                         │
│                      └─────────────────── parallel constant ──→ HR_ROLE_IDS     │
│                                                  │    │            │            │
│                                                  │    │            ▼            │
│                                                  │    │   requireHrRole         │
│                                                  │    │   middleware            │
│                                                  │    │            │            │
│                                                  │    │            ▼            │
│                                                  │    │   POST/PUT/DELETE       │
│                                                  │    │   on 6 resources        │
└──────────────────────────────────────────────────┘    └─────────────────────────┘
```

Frontend `HR_ROLES` and backend `HR_ROLE_IDS` are independent constants holding the same numeric IDs `[1, 8, 3]`. They are not shared via a package because the two repos are not linked. Both reference role IDs from the database `role_access` table — the data layer is the underlying source of truth.

---

## 5. Frontend changes (`recruitment-hris`)

### 5.1 Extend `src/lib/constants/roles.ts`

Add the HR set and a type guard alongside the existing `ROLES` enum:

```ts
export const HR_ROLES: RoleId[] = [
  ROLES.HUMAN_RESOURCES,
  ROLES.HR_MANAGER,
  ROLES.SUPER_ADMIN,
];

export function isHrRole(roleId: number | undefined | null): boolean {
  return roleId != null && HR_ROLES.includes(roleId as RoleId);
}
```

### 5.2 New hook `src/hooks/useIsHr.ts`

```ts
import { useAuthStore } from '@/stores/auth-store';
import { isHrRole } from '@/lib/constants/roles';

export function useIsHr(): boolean {
  const user = useAuthStore((s) => s.user);
  return isHrRole(user?.roleId);
}
```

### 5.3 New guard component `src/components/shared/RequireHr.tsx`

A wrapper component that renders the same 403 Access Denied page used by the existing `RouteGuard` when `useIsHr()` returns `false`. Otherwise renders `children` unchanged.

The 403 markup must be visually identical to `RouteGuard`'s — extract a shared `<AccessDeniedPage />` component if necessary, or import the existing JSX directly.

### 5.4 Page edits

Apply the following pattern across all six resources.

**List pages** (`*/page.tsx`):

```tsx
const isHr = useIsHr();
// ...
{isHr && <CreateButton />}
```

Affected files:
- `src/app/(protected)/organization/obs/page.tsx`
- `src/app/(protected)/organization/divisions/page.tsx`
- `src/app/(protected)/organization/departments/page.tsx`
- `src/app/(protected)/organization/job-levels/page.tsx`
- `src/app/(protected)/organization/job-titles/page.tsx`
- `src/app/(protected)/employees/page.tsx`

**Inline-edit detail pages** (OBS, Division, Department, Job Level): the page already has a read-only render path with an "Edit" toggle. Hide the Edit toggle and the Delete button when `useIsHr()` is false. Save / Cancel never render because edit mode becomes unreachable.

Affected files:
- `src/app/(protected)/organization/obs/[id]/page.tsx`
- `src/app/(protected)/organization/divisions/[id]/page.tsx`
- `src/app/(protected)/organization/departments/[id]/page.tsx`
- `src/app/(protected)/organization/job-levels/[id]/page.tsx`

**Tab-based detail pages** (Job Title, Employee): hide the Edit and Delete buttons in the header. Tabs themselves remain interactive (read-only).

Affected files:
- `src/app/(protected)/organization/job-titles/[id]/page.tsx`
- `src/app/(protected)/employees/[id]/page.tsx`

**Dedicated action pages** (`new/page.tsx`, `[id]/edit/page.tsx`): wrap the page body in `<RequireHr>` so direct URL access shows the 403 page.

Affected files:
- `src/app/(protected)/organization/job-titles/new/page.tsx`
- `src/app/(protected)/organization/job-titles/[id]/edit/page.tsx`
- `src/app/(protected)/employees/new/page.tsx`
- `src/app/(protected)/employees/[id]/edit/page.tsx`

---

## 6. Backend changes (`recruitment-hris-api`)

### 6.1 Extend `src/middlewares/authMiddleware.ts`

Add `roleId` to the `JwtPayload` interface and assign it from the already-fetched user record:

```ts
export interface JwtPayload extends JwtTokenPayload {
  roleId: number     // NEW
  roleName: string
}

// Inside authenticate(), in the existing assignment block:
request.user = {
  userId: decoded.userId,
  email: decoded.email,
  roleId: user.roleId,    // NEW — already fetched in userResult above
  roleName,
}
```

The user record is already fetched on line 49 by `userRepository.findById(decoded.userId)`. `roleId` is currently dropped on the floor. No new database query is introduced.

### 6.2 Use existing `ForbiddenError`

`ForbiddenError` already exists and is exported from `src/errors/index.ts`. Import it directly in the new middleware. No new error class is needed.

### 6.3 New middleware `src/middlewares/roleMiddleware.ts`

```ts
import type { FastifyRequest, FastifyReply } from 'fastify'
import { ForbiddenError } from '../errors/index.js'

const HR_ROLE_IDS = [1, 8, 3] // HUMAN_RESOURCES, HR_MANAGER, SUPER_ADMIN

export async function requireHrRole(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  if (!HR_ROLE_IDS.includes(request.user.roleId)) {
    throw new ForbiddenError('Only HR can perform this action')
  }
}
```

The constant is colocated with the middleware that uses it. If a future feature needs the same set, extract to `src/constants/roleConstants.ts`.

### 6.4 Route attachments

All six target route files currently register `authenticate` as a **file-level** hook via `app.addHook('preHandler', authenticate)` at the top of the route plugin. Leave that hook in place. Attach `requireHrRole` only on the per-route mutation handlers — do not include `authenticate` in the per-route array (it would run twice).

```ts
// File-level (already exists, do not change):
app.addHook('preHandler', authenticate)

// Per-route, on every POST/PUT/PATCH/DELETE handler:
app.post('/', {
  preHandler: requireHrRole,
  schema: { /* ... */ }
}, handler)
```

Fastify runs the file-level hook first, populates `request.user`, then runs the per-route `requireHrRole`. Order is correct by construction.

Affected files:
- `src/routes/obsRoutes.ts`
- `src/routes/divisionRoutes.ts`
- `src/routes/departmentRoutes.ts`
- `src/routes/jobLevelRoutes.ts`
- `src/routes/jobTitleRoutes.ts`
- `src/routes/employeeRoutes.ts`

GET handlers are left untouched. Sub-action mutation endpoints (`assign-head`, `assign-manager`, etc.) also receive `requireHrRole`. Read-only sub-endpoints (`check-structural`, etc.) do not.

---

## 7. View-only behavior summary

For non-HR users:

- **List pages** — Create button hidden. Table renders identically. Rows remain clickable to detail page.
- **Inline-edit detail pages** (OBS, Division, Department, Job Level) — page renders the read-only state. Edit toggle hidden. Delete button hidden. Save / Cancel never reachable.
- **Tab-based detail pages** (Job Title, Employee) — Edit and Delete buttons in the header hidden. Tabs remain interactive.
- **Dedicated action pages** (`/employees/new`, `/employees/[id]/edit`, `/organization/job-titles/new`, `/organization/job-titles/[id]/edit`) — wrapped in `<RequireHr>`. Direct URL access shows the 403 Access Denied page.
- **Backend** — direct API calls to mutation endpoints by non-HR users return `403 Forbidden` with body `{ success: false, message: 'Only HR can perform this action' }`.

A view-only user navigating naturally through the UI never encounters a button that errors out. Every error path is reachable only via direct URL or external API call (curl, Postman).

---

## 8. Testing

Manual smoke test, performed once per role from each of `HUMAN_RESOURCES`, `MANAGER`, `EMPLOYEE`:

1. Open list page for each of the 6 resources → confirm Create button visible only for HR.
2. Open detail page for each → confirm Edit and Delete buttons visible only for HR.
3. As non-HR, type `/employees/new` directly → confirm 403 page.
4. As non-HR, type `/employees/123/edit` directly → confirm 403 page.
5. As non-HR, type `/organization/job-titles/new` directly → confirm 403 page.
6. As non-HR, `curl -X POST` to `/v1/employees` with a valid token → confirm 403 JSON response.
7. As non-HR, `curl -X DELETE` to `/v1/divisions/1` with a valid token → confirm 403 JSON response.
8. As HR, repeat steps 6–7 → confirm 200/204 success.
9. Sidebar: confirm none of the 6 menu items disappear for any active role (page-level access stays open per current `routeAccess.ts`).

No automated tests are added. Neither repo currently has a test harness, and introducing one is out of scope.

---

## 9. Out of scope

These are explicitly **not** part of this work:

- **Roles & Access page** (`/roles-access`) — already HR + Super Admin only via `routeAccess.ts`.
- **Recruitment / Onboarding modules** — already have their own permission model in `useAssessmentPermission.ts`.
- **Employee Request, Employee Budget, Dashboard** — different access rules already encoded in `routeAccess.ts`.
- **Sidebar visibility** — none of the 6 menu items are hidden for any role. View-only users still see the menu and browse.
- **Auto-created employees from onboarding completion** — onboarding is performed by HR, so the resulting backend mutation runs under an HR session. The new middleware does not break this flow.
- **Existing JWT tokens** — adding `roleId` to `request.user` happens server-side in `authMiddleware.ts` (read from DB, not from the token payload). Existing tokens keep working without re-login.
- **Granular department-scoped permissions** — e.g., "a manager can edit only employees in their managed department". `user.managedDepartments` and `user.headOfDivisions` are available in the auth store but unused. Not in scope. Possible future iteration.
- **Test infrastructure** — neither repo has a test harness today; not adding one in this scope.

---

## 10. Files touched

**Frontend (`recruitment-hris`):**

| File | Change |
|---|---|
| `src/lib/constants/roles.ts` | Add `HR_ROLES` and `isHrRole()` |
| `src/hooks/useIsHr.ts` | New file |
| `src/components/shared/RequireHr.tsx` | New file |
| `src/app/(protected)/organization/obs/page.tsx` | Hide Create when not HR |
| `src/app/(protected)/organization/obs/[id]/page.tsx` | Hide Edit/Delete when not HR |
| `src/app/(protected)/organization/divisions/page.tsx` | Hide Create when not HR |
| `src/app/(protected)/organization/divisions/[id]/page.tsx` | Hide Edit/Delete when not HR |
| `src/app/(protected)/organization/departments/page.tsx` | Hide Create when not HR |
| `src/app/(protected)/organization/departments/[id]/page.tsx` | Hide Edit/Delete when not HR |
| `src/app/(protected)/organization/job-levels/page.tsx` | Hide Create when not HR |
| `src/app/(protected)/organization/job-levels/[id]/page.tsx` | Hide Edit/Delete when not HR |
| `src/app/(protected)/organization/job-titles/page.tsx` | Hide Create when not HR |
| `src/app/(protected)/organization/job-titles/[id]/page.tsx` | Hide Edit/Delete when not HR |
| `src/app/(protected)/organization/job-titles/new/page.tsx` | Wrap in `<RequireHr>` |
| `src/app/(protected)/organization/job-titles/[id]/edit/page.tsx` | Wrap in `<RequireHr>` |
| `src/app/(protected)/employees/page.tsx` | Hide Create when not HR |
| `src/app/(protected)/employees/[id]/page.tsx` | Hide Edit/Delete when not HR |
| `src/app/(protected)/employees/new/page.tsx` | Wrap in `<RequireHr>` |
| `src/app/(protected)/employees/[id]/edit/page.tsx` | Wrap in `<RequireHr>` |

**Backend (`recruitment-hris-api`):**

| File | Change |
|---|---|
| `src/middlewares/authMiddleware.ts` | Add `roleId` to `JwtPayload` and assignment |
| `src/middlewares/roleMiddleware.ts` | New file — `requireHrRole` |
| `src/routes/obsRoutes.ts` | Attach `requireHrRole` to POST/PUT/PATCH/DELETE |
| `src/routes/divisionRoutes.ts` | Attach `requireHrRole` to POST/PUT/PATCH/DELETE + assign-head |
| `src/routes/departmentRoutes.ts` | Attach `requireHrRole` to POST/PUT/PATCH/DELETE + assign-manager |
| `src/routes/jobLevelRoutes.ts` | Attach `requireHrRole` to POST/PUT/PATCH/DELETE |
| `src/routes/jobTitleRoutes.ts` | Attach `requireHrRole` to POST/PUT/PATCH/DELETE |
| `src/routes/employeeRoutes.ts` | Attach `requireHrRole` to POST/PUT/PATCH/DELETE (not check-structural) |

Total: ~22 files in frontend, ~8 files in backend. Each touch is small (1–5 lines).
