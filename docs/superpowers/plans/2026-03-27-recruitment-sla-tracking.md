# Recruitment SLA Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 45 working-day SLA tracking to recruitment with warnings, in-app notifications, and email alerts.

**Architecture:** Backend-computed SLA. Backend calculates SLA info from `recruitmentStartedAt` field and returns it in API responses. A daily cron job (node-cron) sends email + creates in-app notifications for approaching/overdue SLAs. Frontend renders SLA banners, badges, and a notification bell.

**Tech Stack:** Fastify v5, Prisma/MySQL (backend); Next.js 16, React, shadcn/ui, Tailwind (frontend); node-cron, Mailgun.

**Spec:** `docs/superpowers/specs/2026-03-27-recruitment-sla-tracking-design.md`

**Repos:**
- Backend: `/Users/diantnugraha/Documents/Documents/Development/recruitment-hris-api`
- Frontend: `/Users/diantnugraha/Documents/Documents/Development/recruitment-hris`

---

## File Structure

### Backend (recruitment-hris-api)

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `prisma/schema.prisma` | Add `recruitmentStartedAt` to EmployeeRequest, add Notification model |
| Create | `prisma/migrations/YYYYMMDD_add_recruitment_started_at/migration.sql` | Migration 1 |
| Create | `prisma/migrations/YYYYMMDD_create_notification/migration.sql` | Migration 2 |
| Create | `src/constants/slaConstants.ts` | SLA_DAYS, SLA_WARNING_DAYS, SLA status types |
| Create | `src/services/slaService.ts` | Pure SLA calculation functions |
| Create | `src/repositories/notificationRepository.ts` | Notification CRUD queries |
| Create | `src/services/notificationService.ts` | Notification business logic |
| Create | `src/controllers/notificationController.ts` | Notification HTTP handlers |
| Create | `src/schemas/notificationSchemas.ts` | Typebox validation schemas |
| Create | `src/routes/notificationRoutes.ts` | Route registration |
| Create | `src/cron/slaCronJob.ts` | Daily SLA check cron |
| Modify | `src/repositories/employeeRequestRepository.ts:367` | Accept + persist `recruitmentStartedAt` in update() |
| Modify | `src/services/employeeRequestService.ts:243` | Set `recruitmentStartedAt` in IN_RECRUITMENT case |
| Modify | `src/controllers/employeeRequestController.ts:21` | Add `sla` to transformEmployeeRequest() |
| Modify | `src/services/emailService.ts` | Add SLA approaching + overdue email templates |
| Modify | `src/routes/index.ts` | Register notification routes |
| Modify | `src/config/app.ts` | Start cron job |

### Frontend (recruitment-hris)

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/lib/constants/sla.ts` | SLA status constants + config |
| Create | `src/types/notification.ts` | Notification type |
| Create | `src/services/notification.service.ts` | Notification API service |
| Create | `src/components/shared/SlaBanner.tsx` | SLA warning banner |
| Create | `src/components/shared/SlaBadge.tsx` | SLA badge for tables |
| Create | `src/components/layout/NotificationBell.tsx` | Bell icon + dropdown |
| Modify | `src/types/employee-request.ts:10` | Add `recruitmentStartedAt`, `sla` to EmployeeRequest |
| Modify | `src/services/employee-request.service.ts:103` | Map `recruitment_started_at` + `sla` in mapEmployeeRequest |
| Modify | `src/services/candidate.service.ts:111` | Add `sla` to employeeRequest nested type |
| Modify | `src/components/layout/header.tsx:33` | Add NotificationBell |
| Modify | `src/app/(protected)/recruitment/page.tsx:52` | Add SLA column |
| Modify | `src/app/(protected)/recruitment/request/[id]/page.tsx:466` | Add SlaBanner |
| Modify | `src/app/(protected)/recruitment/[id]/page.tsx:338` | Add SlaBanner |
| Modify | `src/app/(protected)/dashboard/page.tsx` | Add SLA toast on load |

---

## Task 1: Database Schema & Prisma Migration

**Files:**
- Modify: `recruitment-hris-api/prisma/schema.prisma`
- Create: `recruitment-hris-api/prisma/migrations/20260327010000_add_recruitment_started_at/migration.sql`
- Create: `recruitment-hris-api/prisma/migrations/20260327020000_create_notification/migration.sql`

- [ ] **Step 1: Add `recruitmentStartedAt` to EmployeeRequest in schema.prisma**

In `prisma/schema.prisma`, add after the `rejectedAt` field in the `EmployeeRequest` model (around line 310):

```prisma
  recruitmentStartedAt  DateTime?             @map("recruitment_started_at") @db.Timestamp(0)
```

- [ ] **Step 2: Add Notification model to schema.prisma**

Add after the `EmployeeRequest` model block:

```prisma
model Notification {
  id            BigInt   @id @default(autoincrement()) @db.UnsignedBigInt
  userId        Int      @map("user_id")
  type          String   @db.VarChar(30)
  title         String   @db.VarChar(255)
  message       String   @db.Text
  referenceType String?  @map("reference_type") @db.VarChar(50)
  referenceId   BigInt?  @map("reference_id") @db.UnsignedBigInt
  isRead        Boolean  @default(false) @map("is_read")
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamp(0)
  updatedAt     DateTime? @map("updated_at") @db.Timestamp(0)

  user User @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([userId, isRead])
  @@unique([referenceType, referenceId, type])
  @@map("notification")
}
```

Also add to the `User` model a reverse relation:
```prisma
  notifications Notification[]
