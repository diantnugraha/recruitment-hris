# Employee Request Multi-Level Approval Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement role-based multi-level approval (Manager → HOD → HR → Management) for employee requests with audit trail.

**Architecture:** Backend-first approach. Add authorization middleware and guards to the existing Fastify API, then update the Next.js frontend to conditionally render actions based on user role. Two new middleware layers: `enrichUserContext` for structural role resolution, and an authorization guard in the service layer for status transitions.

**Tech Stack:** Fastify + Prisma (MySQL) backend, Next.js + Zustand frontend

**Spec:** `docs/superpowers/specs/2026-03-21-employee-request-multi-level-approval-design.md`

---

## File Structure

### Backend (recruitment-hris-api) — New Files
| File | Responsibility |
|------|---------------|
| `src/errors/ForbiddenError.ts` | 403 Forbidden error class |
| `src/constants/roleConstants.ts` | Role name normalization map |
| `src/middlewares/enrichUserContext.ts` | Fetch structural roles (managed depts, HOD divisions) |
| `prisma/migrations/<timestamp>_add_approval_audit_trail/migration.sql` | Add `department_id`, audit columns, rename `reviewed_at` |

### Backend — Modified Files
| File | Changes |
|------|---------|
| `src/errors/index.ts` | Export `ForbiddenError` |
| `src/middlewares/authMiddleware.ts` | Add `roleName` to `JwtPayload` / user context |
| `src/constants/employeeRequestConstants.ts` | Update `WORKFLOW_TRANSITIONS` — add `revise` to `reviewed`, remove `head` role |
| `src/services/employeeRequestService.ts` | Authorization guard in `updateStatus`, audit trail, optimistic concurrency, reset on resubmit |
| `src/repositories/employeeRequestRepository.ts` | Role-based filtering in `findAll`/`getStats`, audit columns in `update`, `department_id` |
| `src/controllers/employeeRequestController.ts` | Pass user context, transform new audit fields, rename `reviewed_at` → `hr_reviewed_at` |
| `src/routes/employeeRequestRoutes.ts` | Add `enrichUserContext` middleware to employee-request routes |
| `src/services/authService.ts` | Include `roleName` and `managedDepartments` in login/getCurrentUser response |
| `src/schemas/employeeRequestSchemas.ts` | Add `department_id` to create/update body schemas |
| `src/repositories/userRepository.ts` | Include `role { roleName }` and `employee` relations in `findById` |
| `prisma/schema.prisma` | Add `departmentId`, audit columns, relations |

### Frontend (recruitment-hris) — Modified Files
| File | Changes |
|------|---------|
| `src/types/index.ts` | Update `User` interface — `role: string`, add `employeeId: number \| null` |
| `src/types/employee-request.ts` | Add audit trail fields, `department_id` |
| `src/lib/constants/employeeRequest.ts` | Update `WORKFLOW_TRANSITIONS`, add `ROLES` constant |
| `src/stores/auth-store.ts` | Map `roleName` from login response to `role` field |
| `src/services/employee-request.service.ts` | Map new audit fields from API response |
| `src/app/(protected)/employee-request/[id]/page.tsx` | Conditional action buttons by role |
| `src/app/(protected)/employee-request/new/page.tsx` | Access guard (Manager/Admin only), auto-populate department |
| `src/app/(protected)/employee-request/page.tsx` | Minor — stats now role-filtered by backend |

---

## Task 1: Backend — Create ForbiddenError

**Files:**
- Create: `recruitment-hris-api/src/errors/ForbiddenError.ts`
- Modify: `recruitment-hris-api/src/errors/index.ts`

- [ ] **Step 1: Create ForbiddenError class**

Create `src/errors/ForbiddenError.ts`:
```typescript
import { AppError } from './AppError.js'

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(403, message, 'FORBIDDEN')
  }
}
```

- [ ] **Step 2: Export from index**

In `src/errors/index.ts`, add at the end:
```typescript
export { ForbiddenError } from './ForbiddenError.js'
```

- [ ] **Step 3: Commit**

```bash
git add src/errors/ForbiddenError.ts src/errors/index.ts
git commit -m "feat: add ForbiddenError class for 403 responses"
```

---

## Task 2: Backend — Create Role Constants

**Files:**
- Create: `recruitment-hris-api/src/constants/roleConstants.ts`

- [ ] **Step 1: Create role constants file**

Create `src/constants/roleConstants.ts`:
```typescript
// Normalized role shorthand used in WORKFLOW_TRANSITIONS and authorization checks.
// Keys are the exact role_access.role_name values from the database.
// Values are the shorthand strings used internally.
export const ROLE_NAME_MAP: Record<string, string> = {
  'admin': 'admin',
  'Administrator': 'admin',
  'Human Resources': 'hr',
  'Management': 'management',
}

// Reverse: shorthand → display name (for UI if needed)
export const ROLE_SHORTHAND = {
  ADMIN: 'admin',
  HR: 'hr',
  MANAGEMENT: 'management',
  MANAGER: 'manager',
  HOD: 'hod',
} as const

export type RoleShorthand = typeof ROLE_SHORTHAND[keyof typeof ROLE_SHORTHAND]

// Normalize a role_access.role_name to shorthand.
// Returns the raw roleName lowercased if no mapping exists.
export function normalizeRoleName(roleName: string): string {
  return ROLE_NAME_MAP[roleName] ?? roleName.toLowerCase()
}
```

- [ ] **Step 2: Commit**

```bash
git add src/constants/roleConstants.ts
git commit -m "feat: add role constants with normalization map"
```

---

## Task 3: Backend — Database Migration

