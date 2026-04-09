# Role-Based CRUD Access Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restrict create/update/delete on OBS, Division, Department, Job Level, Job Title, and Employee List to HR roles (IDs 1, 8, 3); all other authenticated roles get view-only access.

**Architecture:** Two layers, one rule, one source of truth per layer. Frontend gets a centralized `HR_ROLES` constant, `useIsHr()` hook, and `<RequireHr>` guard — list/detail pages hide mutation buttons, dedicated action pages show 403. Backend gets a `requireHrRole` Fastify middleware attached to every POST/PUT/PATCH/DELETE on the six target route files.

**Tech Stack:** Next.js 15, React 19, Zustand, Fastify, Prisma, TypeScript

**Spec:** `docs/superpowers/specs/2026-04-07-role-based-crud-access-design.md`

**Repos affected:**
- `recruitment-hris` (frontend) — 18 files
- `recruitment-hris-api` (backend) — 8 files

---

## Execution Order

Backend first (Tasks 1–8), then frontend infrastructure (Tasks 9–11), then frontend page edits (Tasks 12–15), then smoke test (Task 16).

The order matters: backend must be in place before frontend can be tested end-to-end against mutation endpoints. Frontend infrastructure (hook + guard) must exist before the page edits can import them.

---

## Task 1: Backend — Add `roleId` to `JwtPayload` and `request.user`

**Files:**
- Modify: `recruitment-hris-api/src/middlewares/authMiddleware.ts`

**Context:** `JwtPayload` currently contains `userId`, `email`, `roleName`. The `user` record is already fetched inside `authenticate()`, but `user.roleId` is dropped on the floor. This task plumbs `roleId` through so per-route middleware can read it from `request.user` without any new DB query.

- [ ] **Step 1: Read the current file**

Run: `cat recruitment-hris-api/src/middlewares/authMiddleware.ts`

Expected: You should see the `JwtPayload` interface near the top (lines 10–23) and the `request.user = { ... }` assignment inside `authenticate()` (lines 48–62).

- [ ] **Step 2: Add `roleId` to `JwtPayload`**

Find the interface:

```ts
export interface JwtPayload extends JwtTokenPayload {
  roleName: string
}
```

Replace with:

```ts
export interface JwtPayload extends JwtTokenPayload {
  roleId: number
  roleName: string
}
```

- [ ] **Step 3: Populate `roleId` on `request.user`**

Find the assignment block inside `authenticate()`:

```ts
request.user = {
  userId: decoded.userId,
  email: decoded.email,
  roleName,
}
```

Replace with:

```ts
request.user = {
  userId: decoded.userId,
  email: decoded.email,
  roleId: user.roleId,
  roleName,
}
```

`user` here is the record returned by `userRepository.findById(decoded.userId)` earlier in the function. It already has `roleId`. No extra query.

- [ ] **Step 4: Type-check**

Run: `cd recruitment-hris-api && npx tsc --noEmit`
Expected: No new TypeScript errors.

- [ ] **Step 5: Commit**

```bash
cd recruitment-hris-api
git add src/middlewares/authMiddleware.ts
git commit -m "feat(auth): expose roleId on request.user"
```

---

## Task 2: Backend — Create `requireHrRole` middleware

**Files:**
- Create: `recruitment-hris-api/src/middlewares/roleMiddleware.ts`

**Context:** A single Fastify `preHandler` that blocks any non-HR role from proceeding. Throws `ForbiddenError` (already exported from `src/errors/index.ts` at line 7 — do not create a new error class). Constant is colocated with the only consumer.

- [ ] **Step 1: Create the file**

Create `recruitment-hris-api/src/middlewares/roleMiddleware.ts` with:

```ts
import type { FastifyRequest, FastifyReply } from 'fastify'
import { ForbiddenError } from '../errors/index.js'

// HR_ROLE_IDS corresponds to frontend HR_ROLES:
// 1 = HUMAN_RESOURCES, 8 = HR_MANAGER, 3 = SUPER_ADMIN
const HR_ROLE_IDS = [1, 8, 3]

export async function requireHrRole(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  if (!HR_ROLE_IDS.includes(request.user.roleId)) {
    throw new ForbiddenError('Only HR can perform this action')
  }
}
```

- [ ] **Step 2: Type-check**

Run: `cd recruitment-hris-api && npx tsc --noEmit`
Expected: No errors. `request.user.roleId` resolves via the updated `JwtPayload` from Task 1.

- [ ] **Step 3: Commit**

```bash
cd recruitment-hris-api
git add src/middlewares/roleMiddleware.ts
git commit -m "feat(auth): add requireHrRole middleware"
```

---

## Task 3: Backend — Attach `requireHrRole` to OBS routes

**Files:**
- Modify: `recruitment-hris-api/src/routes/obsRoutes.ts`

**Context:** File-level hook `app.addHook('preHandler', authenticate)` already runs at line 16. Fastify runs file-level hooks before per-route hooks, so `request.user.roleId` is populated by the time `requireHrRole` runs. Do NOT add `authenticate` to the per-route `preHandler` array (would run twice).

Routes to protect:
- `POST /` (create)
- `PUT /:id` (update)
- `DELETE /:id` (delete)

GET handlers stay untouched.

- [ ] **Step 1: Add import**

At the top of `obsRoutes.ts`, next to the existing `authenticate` import, add:

```ts
import { requireHrRole } from '../middlewares/roleMiddleware.js'
```

- [ ] **Step 2: Attach `requireHrRole` to POST**

Find the POST handler (around line 30–34):

```ts
app.post('/', obsController.create)
```

Replace with:

```ts
app.post('/', { preHandler: requireHrRole }, obsController.create)
```

- [ ] **Step 3: Attach `requireHrRole` to PUT**

Find the PUT handler (around line 36–45). It currently has a schema object. Add `preHandler` alongside it:

```ts
app.put<{ Params: IdParam; Body: UpdateObsBody }>(
  '/:id',
  { preHandler: requireHrRole, schema: { params: IdParamSchema } },
  obsController.update
)
```

- [ ] **Step 4: Attach `requireHrRole` to DELETE**

Find the DELETE handler (around line 47–51):

```ts
app.delete<{ Params: IdParam }>(
  '/:id',
  { preHandler: requireHrRole, schema: { params: IdParamSchema } },
  obsController.remove
)
```

- [ ] **Step 5: Type-check**

Run: `cd recruitment-hris-api && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Manual verification**

Start the backend (`npm run dev`) and from a separate terminal:

```bash
# As a non-HR user (replace TOKEN)
curl -i -X POST http://localhost:3000/v1/obs \
  -H "Authorization: Bearer NON_HR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"test","cluster":"test"}'
```

Expected: HTTP 403 with JSON body `{"success":false,"message":"Only HR can perform this action"}`.

```bash
# As HR
curl -i -X GET http://localhost:3000/v1/obs \
  -H "Authorization: Bearer ANY_TOKEN"
```

Expected: HTTP 200 — GET is unaffected.

- [ ] **Step 7: Commit**

```bash
cd recruitment-hris-api
git add src/routes/obsRoutes.ts
git commit -m "feat(obs): restrict mutations to HR roles"
```

---

## Task 4: Backend — Attach `requireHrRole` to Division routes

**Files:**
- Modify: `recruitment-hris-api/src/routes/divisionRoutes.ts`

**Context:** Same pattern as Task 3. File-level `authenticate` hook at line 18. In addition to main CRUD, this file has four sub-action routes — all mutations, all must be protected: `assign-head`, `remove-head`, `assign-deputy`, `remove-deputy`.

- [ ] **Step 1: Add import**

```ts
import { requireHrRole } from '../middlewares/roleMiddleware.js'
```

- [ ] **Step 2: Attach to POST `/` (create)**

Find the POST handler around line 21–30. Add `preHandler: requireHrRole`:

```ts
app.post<{ Body: CreateDivisionBody }>(
  '/',
  { preHandler: requireHrRole },
  divisionController.create
)
```

- [ ] **Step 3: Attach to PUT `/:id` (update)**

Find the PUT handler around line 32–41:

```ts
app.put<{ Params: IdParam; Body: UpdateDivisionBody }>(
  '/:id',
  { preHandler: requireHrRole, schema: { params: IdParamSchema } },
  divisionController.update
)
```

- [ ] **Step 4: Attach to DELETE `/:id`**

Find the DELETE handler around line 43–56:

```ts
app.delete<{ Params: IdParam }>(
  '/:id',
  { preHandler: requireHrRole, schema: { params: IdParamSchema } },
  divisionController.remove
)
```

- [ ] **Step 5: Attach to POST `/:id/assign-head`**

Around line 59–68. Merge `preHandler` into the existing options object:

```ts
app.post<{ Params: IdParam; Body: AssignHeadBody }>(
  '/:id/assign-head',
  { preHandler: requireHrRole, schema: { params: IdParamSchema } },
  divisionController.assignHead
)
```

- [ ] **Step 6: Attach to DELETE `/:id/head` (remove-head)**

Around line 71–75:

```ts
app.delete<{ Params: IdParam }>(
  '/:id/head',
  { preHandler: requireHrRole, schema: { params: IdParamSchema } },
  divisionController.removeHead
)
```

- [ ] **Step 7: Attach to POST `/:id/assign-deputy`**

Around line 78–87:

```ts
app.post<{ Params: IdParam; Body: AssignDeputyBody }>(
  '/:id/assign-deputy',
  { preHandler: requireHrRole, schema: { params: IdParamSchema } },
  divisionController.assignDeputy
)
```

- [ ] **Step 8: Attach to DELETE `/:id/deputy` (remove-deputy)**

Around line 90–94:

```ts
app.delete<{ Params: IdParam }>(
  '/:id/deputy',
  { preHandler: requireHrRole, schema: { params: IdParamSchema } },
  divisionController.removeDeputy
)
```

- [ ] **Step 9: Type-check**

Run: `cd recruitment-hris-api && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 10: Commit**

```bash
cd recruitment-hris-api
git add src/routes/divisionRoutes.ts
git commit -m "feat(division): restrict mutations to HR roles"
```

---

## Task 5: Backend — Attach `requireHrRole` to Department routes

**Files:**
- Modify: `recruitment-hris-api/src/routes/departmentRoutes.ts`

**Context:** Same pattern. File-level `authenticate` at line 18. Sub-actions: `assign-manager`, `remove-manager`.

- [ ] **Step 1: Add import**

```ts
import { requireHrRole } from '../middlewares/roleMiddleware.js'
```

- [ ] **Step 2: Attach to POST `/` (create)**

Around line 20–29:

```ts
app.post<{ Body: CreateDepartmentBody }>(
  '/',
  { preHandler: requireHrRole },
  departmentController.create
)
```

- [ ] **Step 3: Attach to PUT `/:id`**

Around line 31–40:

```ts
app.put<{ Params: IdParam; Body: UpdateDepartmentBody }>(
  '/:id',
  { preHandler: requireHrRole, schema: { params: IdParamSchema } },
  departmentController.update
)
```

- [ ] **Step 4: Attach to DELETE `/:id`**

Around line 42–53:

```ts
app.delete<{ Params: IdParam }>(
  '/:id',
  { preHandler: requireHrRole, schema: { params: IdParamSchema } },
  departmentController.remove
)
```

- [ ] **Step 5: Attach to POST `/:id/assign-manager`**

Around line 56–65:

```ts
app.post<{ Params: IdParam; Body: AssignManagerBody }>(
  '/:id/assign-manager',
  { preHandler: requireHrRole, schema: { params: IdParamSchema } },
  departmentController.assignManager
)
```

- [ ] **Step 6: Attach to DELETE `/:id/manager` (remove-manager)**

Around line 68–72:

```ts
app.delete<{ Params: IdParam }>(
  '/:id/manager',
  { preHandler: requireHrRole, schema: { params: IdParamSchema } },
  departmentController.removeManager
)
```

- [ ] **Step 7: Type-check**

Run: `cd recruitment-hris-api && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 8: Commit**

```bash
cd recruitment-hris-api
git add src/routes/departmentRoutes.ts
git commit -m "feat(department): restrict mutations to HR roles"
```

---

## Task 6: Backend — Attach `requireHrRole` to Job Level routes

**Files:**
- Modify: `recruitment-hris-api/src/routes/jobLevelRoutes.ts`

**Context:** Straightforward CRUD, no sub-actions. File-level `authenticate` at line 16.

- [ ] **Step 1: Add import**

```ts
import { requireHrRole } from '../middlewares/roleMiddleware.js'
```

- [ ] **Step 2: Attach to POST `/`**

Around line 18–27:

```ts
app.post<{ Body: CreateJobLevelBody }>(
  '/',
  { preHandler: requireHrRole },
  jobLevelController.create
)
```

- [ ] **Step 3: Attach to PUT `/:id`**

Around line 29–38:

```ts
app.put<{ Params: IdParam; Body: UpdateJobLevelBody }>(
  '/:id',
  { preHandler: requireHrRole, schema: { params: IdParamSchema } },
  jobLevelController.update
)
```

- [ ] **Step 4: Attach to DELETE `/:id`**

Around line 40–51:

```ts
app.delete<{ Params: IdParam }>(
  '/:id',
  { preHandler: requireHrRole, schema: { params: IdParamSchema } },
  jobLevelController.remove
)
```

- [ ] **Step 5: Type-check**

Run: `cd recruitment-hris-api && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
cd recruitment-hris-api
git add src/routes/jobLevelRoutes.ts
git commit -m "feat(job-level): restrict mutations to HR roles"
```

---

## Task 7: Backend — Attach `requireHrRole` to Job Title routes

**Files:**
- Modify: `recruitment-hris-api/src/routes/jobTitleRoutes.ts`

**Context:** Straightforward CRUD, no sub-actions. File-level `authenticate` at line 16.

- [ ] **Step 1: Add import**

```ts
import { requireHrRole } from '../middlewares/roleMiddleware.js'
```

- [ ] **Step 2: Attach to POST `/`**

Around line 18–27:

```ts
app.post<{ Body: CreateJobTitleBody }>(
  '/',
  { preHandler: requireHrRole },
  jobTitleController.create
)
```

- [ ] **Step 3: Attach to PUT `/:id`**

Around line 29–38:

```ts
app.put<{ Params: IdParam; Body: UpdateJobTitleBody }>(
  '/:id',
  { preHandler: requireHrRole, schema: { params: IdParamSchema } },
  jobTitleController.update
)
```

- [ ] **Step 4: Attach to DELETE `/:id`**

Around line 40–51:

```ts
app.delete<{ Params: IdParam }>(
  '/:id',
  { preHandler: requireHrRole, schema: { params: IdParamSchema } },
  jobTitleController.remove
)
```

- [ ] **Step 5: Type-check**

Run: `cd recruitment-hris-api && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
cd recruitment-hris-api
git add src/routes/jobTitleRoutes.ts
git commit -m "feat(job-title): restrict mutations to HR roles"
```

---

## Task 8: Backend — Attach `requireHrRole` to Employee routes

**Files:**
- Modify: `recruitment-hris-api/src/routes/employeeRoutes.ts`

**Context:** File-level `authenticate` at line 18. Critical: `GET /check-structural-position` (around lines 56–60) is a **read-only** sub-action and must NOT receive the middleware.

- [ ] **Step 1: Add import**

```ts
import { requireHrRole } from '../middlewares/roleMiddleware.js'
```

- [ ] **Step 2: Attach to POST `/` (create)**

Around line 20–29:

```ts
app.post<{ Body: CreateEmployeeBody }>(
  '/',
  { preHandler: requireHrRole },
  employeeController.create
)
```

- [ ] **Step 3: Attach to PUT `/:id`**

Around line 31–40:

```ts
app.put<{ Params: IdParam; Body: UpdateEmployeeBody }>(
  '/:id',
  { preHandler: requireHrRole, schema: { params: IdParamSchema } },
  employeeController.update
)
```

- [ ] **Step 4: Attach to DELETE `/:id`**

Around line 42–53:

```ts
app.delete<{ Params: IdParam }>(
  '/:id',
  { preHandler: requireHrRole, schema: { params: IdParamSchema } },
  employeeController.remove
)
```

- [ ] **Step 5: Verify `check-structural-position` is untouched**

Find the handler around line 56–60. Confirm it is a `GET` with NO `preHandler: requireHrRole` change:

```ts
app.get('/check-structural-position', employeeController.checkStructuralPosition)
```

This route must remain open to all authenticated users.

- [ ] **Step 6: Type-check**

Run: `cd recruitment-hris-api && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 7: Manual verification**