```

- [ ] **Step 3: Create migration 1 — add_recruitment_started_at**

Create file `prisma/migrations/20260327010000_add_recruitment_started_at/migration.sql`:

```sql
-- Add recruitment_started_at to employee_request
ALTER TABLE `employee_request`
ADD COLUMN `recruitment_started_at` TIMESTAMP NULL AFTER `rejected_at`;
```

- [ ] **Step 4: Create migration 2 — create_notification**

Create file `prisma/migrations/20260327020000_create_notification/migration.sql`:

```sql
-- Create notification table
CREATE TABLE `notification` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `type` VARCHAR(30) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `reference_type` VARCHAR(50) NULL,
  `reference_id` BIGINT UNSIGNED NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL,
  INDEX `idx_notification_user_id` (`user_id`),
  INDEX `idx_notification_user_read` (`user_id`, `is_read`),
  INDEX `idx_notification_ref_type` (`reference_type`, `reference_id`, `type`),
  UNIQUE INDEX `uq_notification_ref_type` (`reference_type`, `reference_id`, `type`),
  CONSTRAINT `fk_notification_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

- [ ] **Step 5: Run migrations**

```bash
cd /Users/diantnugraha/Documents/Documents/Development/recruitment-hris-api
npx prisma migrate deploy
npx prisma generate
```

- [ ] **Step 6: Commit**

```bash
git add prisma/
git commit -m "feat: add recruitment_started_at field and notification table"
```

---

## Task 2: SLA Calculation Service (Backend)

**Files:**
- Create: `recruitment-hris-api/src/constants/slaConstants.ts`
- Create: `recruitment-hris-api/src/services/slaService.ts`

- [ ] **Step 1: Create SLA constants**

Create `src/constants/slaConstants.ts`:

```typescript
export const SLA_DAYS = 45;
export const SLA_WARNING_DAYS = 10;

export const SLA_STATUS = {
  ON_TRACK: 'on_track',
  APPROACHING: 'approaching',
  OVERDUE: 'overdue',
} as const;

export type SlaStatus = typeof SLA_STATUS[keyof typeof SLA_STATUS];

export interface SlaInfo {
  startedAt: string;
  dueDate: string;
  remainingDays: number;
  totalDays: number;
  status: SlaStatus;
}
```

- [ ] **Step 2: Create SLA service**

Create `src/services/slaService.ts`:

```typescript
import { SLA_DAYS, SLA_WARNING_DAYS, SLA_STATUS, type SlaInfo, type SlaStatus } from '../constants/slaConstants.js';

function isWorkingDay(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6; // not Sunday, not Saturday
}

export function calculateDueDate(startDate: Date): Date {
  const date = new Date(startDate);
  let count = 0;

  while (count < SLA_DAYS) {
    date.setDate(date.getDate() + 1);
    if (isWorkingDay(date)) {
      count++;
    }
  }

  // Set to end of day
  date.setHours(23, 59, 59, 999);
  return date;
}

export function countWorkingDaysBetween(fromDate: Date, toDate: Date): number {
  const start = new Date(fromDate);
  const end = new Date(toDate);
  let count = 0;

  // Normalize to start of day for comparison
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const current = new Date(start);
  while (current < end) {
    current.setDate(current.getDate() + 1);
    if (isWorkingDay(current)) {
      count++;
    }
  }

  return count;
}

export function getRemainingWorkingDays(startDate: Date): number {
  const dueDate = calculateDueDate(startDate);
  const now = new Date();

  // Normalize dueDate to start of day for comparison
  const dueDateNormalized = new Date(dueDate);
  dueDateNormalized.setHours(0, 0, 0, 0);

  const nowNormalized = new Date(now);
  nowNormalized.setHours(0, 0, 0, 0);

  if (nowNormalized <= dueDateNormalized) {
    // Count working days from now to due date
    return countWorkingDaysBetween(nowNormalized, dueDateNormalized);
  } else {
    // Overdue: count working days from due date to now (negative)
    return -countWorkingDaysBetween(dueDateNormalized, nowNormalized);
  }
}

export function getSlaStatus(remainingDays: number): SlaStatus {
  if (remainingDays <= 0) return SLA_STATUS.OVERDUE;
  if (remainingDays <= SLA_WARNING_DAYS) return SLA_STATUS.APPROACHING;
  return SLA_STATUS.ON_TRACK;
}

