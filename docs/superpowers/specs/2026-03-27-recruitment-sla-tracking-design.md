# Recruitment SLA Tracking

## Overview

Add a 45 working-day SLA (Service Level Agreement) to the recruitment process. The SLA starts when HR clicks "Start Recruitment" on an approved Employee Request. The system tracks remaining working days, displays warnings at multiple levels, and sends notifications (in-app + email) when the deadline is approaching or overdue.

**Key constraint:** Recruitment can still proceed after the SLA is exceeded — the warning is informational, not blocking.

## Requirements Summary

| Requirement | Detail |
|---|---|
| SLA duration | 45 working days (Mon-Fri, no public holidays) |
| SLA start trigger | HR clicks "Start Recruitment" (`approved` -> `in_recruitment`) |
| SLA completion | When a candidate is Hired |
| SLA scope | Per Employee Request (1 request = 1 position = 1 hire) |
| Warning levels | On Track (>10 days), Approaching (<=10 days), Overdue (past due) |
| Notifications | Email + In-app notification |
| Blocking? | No — recruitment continues past SLA |

## Approach

**Backend-Computed SLA (Approach A):** All SLA logic lives in the backend. The API returns computed SLA data in responses. A cron job handles daily email + in-app notification creation. Frontend only renders the data.

---

## Database Schema

### Migration 1: Add `recruitment_started_at` to `employee_request`

```sql
ALTER TABLE employee_request
ADD COLUMN recruitment_started_at DATETIME NULL AFTER rejected_at;
```

- Populated when `startRecruitment()` is called
- NULL for requests not yet in recruitment

### Migration 2: Create `notification` table

```sql
CREATE TABLE notification (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type VARCHAR(30) NOT NULL COMMENT 'sla_approaching, sla_overdue, general',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  reference_type VARCHAR(50) NULL COMMENT 'employee_request',
  reference_id BIGINT NULL COMMENT 'ID of the referenced entity',
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_notification_user_id (user_id),
  INDEX idx_notification_user_read (user_id, is_read),
  INDEX idx_notification_reference (reference_type, reference_id),
  CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Prisma Schema Addition

```prisma
model Notification {
  id            BigInt   @id @default(autoincrement())
  userId        Int      @map("user_id")
  type          String   @db.VarChar(30)
  title         String   @db.VarChar(255)
  message       String   @db.Text
  referenceType String?  @map("reference_type") @db.VarChar(50)
  referenceId   BigInt?  @map("reference_id")
  isRead        Boolean  @default(false) @map("is_read")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([userId, isRead])
  @@index([referenceType, referenceId])
  @@map("notification")
}
```

---

## Backend: SLA Calculation Service

### File: `src/services/slaService.ts`

**Constants:**
```typescript
export const SLA_DAYS = 45;
export const SLA_WARNING_DAYS = 10;
```

**Functions:**

| Function | Input | Output | Description |
|---|---|---|---|
| `calculateDueDate` | `startDate: Date` | `Date` | Add 45 working days (Mon-Fri) to start date |
| `getRemainingWorkingDays` | `startDate: Date` | `number` | Working days remaining (negative if overdue) |
| `getSlaStatus` | `startDate: Date` | `'on_track' \| 'approaching' \| 'overdue'` | Determine SLA status based on remaining days |
| `getSlaInfo` | `startDate: Date` | `SlaInfo` | Full SLA payload for API response |

**`SlaInfo` type:**
```typescript
interface SlaInfo {
  startedAt: string;       // ISO date
  dueDate: string;         // ISO date (computed)
  remainingDays: number;   // working days remaining (negative if overdue)
  totalDays: number;       // always 45
  status: 'on_track' | 'approaching' | 'overdue';
}
```

**Working day calculation:** Iterate from start date, skip Saturday (6) and Sunday (0), count until reaching `SLA_DAYS`. No public holiday consideration.

---

## Backend: API Changes

### Modified Endpoints

**`GET /employee-requests/:id`** and **`GET /employee-requests`**

Add `sla` field to response when `statusEmployeeRequest` is `in_recruitment` (6) or `completed` (7) and `recruitmentStartedAt` is not null:

```json
{
  "id": 1,
  "code": "ER-2026-001",
  "statusEmployeeRequest": 6,
  "recruitmentStartedAt": "2026-03-27T08:00:00.000Z",
  "sla": {
    "startedAt": "2026-03-27T08:00:00.000Z",
    "dueDate": "2026-05-28T08:00:00.000Z",
    "remainingDays": 32,
    "totalDays": 45,
    "status": "on_track"
  }
}
```

**`POST /employee-requests/:id/start-recruitment`**

Set `recruitmentStartedAt = new Date()` during the status transition.

**`GET /candidates/:id`**

Include parent Employee Request's `sla` in response (for displaying SLA banner on candidate detail page).

### New Endpoints: Notifications

| Method | Path | Description |
|---|---|---|
| `GET` | `/notifications` | List notifications for authenticated user (paginated, sorted by created_at DESC) |
| `GET` | `/notifications/unread-count` | Return `{ count: number }` of unread notifications |
| `PUT` | `/notifications/:id/read` | Mark single notification as read |
| `PUT` | `/notifications/read-all` | Mark all notifications as read for authenticated user |

---

## Backend: Cron Job

### File: `src/cron/slaCronJob.ts`

**Schedule:** Every working day at 08:00 WIB (UTC+7) = `0 1 * * 1-5` (UTC cron)

**Library:** `node-cron` (new dependency)

**Logic:**
1. Query all Employee Requests where `statusEmployeeRequest = 6` (in_recruitment) and `recruitmentStartedAt IS NOT NULL`
2. For each request, calculate SLA status
3. **If approaching (<=10 working days remaining):**
   - Check if `sla_approaching` notification already exists for this request
   - If not: create notification + send email to all HR users
4. **If overdue:**
   - Check if `sla_overdue` notification already exists for this request
   - If not: create notification + send email to all HR users
5. Each notification type is sent **once per Employee Request** (idempotent via `reference_type` + `reference_id` + `type` check)

### Email Templates

**Approaching email:**
- Subject: "Recruitment SLA Approaching - {requestCode}"
- Body: "{requestCode} for {jobTitle} has {remainingDays} working days remaining before the SLA deadline of {dueDate}."

**Overdue email:**
- Subject: "Recruitment SLA Overdue - {requestCode}"
- Body: "{requestCode} for {jobTitle} has exceeded the 45 working-day SLA by {overdueDays} days. Due date was {dueDate}. Recruitment can still proceed."

---

## Frontend: Constants & Types

### File: `src/lib/constants/sla.ts`

```typescript
export const SLA_STATUS = {
  ON_TRACK: 'on_track',
  APPROACHING: 'approaching',
  OVERDUE: 'overdue',
} as const;