```bash
# As non-HR, check-structural-position must still work
curl -i -X GET "http://localhost:3000/v1/employees/check-structural-position?jobLevelId=1" \
  -H "Authorization: Bearer NON_HR_TOKEN"
```

Expected: HTTP 200.

```bash
# As non-HR, DELETE must be blocked
curl -i -X DELETE http://localhost:3000/v1/employees/1 \
  -H "Authorization: Bearer NON_HR_TOKEN"
```

Expected: HTTP 403.

- [ ] **Step 8: Commit**

```bash
cd recruitment-hris-api
git add src/routes/employeeRoutes.ts
git commit -m "feat(employee): restrict mutations to HR roles"
```

---

## Task 9: Frontend — Add `HR_ROLES` and `isHrRole()` to roles.ts

**Files:**
- Modify: `recruitment-hris/src/lib/constants/roles.ts`

**Context:** The file already defines `ROLES`, `RoleId`, `ROLE_LABELS`, etc. (ends at line 89). Append the HR set and type guard at the bottom.

- [ ] **Step 1: Append HR_ROLES constant and type guard**

At the end of `src/lib/constants/roles.ts`, append:

```ts

/**
 * Roles allowed to CRUD master data and employee list.
 * Must match backend HR_ROLE_IDS in recruitment-hris-api/src/middlewares/roleMiddleware.ts.
 */
export const HR_ROLES: RoleId[] = [
  ROLES.HUMAN_RESOURCES,
  ROLES.HR_MANAGER,
  ROLES.SUPER_ADMIN,
];

/**
 * Type guard for HR role membership.
 * Accepts unknown numeric values from user store.
 */
export function isHrRole(roleId: number | undefined | null): boolean {
  return roleId != null && (HR_ROLES as number[]).includes(roleId);
}
```

- [ ] **Step 2: Type-check**

Run: `cd recruitment-hris && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd recruitment-hris
git add src/lib/constants/roles.ts
git commit -m "feat(roles): add HR_ROLES and isHrRole helper"
```

---

## Task 10: Frontend — Create `useIsHr` hook

**Files:**
- Create: `recruitment-hris/src/hooks/useIsHr.ts`

**Context:** Thin selector on top of `useAuthStore`. Returns `true` if the current user's `roleId` is in `HR_ROLES`. One caller per page.

- [ ] **Step 1: Create the file**

Create `recruitment-hris/src/hooks/useIsHr.ts` with:

```ts
import { useAuthStore } from '@/stores/auth-store';
import { isHrRole } from '@/lib/constants/roles';

/**
 * Returns true if the current user belongs to one of the HR roles
 * allowed to CRUD master data and employee list.
 */
export function useIsHr(): boolean {
  const user = useAuthStore((s) => s.user);
  return isHrRole(user?.roleId);
}
```

- [ ] **Step 2: Type-check**

Run: `cd recruitment-hris && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd recruitment-hris
git add src/hooks/useIsHr.ts
git commit -m "feat(hooks): add useIsHr hook"
```

---

## Task 11: Frontend — Create `RequireHr` guard component

**Files:**
- Create: `recruitment-hris/src/components/shared/RequireHr.tsx`
- Reference: `recruitment-hris/src/components/shared/RouteGuard.tsx` (for 403 markup parity)

**Context:** When `useIsHr()` returns `false`, render the same 403 Access Denied layout used by the existing `RouteGuard`. Markup must be visually identical. The simplest approach is to duplicate the 403 JSX verbatim from `RouteGuard.tsx` — factoring out a shared `<AccessDeniedPage />` is optional and out of scope unless it makes the component noticeably cleaner.

- [ ] **Step 1: Read `RouteGuard.tsx` and identify the 403 block**

Open `recruitment-hris/src/components/shared/RouteGuard.tsx` and find the JSX branch that renders when the user lacks access. This is the block that shows the 403 Access Denied page — it includes:
- Wrapper container with centering styles
- Lock/shield icon
- "Access Denied" heading
- Descriptive subtext
- Any back-to-dashboard button or link
- All associated imports (icons, Button, etc.)

Note which imports the 403 block depends on — you'll need to replicate them in `RequireHr.tsx`.

- [ ] **Step 2: Create `RequireHr.tsx` with the RouteGuard 403 block inlined**

Create `recruitment-hris/src/components/shared/RequireHr.tsx`. The file should:

1. Start with `'use client';`
2. Import `ReactNode` from `react`
3. Import `useIsHr` from `@/hooks/useIsHr`
4. Import the same icons/components that `RouteGuard.tsx` uses for its 403 block (e.g. `Lock` from `lucide-react`, `Button`, `Link`, etc.)
5. Export a `RequireHr` component that:
   - Accepts `{ children: ReactNode }`
   - Calls `useIsHr()`
   - When `!isHr`, returns the **exact same JSX** used by `RouteGuard.tsx` for its 403 branch — no visual differences
   - Otherwise returns `<>{children}</>`

Skeleton (fill in the 403 JSX by copying verbatim from `RouteGuard.tsx`):

```tsx
'use client';

import type { ReactNode } from 'react';
// Add here the same imports RouteGuard.tsx uses for its 403 block
// (icons, Button, Link, etc.)
import { useIsHr } from '@/hooks/useIsHr';

interface RequireHrProps {
  children: ReactNode;
}

/**
 * Wrapper that shows a 403 Access Denied page when the current user is not HR.
 * Used on dedicated action pages (new/edit) where direct URL access must be
 * blocked for non-HR roles.
 *
 * The 403 JSX is intentionally duplicated from RouteGuard so both guards
 * render the same page. Keep them in sync.
 */
export function RequireHr({ children }: RequireHrProps) {
  const isHr = useIsHr();

  if (!isHr) {
    // >>> Paste the exact 403 JSX from RouteGuard.tsx here <<<
    // Start at the opening tag of the 403 wrapper, end at its closing tag.
    // Do not change any classNames, text, or structure.
    return (
      <div>
        {/* Replace this div with the verbatim 403 block from RouteGuard.tsx */}
      </div>
    );
  }

  return <>{children}</>;
}
```

The final file must have the real 403 JSX pasted in — no comment stubs, no placeholder `<div>`, no `TODO`. If you cannot find the 403 block in `RouteGuard.tsx`, stop and flag it before proceeding.

- [ ] **Step 3: Type-check**

Run: `cd recruitment-hris && npx tsc --noEmit`
Expected: No errors. If `RouteGuard`'s 403 block imports any icons or components, add the same imports at the top of `RequireHr.tsx`.

- [ ] **Step 4: Visual sanity check**

Temporarily add `<RequireHr><div>test</div></RequireHr>` to any page, log in as a non-HR user, and open the page. Confirm the 403 looks identical to what `RouteGuard` renders on a blocked route. Remove the temporary usage.

- [ ] **Step 5: Commit**

```bash
cd recruitment-hris
git add src/components/shared/RequireHr.tsx
git commit -m "feat(shared): add RequireHr guard component"
```

---

## Task 12: Frontend — Hide Create button on 6 list pages

**Files:**
- Modify: `recruitment-hris/src/app/(protected)/organization/obs/page.tsx` (Create button lines 187–201)
- Modify: `recruitment-hris/src/app/(protected)/organization/divisions/page.tsx` (Create button lines 203–217)
- Modify: `recruitment-hris/src/app/(protected)/organization/departments/page.tsx` (Create button lines 228–242)
- Modify: `recruitment-hris/src/app/(protected)/organization/job-levels/page.tsx` (Create button lines 202–216)
- Modify: `recruitment-hris/src/app/(protected)/organization/job-titles/page.tsx` (Create button lines 166–180)
- Modify: `recruitment-hris/src/app/(protected)/employees/page.tsx` (Create button lines 222–236)

**Context:** Each list page has a Create button in the header actions area. Wrap each with `{isHr && …}`. Add the `useIsHr` import and hook call once per file.

Apply the **same** pattern to every file below. Do each file as its own step so commits stay small.

- [ ] **Step 1: OBS list page**

In `src/app/(protected)/organization/obs/page.tsx`:

1. Add import near the other hook/util imports:
   ```tsx
   import { useIsHr } from '@/hooks/useIsHr';
   ```
2. Inside the component function, near the other hook calls at the top:
   ```tsx
   const isHr = useIsHr();
   ```
3. Wrap the existing Create button JSX (lines 187–201) with an `{isHr && (...)}` guard:
   ```tsx
   {isHr && (
     <Button onClick={() => router.push('/organization/obs/new')}>
       {/* ...existing button contents... */}
     </Button>
   )}
   ```

Run: `cd recruitment-hris && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 2: Divisions list page**

Same three edits in `src/app/(protected)/organization/divisions/page.tsx`. Wrap the Create button block at lines 203–217.

Run type-check. Expected: clean.

- [ ] **Step 3: Departments list page**

Same three edits in `src/app/(protected)/organization/departments/page.tsx`. Wrap the Create button block at lines 228–242.

Run type-check. Expected: clean.

- [ ] **Step 4: Job Levels list page**

Same three edits in `src/app/(protected)/organization/job-levels/page.tsx`. Wrap the Create button block at lines 202–216.

Run type-check. Expected: clean.

- [ ] **Step 5: Job Titles list page**

Same three edits in `src/app/(protected)/organization/job-titles/page.tsx`. Wrap the Create button block at lines 166–180.

Run type-check. Expected: clean.

- [ ] **Step 6: Employees list page**

Same three edits in `src/app/(protected)/employees/page.tsx`. Wrap the Create button block at lines 222–236.

Run type-check. Expected: clean.

- [ ] **Step 7: Commit**

```bash
cd recruitment-hris
git add src/app/\(protected\)/organization/obs/page.tsx \
        src/app/\(protected\)/organization/divisions/page.tsx \
        src/app/\(protected\)/organization/departments/page.tsx \
        src/app/\(protected\)/organization/job-levels/page.tsx \
        src/app/\(protected\)/organization/job-titles/page.tsx \
        src/app/\(protected\)/employees/page.tsx