**Files:**
- Modify: `recruitment-hris-api/prisma/schema.prisma`
- Create: new Prisma migration

- [ ] **Step 1: Update Prisma schema**

In `prisma/schema.prisma`, update the `EmployeeRequest` model. Add these fields after `createdBy`:

```prisma
  departmentId          Int?                  @map("department_id")
  hodReviewedBy         Int?                  @map("hod_reviewed_by")
  hodReviewedAt         DateTime?             @map("hod_reviewed_at") @db.Timestamp(0)
  hrReviewedBy          Int?                  @map("hr_reviewed_by")
  hrReviewedAt          DateTime?             @map("hr_reviewed_at") @db.Timestamp(0)
  approvedBy            Int?                  @map("approved_by")
  revisedBy             Int?                  @map("revised_by")
  revisedAt             DateTime?             @map("revised_at") @db.Timestamp(0)
  rejectedBy            Int?                  @map("rejected_by")
  rejectedAt            DateTime?             @map("rejected_at") @db.Timestamp(0)
```

Rename existing `reviewedAt` field:
- Change `reviewedAt DateTime? @map("reviewed_at")` → remove this line (will be replaced by `hrReviewedAt`)

Add relations after existing `comments` relation:
```prisma
  department            Department?           @relation(fields: [departmentId], references: [id])
  hodReviewer           User?                 @relation("HodReviewer", fields: [hodReviewedBy], references: [id])
  hrReviewer            User?                 @relation("HrReviewer", fields: [hrReviewedBy], references: [id])
  approver              User?                 @relation("Approver", fields: [approvedBy], references: [id])
  reviser               User?                 @relation("Reviser", fields: [revisedBy], references: [id])
  rejecter              User?                 @relation("Rejecter", fields: [rejectedBy], references: [id])
```

Also add the inverse relations on the `User` model:
```prisma
  hodReviewedRequests      EmployeeRequest[] @relation("HodReviewer")
  hrReviewedRequests       EmployeeRequest[] @relation("HrReviewer")
  approvedRequests         EmployeeRequest[] @relation("Approver")
  revisedRequests          EmployeeRequest[] @relation("Reviser")
  rejectedRequests         EmployeeRequest[] @relation("Rejecter")
```

And on the `Department` model, add:
```prisma
  employeeRequests    EmployeeRequest[]
```

**Important:** The existing `reviewedAt` column is renamed to `hr_reviewed_at` in the migration SQL below, but at the Prisma level we replace the field name from `reviewedAt` to `hrReviewedAt`.

- [ ] **Step 2: Create migration SQL**

Run `npx prisma migrate dev --create-only --name add_approval_audit_trail` to create the migration file, then edit the generated SQL to contain:

```sql
-- Rename reviewed_at to hr_reviewed_at
ALTER TABLE `employee_request` CHANGE COLUMN `reviewed_at` `hr_reviewed_at` TIMESTAMP NULL DEFAULT NULL;

-- Add department_id
ALTER TABLE `employee_request` ADD COLUMN `department_id` INT NULL AFTER `created_by`;
ALTER TABLE `employee_request` ADD CONSTRAINT `fk_employee_request_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL;

-- Add audit trail columns
ALTER TABLE `employee_request` ADD COLUMN `hod_reviewed_by` INT NULL AFTER `department_id`;
ALTER TABLE `employee_request` ADD COLUMN `hod_reviewed_at` TIMESTAMP NULL DEFAULT NULL AFTER `hod_reviewed_by`;
ALTER TABLE `employee_request` ADD COLUMN `hr_reviewed_by` INT NULL AFTER `hod_reviewed_at`;
ALTER TABLE `employee_request` ADD COLUMN `approved_by` INT NULL AFTER `approved_at`;
ALTER TABLE `employee_request` ADD COLUMN `revised_by` INT NULL AFTER `approved_by`;
ALTER TABLE `employee_request` ADD COLUMN `revised_at` TIMESTAMP NULL DEFAULT NULL AFTER `revised_by`;
ALTER TABLE `employee_request` ADD COLUMN `rejected_by` INT NULL AFTER `revised_at`;
ALTER TABLE `employee_request` ADD COLUMN `rejected_at` TIMESTAMP NULL DEFAULT NULL AFTER `rejected_by`;

