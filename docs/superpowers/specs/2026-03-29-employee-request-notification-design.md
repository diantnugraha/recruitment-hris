# Employee Request Approval Notification & Email Design

**Date:** 2026-03-29
**Status:** Approved
**Scope:** Backend (recruitment-hris-api) + Frontend (recruitment-hris)

---

## 1. Overview

Add in-app notification and email notification for every Employee Request approval/review workflow step. When a status change occurs (submit, HOD approve, HR approve, Management approve, revise, reject), the relevant users receive both an in-app notification and an email.

**Approach:** Inline in `updateEmployeeRequestStatus()` and `createEmployeeRequest()` — trigger notifications directly after successful status update. No new infrastructure (queues, event emitters) needed.

---

## 2. Notification Matrix

| Transition | Action | Notification Type | Target Users | Resolve Method |
|---|---|---|---|---|
| `draft -> created` | Manager submit | `employee_request_submitted` | HOD of request's division | Structural: `departmentId -> Department.divisionId -> Division.headOfDivisionId -> Employee -> User` |
| `revise -> created` | Manager resubmit | `employee_request_submitted` | HOD of request's division | Same as above (resubmission after revision) |
| `created -> hod_reviewed` | HOD approve | `employee_request_hod_approved` | All HR | Users with `role.roleName` in `['Human Resources', 'HR Manager']`, not deleted |
| `hod_reviewed -> reviewed` | HR approve | `employee_request_hr_approved` | All Management | Users with `role.roleName = 'Management'`, not deleted |
| `reviewed -> approved` | Management approve | `employee_request_approved` | HR + Manager (requester) | HR users (by roleName) + `createdBy` |
| `any -> revise` | Revision requested (by HOD/HR/Management) | `employee_request_revised` | Manager (requester) | `createdBy` |
| `reviewed -> rejected` | Management reject | `employee_request_rejected` | Manager (requester) | `createdBy` |

### Target User Scoping

- **HOD:** Resolved structurally — NOT by roleId. Chain: `EmployeeRequest.departmentId` -> `Department.divisionId` -> `Division.headOfDivisionId` -> `Employee` -> `User`. This is consistent with how `authorizeStatusTransition` resolves HOD access. If `departmentId` is null, skip HOD notification silently (log warning).
- **HR:** All active HR users queried by `role.roleName: { in: ['Human Resources', 'HR Manager'] }`, `trash IS NULL`. Consistent with existing pattern in `slaCronJob.ts`.
- **Management:** All active Management users queried by `role.roleName: 'Management'`, `trash IS NULL`.
- **Requester:** The `createdBy` user of the request

**Important:** Do NOT use hardcoded `roleId` integers. The codebase standard is to query by `role.roleName` string. Role IDs can differ across environments.

### Revise Action Context

The `revise` transition can be triggered from 3 different levels:
- `created -> revise` (by HOD)
- `hod_reviewed -> revise` (by HR)
- `reviewed -> revise` (by Management)

The notification message should include the actor's name and role to indicate which approval level sent it back (e.g., "Revision requested by Jane Smith (HR)").

---

## 3. Notification Data Shape

```typescript
{
  userId: number;              // target user
  type: string;                // e.g., 'employee_request_approved'
  title: string;               // e.g., 'Employee Request ER-2024-001 - Approved'
  message: string;             // e.g., 'Request ER-2024-001 for Software Engineer has been Approved by Management by John Doe'
  referenceType: 'employee_request';
  referenceId: bigint;         // request ID (bigint to match Prisma schema)
}
```

### Notification Type Constants

```typescript
EMPLOYEE_REQUEST_NOTIFICATION_TYPES = {
  SUBMITTED: 'employee_request_submitted',
  HOD_APPROVED: 'employee_request_hod_approved',
  HR_APPROVED: 'employee_request_hr_approved',
  APPROVED: 'employee_request_approved',
  REVISED: 'employee_request_revised',
  REJECTED: 'employee_request_rejected',
}
```

### Action Label & Color Mapping

| Type | Label | Color |
|---|---|---|
| `submitted` | Submitted for Review | `#0032A0` (blue) |
| `hod_approved` | Approved by Head of Division | `#0032A0` (blue) |
| `hr_approved` | Reviewed by HR | `#0032A0` (blue) |
| `approved` | Approved by Management | `#16a34a` (green) |
| `revised` | Revision Requested | `#f59e0b` (orange) |
| `rejected` | Rejected | `#dc2626` (red) |

---

## 4. Backend — Trigger Logic

### Location

`src/services/employeeRequestService.ts` — two trigger points:

1. **`updateEmployeeRequestStatus()`** — after successful DB update and comment creation
2. **`createEmployeeRequest()`** — when a request is created directly with `status='created'` (submit on create), trigger `employee_request_submitted` notification to HOD

### Flow

```
updateEmployeeRequestStatus()
  -> update status in DB (existing)
  -> create comment (existing)
  -> NEW: resolveNotificationTargets(request, newStatus)
  -> NEW: for each target -> createNotification() + sendEmployeeRequestStatusEmail()

createEmployeeRequest()
  -> create request in DB (existing)
  -> IF status === 'created':
     -> NEW: resolveNotificationTargets(request, 'submitted')
     -> NEW: for each target -> createNotification() + sendEmployeeRequestStatusEmail()
```

### Helper Function

```typescript
async function resolveNotificationTargets(
  request: EmployeeRequest,
  newStatus: string,
  actorName: string
): Promise<{ userId: number; email: string; name: string }[]>
```