git commit -m "feat(access): hide Create button from non-HR on 6 list pages"
```

---

## Task 13: Frontend — Hide Edit/Delete on 4 inline-edit detail pages

**Files:**
- Modify: `recruitment-hris/src/app/(protected)/organization/obs/[id]/page.tsx`
  - `isEditing` state at line 155
  - Edit/Delete block at lines 289–315 (Delete at 306, Edit at 310)
- Modify: `recruitment-hris/src/app/(protected)/organization/divisions/[id]/page.tsx`
  - `isEditing` state at line 155
  - Edit/Delete block at line 289, Delete at 306, Edit at 310
- Modify: `recruitment-hris/src/app/(protected)/organization/departments/[id]/page.tsx`
  - `isEditing` state at line 167
  - Edit/Delete block at line 325, Delete at 342, Edit at 346
- Modify: `recruitment-hris/src/app/(protected)/organization/job-levels/[id]/page.tsx`
  - `isEditing` state at line 165
  - Edit/Delete block at line 313, Delete at 330, Edit at 334

**Context:** These pages render read/edit modes inline via an `isEditing` state. When non-HR:
- Edit toggle button must not render.
- Delete button must not render.
- The Save / Cancel action row only appears inside the `isEditing` branch — since Edit cannot be triggered, Save/Cancel become unreachable. No extra change needed for those.

For each page, wrap the Edit and Delete buttons with `{isHr && …}`. This can be done either individually or by wrapping the entire `<div>` that contains both.

- [ ] **Step 1: OBS detail page**

In `src/app/(protected)/organization/obs/[id]/page.tsx`:

1. Add import:
   ```tsx
   import { useIsHr } from '@/hooks/useIsHr';
   ```
2. Near the `isEditing` state declaration (line 155), add:
   ```tsx
   const isHr = useIsHr();
   ```
3. At lines 289–315, the block contains the Delete button (line 306) and Edit button (line 310). Wrap the entire wrapping `<div>` (or each button individually) with `{isHr && …}`. Example shape:
   ```tsx
   {isHr && (
     <div className="..."> {/* existing wrapper */}
       <Button variant="destructive" onClick={...}>Delete</Button>
       <Button onClick={() => setIsEditing(true)}>Edit</Button>
     </div>
   )}
   ```

Run: `cd recruitment-hris && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 2: Divisions detail page**

Same three edits in `src/app/(protected)/organization/divisions/[id]/page.tsx`. `isEditing` at line 155, Edit/Delete at lines 289/306/310.

Run type-check. Expected: clean.

- [ ] **Step 3: Departments detail page**

Same three edits in `src/app/(protected)/organization/departments/[id]/page.tsx`. `isEditing` at line 167, Edit/Delete at lines 325/342/346.

Run type-check. Expected: clean.

- [ ] **Step 4: Job Levels detail page**

Same three edits in `src/app/(protected)/organization/job-levels/[id]/page.tsx`. `isEditing` at line 165, Edit/Delete at lines 313/330/334.

Run type-check. Expected: clean.

- [ ] **Step 5: Smoke check — read-only path remains intact**

As a non-HR user, navigate to each of the 4 detail pages by clicking a row from the list page. Expected:
- Page loads successfully.
- Data displays in read-only form.
- No Edit button, no Delete button.
- No console errors about `setIsEditing` or missing props.

- [ ] **Step 6: Commit**

```bash
cd recruitment-hris
git add src/app/\(protected\)/organization/obs/\[id\]/page.tsx \
        src/app/\(protected\)/organization/divisions/\[id\]/page.tsx \
        src/app/\(protected\)/organization/departments/\[id\]/page.tsx \
        src/app/\(protected\)/organization/job-levels/\[id\]/page.tsx
git commit -m "feat(access): hide Edit/Delete from non-HR on 4 inline-edit detail pages"
```

---

## Task 14: Frontend — Hide Edit/Delete on 2 tab-based detail pages

**Files:**
- Modify: `recruitment-hris/src/app/(protected)/organization/job-titles/[id]/page.tsx`
  - Edit/Delete block at lines 281–289
- Modify: `recruitment-hris/src/app/(protected)/employees/[id]/page.tsx`
  - Edit/Delete wrapper div at lines 497–524 (Delete at 499, Edit at 522)

**Context:** These pages do not have an inline edit mode — clicking Edit navigates to a separate `/edit` page. Hide the header Edit and Delete buttons for non-HR. Tabs below stay interactive (read-only).

- [ ] **Step 1: Job Titles detail page**

In `src/app/(protected)/organization/job-titles/[id]/page.tsx`:

1. Add import:
   ```tsx
   import { useIsHr } from '@/hooks/useIsHr';
   ```
2. Inside the component, near the top:
   ```tsx
   const isHr = useIsHr();
   ```
3. Wrap the block at lines 281–289 (both Edit and Delete buttons) with `{isHr && …}`:
   ```tsx
   {isHr && (
     <>
       <Button onClick={...}>Edit</Button>
       <Button variant="destructive" onClick={...}>Delete</Button>
     </>
   )}
   ```