export function getSlaInfo(startDate: Date | null): SlaInfo | null {
  if (!startDate) return null;

  const dueDate = calculateDueDate(startDate);
  const remainingDays = getRemainingWorkingDays(startDate);
  const status = getSlaStatus(remainingDays);

  return {
    startedAt: startDate.toISOString(),
    dueDate: dueDate.toISOString(),
    remainingDays,
    totalDays: SLA_DAYS,
    status,
  };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/constants/slaConstants.ts src/services/slaService.ts
git commit -m "feat: add SLA calculation service with working day logic"
```

---

## Task 3: Wire SLA into Employee Request Flow (Backend)

**Files:**
- Modify: `recruitment-hris-api/src/repositories/employeeRequestRepository.ts:367`
- Modify: `recruitment-hris-api/src/services/employeeRequestService.ts:243`
- Modify: `recruitment-hris-api/src/controllers/employeeRequestController.ts:21`

- [ ] **Step 1: Update repository to persist `recruitmentStartedAt`**

In `src/repositories/employeeRequestRepository.ts`, inside the `update` function (line 367), add to the conditional field mapping block where other audit fields like `approvedAt`, `hodReviewedAt` are mapped:

```typescript
if (data.recruitmentStartedAt !== undefined) {
  updateData.recruitmentStartedAt = data.recruitmentStartedAt;
}
```

- [ ] **Step 2: Set `recruitmentStartedAt` in service**

In `src/services/employeeRequestService.ts`, inside `updateEmployeeRequestStatus` (line 243), find the section where `IN_RECRUITMENT` is handled (where `generateRecruitmentCode` is called). Add after `codeRecruitment` is set:

```typescript
updateData.recruitmentStartedAt = new Date();
```

- [ ] **Step 3: Add SLA to transformer**

**Note:** The spec lists `src/transformers/employeeRequestTransformer.ts` but that file does not exist. The `transformEmployeeRequest` function lives inline in `src/controllers/employeeRequestController.ts` (line 21). This is a spec inaccuracy — the plan targets the correct file.

In `src/controllers/employeeRequestController.ts`, find the `transformEmployeeRequest` function (line 21). Import `getSlaInfo` at the top:

```typescript
import { getSlaInfo } from '../services/slaService.js';
```

Add to the returned object inside `transformEmployeeRequest`, after the existing fields:

```typescript
recruitment_started_at: request.recruitmentStartedAt?.toISOString() || null,
sla: (request.statusEmployeeRequest === 6 || request.statusEmployeeRequest === 7)
  ? getSlaInfo(request.recruitmentStartedAt || null)
  : null,
```

Status `6` = in_recruitment, `7` = completed.

- [ ] **Step 4: Verify by testing the start-recruitment endpoint manually**

```bash
# Start the server and test via curl or Postman:
# POST /v1/employee-request/:id/start-recruitment
# Then GET /v1/employee-request/:id — verify `sla` field is present
```

- [ ] **Step 5: Commit**

```bash
git add src/repositories/employeeRequestRepository.ts src/services/employeeRequestService.ts src/controllers/employeeRequestController.ts
git commit -m "feat: wire SLA calculation into employee request flow"
```

---

## Task 4: Notification Repository & Service (Backend)

**Files:**
- Create: `recruitment-hris-api/src/repositories/notificationRepository.ts`
- Create: `recruitment-hris-api/src/services/notificationService.ts`

- [ ] **Step 1: Create notification repository**

Create `src/repositories/notificationRepository.ts`:

```typescript
import { prisma } from '../config/database.js';
import { success, failure, type RepositoryResult } from './types.js';
import type { Notification, Prisma } from '@prisma/client';

export async function findByUserId(
  userId: number,
  pagination: { page: number; limit: number },
  type?: string
): Promise<RepositoryResult<{ items: Notification[]; total: number }>> {
  try {
    const where: Prisma.NotificationWhereInput = { userId };

    if (type) {
      const types = type.split(',').map(t => t.trim());
      where.type = { in: types };
    }

    const [items, total] = await prisma.$transaction([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return success({ items, total });
  } catch (error) {
    return failure(`Failed to fetch notifications: ${error}`);
  }
}

export async function getUnreadCount(userId: number): Promise<RepositoryResult<number>> {
  try {
    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });
    return success(count);
  } catch (error) {
    return failure(`Failed to get unread count: ${error}`);
  }
}

export async function markAsRead(id: number, userId: number): Promise<RepositoryResult<boolean>> {
  try {
    await prisma.notification.updateMany({
      where: { id: BigInt(id), userId },
      data: { isRead: true, updatedAt: new Date() },
    });
    return success(true);
  } catch (error) {
    return failure(`Failed to mark as read: ${error}`);
  }
}

export async function markAllAsRead(userId: number): Promise<RepositoryResult<boolean>> {
  try {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, updatedAt: new Date() },
    });
    return success(true);
  } catch (error) {
    return failure(`Failed to mark all as read: ${error}`);
  }
}

export async function create(data: {
  userId: number;
  type: string;
  title: string;
  message: string;
  referenceType?: string;
  referenceId?: bigint;
}): Promise<RepositoryResult<Notification>> {
  try {
    const notification = await prisma.notification.create({ data });
    return success(notification);
  } catch (error) {
    return failure(`Failed to create notification: ${error}`);
  }
}

export async function existsByReference(
  referenceType: string,
  referenceId: bigint,
  type: string
): Promise<RepositoryResult<boolean>> {
  try {
    const count = await prisma.notification.count({
      where: { referenceType, referenceId, type },
    });
    return success(count > 0);
  } catch (error) {
    return failure(`Failed to check notification existence: ${error}`);
  }
}
```

- [ ] **Step 2: Create notification service**

Create `src/services/notificationService.ts`:

```typescript
import * as notificationRepository from '../repositories/notificationRepository.js';
import { NotFoundError } from '../errors/index.js';

export async function getNotifications(
  userId: number,
  pagination: { page: number; limit: number },
  type?: string
) {
  const result = await notificationRepository.findByUserId(userId, pagination, type);
  if (result.isFailure()) throw new Error(result.error);
  return result.getValue();
}

export async function getUnreadCount(userId: number): Promise<number> {
  const result = await notificationRepository.getUnreadCount(userId);
  if (result.isFailure()) throw new Error(result.error);
  return result.getValue();
}

export async function markAsRead(id: number, userId: number): Promise<void> {
  const result = await notificationRepository.markAsRead(id, userId);
  if (result.isFailure()) throw new Error(result.error);
}

export async function markAllAsRead(userId: number): Promise<void> {
  const result = await notificationRepository.markAllAsRead(userId);
  if (result.isFailure()) throw new Error(result.error);
}

