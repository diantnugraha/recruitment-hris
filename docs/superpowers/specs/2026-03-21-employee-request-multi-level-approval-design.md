# Employee Request Multi-Level Approval Flow

**Date:** 2026-03-21
**Status:** Draft
**Scope:** Backend (recruitment-hris-api) + Frontend (recruitment-hris)

---

## 1. Overview

Implement role-based, multi-level approval for employee requests. Currently, approval actions are visible to all users and the backend does not enforce role authorization. This design adds proper authorization at every approval step with audit trail.

## 2. Approval Chain

```
Draft ──[Manager submit]──→ Created (waiting HOD)
  ──[HOD approve]──→ HOD Reviewed (waiting HR)
  ──[HOD revise]──→ Revise ──[Manager resubmit]──→ Created

HOD Reviewed ──[HR approve]──→ Reviewed (waiting Management)
  ──[HR revise]──→ Revise ──[Manager resubmit]──→ Created

Reviewed ──[Management approve]──→ Approved
  ──[Management reject]──→ Rejected
  ──[Management revise]──→ Revise ──[Manager resubmit]──→ Created

Approved ──[HR]──→ In Recruitment ──[HR]──→ Completed
```

## 3. Role Definitions

| Role | Source | Scope |
|------|--------|-------|
| **Manager** | `departments.manager_id` = user's `employee_id` | Own department only |
| **HOD (Head of Division)** | `divisions.head_of_division_id` = user's `employee_id` | Own division's departments only |
| **Human Resources** | `role_access.role_name` = "Human Resources" | All requests |
| **Management** | `role_access.role_name` = "Management" | All requests |
| **Administrator** | `role_access.role_name` = "admin" | All actions, all requests |

### 3a. Role Name Mapping

The `role_access.role_name` from the database stores full names (e.g., "Human Resources", "Management"). The existing `WORKFLOW_TRANSITIONS` constants use shorthand (`'hr'`, `'management'`, `'hod'`, `'manager'`). To resolve this mismatch, define a normalization map in a shared constant:

```typescript
// Backend: src/constants/roleConstants.ts
export const ROLE_NAME_MAP: Record<string, string> = {
  'admin': 'admin',
  'Human Resources': 'hr',
  'Management': 'management',
} as const;
```

Structural roles (Manager, HOD) are determined from database relations, not from `role_access`. The middleware normalizes `roleName` to the shorthand form before injecting into `request.user`, so all downstream code uses consistent shorthand strings.

## 4. Allowed Transitions by Role

| Transition | Allowed Roles | Scope Condition |
|------------|--------------|-----------------|
| `draft` → `created` | Manager, Admin | Manager must be `departments.manager_id` for the request's department |
| `revise` → `created` | Manager, Admin | Same as above (resubmit) |
| `created` → `hod_reviewed` | HOD, Admin | HOD must be `divisions.head_of_division_id` of the request's department's division |
| `created` → `revise` | HOD, Admin | Same as above |
| `hod_reviewed` → `reviewed` | Human Resources, Admin | No scope restriction |
| `hod_reviewed` → `revise` | Human Resources, Admin | No scope restriction |
| `reviewed` → `approved` | Management, Admin | No scope restriction |
| `reviewed` → `rejected` | Management, Admin | No scope restriction |
| `reviewed` → `revise` | Management, Admin | No scope restriction (NEW — not in current constants) |
| `approved` → `in_recruitment` | Human Resources, Admin | No scope restriction |
| `in_recruitment` → `completed` | Human Resources, Admin | No scope restriction |

**Breaking change:** The existing `WORKFLOW_TRANSITIONS` for `reviewed` only includes `nextStatuses: ['approved', 'rejected']`. This must be updated to include `'revise'` as a valid next status in both backend and frontend constants.

### 4a. Updated WORKFLOW_TRANSITIONS Shape

```typescript
export const WORKFLOW_TRANSITIONS = {
  draft:          { nextStatuses: ['created'],                         allowedRoles: ['manager', 'admin'] },
  created:        { nextStatuses: ['hod_reviewed', 'revise'],          allowedRoles: ['hod', 'admin'] },
  hod_reviewed:   { nextStatuses: ['reviewed', 'revise'],              allowedRoles: ['hr', 'admin'] },
  reviewed:       { nextStatuses: ['approved', 'rejected', 'revise'],  allowedRoles: ['management', 'admin'] },
  approved:       { nextStatuses: ['in_recruitment'],                  allowedRoles: ['hr', 'admin'] },
  revise:         { nextStatuses: ['created'],                         allowedRoles: ['manager', 'admin'] },
  in_recruitment: { nextStatuses: ['completed'],                       allowedRoles: ['hr', 'admin'] },
  rejected:       { nextStatuses: [],                                  allowedRoles: [] },
  completed:      { nextStatuses: [],                                  allowedRoles: [] },
} as const;
```