**Resolution logic:**
1. `submitted` -> Structural HOD lookup: `request.departmentId` -> `Department.divisionId` -> `Division.headOfDivisionId` -> `Employee` -> `User`. If `departmentId` is null, skip silently with a warning log.
2. `hod_approved` -> Query users WHERE `role.roleName IN ('Human Resources', 'HR Manager')`, `trash IS NULL`
3. `hr_approved` -> Query users WHERE `role.roleName = 'Management'`, `trash IS NULL`
4. `approved` -> Query HR users (by roleName) + `request.createdBy` (requester)
5. `revised` -> Query `request.createdBy` only
6. `rejected` -> Query `request.createdBy` only

**Email sends:** Use `Promise.allSettled()` for parallel email sending when notifying multiple users (HR team, Management team) to minimize response latency.

**Notification deduplication on resubmission:** When a request goes through `created -> revise -> created`, the same HOD may receive a second `employee_request_submitted` notification for the same request. Use `upsert` (matching on `[referenceType, referenceId, type, userId]`) instead of `create` — this updates the existing notification (marks as unread, updates message/timestamp) rather than failing on the unique constraint.

### Error Handling

Email/notification failure must NOT rollback the status update. Wrap notification logic in try-catch, log errors, but always return success for the status change.

---

## 5. Backend — Email Template

### Interface

```typescript
interface EmployeeRequestStatusEmailData {
  recipientName: string;       // e.g., "John Doe"
  requestCode: string;         // e.g., "ER-2024-001"
  jobTitle: string;            // e.g., "Software Engineer"
  department: string;          // e.g., "IT Department"
  actionLabel: string;         // e.g., "Approved by Management"
  actorName: string;           // e.g., "Jane Smith"
  comment?: string;            // Optional reviewer comment
  statusColor: string;         // Badge color hex
  detailUrl: string;           // `${process.env.FRONTEND_URL}/employee-request/${requestId}`
}
```

### Template Structure

```
[TUV Nord Logo]
Employee Request Update

Hi {recipientName},

[Colored Status Badge: {actionLabel}]

Request {requestCode} for position {jobTitle} ({department})
has been {actionLabel}.

[Comment box - if comment exists]
"{comment}"

[CTA Button: "View Request Details" -> detailUrl]

[Footer: company info]
```

### Function

```typescript
async function sendEmployeeRequestStatusEmail(
  to: string,
  data: EmployeeRequestStatusEmailData
): Promise<void>
```

Follows existing email pattern: uses `getBaseLayout()`, `getLogoBase64()`, `getEmailConfig()`, Mailgun send.

---

## 6. Frontend Changes

### NotificationBell Routing Fix

In `src/components/layout/NotificationBell.tsx`, update `getNotificationRoute()`:

```typescript
if (notification.referenceType === 'employee_request' && notification.referenceId) {
  return `/employee-request/${notification.referenceId}`;
}
```

Currently routes to `/recruitment/request/{id}` which is incorrect.

### Notification Type Constants

Add to frontend constants (new file or existing):

```typescript
const NOTIFICATION_TYPES = {
  SLA_APPROACHING: 'sla_approaching',
  SLA_OVERDUE: 'sla_overdue',
  ER_SUBMITTED: 'employee_request_submitted',
  ER_HOD_APPROVED: 'employee_request_hod_approved',
  ER_HR_APPROVED: 'employee_request_hr_approved',
  ER_APPROVED: 'employee_request_approved',
  ER_REVISED: 'employee_request_revised',
  ER_REJECTED: 'employee_request_rejected',
} as const;
```

### No Other Frontend Changes Needed

Existing NotificationBell already handles:
- Polling unread count every 60 seconds
- Displaying title + message from API
- Mark as read on click
- Navigate to detail page

---

## 7. Files to Modify

### Backend (recruitment-hris-api)

| File | Change |
|---|---|
| `src/services/employeeRequestService.ts` | Add `resolveNotificationTargets()`, trigger notifications + email after status update and after create-as-submitted |
| `src/services/emailService.ts` | Add `EmployeeRequestStatusEmailData` interface, `sendEmployeeRequestStatusEmail()`, HTML template |
| `src/constants/employeeRequestConstants.ts` | Add notification type constants & action label mapping |
| `prisma/schema.prisma` | Update Notification unique constraint to include `userId` |
| Prisma migration | `@@unique([referenceType, referenceId, type, userId])` |

### Frontend (recruitment-hris)

| File | Change |
|---|---|
| `src/components/layout/NotificationBell.tsx` | Fix routing for `employee_request` referenceType to `/employee-request/{id}` |
| `src/lib/constants/notification.ts` (new) | Add `NOTIFICATION_TYPES` constants |
| `src/types/notification.ts` | Update type union if needed |

### Prisma Migration Required

The Notification table has `@@unique([referenceType, referenceId, type])` which does NOT include `userId`. Since multi-user notifications create multiple rows with the same `(referenceType, referenceId, type)` but different `userId`, this will cause unique constraint violations.

**Fix:** Add a Prisma migration to change the unique constraint to `@@unique([referenceType, referenceId, type, userId])`.

### Not Needed

- No new API endpoints — uses existing notification endpoints
- No new frontend components — existing NotificationBell is sufficient

---

## 8. Out of Scope

- Notification for `approved -> in_recruitment` transition (recruitment started)
- Notification for `in_recruitment -> completed` transition
- Real-time notifications (WebSocket/SSE) — polling is sufficient
- Notification preferences (opt-in/opt-out per user)
- Notification grouping/batching
- SMS notifications
- Dashboard notification summary widget