Run: `cd recruitment-hris && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 2: Employees detail page**

In `src/app/(protected)/employees/[id]/page.tsx`:

1. Add import:
   ```tsx
   import { useIsHr } from '@/hooks/useIsHr';
   ```
2. Inside the component, near the top:
   ```tsx
   const isHr = useIsHr();
   ```
3. Wrap the entire wrapping `<div>` at lines 497–524 (which contains both Delete at 499 and Edit at 522) with `{isHr && …}`:
   ```tsx
   {isHr && (
     <div className="..."> {/* existing wrapper at line 497 */}
       {/* Delete button */}
       {/* Edit button */}
     </div>
   )}
   ```

Run: `cd recruitment-hris && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Smoke check**

As a non-HR user:
- Open any job title detail page → header shows title only, no Edit/Delete. Tabs below work.
- Open any employee detail page → header shows employee info only, no Edit/Delete. Tabs below work.

- [ ] **Step 4: Commit**

```bash
cd recruitment-hris
git add src/app/\(protected\)/organization/job-titles/\[id\]/page.tsx \
        src/app/\(protected\)/employees/\[id\]/page.tsx
git commit -m "feat(access): hide Edit/Delete from non-HR on tab-based detail pages"
```

---

## Task 15: Frontend — Wrap 4 dedicated action pages with `<RequireHr>`

**Files:**
- Modify: `recruitment-hris/src/app/(protected)/organization/job-titles/new/page.tsx`
  - Function declaration at line 139, return JSX starts at line 260
- Modify: `recruitment-hris/src/app/(protected)/organization/job-titles/[id]/edit/page.tsx`
  - Function declaration at line 139, return JSX starts at line 312
- Modify: `recruitment-hris/src/app/(protected)/employees/new/page.tsx`
  - Function declaration at line 240, return JSX starts at line 437
- Modify: `recruitment-hris/src/app/(protected)/employees/[id]/edit/page.tsx`
  - Function declaration at line 299, return JSX starts at line 617

**Context:** These are the only 4 dedicated mutation routes (`new`, `[id]/edit`) that exist outside of inline-edit detail pages. Wrap the entire returned JSX in `<RequireHr>` so direct URL access by non-HR lands on the 403 page.

- [ ] **Step 1: Job Titles new page**

In `src/app/(protected)/organization/job-titles/new/page.tsx`:

1. Add import:
   ```tsx
   import { RequireHr } from '@/components/shared/RequireHr';
   ```
2. At line ~260 where the `return (…)` starts, wrap the entire returned JSX:
   ```tsx
   return (
     <RequireHr>
       {/* existing JSX tree unchanged */}
     </RequireHr>
   );
   ```

Run: `cd recruitment-hris && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 2: Job Titles edit page**

Same pattern in `src/app/(protected)/organization/job-titles/[id]/edit/page.tsx`. Wrap the return at line 312.

Run type-check. Expected: clean.

- [ ] **Step 3: Employees new page**

Same pattern in `src/app/(protected)/employees/new/page.tsx`. Wrap the return at line 437.

Run type-check. Expected: clean.

- [ ] **Step 4: Employees edit page**

Same pattern in `src/app/(protected)/employees/[id]/edit/page.tsx`. Wrap the return at line 617.

Run type-check. Expected: clean.

- [ ] **Step 5: Direct-URL smoke check**

As a non-HR user, type each URL directly into the browser address bar:

1. `http://localhost:3000/organization/job-titles/new`
2. `http://localhost:3000/organization/job-titles/1/edit` (any existing ID)
3. `http://localhost:3000/employees/new`
4. `http://localhost:3000/employees/1/edit` (any existing ID)

Expected: All four show the 403 Access Denied page (same markup as `RouteGuard`).

Then as an HR user, the same URLs should render the forms normally.

- [ ] **Step 6: Commit**

```bash
cd recruitment-hris
git add src/app/\(protected\)/organization/job-titles/new/page.tsx \
        src/app/\(protected\)/organization/job-titles/\[id\]/edit/page.tsx \
        src/app/\(protected\)/employees/new/page.tsx \
        src/app/\(protected\)/employees/\[id\]/edit/page.tsx
git commit -m "feat(access): wrap dedicated new/edit pages in RequireHr guard"
```

---

## Task 16: Manual End-to-End Smoke Test

**Files:** None — verification only.

**Context:** Both repos have no automated test harness today. This task is the acceptance gate. Run it from a fresh browser session for each role.

Test accounts needed:
- `HUMAN_RESOURCES` (roleId = 1)
- `MANAGER` (non-HR, roleId = 4 or similar)
- `EMPLOYEE` (non-HR, roleId = 6 or similar)

Start both servers: `cd recruitment-hris-api && npm run dev` in one terminal, `cd recruitment-hris && npm run dev` in another.

### Test Matrix

- [ ] **Step 1: HR — List pages show Create button**

Log in as `HUMAN_RESOURCES`. Visit each of the 6 list pages. Expected:
- `/organization/obs` — Create visible
- `/organization/divisions` — Create visible
- `/organization/departments` — Create visible
- `/organization/job-levels` — Create visible
- `/organization/job-titles` — Create visible
- `/employees` — Create visible

- [ ] **Step 2: HR — Detail pages show Edit/Delete**