export async function createNotification(data: {
  userId: number;
  type: string;
  title: string;
  message: string;
  referenceType?: string;
  referenceId?: bigint;
}): Promise<void> {
  const result = await notificationRepository.create(data);
  if (result.isFailure()) throw new Error(result.error);
}

export async function hasNotificationForReference(
  referenceType: string,
  referenceId: bigint,
  type: string
): Promise<boolean> {
  const result = await notificationRepository.existsByReference(referenceType, referenceId, type);
  if (result.isFailure()) throw new Error(result.error);
  return result.getValue();
}
```

- [ ] **Step 3: Commit**

```bash
git add src/repositories/notificationRepository.ts src/services/notificationService.ts
git commit -m "feat: add notification repository and service"
```

---

## Task 5: Notification API Endpoints (Backend)

**Files:**
- Create: `recruitment-hris-api/src/schemas/notificationSchemas.ts`
- Create: `recruitment-hris-api/src/controllers/notificationController.ts`
- Create: `recruitment-hris-api/src/routes/notificationRoutes.ts`
- Modify: `recruitment-hris-api/src/routes/index.ts`

- [ ] **Step 1: Create notification schemas**

Create `src/schemas/notificationSchemas.ts`:

```typescript
import { Type } from '@sinclair/typebox';

export const notificationQuerySchema = Type.Object({
  page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
  type: Type.Optional(Type.String()),
});

export const notificationIdParamSchema = Type.Object({
  id: Type.Number(),
});
```

- [ ] **Step 2: Create notification controller**

Create `src/controllers/notificationController.ts`:

```typescript
import type { FastifyRequest, FastifyReply } from 'fastify';
import * as notificationService from '../services/notificationService.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';

export async function getAll(
  request: FastifyRequest<{ Querystring: { page?: number; limit?: number; type?: string } }>,
  reply: FastifyReply
): Promise<void> {
  const { page = 1, limit = 20, type } = request.query;
  const userId = request.enrichedUser.userId;

  const { items, total } = await notificationService.getNotifications(userId, { page, limit }, type);

  sendPaginated(reply, items, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}

export async function getUnreadCount(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const userId = request.enrichedUser.userId;
  const count = await notificationService.getUnreadCount(userId);
  sendSuccess(reply, { count });
}

export async function markAsRead(
  request: FastifyRequest<{ Params: { id: number } }>,
  reply: FastifyReply
): Promise<void> {
  const userId = request.enrichedUser.userId;
  const { id } = request.params;
  await notificationService.markAsRead(id, userId);
  sendSuccess(reply, null);
}

export async function markAllAsRead(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const userId = request.enrichedUser.userId;
  await notificationService.markAllAsRead(userId);
  sendSuccess(reply, null);
}
```

- [ ] **Step 3: Create notification routes**

Create `src/routes/notificationRoutes.ts`:

```typescript
import type { FastifyInstance } from 'fastify';
import * as notificationController from '../controllers/notificationController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { enrichUserContext } from '../middlewares/enrichUserContext.js';
import { notificationQuerySchema, notificationIdParamSchema } from '../schemas/notificationSchemas.js';

export async function notificationRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', enrichUserContext);

  // Static routes FIRST (before parametric :id)
  app.get('/unread-count', notificationController.getUnreadCount);

  app.put('/read-all', notificationController.markAllAsRead);

  app.get('/', {
    schema: { querystring: notificationQuerySchema },
    handler: notificationController.getAll,
  });

  // Parametric route LAST
  app.put<{ Params: { id: number } }>('/:id/read', {
    schema: { params: notificationIdParamSchema },
    handler: notificationController.markAsRead,
  });
}
```

- [ ] **Step 4: Register routes in index.ts**

In `src/routes/index.ts`, add import and registration. Follow existing pattern:

```typescript
import { notificationRoutes } from './notificationRoutes.js';
```

Inside `registerRoutes`:
```typescript
await app.register(notificationRoutes, { prefix: '/v1/notifications' });
```

- [ ] **Step 5: Commit**

```bash
git add src/schemas/notificationSchemas.ts src/controllers/notificationController.ts src/routes/notificationRoutes.ts src/routes/index.ts
git commit -m "feat: add notification API endpoints"
```

---

## Task 6: SLA Email Templates (Backend)

**Files:**
- Modify: `recruitment-hris-api/src/services/emailService.ts`

- [ ] **Step 1: Add SLA email data types and templates**

In `src/services/emailService.ts`, add after the existing email types (follow the pattern of `InterviewScheduleEmailData`):

```typescript
export interface SlaApproachingEmailData {
  recipientEmail: string;
  recipientName: string;
  requestCode: string;
  jobTitle: string;
  remainingDays: number;
  dueDate: string;
}

export interface SlaOverdueEmailData {
  recipientEmail: string;
  recipientName: string;
  requestCode: string;
  jobTitle: string;
  overdueDays: number;
  dueDate: string;
}
```

- [ ] **Step 2: Add template functions**

Follow the existing pattern (private template + public send function):

```typescript
function getSlaApproachingTemplate(data: SlaApproachingEmailData & { companyName: string }): string {
  const bodyHtml = `
    <p>${data.requestCode} for <strong>${data.jobTitle}</strong> has <strong>${data.remainingDays} working days</strong> remaining before the SLA deadline.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
      <tr>
        <td style="padding: 15px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; font-weight: 600; color: #92400e;">SLA Deadline: ${data.dueDate}</p>
          <p style="margin: 5px 0 0; color: #92400e;">${data.remainingDays} working days remaining</p>
        </td>
      </tr>
    </table>
    <p>Please ensure the recruitment process is progressing to meet the deadline.</p>
  `;

  return getBaseLayout({
    title: `SLA Approaching - ${data.requestCode}`,
    heading: 'Recruitment SLA Approaching',
    greeting: `Dear ${data.recipientName},`,
    bodyHtml,
  });
}