export type SlaStatus = typeof SLA_STATUS[keyof typeof SLA_STATUS];

export const SLA_STATUS_CONFIG: Record<SlaStatus, { label: string; variant: string; className: string }> = {
  on_track: { label: 'On Track', variant: 'default', className: 'bg-green-100 text-green-800 border-green-200' },
  approaching: { label: 'Approaching', variant: 'warning', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  overdue: { label: 'Overdue', variant: 'destructive', className: 'bg-red-100 text-red-800 border-red-200' },
};
```

### Type: `SlaInfo`

```typescript
export interface SlaInfo {
  startedAt: string;
  dueDate: string;
  remainingDays: number;
  totalDays: number;
  status: SlaStatus;
}
```

Added to `EmployeeRequest` type and candidate response type.

### Type: `Notification`

```typescript
export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  referenceType: string | null;
  referenceId: number | null;
  isRead: boolean;
  createdAt: string;
}
```

---

## Frontend: Components

### 1. `SlaBanner` (`src/components/shared/SlaBanner.tsx`)

Reusable banner component that accepts `SlaInfo` and renders:

- **On Track**: Green info banner — "SLA: 32 working days remaining (due: May 28, 2026)"
- **Approaching**: Yellow warning banner — "SLA deadline approaching: 8 working days remaining (due: May 28, 2026)"
- **Overdue**: Red destructive banner — "SLA overdue by 3 working days (due: May 28, 2026). Recruitment can still proceed."

**Props:**
```typescript
interface SlaBannerProps {
  sla: SlaInfo;
  showOnTrack?: boolean; // default true — set false on candidate detail to only show warnings
}
```

### 2. `SlaBadge` (`src/components/shared/SlaBadge.tsx`)

Compact badge for use in table columns. Shows remaining days with color coding.

- On Track: green badge "32d remaining"
- Approaching: yellow badge "8d remaining"
- Overdue: red badge "3d overdue"

### 3. `NotificationBell` (`src/components/layout/NotificationBell.tsx`)

- Bell icon in the app header/navbar
- Unread count badge (red dot with number)
- Click opens a Popover/dropdown with notification list
- Each notification item: icon + title + message + time ago + click navigates to referenced page
- "Mark all as read" button at the top
- Clicking a notification marks it as read and navigates to `/recruitment/request/{referenceId}`

### 4. SLA Column in Recruitment List Table

Add "SLA" column to the Employee Request list table (only visible for `in_recruitment` status). Uses `SlaBadge`.

---

## Frontend: Page Changes

### `/recruitment/request` (List page)

- Add SLA column to table using `SlaBadge`

### `/recruitment/request/[id]` (Employee Request Detail)

- Add `SlaBanner` below header, above content
- Show all 3 levels (on_track, approaching, overdue)

### `/recruitment/[id]` (Candidate Detail)

- Add `SlaBanner` below profile header
- Only show approaching and overdue (`showOnTrack={false}`)

### Layout/Header

- Add `NotificationBell` component to the app header

### Dashboard / Login Toast

- On dashboard load, fetch notifications with `sla_approaching` or `sla_overdue` type
- If any unread SLA notifications exist, show toast warning

---

## Frontend: Services

### `notificationService.ts`

```typescript
getNotifications(params: { page: number; limit: number }): Promise<ApiResponse<Notification[]>>
getUnreadCount(): Promise<ApiResponse<{ count: number }>>
markAsRead(id: number): Promise<ApiResponse<void>>
markAllAsRead(): Promise<ApiResponse<void>>
```

---

## Files to Create/Modify

### Backend (recruitment-hris-api)

| Action | File | Description |
|---|---|---|
| Create | `prisma/migrations/XXXX_add_recruitment_started_at/migration.sql` | Add column to employee_request |
| Create | `prisma/migrations/XXXX_create_notification_table/migration.sql` | Create notification table |
| Modify | `prisma/schema.prisma` | Add field + new model |
| Create | `src/services/slaService.ts` | SLA calculation logic |
| Create | `src/cron/slaCronJob.ts` | Daily SLA check cron |
| Create | `src/repositories/notificationRepository.ts` | Notification DB queries |
| Create | `src/services/notificationService.ts` | Notification business logic |
| Create | `src/controllers/notificationController.ts` | Notification request handlers |
| Create | `src/routes/notificationRoutes.ts` | Notification route definitions |
| Create | `src/schemas/notificationSchemas.ts` | Request validation schemas |
| Modify | `src/services/employeeRequestService.ts` | Set `recruitmentStartedAt` in startRecruitment |
| Modify | `src/transformers/employeeRequestTransformer.ts` | Include `sla` in response |
| Modify | `src/services/emailService.ts` | Add SLA email templates |
| Modify | `src/config/app.ts` | Register notification routes + start cron |
| Modify | `src/repositories/employeeRequestRepository.ts` | Include new field in queries |

### Frontend (recruitment-hris)

| Action | File | Description |
|---|---|---|
| Create | `src/lib/constants/sla.ts` | SLA status constants & config |
| Create | `src/components/shared/SlaBanner.tsx` | SLA banner component |
| Create | `src/components/shared/SlaBadge.tsx` | SLA badge for tables |
| Create | `src/components/layout/NotificationBell.tsx` | Notification bell + dropdown |
| Create | `src/services/notificationService.ts` | Notification API service |
| Create | `src/types/notification.ts` | Notification types |
| Modify | `src/types/employee-request.ts` | Add `recruitmentStartedAt` + `sla` fields |
| Modify | `src/components/layout/AppLayout.tsx` (or Header) | Add NotificationBell |
| Modify | Recruitment list page | Add SLA column |
| Modify | Employee Request detail page | Add SlaBanner |
| Modify | Candidate detail page (`/recruitment/[id]`) | Add SlaBanner |
| Modify | Dashboard page | Add SLA toast on load |

---

## Edge Cases

1. **Recruitment completed before SLA** — SLA info still shown (as completed/on-track) but no more cron checks
2. **Recruitment started before this feature** — `recruitmentStartedAt` is NULL, no SLA shown (graceful fallback)
3. **Multiple HR users** — All users with HR role receive email notifications
4. **Cron idempotency** — Check for existing notification before creating duplicate (query by `reference_type`, `reference_id`, `type`)
5. **Weekend start** — If startRecruitment is called on weekend, `recruitmentStartedAt` is still recorded as-is; SLA calculation skips weekends naturally