Still as HR, click into one row on each of the 6 list pages. Expected:
- All 6 detail pages show Edit and Delete in the header.
- Inline-edit pages (OBS, Division, Department, Job Level) allow toggling into edit mode.
- Tab-based pages (Job Title, Employee) navigate to `/edit` on click.

- [ ] **Step 3: HR — Action pages load**

Still as HR, visit each URL directly:
- `/organization/job-titles/new`
- `/organization/job-titles/<existing-id>/edit`
- `/employees/new`
- `/employees/<existing-id>/edit`

Expected: All four render the form page normally.

- [ ] **Step 4: HR — Backend mutations succeed**

Still as HR, from the UI create one new record in any of the 6 resources and delete it. Expected: success toast, list refreshes, no 403.

Or via curl with HR token:

```bash
curl -i -X POST http://localhost:3000/v1/divisions \
  -H "Authorization: Bearer HR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"smoke-test","code":"SMK","organizationId":1}'
```

Expected: HTTP 200/201.

- [ ] **Step 5: Non-HR (Manager) — List pages hide Create button**

Log out. Log in as `MANAGER`. Visit all 6 list pages. Expected:
- All 6 pages load.
- Tables render with data.
- Rows are clickable.
- **No Create button visible on any page.**

- [ ] **Step 6: Non-HR (Manager) — Detail pages hide Edit/Delete**

Click into one row on each of the 6 list pages. Expected:
- All 6 detail pages load in read-only state.
- **No Edit button, no Delete button on any page.**
- For inline-edit pages: no way to enter edit mode.
- For tab-based pages: tabs below still work (read-only).

- [ ] **Step 7: Non-HR (Manager) — Direct URL to action pages returns 403**

Type each URL directly:
- `/organization/job-titles/new`
- `/organization/job-titles/1/edit`
- `/employees/new`
- `/employees/1/edit`

Expected: All four show the 403 Access Denied page. Page does NOT render the form.

- [ ] **Step 8: Non-HR (Manager) — Direct API mutation returns 403**

```bash
# Replace MANAGER_TOKEN with a real manager's token
curl -i -X POST http://localhost:3000/v1/employees \
  -H "Authorization: Bearer MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"x","lastName":"y","email":"x@y.z"}'
```

Expected: HTTP 403 with body `{"success":false,"message":"Only HR can perform this action"}`.

```bash
curl -i -X DELETE http://localhost:3000/v1/divisions/1 \
  -H "Authorization: Bearer MANAGER_TOKEN"
```

Expected: HTTP 403.

```bash
curl -i -X POST http://localhost:3000/v1/divisions/1/assign-head \
  -H "Authorization: Bearer MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"employeeId":1}'
```

Expected: HTTP 403. Sub-action mutations are blocked too.

- [ ] **Step 9: Non-HR (Manager) — Read-only sub-action remains open**

```bash
curl -i -X GET "http://localhost:3000/v1/employees/check-structural-position?jobLevelId=1" \
  -H "Authorization: Bearer MANAGER_TOKEN"
```

Expected: HTTP 200. `check-structural-position` is a read-only helper and must NOT be HR-gated.

- [ ] **Step 10: Non-HR (Employee) — Repeat key checks**

Log out. Log in as `EMPLOYEE`. Spot check:
- 6 list pages → Create hidden.
- 2 detail pages → Edit/Delete hidden.
- 1 direct URL (e.g. `/employees/new`) → 403.
- 1 direct API mutation (POST /v1/employees) → 403.

- [ ] **Step 11: Sidebar visibility — all 6 menu items still present**

For each of the three roles (HR, Manager, Employee), confirm the sidebar still shows all 6 menu entries (OBS, Division, Department, Job Level, Job Title, Employees). This plan does not hide menu items — view-only users still browse.

- [ ] **Step 12: Regression check — unrelated flows still work**

Spot check:
- Recruitment module — open a candidate, change assessment status. Expected: works (has its own permission model, not touched by this plan).
- Employee Request module — open, create a request. Expected: works as before.
- Onboarding completion — HR finishes an onboarding and verifies the auto-created employee is saved. Expected: works, because the onboarding flow runs under an HR session.

- [ ] **Step 13: Final commit (if any follow-up fixes were needed)**

If any issue surfaced during smoke test and was fixed, commit the fix on top with a descriptive message like `fix(access): <what was wrong>`. Otherwise skip this step.

---

## Completion Criteria

All of the following must be true:

1. All 16 tasks committed to git.
2. `npx tsc --noEmit` is clean in both repos.
3. All Step checkboxes under Task 16 are ticked.
4. No list/detail page renders a mutation button for a non-HR user.
5. Every `/new` and `/[id]/edit` page outside inline-edit pages shows 403 for non-HR.
6. Every POST/PUT/PATCH/DELETE on the 6 target resources returns 403 for non-HR tokens, including the three `assign-*` / `remove-*` sub-action mutations.
7. The read-only `GET /v1/employees/check-structural-position` endpoint still returns 200 for non-HR.

---

## Out of Scope Reminder

Per the spec (Section 9), the following are explicitly NOT part of this plan:

- Recruitment / Onboarding permission changes
- Employee Request, Employee Budget, Dashboard permission changes
- Sidebar visibility changes
- Granular department-scoped permissions (e.g. "manager edits only their department's employees")
- Automated test infrastructure
- JWT token shape changes (roleId is read from DB server-side, not added to the JWT payload)

If any of these come up during implementation, stop and surface them — do not expand scope inline.