export async function sendSlaApproachingEmail(data: SlaApproachingEmailData): Promise<void> {
  const config = getEmailConfig();
  const mg = getMailgunClient();
  const html = getSlaApproachingTemplate({ ...data, companyName: config.companyName });

  await mg.messages.create(config.domain, {
    from: `${config.fromName} <${config.fromEmail}>`,
    to: data.recipientEmail,
    subject: `Recruitment SLA Approaching - ${data.requestCode}`,
    html,
  });
}

function getSlaOverdueTemplate(data: SlaOverdueEmailData & { companyName: string }): string {
  const bodyHtml = `
    <p>${data.requestCode} for <strong>${data.jobTitle}</strong> has exceeded the 45 working-day SLA by <strong>${data.overdueDays} days</strong>.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
      <tr>
        <td style="padding: 15px; background-color: #fee2e2; border-radius: 8px; border-left: 4px solid #ef4444;">
          <p style="margin: 0; font-weight: 600; color: #991b1b;">SLA Deadline: ${data.dueDate} (exceeded)</p>
          <p style="margin: 5px 0 0; color: #991b1b;">Overdue by ${data.overdueDays} working days</p>
        </td>
      </tr>
    </table>
    <p>The recruitment process can still proceed. Please take action to complete the process as soon as possible.</p>
  `;

  return getBaseLayout({
    title: `SLA Overdue - ${data.requestCode}`,
    heading: 'Recruitment SLA Overdue',
    greeting: `Dear ${data.recipientName},`,
    bodyHtml,
  });
}