-- Add foreign keys for audit columns
ALTER TABLE `employee_request` ADD CONSTRAINT `fk_er_hod_reviewed_by` FOREIGN KEY (`hod_reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;
ALTER TABLE `employee_request` ADD CONSTRAINT `fk_er_hr_reviewed_by` FOREIGN KEY (`hr_reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;
ALTER TABLE `employee_request` ADD CONSTRAINT `fk_er_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;
ALTER TABLE `employee_request` ADD CONSTRAINT `fk_er_revised_by` FOREIGN KEY (`revised_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;
ALTER TABLE `employee_request` ADD CONSTRAINT `fk_er_rejected_by` FOREIGN KEY (`rejected_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

-- Backfill department_id from department_job_title pivot
UPDATE `employee_request` er
JOIN `department_job_title` djt ON djt.`job_title_id` = er.`job_title_id`
SET er.`department_id` = djt.`department_id`
WHERE er.`department_id` IS NULL;
```

- [ ] **Step 3: Run migration**

```bash
cd /Users/diantnugraha/Documents/Documents/Development/recruitment-hris-api
npx prisma migrate dev
```

- [ ] **Step 4: Verify schema**

```bash
npx prisma generate
```

- [ ] **Step 5: Commit**

```bash
git add prisma/
git commit -m "feat: add department_id and audit trail columns to employee_request"
```

---

## Task 4: Backend — Enrich Auth Middleware

**Files:**
- Modify: `recruitment-hris-api/src/middlewares/authMiddleware.ts`
- Create: `recruitment-hris-api/src/middlewares/enrichUserContext.ts`
- Modify: `recruitment-hris-api/src/repositories/userRepository.ts`

- [ ] **Step 1: Update userRepository.findById to include role and structural relations**

In `src/repositories/userRepository.ts`, update the `findById` function. Replace the `select` with `include` or add the role relation. The query should become:

```typescript
export async function findById(id: number): Promise<RepositoryResult<UserWithRole | null>> {
  const user = await prisma.user.findFirst({
    where: { id, trash: null },
    select: {
      id: true,
      name: true,
      email: true,
      displayName: true,
      roleId: true,
      employeeId: true,
      superiorId: true,
      rememberToken: true,
      emailVerifiedAt: true,
      userImei: true,
      created_at: true,
      updated_at: true,
      trash: true,
      role: {
        select: { roleName: true },
      },
    },
  })

  return success(user)
}
```

Add the type above the function:
```typescript
export type UserWithRole = Omit<UserWithoutPassword, never> & {
  role?: { roleName: string | null } | null
}
```

- [ ] **Step 2: Update JwtPayload and authMiddleware to include roleName**

In `src/middlewares/authMiddleware.ts`, update the `JwtPayload` interface and fetch role after JWT validation:

```typescript
import { normalizeRoleName } from '../constants/roleConstants.js'
import * as userRepository from '../repositories/userRepository.js'

export interface JwtPayload {
  userId: number
  email: string
  roleName: string
}

// In the authenticate function, after jwt.verify:
try {
  const decoded = jwt.verify(token, JWT_CONFIG.secret) as { userId: number; email: string }
  // Fetch user role from DB
  const userResult = await userRepository.findById(decoded.userId)
  const user = userResult.data
  if (!user) {
    throw new UnauthorizedError('User not found')
  }
  const roleName = normalizeRoleName(user.role?.roleName ?? '')
  request.user = {
    userId: decoded.userId,
    email: decoded.email,
    roleName,
  }
} catch (error) {
  if (error instanceof UnauthorizedError) throw error
  throw new UnauthorizedError('Invalid or expired token')
}
```

- [ ] **Step 3: Create enrichUserContext middleware**

Create `src/middlewares/enrichUserContext.ts`:

```typescript
import type { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../config/database.js'
import { ForbiddenError } from '../errors/index.js'

export interface EnrichedUser {
  userId: number
  email: string
  roleName: string
  employeeId: number | null
  managedDepartmentIds: number[]
  hodDivisionIds: number[]
}

declare module 'fastify' {
  interface FastifyRequest {
    enrichedUser?: EnrichedUser
  }
}

export async function enrichUserContext(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const { userId, email, roleName } = request.user

  // Fetch user's employee link and structural positions in one query
  const user = await prisma.user.findFirst({
    where: { id: userId, trash: null },
    select: {
      employeeId: true,
      employee: {
        select: {
          managedDepartments: {
            select: { id: true },
          },
          headOfDivisions: {
            select: { id: true },
          },
        },
      },
    },
  })

  const employeeId = user?.employeeId ?? null
  const managedDepartmentIds = user?.employee?.managedDepartments?.map(d => d.id) ?? []
  const hodDivisionIds = user?.employee?.headOfDivisions?.map(d => d.id) ?? []

  request.enrichedUser = {
    userId,
    email,
    roleName,
    employeeId,
    managedDepartmentIds,
    hodDivisionIds,
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/middlewares/authMiddleware.ts src/middlewares/enrichUserContext.ts src/repositories/userRepository.ts
git commit -m "feat: enrich auth middleware with role and structural positions"
```

---

## Task 5: Backend — Update WORKFLOW_TRANSITIONS

**Files:**
- Modify: `recruitment-hris-api/src/constants/employeeRequestConstants.ts`

- [ ] **Step 1: Update WORKFLOW_TRANSITIONS**

In `src/constants/employeeRequestConstants.ts`, replace the `WORKFLOW_TRANSITIONS` object (lines 68-109):

```typescript
export const WORKFLOW_TRANSITIONS: Record<EmployeeRequestStatus, {
  nextStatuses: EmployeeRequestStatus[]
  allowedRoles: string[]
}> = {
  draft: {
    nextStatuses: ['created'],
    allowedRoles: ['manager', 'admin'],
  },
  created: {
    nextStatuses: ['hod_reviewed', 'revise'],
    allowedRoles: ['hod', 'admin'],
  },
  hod_reviewed: {
    nextStatuses: ['reviewed', 'revise'],
    allowedRoles: ['hr', 'admin'],
  },
  reviewed: {
    nextStatuses: ['approved', 'rejected', 'revise'],
    allowedRoles: ['management', 'admin'],
  },
  approved: {
    nextStatuses: ['in_recruitment'],
    allowedRoles: ['hr', 'admin'],
  },
  rejected: {
    nextStatuses: [],
    allowedRoles: [],
  },
  revise: {
    nextStatuses: ['created'],
    allowedRoles: ['manager', 'admin'],
  },
  in_recruitment: {
    nextStatuses: ['completed'],
    allowedRoles: ['hr', 'admin'],
  },
  completed: {
    nextStatuses: [],
    allowedRoles: [],
  },
}
```

Changes from current:
- `reviewed.nextStatuses`: added `'revise'`
- `draft.allowedRoles`: removed `'head'`
- `created.allowedRoles`: removed `'head'`
- `revise.allowedRoles`: removed `'head'`

- [ ] **Step 2: Commit**

```bash
git add src/constants/employeeRequestConstants.ts
git commit -m "feat: update WORKFLOW_TRANSITIONS with revise from reviewed, remove head role"
```

---

## Task 6: Backend — Authorization Guard in Service

**Files:**
- Modify: `recruitment-hris-api/src/services/employeeRequestService.ts`

- [ ] **Step 1: Add authorization imports and helper**

At the top of `src/services/employeeRequestService.ts`, add:

```typescript
import { ForbiddenError } from '../errors/index.js'
import type { EnrichedUser } from '../middlewares/enrichUserContext.js'
```

Add authorization helper function before `updateEmployeeRequestStatus`:

```typescript
async function authorizeStatusTransition(
  user: EnrichedUser,
  currentStatus: EmployeeRequestStatus,
  targetStatus: EmployeeRequestStatus,
  employeeRequest: { departmentId?: number | null; createdBy: number }
): Promise<void> {
  const { roleName, managedDepartmentIds, hodDivisionIds, employeeId } = user

  // Admin can do everything
  if (roleName === 'admin') return

  // Get allowed roles for the current status transition
  const currentTransition = WORKFLOW_TRANSITIONS[currentStatus]
  if (!currentTransition) {
    throw new ForbiddenError('Invalid status transition')
  }

  const allowedRoles = currentTransition.allowedRoles

  // Check Manager role (structural — based on department)
  if (allowedRoles.includes('manager')) {
    if (!employeeId) {
      throw new ForbiddenError('User account is not linked to an employee record')
    }
    const deptId = employeeRequest.departmentId
    if (deptId && managedDepartmentIds.includes(deptId)) return
  }

  // Check HOD role (structural — based on division)
  if (allowedRoles.includes('hod')) {
    if (!employeeId) {
      throw new ForbiddenError('User account is not linked to an employee record')
    }
    const deptId = employeeRequest.departmentId
    if (deptId) {
      // Fetch division for this department
      const dept = await prisma.department.findUnique({
        where: { id: deptId },
        select: { divisionId: true },
      })
      if (dept && hodDivisionIds.includes(dept.divisionId)) return
    }
  }

  // Check role-based roles (HR, Management)
  if (allowedRoles.includes(roleName)) return

  throw new ForbiddenError('You do not have permission to perform this action')
}
```

- [ ] **Step 2: Update updateEmployeeRequestStatus signature and add authorization + audit**

Change the function signature to accept `EnrichedUser` instead of just `userId`:

```typescript
export async function updateEmployeeRequestStatus(
  id: number,
  newStatus: string,
  user: EnrichedUser,
  comment?: string
): Promise<EmployeeRequestWithRelations> {
```

After fetching `existing` and validating the transition, add authorization check:

```typescript
  // After: if (!transition || !transition.nextStatuses.includes(targetStatus))
  // Add authorization
  await authorizeStatusTransition(user, currentStatus, targetStatus, existing)
```

Build audit trail data based on target status:

```typescript
  // Build audit data
  const auditData: Record<string, unknown> = {}
  const now = new Date()

  if (targetStatus === EMPLOYEE_REQUEST_STATUS.HOD_REVIEWED) {
    auditData.hodReviewedBy = user.userId
    auditData.hodReviewedAt = now
  } else if (targetStatus === EMPLOYEE_REQUEST_STATUS.REVIEWED) {
    auditData.hrReviewedBy = user.userId
    auditData.hrReviewedAt = now
  } else if (targetStatus === EMPLOYEE_REQUEST_STATUS.APPROVED) {
    auditData.approvedBy = user.userId
    auditData.approvedAt = now
  } else if (targetStatus === EMPLOYEE_REQUEST_STATUS.REVISE) {
    auditData.revisedBy = user.userId
    auditData.revisedAt = now
  } else if (targetStatus === EMPLOYEE_REQUEST_STATUS.REJECTED) {
    auditData.rejectedBy = user.userId
    auditData.rejectedAt = now
  } else if (targetStatus === EMPLOYEE_REQUEST_STATUS.CREATED && currentStatus === EMPLOYEE_REQUEST_STATUS.REVISE) {
    // Resubmit — reset all audit columns
    auditData.hodReviewedBy = null
    auditData.hodReviewedAt = null
    auditData.hrReviewedBy = null
    auditData.hrReviewedAt = null
    auditData.approvedBy = null
    auditData.approvedAt = null
    auditData.revisedBy = null
    auditData.revisedAt = null
  }
```

Pass `auditData` to the repository `update` call (merge with existing update data).

- [ ] **Step 3: Add optimistic concurrency**

In the repository update, use a transaction with status check:

```typescript
// In the update call, wrap in transaction
const result = await prisma.$transaction(async (tx) => {
  const updated = await tx.employeeRequest.updateMany({
    where: {
      id: BigInt(id),
      statusEmployeeRequest: STATUS_REVERSE_MAP[currentStatus],
    },
    data: {
      statusEmployeeRequest: STATUS_REVERSE_MAP[targetStatus],
      ...auditData,
      updatedAt: new Date(),
    },
  })
  if (updated.count === 0) {
    throw new ConflictError('Request status has been changed by another user. Please refresh.')
  }
  // Fetch and return the updated record
  return employeeRequestRepository.findById(id)
})
```

- [ ] **Step 4: Update startRecruitment to pass EnrichedUser**

Update `startRecruitment` function signature:
```typescript
export async function startRecruitment(id: number, user: EnrichedUser): Promise<EmployeeRequestWithRelations> {
```

Pass `user` instead of `userId` to `updateEmployeeRequestStatus`.

- [ ] **Step 5: Commit**

```bash
git add src/services/employeeRequestService.ts
git commit -m "feat: add authorization guard and audit trail to employee request status updates"
```

---

## Task 7: Backend — Role-Based Filtering in Repository

**Files:**
- Modify: `recruitment-hris-api/src/repositories/employeeRequestRepository.ts`

- [ ] **Step 1: Add role filter type**

Add at the top of the file:

```typescript
import type { EnrichedUser } from '../middlewares/enrichUserContext.js'

export interface RoleFilter {
  roleName: string
  userId: number
  managedDepartmentIds: number[]
  hodDivisionIds: number[]
}
```

- [ ] **Step 2: Create buildRoleWhereClause helper**

```typescript
function buildRoleWhereClause(roleFilter: RoleFilter): Record<string, unknown> {
  const { roleName, userId, managedDepartmentIds, hodDivisionIds } = roleFilter

  if (roleName === 'admin') {
    return {} // No filter — see everything
  }

  if (roleName === 'manager') {
    return { createdBy: userId }
  }

  if (roleName === 'hod') {
    // Departments in their divisions + own requests
    return {
      OR: [
        { createdBy: userId },
        ...(hodDivisionIds.length > 0
          ? [{ department: { divisionId: { in: hodDivisionIds } } }]
          : []),
      ],
    }
  }

  if (roleName === 'hr') {
    // All non-draft requests + own requests
    return {
      OR: [
        { createdBy: userId },
        { statusEmployeeRequest: { in: [1, 8, 2, 3, 4, 5, 6, 7] } },
      ],
    }
  }

  if (roleName === 'management') {
    // HR-reviewed and beyond + own requests
    return {
      OR: [
        { createdBy: userId },
        { statusEmployeeRequest: { in: [2, 3, 4, 5, 6, 7] } },
      ],
    }
  }

  // Unknown role — only own requests
  return { createdBy: userId }
}
```

- [ ] **Step 3: Update findAll to accept and apply roleFilter**

Add `roleFilter?: RoleFilter` as a third parameter to `findAll`, preserving the existing two-argument signature:

```typescript
export async function findAll(
  filters: EmployeeRequestFilters,
  pagination: PaginationParams,
  roleFilter?: RoleFilter
): Promise<RepositoryResult<PaginatedResult>> {
  // ... existing where clause building ...

  const roleWhere = roleFilter ? buildRoleWhereClause(roleFilter) : {}

  const where = {
    isDeleted: 0,
    ...statusFilter,
    ...jobTitleFilter,
    ...requestedByFilter,
    ...searchFilter,
    ...roleWhere,
  }
  // ... rest of function unchanged
}
```

**Also update the service layer** in `src/services/employeeRequestService.ts`: the `getAllEmployeeRequests` function currently calls `employeeRequestRepository.findAll(filters, pagination)`. Add `roleFilter` as the third argument:

```typescript
export async function getAllEmployeeRequests(
  filters: EmployeeRequestFilters,
  pagination: PaginationParams,
  roleFilter?: RoleFilter
): Promise<...> {
  return employeeRequestRepository.findAll(filters, pagination, roleFilter)
}
```

Import `RoleFilter` from the repository at the top of the service file.

- [ ] **Step 4: Update getStats to accept and apply roleFilter**

Same approach — add `roleFilter?: RoleFilter` param, apply `buildRoleWhereClause` to the `where` in `groupBy`:

```typescript
export async function getStats(roleFilter?: RoleFilter): Promise<Record<string, number>> {
  const roleWhere = roleFilter ? buildRoleWhereClause(roleFilter) : {}
  const where = { isDeleted: 0, ...roleWhere }

  const stats = await prisma.employeeRequest.groupBy({
    by: ['statusEmployeeRequest'],
    where,
    _count: { _all: true },
  })
  // ... rest of mapping
}
```

**Also update the service layer** in `src/services/employeeRequestService.ts`: the `getStats` function currently calls `employeeRequestRepository.getStats()` with no arguments. Update to pass through the `roleFilter`:

```typescript
export async function getStats(roleFilter?: RoleFilter): Promise<Record<string, number>> {
  return employeeRequestRepository.getStats(roleFilter)
}
```

- [ ] **Step 5: Update update function to handle new audit columns**

In the `UpdateEmployeeRequestData` type and `update` function, add support for the new columns:

```typescript
// Add to UpdateEmployeeRequestData:
departmentId?: number | null
hodReviewedBy?: number | null
hodReviewedAt?: Date | null
hrReviewedBy?: number | null
hrReviewedAt?: Date | null
approvedBy?: number | null
revisedBy?: number | null
revisedAt?: Date | null
rejectedBy?: number | null
rejectedAt?: Date | null
```

In the `update` function, map these new fields into the Prisma update input.

- [ ] **Step 6: Commit**

```bash
git add src/repositories/employeeRequestRepository.ts
git commit -m "feat: add role-based filtering to employee request findAll and getStats"
```

---

## Task 8: Backend — Update Controller and Routes

**Files:**
- Modify: `recruitment-hris-api/src/controllers/employeeRequestController.ts`
- Modify: `recruitment-hris-api/src/routes/employeeRequestRoutes.ts`

- [ ] **Step 1: Update transformEmployeeRequest**

In `src/controllers/employeeRequestController.ts`, update the `transformEmployeeRequest` function:

Replace `reviewed_at` with `hr_reviewed_at` and add new audit fields:

```typescript
// Replace:
//   reviewed_at: request.reviewedAt,
// With:
hr_reviewed_at: request.hrReviewedAt,
hod_reviewed_at: request.hodReviewedAt,
hod_reviewed_by: request.hodReviewedBy,
hr_reviewed_by: request.hrReviewedBy,
approved_by: request.approvedBy,
revised_by: request.revisedBy,
revised_at: request.revisedAt,
rejected_by: request.rejectedBy,
rejected_at: request.rejectedAt,
department_id: request.departmentId,
```

- [ ] **Step 2: Update controller handlers to pass enrichedUser**

In the `updateStatus` handler, change:
```typescript
// Before:
const result = await employeeRequestService.updateEmployeeRequestStatus(id, status, request.user.userId, comment)
// After:
const result = await employeeRequestService.updateEmployeeRequestStatus(id, status, request.enrichedUser!, comment)
```

In the `startRecruitment` handler:
```typescript
// Before:
const result = await employeeRequestService.startRecruitment(id, request.user.userId)
// After:
const result = await employeeRequestService.startRecruitment(id, request.enrichedUser!)
```

In the `getAll` handler, pass role filter:
```typescript
const roleFilter = request.enrichedUser ? {
  roleName: request.enrichedUser.roleName,
  userId: request.enrichedUser.userId,
  managedDepartmentIds: request.enrichedUser.managedDepartmentIds,
  hodDivisionIds: request.enrichedUser.hodDivisionIds,
} : undefined

const result = await employeeRequestService.getAll({ ...params, roleFilter })
```

In the `getStats` handler:
```typescript
const roleFilter = request.enrichedUser ? { ... } : undefined
const stats = await employeeRequestService.getStats(roleFilter)
```

- [ ] **Step 3: Update backend request body schema**

In `src/schemas/employeeRequestSchemas.ts`, add `department_id` to the `CreateEmployeeRequestBodySchema`:

```typescript
// Add to the create schema:
department_id: z.number().int().positive().optional(),
```

This ensures the backend validates and accepts `department_id` from the frontend when creating a request.

- [ ] **Step 4: Add enrichUserContext to employee-request routes**

In `src/routes/employeeRequestRoutes.ts`, import and add the middleware:

```typescript
import { enrichUserContext } from '../middlewares/enrichUserContext.js'

// After: app.addHook('preHandler', authenticate)
// Add:
app.addHook('preHandler', enrichUserContext)
```

- [ ] **Step 5: Commit**

```bash
git add src/controllers/employeeRequestController.ts src/routes/employeeRequestRoutes.ts src/schemas/employeeRequestSchemas.ts
git commit -m "feat: wire up enriched user context to employee request routes and controller"
```

---

## Task 9: Backend — Update Auth Service Login Response

**Files:**
- Modify: `recruitment-hris-api/src/services/authService.ts`
- Modify: `recruitment-hris-api/src/repositories/userRepository.ts`

- [ ] **Step 1: Update authService login to include roleName**

In `src/services/authService.ts`, after fetching the user, resolve the role name. The `login` function should include `roleName` in the returned user object:

```typescript
import { normalizeRoleName } from '../constants/roleConstants.js'

// In the login function, after validating password:
// Fetch role name
const roleResult = await prisma.role.findUnique({
  where: { roleId: user.roleId },
  select: { roleName: true },
})
const roleName = normalizeRoleName(roleResult?.roleName ?? '')

return {
  user: {
    ...userWithoutPassword,
    roleName,
  },
  token,
}
```

- [ ] **Step 2: Update getCurrentUser to also include roleName and structural info**

Same pattern — when returning the current user, include the normalized role name. Also include `managedDepartmentIds` so the frontend can auto-populate the department on the create page for Manager users:

```typescript
// In getCurrentUser, after fetching user:
const employee = user.employeeId
  ? await prisma.employee.findUnique({
      where: { employeeId: user.employeeId },
      select: {
        managedDepartments: { select: { id: true, name: true } },
      },
    })
  : null

return {
  ...userWithoutPassword,
  roleName,
  managedDepartments: employee?.managedDepartments ?? [],
}
```

Update the return type of both `login` and `getCurrentUser` to include `roleName: string` and `managedDepartments: { id: number; name: string }[]`.

- [ ] **Step 3: Commit**

```bash
git add src/services/authService.ts src/repositories/userRepository.ts
git commit -m "feat: include normalized roleName and managedDepartments in login and getCurrentUser responses"
```

---

## Task 10: Frontend — Update Types

**Files:**
- Modify: `recruitment-hris/src/types/index.ts`
- Modify: `recruitment-hris/src/types/employee-request.ts`

- [ ] **Step 1: Update User interface**

In `src/types/index.ts`, update the `User` interface (lines 2-11):

```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;           // normalized roleName from backend (e.g., 'hr', 'management', 'admin')
  avatar?: string;
  employeeId?: number | null;
  managedDepartments?: { id: number; name: string }[];  // for Manager auto-populate on create page
  createdAt: string;
  updatedAt: string;
}
```

Changes: `role` from union literal to `string`, `employeeId` from `string` to `number | null`, added `managedDepartments`.

- [ ] **Step 2: Update EmployeeRequest types**

In `src/types/employee-request.ts`, add audit trail fields to `EmployeeRequest` interface:

```typescript
// Add after existing fields:
hodReviewedBy?: number | null;
hodReviewedAt?: string | null;
hrReviewedBy?: number | null;
hrReviewedAt?: string | null;
approvedBy?: number | null;
approvedAt?: string | null;
revisedBy?: number | null;
revisedAt?: string | null;
rejectedBy?: number | null;
rejectedAt?: string | null;
```

Add `hod_reviewed` to `EmployeeRequestStats`:
```typescript
export interface EmployeeRequestStats {
  total: number;
  draft: number;
  created: number;
  hod_reviewed: number;
  reviewed: number;
  approved: number;
  rejected: number;
  revise: number;
  in_recruitment: number;
  completed: number;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts src/types/employee-request.ts
git commit -m "feat: update types for role-based approval and audit trail"
```

---

## Task 11: Frontend — Update Constants

**Files:**
- Modify: `recruitment-hris/src/lib/constants/employeeRequest.ts`

- [ ] **Step 1: Add ROLES constant**

Add at the top of `src/lib/constants/employeeRequest.ts`:

```typescript
export const ROLES = {
  ADMIN: 'admin',
  HR: 'hr',
  MANAGEMENT: 'management',
  MANAGER: 'manager',
  HOD: 'hod',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
```

- [ ] **Step 2: Update WORKFLOW_TRANSITIONS**

Replace the existing `WORKFLOW_TRANSITIONS` (lines 216-229):

```typescript
export const WORKFLOW_TRANSITIONS: Record<EmployeeRequestStatus, {
  nextStatuses: EmployeeRequestStatus[];
  allowedRoles: string[];
}> = {
  draft:          { nextStatuses: ['created'],                         allowedRoles: ['manager', 'admin'] },
  created:        { nextStatuses: ['hod_reviewed', 'revise'],          allowedRoles: ['hod', 'admin'] },
  hod_reviewed:   { nextStatuses: ['reviewed', 'revise'],              allowedRoles: ['hr', 'admin'] },
  reviewed:       { nextStatuses: ['approved', 'rejected', 'revise'],  allowedRoles: ['management', 'admin'] },
  approved:       { nextStatuses: ['in_recruitment'],                  allowedRoles: ['hr', 'admin'] },
  rejected:       { nextStatuses: [],                                  allowedRoles: [] },
  revise:         { nextStatuses: ['created'],                         allowedRoles: ['manager', 'admin'] },
  in_recruitment: { nextStatuses: ['completed'],                       allowedRoles: ['hr', 'admin'] },
  completed:      { nextStatuses: [],                                  allowedRoles: [] },
};
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/constants/employeeRequest.ts
git commit -m "feat: add ROLES constant and update WORKFLOW_TRANSITIONS"
```

---

## Task 12: Frontend — Update Auth Store

**Files:**
- Modify: `recruitment-hris/src/stores/auth-store.ts`
- Modify: `recruitment-hris/src/services/auth.service.ts` (if roleName mapping needed)

- [ ] **Step 1: Update auth store login handler**

In `src/stores/auth-store.ts`, the login response already maps `response.data.user` to the store. Since the backend now returns `roleName` in the user object, update the mapping in the `login` function:

```typescript
login: async (credentials) => {
  set({ isLoading: true });
  const response = await authService.login(credentials);
  if (response.success && response.data) {
    const userData = response.data.user;
    set({
      user: {
        ...userData,
        role: userData.roleName ?? userData.role,  // Prefer normalized roleName from backend
      },
      token: response.data.token,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
    return true;
  } else {
    set({ isLoading: false, error: response.message || "Login failed." });
    return false;
  }
},
```

- [ ] **Step 2: Update checkAuth similarly**

Ensure `checkAuth` also maps `roleName` to `role` from the getCurrentUser response.

- [ ] **Step 3: Commit**

```bash
git add src/stores/auth-store.ts
git commit -m "feat: map normalized roleName to auth store role field"
```

---

## Task 13: Frontend — Update Employee Request Service

**Files:**
- Modify: `recruitment-hris/src/services/employee-request.service.ts`

- [ ] **Step 1: Update transformResponse to include new audit fields**

In the `transformResponse` function (or wherever API response is mapped to frontend types), add mappings for the new fields:

```typescript
// Add to the response mapping:
hodReviewedBy: api.hod_reviewed_by ?? null,
hodReviewedAt: api.hod_reviewed_at ?? null,
hrReviewedBy: api.hr_reviewed_by ?? null,
hrReviewedAt: api.hr_reviewed_at ?? null,
approvedBy: api.approved_by ?? null,
approvedAt: api.approved_at ?? null,
revisedBy: api.revised_by ?? null,
revisedAt: api.revised_at ?? null,
rejectedBy: api.rejected_by ?? null,
rejectedAt: api.rejected_at ?? null,
```

Also update any reference to `reviewed_at` → `hr_reviewed_at`.

- [ ] **Step 2: Update create function to include department_id**

Ensure the `create` method sends `department_id` in the payload.

- [ ] **Step 3: Commit**

```bash
git add src/services/employee-request.service.ts
git commit -m "feat: map audit trail fields in employee request service"
```

---

## Task 14: Frontend — Update Detail Page (Conditional Actions)

**Files:**
- Modify: `recruitment-hris/src/app/(protected)/employee-request/[id]/page.tsx`

- [ ] **Step 1: Import auth store and ROLES constant**

At the top of the file:
```typescript
import { useAuthStore } from "@/stores/auth-store";
import { ROLES } from "@/lib/constants/employeeRequest";
```

- [ ] **Step 2: Get current user role**

Inside the component function:
```typescript
const { user } = useAuthStore();
const userRole = user?.role ?? '';
const isAdmin = userRole === ROLES.ADMIN;
```

- [ ] **Step 3: Add helper to check if user can perform actions**

```typescript
const canPerformAction = (allowedRoles: string[]) => {
  if (isAdmin) return true;
  return allowedRoles.includes(userRole);
};

// For owner checks (draft, revise — only the requester or admin)
const isOwner = request?.requestedById === String(user?.id);
```

- [ ] **Step 4: Update action buttons with role checks**

Replace the existing action buttons section (lines ~340-416). Wrap each block with role check:

```tsx
{/* Manager actions: draft, revise */}
{["draft", "revise"].includes(request.status) && (isOwner || isAdmin) && (
  <>
    <Button variant="outline" onClick={() => router.push(`/employee-request/${id}/edit`)}>Edit</Button>
    {request.status === "draft" && (
      <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>Delete</Button>
    )}
    <Button onClick={() => openActionDialog(request.status === "draft" ? "submit" : "resubmit")}>
      {request.status === "draft" ? "Submit" : "Resubmit"}
    </Button>
  </>
)}

{/* HOD actions: created */}
{request.status === "created" && canPerformAction(['hod']) && (
  <>
    <Button variant="outline" onClick={() => openActionDialog("revise")}>Request Revision</Button>
    <Button onClick={() => openActionDialog("hod_review")}>HOD Approve</Button>
  </>
)}

{/* HR actions: hod_reviewed */}
{request.status === "hod_reviewed" && canPerformAction(['hr']) && (
  <>
    <Button variant="outline" onClick={() => openActionDialog("revise")}>Request Revision</Button>
    <Button onClick={() => openActionDialog("hr_review")}>HR Approve</Button>
  </>
)}

{/* Management actions: reviewed */}
{request.status === "reviewed" && canPerformAction(['management']) && (
  <>
    <Button variant="outline" onClick={() => openActionDialog("revise")}>Request Revision</Button>
    <Button variant="destructive" onClick={() => openActionDialog("reject")}>Reject</Button>
    <Button onClick={() => openActionDialog("approve")}>Management Approve</Button>
  </>
)}

{/* HR actions: approved */}
{request.status === "approved" && canPerformAction(['hr']) && (
  <>
    <Button variant="outline" onClick={handleDownloadPdf}>Download PDF</Button>
    <Button onClick={handleStartRecruitment}>Start Recruitment</Button>
  </>
)}

{/* HR actions: in_recruitment */}
{request.status === "in_recruitment" && canPerformAction(['hr']) && (
  <Button onClick={() => openActionDialog("complete")}>Complete</Button>
)}

{/* Download PDF for completed/in_recruitment — visible to all */}
{["in_recruitment", "completed"].includes(request.status) && (
  <Button variant="outline" onClick={handleDownloadPdf}>Download PDF</Button>
)}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(protected\)/employee-request/\[id\]/page.tsx
git commit -m "feat: conditional action buttons based on user role in employee request detail"
```

---

## Task 15: Frontend — Update Create Page (Access Guard)

**Files:**
- Modify: `recruitment-hris/src/app/(protected)/employee-request/new/page.tsx`

- [ ] **Step 1: Add access guard**

Import auth store and add guard at the top of the component:

```typescript
import { useAuthStore } from "@/stores/auth-store";
import { ROLES } from "@/lib/constants/employeeRequest";

// Inside component:
const { user } = useAuthStore();
const userRole = user?.role ?? '';

// Redirect if not Manager or Admin
useEffect(() => {
  if (userRole && userRole !== ROLES.ADMIN && userRole !== ROLES.MANAGER) {
    router.push('/employee-request');
  }
}, [userRole, router]);
```

- [ ] **Step 2: Auto-populate department for Manager**

If the user is a Manager, the department should be auto-populated and non-editable. The `managedDepartments` array is available from the auth store (populated from the login response in Task 9):

```typescript
const { user } = useAuthStore();

// On mount, if Manager, auto-set department from managedDepartments
useEffect(() => {
  if (user?.role === ROLES.MANAGER && user.managedDepartments?.length) {
    const dept = user.managedDepartments[0];
    form.setValue('departmentId', String(dept.id));
    // Department selector should be disabled for Manager
  }
}, [user, form]);
```

- For Manager: department auto-populated from `user.managedDepartments[0]`, selector disabled
- For Admin: department selector remains enabled, can choose any department

- [ ] **Step 3: Commit**

```bash
git add src/app/\(protected\)/employee-request/new/page.tsx
git commit -m "feat: add access guard and auto-populate department for manager on create page"
```

---

## Task 16: Integration Testing

- [ ] **Step 1: Test backend authorization**

Manually test using API calls (curl/Postman):
1. Login as Manager → create request → verify success
2. Login as non-Manager → try create → verify 403
3. Login as HOD of correct division → approve `created` request → verify success
4. Login as HOD of wrong division → try approve → verify 403
5. Login as HR → approve `hod_reviewed` request → verify success
6. Login as Management → approve `reviewed` request → verify success
7. Login as Management → revise `reviewed` request → verify success
8. Login as Admin → perform any action → verify success

- [ ] **Step 2: Test list filtering**

1. Login as Manager → verify only own requests in list and stats
2. Login as HOD → verify only division requests + own
3. Login as HR → verify all non-draft + own
4. Login as Management → verify reviewed+ only + own
5. Login as Admin → verify all requests

- [ ] **Step 3: Test audit trail**

1. Walk a request through the full flow: draft → created → hod_reviewed → reviewed → approved
2. Verify each audit column is populated with correct userId and timestamp
3. Test revise → resubmit → verify audit columns are reset to NULL

- [ ] **Step 4: Test frontend**

1. Login as Manager → verify only sees Submit/Edit/Delete on own draft/revise requests
2. Login as HOD → verify sees HOD Approve/Revise on `created` requests
3. Login as HR → verify sees HR Approve/Revise on `hod_reviewed` requests
4. Login as Management → verify sees Approve/Reject/Revise on `reviewed` requests
5. Login as non-Manager → verify `/employee-request/new` redirects
6. Login as Admin → verify sees all actions on all statuses