**Note on `'head'` role removal:** The existing constants include `'head'` in `allowedRoles` for `draft` and `revise` transitions. This was an earlier alias for HOD-level users. In the new design, HOD is identified structurally via `divisions.head_of_division_id`, not via role string. The `'head'` shorthand is intentionally removed — HOD's authority is scoped to the `created` → `hod_reviewed`/`revise` transitions only, not to submitting or resubmitting requests.

## 5. Database Migration

### 5a. Add `department_id` to `employee_request`

Currently `employee_request` has no `department_id` column. The department is resolved indirectly via `job_title_id` → `department_job_title` pivot, which is non-deterministic when a job title belongs to multiple departments. To fix this:

- **Add `department_id INT NULL`** FK → `departments.id` to `employee_request`
- **Data migration:** For existing records, populate `department_id` from the `department_job_title` pivot table using the job title's first matching department
- When creating a new request, the frontend sends `department_id` explicitly (Manager's department auto-populated, Admin selects)

This gives a deterministic department for authorization checks and HOD filtering.

### 5b. Audit Trail Columns

Add the following columns to `employee_request` table:

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `department_id` | `INT` | YES | FK → `departments.id`, explicit department for auth checks |
| `hod_reviewed_by` | `INT` | YES | FK → `users.id`, set when HOD approves |
| `hod_reviewed_at` | `TIMESTAMP` | YES | Time of HOD approval |
| `hr_reviewed_by` | `INT` | YES | FK → `users.id`, set when HR approves |
| `hr_reviewed_at` | `TIMESTAMP` | YES | Time of HR approval (replaces existing `reviewed_at`) |
| `approved_by` | `INT` | YES | FK → `users.id`, set when Management approves |
| `revised_by` | `INT` | YES | FK → `users.id`, set when any role requests revision |
| `revised_at` | `TIMESTAMP` | YES | Time of revision request |
| `rejected_by` | `INT` | YES | FK → `users.id`, set when Management rejects |
| `rejected_at` | `TIMESTAMP` | YES | Time of rejection |

**Existing columns:**
- `reviewed_at` → rename to `hr_reviewed_at` for consistency. All code references (`transformEmployeeRequest` in controller, service timestamp logic, Prisma model) must be updated.
- `approved_at` → keep as-is, add `approved_by`

**Reset on resubmit:** When a request transitions from `revise` → `created`, the following columns are reset to NULL: `hod_reviewed_by`, `hod_reviewed_at`, `hr_reviewed_by`, `hr_reviewed_at`, `approved_by`, `approved_at`, `revised_by`, `revised_at`. History is preserved in `employee_request_comment`.

**Note on `approved_at` reset:** PDF generation reads `approved_at`. Since a resubmitted request is no longer approved, resetting to NULL is correct — PDF should only be generated for approved/later-status requests.

## 6. Backend Changes

### 6a. Create `ForbiddenError`

The existing error module (`src/errors/index.ts`) does not have a `ForbiddenError`. Add:

```typescript
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}
```

### 6b. Auth Middleware — Enrich User Context

Enhance the `authenticate` middleware to inject full authorization context:

```typescript
request.user = {
  userId: number,
  email: string,
  roleName: string,                // normalized shorthand (e.g., 'hr', 'management', 'admin')
  employeeId: number | null,       // from users.employee_id
  managedDepartmentIds: number[],  // department IDs where employee = manager_id
  hodDivisionIds: number[],        // division IDs where employee = head_of_division_id
}
```

**Performance consideration:** This enrichment adds DB queries on every authenticated request. To minimize impact:
- Use a single Prisma query with `include` to fetch user + role + employee + managedDepartments + headOfDivisions in one round-trip
- Only the employee-request routes that need `managedDepartmentIds` and `hodDivisionIds` should get the full enrichment. Create a separate `enrichUserContext` middleware applied only to employee-request routes. The base `authenticate` middleware continues to only set `userId`, `email`, `roleName`.

**Users without `employee_id`:** If a user has no linked employee record, `managedDepartmentIds` and `hodDivisionIds` will be empty arrays. Such users can still operate based on `roleName` (e.g., "admin", "hr", "management"). A Manager or HOD role without an employee link will fail authorization with a clear `ForbiddenError("User account is not linked to an employee record")`.

### 6c. Authorization Guard in `updateStatus`

In the `updateEmployeeRequestStatus` service function, before processing:

1. Fetch the employee request → get `department_id` → get department's `division_id`
2. Check user authorization:
   - If `roleName` = "admin" → allow all transitions
   - If transition requires Manager → check request's `department_id` is in user's `managedDepartmentIds`
   - If transition requires HOD → check request's department's `division_id` is in user's `hodDivisionIds`
   - If transition requires "hr" → check `roleName` = "hr"
   - If transition requires "management" → check `roleName` = "management"
3. If unauthorized → throw `ForbiddenError` (HTTP 403)

**Optimistic concurrency:** Wrap the status update in a transaction that checks `WHERE id = :id AND status_employee_request = :expectedStatus`. If no rows are updated (another user changed the status), throw `ConflictError("Request status has been changed by another user. Please refresh.")`.

### 6d. Authorization Guard on `startRecruitment`

The `startRecruitment` endpoint (`POST /:id/start-recruitment`) is a separate function from `updateStatus`. Apply the same authorization: only `hr` and `admin` roles are allowed. Either refactor to use the same guard, or add the check directly in the `startRecruitment` service function.

### 6e. List Filtering by Role

The `getAll` endpoint filters results based on the authenticated user's role:

| Role | Visible Requests |
|------|-----------------|
| Manager | Only requests where `created_by` = userId |
| HOD | Requests where `department_id` is in a department belonging to user's `hodDivisionIds` + own requests (`created_by` = userId) |
| Human Resources | All requests with `status_employee_request` IN (1, 8, 2, 3, 4, 5, 6, 7) — i.e., everything except drafts + own requests |
| Management | All requests with `status_employee_request` IN (2, 3, 4, 5, 6, 7) — i.e., HR-reviewed and beyond + own requests |
| Admin | All requests |

**Important:** Status integers are non-sequential (`8` = `hod_reviewed`). Always use explicit set-membership (`IN [...]`), never numeric comparison (`>=`), to avoid bugs.

**HOD filtering query:** With `department_id` now on `employee_request`, the query becomes: `WHERE department_id IN (SELECT id FROM departments WHERE division_id IN (:hodDivisionIds))`. No multi-join needed.

### 6f. Stats Filtering by Role

The `getStats` endpoint must also apply the same role-based filtering. Otherwise stat cards on the list page will show counts inconsistent with the filtered list. Apply the same `WHERE` conditions as `getAll`.

### 6g. Audit Trail Population

During each status transition, populate the corresponding audit columns:

| Transition | Set Columns |
|------------|------------|
| `created` → `hod_reviewed` | `hod_reviewed_by` = userId, `hod_reviewed_at` = now |
| `hod_reviewed` → `reviewed` | `hr_reviewed_by` = userId, `hr_reviewed_at` = now |
| `reviewed` → `approved` | `approved_by` = userId, `approved_at` = now |
| `*` → `revise` | `revised_by` = userId, `revised_at` = now |
| `reviewed` → `rejected` | `rejected_by` = userId, `rejected_at` = now |
| `revise` → `created` | Reset all audit columns to NULL (see Section 5b) |

## 7. Frontend Changes

### 7a. Auth Store — Add Role Info

The existing `User` type in `src/types/index.ts` has `role: "admin" | "hr" | "manager" | "employee"`. This union is too restrictive — it doesn't include `"management"` or `"hod"`. Update to use `string` type to accommodate all dynamic roles from `role_access`:

```typescript
interface User {
  id: number;
  email: string;
  displayName: string;
  role: string;        // normalized roleName from backend (e.g., 'hr', 'management', 'admin')
  employeeId: number | null;
}
```

**Why `string` instead of a union:** Roles are managed dynamically in `role_access` table, not hardcoded. A string union would break whenever a new role is added. The frontend should define role constants (e.g., `ROLES.ADMIN`, `ROLES.HR`) for comparison but accept any string from the backend.

The backend login endpoint must include the normalized `roleName` in the response. The frontend maps it to the `role` field. The old `"employee"` value in the union is dropped — users without a specific role (Manager structural position, HR, Management, Admin) will have their actual `role_access.role_name` normalized and stored. If a user's role doesn't match any approval role, they simply see no action buttons.

### 7b. Detail Page — Conditional Action Buttons

Show action buttons based on **status + role** combination:

| Request Status | Buttons | Visible To |
|---|---|---|
| `draft` | Edit, Submit, Delete | Manager (owner), Admin |
| `created` | HOD Approve, Request Revision | HOD (related division), Admin |
| `hod_reviewed` | HR Approve, Request Revision | Human Resources, Admin |
| `reviewed` | Management Approve, Reject, Request Revision | Management, Admin |
| `revise` | Edit, Resubmit | Manager (owner), Admin |
| `approved` | Start Recruitment | Human Resources, Admin |
| `in_recruitment` | Complete | Human Resources, Admin |

Users without permission see detail in read-only mode (no action buttons).

**Note:** For Manager and HOD, scope validation (correct department/division) is enforced server-side. The frontend hides buttons based on role name only — the backend rejects unauthorized calls.

### 7c. Create Page — Access Guard

`/employee-request/new` is only accessible by:
- **Manager** — department auto-populated from their managed department
- **Admin** — can select any department

Other roles attempting access → redirect to list page.

### 7d. List Page

No major frontend changes needed. Backend handles role-based filtering. The stat cards and table will naturally reflect only the requests visible to the current user.

## 8. Unchanged

- Workflow states and status integer mapping (0-8) remain the same
- Comment system unchanged
- PDF generation unchanged (but `reviewed_at` references must be updated to `hr_reviewed_at`)
- Budget validation unchanged
- `employee_request_comment` table unchanged

## 9. Out of Scope

- Email/notification triggers on status changes (future enhancement)
- Configurable/dynamic approval chains
- Delegation or proxy approval

## 10. Files to Modify

### Backend (recruitment-hris-api)
- `prisma/schema.prisma` — add `department_id`, audit trail columns + relations, rename `reviewed_at`
- New migration — add columns, rename column, data migration for existing records
- `src/errors/index.ts` — add `ForbiddenError` class
- `src/constants/employeeRequestConstants.ts` — update `WORKFLOW_TRANSITIONS` (add `revise` to `reviewed`)
- New file: `src/constants/roleConstants.ts` — role name normalization map
- `src/middlewares/authMiddleware.ts` — enrich user context with role + structural positions
- New middleware: `enrichUserContext` — applied only to employee-request routes for `managedDepartmentIds` and `hodDivisionIds`
- `src/services/employeeRequestService.ts` — add authorization guard in `updateStatus` and `startRecruitment`, audit trail population, reset on resubmit, optimistic concurrency
- `src/repositories/employeeRequestRepository.ts` — update queries for role-based filtering in `findAll` and `getStats`, new audit columns, `department_id` handling
- `src/controllers/employeeRequestController.ts` — pass user context to service, update `transformEmployeeRequest` (`reviewed_at` → `hr_reviewed_at`, add new audit fields)
- `src/repositories/userRepository.ts` — update `findById` to include role, employee, managedDepartments, headOfDivisions
- `src/services/authService.ts` — include normalized `roleName` in login/getCurrentUser responses
- `src/schemas/employeeRequestSchemas.ts` — add `department_id` to create/update schemas

### Frontend (recruitment-hris)
- `src/types/index.ts` — update `User` interface with proper role type
- `src/types/employee-request.ts` — add `department_id` and audit trail fields
- `src/store/` or `src/contexts/` — ensure role is stored from login response
- `src/app/(protected)/employee-request/[id]/page.tsx` — conditional action buttons by role
- `src/app/(protected)/employee-request/new/page.tsx` — access guard, auto-populate department, send `department_id`
- `src/app/(protected)/employee-request/page.tsx` — minor adjustments if needed
- `src/lib/constants/employeeRequest.ts` — update `WORKFLOW_TRANSITIONS`
- `src/services/employee-request.service.ts` — update status mapping if needed

## 11. Known Design Artifacts

- **Status integer `8` for `hod_reviewed`:** This is a later addition to the status enum, hence non-sequential. All status checks must use explicit set-membership (`IN [...]`), never numeric comparison (`>=`).
- **`revised_by`/`revised_at` reset on resubmit:** These are reset along with other audit fields. If the history of who requested revision is needed, it is preserved in `employee_request_comment`.