export async function sendSlaOverdueEmail(data: SlaOverdueEmailData): Promise<void> {
  const config = getEmailConfig();
  const mg = getMailgunClient();
  const html = getSlaOverdueTemplate({ ...data, companyName: config.companyName });

  await mg.messages.create(config.domain, {
    from: `${config.fromName} <${config.fromEmail}>`,
    to: data.recipientEmail,
    subject: `Recruitment SLA Overdue - ${data.requestCode}`,
    html,
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/services/emailService.ts
git commit -m "feat: add SLA approaching and overdue email templates"
```

---

## Task 7: SLA Cron Job (Backend)

**Files:**
- Create: `recruitment-hris-api/src/cron/slaCronJob.ts`
- Modify: `recruitment-hris-api/src/config/app.ts`

- [ ] **Step 1: Install node-cron**

```bash
cd /Users/diantnugraha/Documents/Documents/Development/recruitment-hris-api
npm install node-cron
npm install -D @types/node-cron
```

- [ ] **Step 2: Create the cron job**

Create `src/cron/slaCronJob.ts`:

```typescript
import cron from 'node-cron';
import { prisma } from '../config/database.js';
import { getRemainingWorkingDays, getSlaStatus, calculateDueDate } from '../services/slaService.js';
import { SLA_STATUS } from '../constants/slaConstants.js';
import * as notificationService from '../services/notificationService.js';
import { sendSlaApproachingEmail, sendSlaOverdueEmail } from '../services/emailService.js';
import { format } from 'date-fns';

async function getHrUsers(): Promise<Array<{ id: number; email: string; name: string }>> {
  const users = await prisma.user.findMany({
    where: {
      role: {
        roleName: { in: ['Human Resources', 'HR Manager', 'admin'] },
      },
      trash: null,
    },
    select: { id: true, email: true, name: true },
  });
  return users;
}

async function fetchJobTitle(jobTitleId: number): Promise<string> {
  const jobTitle = await prisma.jobTitle.findFirst({
    where: { id: jobTitleId },
    select: { name: true },
  });
  return jobTitle?.name || 'Unknown Position';
}

async function checkSlaDeadlines(): Promise<void> {
  console.log('[SLA Cron] Starting daily SLA check...');

  try {
    // Query all in_recruitment requests
    const requests = await prisma.employeeRequest.findMany({
      where: {
        statusEmployeeRequest: 6, // in_recruitment
        recruitmentStartedAt: { not: null },
        isDeleted: 0,
      },
      select: {
        id: true,
        code: true,
        codeRecruitment: true,
        jobTitleId: true,
        recruitmentStartedAt: true,
      },
    });

    console.log(`[SLA Cron] Found ${requests.length} active recruitments to check`);

    const hrUsers = await getHrUsers();

    for (const request of requests) {
      const startDate = request.recruitmentStartedAt!;
      const remainingDays = getRemainingWorkingDays(startDate);
      const status = getSlaStatus(remainingDays);
      const dueDate = calculateDueDate(startDate);
      const dueDateFormatted = format(dueDate, 'MMMM d, yyyy');
      const requestCode = request.codeRecruitment || request.code;

      if (status === SLA_STATUS.APPROACHING) {
        const alreadySent = await notificationService.hasNotificationForReference(
          'employee_request', request.id, 'sla_approaching'
        );
        if (!alreadySent) {
          const jobTitle = await fetchJobTitle(request.jobTitleId);

          // Create notification for each HR user
          for (const user of hrUsers) {
            await notificationService.createNotification({
              userId: user.id,
              type: 'sla_approaching',
              title: `SLA Approaching - ${requestCode}`,
              message: `${requestCode} for ${jobTitle} has ${remainingDays} working days remaining before the SLA deadline of ${dueDateFormatted}.`,
              referenceType: 'employee_request',
              referenceId: request.id,
            });

            await sendSlaApproachingEmail({
              recipientEmail: user.email,
              recipientName: user.name,
              requestCode,
              jobTitle,
              remainingDays,
              dueDate: dueDateFormatted,
            });
          }

          console.log(`[SLA Cron] Sent approaching notifications for ${requestCode}`);
        }
      }

      if (status === SLA_STATUS.OVERDUE) {
        const alreadySent = await notificationService.hasNotificationForReference(
          'employee_request', request.id, 'sla_overdue'
        );
        if (!alreadySent) {
          const jobTitle = await fetchJobTitle(request.jobTitleId);
          const overdueDays = Math.abs(remainingDays);

          for (const user of hrUsers) {
            await notificationService.createNotification({
              userId: user.id,
              type: 'sla_overdue',
              title: `SLA Overdue - ${requestCode}`,
              message: `${requestCode} for ${jobTitle} has exceeded the 45 working-day SLA by ${overdueDays} days. Due date was ${dueDateFormatted}. Recruitment can still proceed.`,
              referenceType: 'employee_request',
              referenceId: request.id,
            });

            await sendSlaOverdueEmail({
              recipientEmail: user.email,
              recipientName: user.name,
              requestCode,
              jobTitle,
              overdueDays,
              dueDate: dueDateFormatted,
            });
          }

          console.log(`[SLA Cron] Sent overdue notifications for ${requestCode}`);
        }
      }
    }

    console.log('[SLA Cron] Daily SLA check completed');
  } catch (error) {
    console.error('[SLA Cron] Error during SLA check:', error);
  }
}

export function startSlaCronJob(): void {
  // Run every working day at 01:00 UTC (08:00 WIB)
  cron.schedule('0 1 * * 1-5', () => {
    checkSlaDeadlines();
  });

  console.log('[SLA Cron] Scheduled daily SLA check (Mon-Fri 08:00 WIB)');
}
```

- [ ] **Step 3: Register cron in app startup**

In `src/config/app.ts`, add import:

```typescript
import { startSlaCronJob } from '../cron/slaCronJob.js';
```

At the end of `createApp` (after `registerRoutes`), add:

```typescript
startSlaCronJob();
```

- [ ] **Step 4: Commit**

```bash
git add src/cron/slaCronJob.ts src/config/app.ts package.json package-lock.json
git commit -m "feat: add daily SLA cron job for approaching/overdue notifications"
```

---

## Task 8: Frontend — SLA Constants, Types & Service

**Files:**
- Create: `recruitment-hris/src/lib/constants/sla.ts`
- Create: `recruitment-hris/src/types/notification.ts`
- Create: `recruitment-hris/src/services/notification.service.ts`
- Modify: `recruitment-hris/src/types/employee-request.ts`
- Modify: `recruitment-hris/src/services/employee-request.service.ts`
- Modify: `recruitment-hris/src/services/candidate.service.ts`

- [ ] **Step 1: Create SLA constants**

Create `src/lib/constants/sla.ts`:

```typescript
export const SLA_STATUS = {
  ON_TRACK: 'on_track',
  APPROACHING: 'approaching',
  OVERDUE: 'overdue',
} as const;

export type SlaStatus = typeof SLA_STATUS[keyof typeof SLA_STATUS];

export interface SlaInfo {
  startedAt: string;
  dueDate: string;
  remainingDays: number;
  totalDays: number;
  status: SlaStatus;
}

export const SLA_STATUS_CONFIG: Record<SlaStatus, { label: string; variant: string; className: string }> = {
  on_track: {
    label: 'On Track',
    variant: 'default',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  approaching: {
    label: 'Approaching',
    variant: 'outline',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  overdue: {
    label: 'Overdue',
    variant: 'destructive',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
};
```

- [ ] **Step 2: Create notification types**

Create `src/types/notification.ts`:

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

- [ ] **Step 3: Create notification service**

Create `src/services/notification.service.ts`:

```typescript
import api from './api';

import type { Notification } from '@/types/notification';

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

const notificationService = {
  async getNotifications(params: { page?: number; limit?: number; type?: string }): Promise<PaginatedResponse<Notification>> {
    const { data } = await api.get('/v1/notifications', { params });
    return data;
  },

  async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    const { data } = await api.get('/v1/notifications/unread-count');
    return data;
  },

  async markAsRead(id: number): Promise<void> {
    await api.put(`/v1/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await api.put('/v1/notifications/read-all');
  },
};

export default notificationService;
```

- [ ] **Step 4: Add SLA fields to employee-request types**

In `src/types/employee-request.ts`, add import at top:

```typescript
import type { SlaInfo } from '@/lib/constants/sla';
```

Add to the `EmployeeRequest` interface (after `rejectedAt`):

```typescript
recruitmentStartedAt?: string | null;
sla?: SlaInfo | null;
```

- [ ] **Step 5: Update mapEmployeeRequest in employee-request.service.ts**

In `src/services/employee-request.service.ts`, find the `mapEmployeeRequest` function (line 103). Add to the returned object:

```typescript
recruitmentStartedAt: api.recruitment_started_at || null,
sla: api.sla || null,
```

- [ ] **Step 6: Update candidate service employeeRequest type**

In `src/services/candidate.service.ts`, find the `CandidateWithRelations` interface (line 111). Update the `employeeRequest` field:

```typescript
employeeRequest?: { id: number; code: string; jobPlacement?: string; sla?: SlaInfo | null } | null;
```

Add import at top:

```typescript
import type { SlaInfo } from '@/lib/constants/sla';
```

In `mapCandidate`, find the existing `employeeRequest` mapping and **replace** it (do not add a duplicate):

```typescript
// REPLACE the existing employeeRequest mapping with this:
employeeRequest: api.employee_request ? {
  id: api.employee_request.id,
  code: api.employee_request.code,
  jobPlacement: api.employee_request.job_placement,
  sla: api.employee_request.sla || null,
} : null,
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/constants/sla.ts src/types/notification.ts src/services/notification.service.ts src/types/employee-request.ts src/services/employee-request.service.ts src/services/candidate.service.ts
git commit -m "feat: add frontend SLA constants, notification types and services"
```

---

## Task 9: Frontend — SlaBanner & SlaBadge Components

**Files:**
- Create: `recruitment-hris/src/components/shared/SlaBanner.tsx`
- Create: `recruitment-hris/src/components/shared/SlaBadge.tsx`

- [ ] **Step 1: Create SlaBanner component**

Create `src/components/shared/SlaBanner.tsx`:

```tsx
'use client';

import { AlertTriangle, Clock, Info } from 'lucide-react';
import { format } from 'date-fns';

import { SLA_STATUS, type SlaInfo } from '@/lib/constants/sla';

interface SlaBannerProps {
  sla: SlaInfo;
  showOnTrack?: boolean;
}

const BANNER_CONFIG = {
  [SLA_STATUS.ON_TRACK]: {
    icon: Info,
    className: 'bg-green-50 border-green-200 text-green-800',
    iconClassName: 'text-green-600',
  },
  [SLA_STATUS.APPROACHING]: {
    icon: AlertTriangle,
    className: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    iconClassName: 'text-yellow-600',
  },
  [SLA_STATUS.OVERDUE]: {
    icon: AlertTriangle,
    className: 'bg-red-50 border-red-200 text-red-800',
    iconClassName: 'text-red-600',
  },
} as const;

function getMessage(sla: SlaInfo): string {
  const dueDate = format(new Date(sla.dueDate), 'MMMM d, yyyy');

  switch (sla.status) {
    case SLA_STATUS.ON_TRACK:
      return `SLA: ${sla.remainingDays} working days remaining (due: ${dueDate})`;
    case SLA_STATUS.APPROACHING:
      return `SLA deadline approaching: ${sla.remainingDays} working days remaining (due: ${dueDate})`;
    case SLA_STATUS.OVERDUE:
      return `SLA overdue by ${Math.abs(sla.remainingDays)} working days (due: ${dueDate}). Recruitment can still proceed.`;
    default:
      return '';
  }
}

export function SlaBanner({ sla, showOnTrack = true }: SlaBannerProps) {
  if (!showOnTrack && sla.status === SLA_STATUS.ON_TRACK) {
    return null;
  }

  const config = BANNER_CONFIG[sla.status];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-3 rounded-lg border p-3 ${config.className}`}>
      <Icon className={`h-5 w-5 shrink-0 ${config.iconClassName}`} />
      <p className="text-sm font-medium">{getMessage(sla)}</p>
    </div>
  );
}
```

- [ ] **Step 2: Create SlaBadge component**

Create `src/components/shared/SlaBadge.tsx`:

```tsx
'use client';

import { SLA_STATUS, SLA_STATUS_CONFIG, type SlaInfo } from '@/lib/constants/sla';

interface SlaBadgeProps {
  sla: SlaInfo | null | undefined;
}

export function SlaBadge({ sla }: SlaBadgeProps) {
  if (!sla) {
    return <span className="text-muted-foreground">-</span>;
  }

  const config = SLA_STATUS_CONFIG[sla.status];

  const label = sla.status === SLA_STATUS.OVERDUE
    ? `${Math.abs(sla.remainingDays)}d overdue`
    : `${sla.remainingDays}d remaining`;

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.className}`}>
      {label}
    </span>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/SlaBanner.tsx src/components/shared/SlaBadge.tsx
git commit -m "feat: add SlaBanner and SlaBadge components"
```

---

## Task 10: Frontend — NotificationBell Component

**Files:**
- Create: `recruitment-hris/src/components/layout/NotificationBell.tsx`
- Modify: `recruitment-hris/src/components/layout/header.tsx`

- [ ] **Step 1: Create NotificationBell component**

Create `src/components/layout/NotificationBell.tsx`:

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import notificationService from '@/services/notification.service';
import type { Notification } from '@/types/notification';

const POLL_INTERVAL = 60000; // 60 seconds

function getNotificationRoute(notification: Notification): string {
  if (notification.referenceType === 'employee_request' && notification.referenceId) {
    return `/recruitment/request/${notification.referenceId}`;
  }
  return '/recruitment';
}

export function NotificationBell() {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await notificationService.getUnreadCount();
      if (!signal?.aborted) {
        setUnreadCount(res.data.count);
      }
    } catch {
      // silently fail
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationService.getNotifications({ page: 1, limit: 10 });
      setNotifications(res.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll unread count
  useEffect(() => {
    const controller = new AbortController();
    fetchUnreadCount(controller.signal);

    const interval = setInterval(() => {
      fetchUnreadCount(controller.signal);
    }, POLL_INTERVAL);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [fetchUnreadCount]);

  // Fetch notifications when popover opens
  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await notificationService.markAsRead(notification.id);
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
    }
    setOpen(false);
    router.push(getNotificationRoute(notification));
  };

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead();
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="text-sm font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  className={`w-full px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                    !notification.isRead ? 'bg-blue-50/50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-2">
                    {!notification.isRead && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                    )}
                    <div className={!notification.isRead ? '' : 'pl-4'}>
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
```

- [ ] **Step 2: Add NotificationBell to header**

In `src/components/layout/header.tsx`, import:

```typescript
import { NotificationBell } from '@/components/layout/NotificationBell';
```

Add `<NotificationBell />` in the header, before the user avatar dropdown. Find the section with the user avatar (around line 100) and add the bell before it:

```tsx
<NotificationBell />
```

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/NotificationBell.tsx src/components/layout/header.tsx
git commit -m "feat: add NotificationBell component to header"
```

---

## Task 11: Frontend — SLA in Recruitment Pages

**Files:**
- Modify: `recruitment-hris/src/app/(protected)/recruitment/page.tsx`
- Modify: `recruitment-hris/src/app/(protected)/recruitment/request/[id]/page.tsx`
- Modify: `recruitment-hris/src/app/(protected)/recruitment/[id]/page.tsx`

- [ ] **Step 1: Add SLA column to recruitment list**

In `src/app/(protected)/recruitment/page.tsx`, import:

```typescript
import { SlaBadge } from '@/components/shared/SlaBadge';
```

Add a new column in the columns array (around line 52-112), after the `status` column. This project uses a custom `key/label/render` column pattern (NOT TanStack Table's `accessorKey/header/cell`):

```typescript
{
  key: 'sla',
  label: 'SLA',
  render: (row: EmployeeRequestWithRelations) => <SlaBadge sla={row.sla} />,
},
```

- [ ] **Step 2: Add SlaBanner to Employee Request detail page**

In `src/app/(protected)/recruitment/request/[id]/page.tsx`, import:

```typescript
import { SlaBanner } from '@/components/shared/SlaBanner';
```

Add the banner after the rejected banner section (around line 480), before the workflow stepper. Wrap in a conditional:

```tsx
{request.sla && (
  <SlaBanner sla={request.sla} />
)}
```

- [ ] **Step 3: Add SlaBanner to Candidate detail page**

In `src/app/(protected)/recruitment/[id]/page.tsx`, import:

```typescript
import { SlaBanner } from '@/components/shared/SlaBanner';
```

Add after the profile header card (around line 403), before the workflow stepper. Use the SLA from the employee request:

```tsx
{candidate.employeeRequest?.sla && (
  <SlaBanner sla={candidate.employeeRequest.sla} showOnTrack={false} />
)}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(protected\)/recruitment/page.tsx src/app/\(protected\)/recruitment/request/\[id\]/page.tsx src/app/\(protected\)/recruitment/\[id\]/page.tsx
git commit -m "feat: add SLA banner and badge to recruitment pages"
```

---

## Task 12: Frontend — Dashboard SLA Toast

**Files:**
- Modify: `recruitment-hris/src/app/(protected)/dashboard/page.tsx`

- [ ] **Step 1: Add SLA toast to dashboard**

In `src/app/(protected)/dashboard/page.tsx`, add `'use client'` if not already present. Import:

```typescript
import { useEffect } from 'react';
import notificationService from '@/services/notification.service';
import { useToast } from '@/hooks/use-toast';
```

Add inside the component, before the return:

```typescript
const { toast } = useToast();

useEffect(() => {
  let isCancelled = false;

  async function checkSlaNotifications() {
    try {
      const res = await notificationService.getNotifications({
        page: 1,
        limit: 5,
        type: 'sla_approaching,sla_overdue',
      });

      if (isCancelled) return;

      const unread = res.data.filter((n) => !n.isRead);
      if (unread.length > 0) {
        toast({
          title: 'Recruitment SLA Warning',
          description: `You have ${unread.length} recruitment${unread.length > 1 ? 's' : ''} approaching or past SLA deadline.`,
          variant: 'destructive',
        });
      }
    } catch {
      // silently fail
    }
  }

  checkSlaNotifications();

  return () => { isCancelled = true; };
}, [toast]);
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(protected\)/dashboard/page.tsx
git commit -m "feat: add SLA warning toast on dashboard load"
```

---

## Task 13: End-to-End Verification

- [ ] **Step 1: Start backend and verify**

```bash
cd /Users/diantnugraha/Documents/Documents/Development/recruitment-hris-api
npm run dev
```

Test endpoints:
- `POST /v1/employee-request/:id/start-recruitment` — verify `recruitmentStartedAt` is set
- `GET /v1/employee-request/:id` — verify `sla` object in response
- `GET /v1/notifications` — verify empty list (authenticated)
- `GET /v1/notifications/unread-count` — verify `{ count: 0 }`

- [ ] **Step 2: Start frontend and verify**

```bash
cd /Users/diantnugraha/Documents/Documents/Development/recruitment-hris
npm run dev
```

Verify:
- Recruitment list page shows SLA column
- Employee Request detail page shows SLA banner
- Candidate detail page shows SLA banner (approaching/overdue only)
- NotificationBell appears in header
- Dashboard shows toast if SLA notifications exist

- [ ] **Step 3: TypeScript check**

```bash
cd /Users/diantnugraha/Documents/Documents/Development/recruitment-hris
npx tsc --noEmit
```

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address any issues from end-to-end verification"
```
