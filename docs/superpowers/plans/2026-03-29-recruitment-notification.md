# Recruitment Notification System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add in-app notifications for 4 recruitment events (biodata submitted, assessor assigned, interview user completed, onboarding accepted) targeting HR and User roles.

**Architecture:** Dedicated `recruitmentNotificationHelper.ts` sends notifications via existing `notificationRepository.upsertByReference()`. A new `invited_by` column on `candidate_recruitment_detail` tracks which HR invited each candidate. Four integration points in existing services call the helper after their respective events.

**Tech Stack:** Fastify 5, Prisma 5 (MySQL), TypeScript 5 (ESM), Next.js (frontend)

**Spec:** `docs/superpowers/specs/2026-03-29-recruitment-notification-design.md`

---

## File Structure

### Backend (recruitment-hris-api)

| File | Action | Responsibility |
|------|--------|----------------|
| `prisma/schema.prisma` | Edit | Add `invited_by` column to `candidate_recruitment_detail` |
| `prisma/migrations/.../migration.sql` | New (auto-generated) | DB migration |
| `src/constants/recruitmentNotificationConstants.ts` | New | Notification type constants and config |
| `src/services/recruitmentNotificationHelper.ts` | New | `sendRecruitmentNotification()` helper |
| `src/repositories/candidateDetailRepository.ts` | Edit | Add `updateInvitedBy()` function |
| `src/services/candidateService.ts` | Edit | Add userId param to `sendCandidateInvitation()`, call helper in `updateInterview1()`, `updateInterview2()`, `acceptOnboarding()` |
| `src/services/candidateProfileService.ts` | Edit | Call helper in `submitBiodata()` |
| `src/controllers/candidateController.ts` | Edit | Pass `request.user.userId` to service |

### Frontend (recruitment-hris)

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/constants/notification.ts` | Edit | Add 4 recruitment notification types |
| `src/components/layout/NotificationBell.tsx` | Edit | Add `candidate` referenceType routing |

---

## Task 1: Database — Add `invited_by` column

**Files:**
- Modify: `recruitment-hris-api/prisma/schema.prisma:408-420`
- New: `recruitment-hris-api/prisma/migrations/.../migration.sql` (auto-generated)

- [ ] **Step 1: Add `invited_by` field to Prisma schema**

In `prisma/schema.prisma`, inside `model candidate_recruitment_detail` (line 408), add before the `@@map` line:

```prisma
  invited_by          Int?                  @map("invited_by")
```

- [ ] **Step 2: Generate Prisma migration**

Run from `recruitment-hris-api/`:
```bash
npx prisma migrate dev --name add_invited_by_to_candidate_detail
```
Expected: Migration file created in `prisma/migrations/`, schema updated.

- [ ] **Step 3: Verify migration**

Run:
```bash
npx prisma generate
```
Expected: Prisma Client regenerated successfully.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add invited_by column to candidate_recruitment_detail"
```

---

## Task 2: Backend Constants — Recruitment notification types

**Files:**
- New: `recruitment-hris-api/src/constants/recruitmentNotificationConstants.ts`

- [ ] **Step 1: Create constants file**

Create `src/constants/recruitmentNotificationConstants.ts`:

```typescript
export const RECRUITMENT_NOTIFICATION_TYPE = {
  BIODATA_SUBMITTED: 'recruitment_biodata_submitted',
  ASSESSOR_ASSIGNED: 'recruitment_assessor_assigned',
  INTERVIEW_USER_COMPLETED: 'recruitment_interview_user_completed',
  ONBOARDING_ACCEPTED: 'recruitment_onboarding_accepted',
} as const

export type RecruitmentNotificationType =
  typeof RECRUITMENT_NOTIFICATION_TYPE[keyof typeof RECRUITMENT_NOTIFICATION_TYPE]

export const RECRUITMENT_NOTIFICATION_CONFIG: Record<
  RecruitmentNotificationType,
  { label: string; color: string }
> = {
  [RECRUITMENT_NOTIFICATION_TYPE.BIODATA_SUBMITTED]: {
    label: 'Biodata Submitted',
    color: '#0032A0',
  },
  [RECRUITMENT_NOTIFICATION_TYPE.ASSESSOR_ASSIGNED]: {
    label: 'Assessor Assigned',
    color: '#0032A0',
  },
  [RECRUITMENT_NOTIFICATION_TYPE.INTERVIEW_USER_COMPLETED]: {
    label: 'Interview User Completed',
    color: '#0032A0',
  },
  [RECRUITMENT_NOTIFICATION_TYPE.ONBOARDING_ACCEPTED]: {
    label: 'Onboarding Accepted',
    color: '#16a34a',
  },
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run from `recruitment-hris-api/`:
```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/constants/recruitmentNotificationConstants.ts
git commit -m "feat: add recruitment notification type constants"
```

---

## Task 3: Backend Helper — `sendRecruitmentNotification()`

**Files:**
- New: `recruitment-hris-api/src/services/recruitmentNotificationHelper.ts`
- Reference: `recruitment-hris-api/src/repositories/notificationRepository.ts:85-115` (`upsertByReference`)

- [ ] **Step 1: Create the helper file**

Create `src/services/recruitmentNotificationHelper.ts`:

```typescript
import * as notificationRepository from '../repositories/notificationRepository.js'
import {
  RECRUITMENT_NOTIFICATION_TYPE,
  RECRUITMENT_NOTIFICATION_CONFIG,
  type RecruitmentNotificationType,
} from '../constants/recruitmentNotificationConstants.js'

type NotificationParams = {
  type: RecruitmentNotificationType
  candidateId: number
  candidateName: string
  targetUserIds: number[]
  extra?: string
}

function buildNotificationContent(params: NotificationParams): { title: string; message: string } {
  const { type, candidateName, extra } = params

  switch (type) {
    case RECRUITMENT_NOTIFICATION_TYPE.BIODATA_SUBMITTED:
      return {
        title: 'Biodata Submitted',
        message: `${candidateName} has submitted their biodata and is ready for review`,
      }
    case RECRUITMENT_NOTIFICATION_TYPE.ASSESSOR_ASSIGNED:
      return {
        title: 'Assessment Assignment',
        message: `You have been assigned to assess candidate ${candidateName} for Interview User`,
      }
    case RECRUITMENT_NOTIFICATION_TYPE.INTERVIEW_USER_COMPLETED:
      return {
        title: `Interview User ${extra || 'Completed'}`,
        message: `Candidate ${candidateName} has ${extra?.toLowerCase() || 'completed'} the Interview User assessment`,
      }
    case RECRUITMENT_NOTIFICATION_TYPE.ONBOARDING_ACCEPTED:
      return {
        title: 'Onboarding Accepted',
        message: `Candidate ${candidateName} has accepted the onboarding offer`,
      }
  }
}

export async function sendRecruitmentNotification(params: NotificationParams): Promise<void> {
  const { type, candidateId, targetUserIds } = params

  if (targetUserIds.length === 0) return

  const { title, message } = buildNotificationContent(params)

  for (const userId of targetUserIds) {
    const result = await notificationRepository.upsertByReference({
      userId,
      type,
      title,
      message,
      referenceType: 'candidate',
      referenceId: BigInt(candidateId),
    })
    if (result.isFailure()) {
      console.error(`[NOTIFICATION] Failed to create recruitment notification for user ${userId}:`, result.getError())
    }
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run from `recruitment-hris-api/`:
```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/services/recruitmentNotificationHelper.ts
git commit -m "feat: add recruitment notification helper"
```

---

## Task 4: Backend Repository — Add `updateInvitedBy()`

**Files:**
- Modify: `recruitment-hris-api/src/repositories/candidateDetailRepository.ts` (after line 199)

- [ ] **Step 1: Add `updateInvitedBy` function**

Add after `setPassword()` function (after line 199) in `src/repositories/candidateDetailRepository.ts`:

```typescript
export async function updateInvitedBy(candidateId: number, userId: number): Promise<RepositoryResult<boolean>> {
  try {
    await prisma.candidate_recruitment_detail.updateMany({
      where: { candidate_id: candidateId },
      data: { invited_by: userId, updatedAt: new Date() },
    })
    return success(true)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update invited_by'
    return failure(message)
  }
}
```

Note: Using `updateMany` because `candidate_id` is not the primary key.

- [ ] **Step 2: Add `getInvitedBy` function**

Add right after `updateInvitedBy`:

```typescript
export async function getInvitedBy(candidateId: number): Promise<number | null> {
  try {
    const detail = await prisma.candidate_recruitment_detail.findFirst({
      where: { candidate_id: candidateId },
      select: { invited_by: true },
    })
    return detail?.invited_by ?? null
  } catch {
    return null
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run from `recruitment-hris-api/`:
```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/repositories/candidateDetailRepository.ts
git commit -m "feat: add updateInvitedBy and getInvitedBy to candidate detail repo"
```

---

## Task 5: Backend Integration — `sendCandidateInvitation()` saves `invited_by`

**Files:**
- Modify: `recruitment-hris-api/src/services/candidateService.ts:438-487`
- Modify: `recruitment-hris-api/src/controllers/candidateController.ts:297-307`

- [ ] **Step 1: Add `userId` parameter to `sendCandidateInvitation()`**

In `src/services/candidateService.ts`, modify the function signature at line 438:

```typescript
export async function sendCandidateInvitation(
  candidateId: number,
  portalBaseUrl: string,
  userId: number
): Promise<{ success: boolean; message: string }> {
```

- [ ] **Step 2: Save `invited_by` after invitation is sent**

In the same function, add before the `return` statement (before line 483):

```typescript
  // Save which HR user sent the invitation
  const invitedByResult = await candidateDetailRepository.updateInvitedBy(candidateId, userId)
  if (invitedByResult.isFailure()) {
    console.error(`[NOTIFICATION] Failed to save invited_by for candidate ${candidateId}:`, invitedByResult.error)
  }
```

- [ ] **Step 3: Update controller to pass `userId`**

In `src/controllers/candidateController.ts`, modify the `sendInvitation` function at line 297:

```typescript
export async function sendInvitation(
  request: FastifyRequest<{ Params: IdParam; Body: SendInvitationBody }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params
  const { portal_base_url } = request.body

  const result = await candidateService.sendCandidateInvitation(id, portal_base_url, request.user.userId)

  sendSuccess(reply, result, 'Invitation email sent successfully')
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run from `recruitment-hris-api/`:
```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/services/candidateService.ts src/controllers/candidateController.ts
git commit -m "feat: save invited_by when HR sends candidate invitation"
```

---

## Task 6: Backend Integration — Biodata submitted notification

**Files:**
- Modify: `recruitment-hris-api/src/services/candidateProfileService.ts:250-267`

- [ ] **Step 1: Add imports**

At the top of `src/services/candidateProfileService.ts`, add after existing imports (after line 13):

```typescript
import * as candidateRepository from '../repositories/candidateRepository.js'
import { sendRecruitmentNotification } from './recruitmentNotificationHelper.js'
import { RECRUITMENT_NOTIFICATION_TYPE } from '../constants/recruitmentNotificationConstants.js'
```

- [ ] **Step 2: Add notification call in `submitBiodata()`**

In `submitBiodata()` (line 250), add after the verification succeeds (after line 266, before the closing `}`):

```typescript
  // Send notification to HR who invited the candidate
  try {
    const invitedBy = await candidateDetailRepository.getInvitedBy(candidateId)
    if (invitedBy) {
      const candidateResult = await candidateRepository.findById(candidateId)
      const candidateName = candidateResult.isSuccess()
        ? candidateResult.getValue()?.fullname || 'Unknown'
        : 'Unknown'

      await sendRecruitmentNotification({
        type: RECRUITMENT_NOTIFICATION_TYPE.BIODATA_SUBMITTED,
        candidateId,
        candidateName,
        targetUserIds: [invitedBy],
      })
    }
  } catch (err) {
    console.error('[NOTIFICATION] Failed to send biodata submitted notification:', err)
  }
```

- [ ] **Step 3: Verify TypeScript compiles**

Run from `recruitment-hris-api/`:
```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/services/candidateProfileService.ts
git commit -m "feat: send notification when candidate submits biodata"
```

---

## Task 7: Backend Integration — Assessor assigned notification

**Files:**
- Modify: `recruitment-hris-api/src/services/candidateService.ts:667-683`

- [ ] **Step 1: Add imports**

At the top of `src/services/candidateService.ts`, add after existing imports (after line 11):

```typescript
import { prisma } from '../config/database.js'
import { sendRecruitmentNotification } from './recruitmentNotificationHelper.js'
import { RECRUITMENT_NOTIFICATION_TYPE } from '../constants/recruitmentNotificationConstants.js'
```

Note: `prisma` is NOT currently imported in this file — all three imports must be added.

- [ ] **Step 2: Add notification after assessor assignment**

In `updateInterview1()`, after the `sendAssessorNotifications()` call (after line 682, inside the `if (scoringPayload.assessorIds...)` block), add:

```typescript
      // Send in-app notification to assigned assessors
      try {
        const candidate = await candidateRepository.findById(candidateId)
        const candidateName = candidate.isSuccess()
          ? candidate.getValue()?.fullname || 'Unknown'
          : 'Unknown'

        const userIds: number[] = []
        for (const employeeId of scoringPayload.assessorIds) {
          const user = await prisma.user.findFirst({
            where: { employeeId, trash: null },
            select: { id: true },
          })
          if (user) userIds.push(user.id)
        }

        if (userIds.length > 0) {
          await sendRecruitmentNotification({
            type: RECRUITMENT_NOTIFICATION_TYPE.ASSESSOR_ASSIGNED,
            candidateId,
            candidateName,
            targetUserIds: userIds,
          })
        }
      } catch (err) {
        console.error('[NOTIFICATION] Failed to send assessor assigned notification:', err)
      }
```

- [ ] **Step 3: Verify TypeScript compiles**

Run from `recruitment-hris-api/`:
```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/services/candidateService.ts
git commit -m "feat: send notification when assessor is assigned to candidate"
```

---

## Task 8: Backend Integration — Interview User completed notification

**Files:**
- Modify: `recruitment-hris-api/src/services/candidateService.ts:699-763`

- [ ] **Step 1: Add notification after interview2 update**

In `updateInterview2()`, add after the rejection email check (after line 755, before the `getProgress` call):

```typescript
  // Send in-app notification to HR who invited the candidate
  try {
    const invitedBy = await candidateDetailRepository.getInvitedBy(candidateId)
    if (invitedBy) {
      const candidate = await candidateRepository.findById(candidateId)
      const candidateName = candidate.isSuccess()
        ? candidate.getValue()?.fullname || 'Unknown'
        : 'Unknown'

      await sendRecruitmentNotification({
        type: RECRUITMENT_NOTIFICATION_TYPE.INTERVIEW_USER_COMPLETED,
        candidateId,
        candidateName,
        targetUserIds: [invitedBy],
        extra: status === 'PASSED' ? 'Passed' : 'Failed',
      })
    }
  } catch (err) {
    console.error('[NOTIFICATION] Failed to send interview user completed notification:', err)
  }
```

- [ ] **Step 2: Verify TypeScript compiles**

Run from `recruitment-hris-api/`:
```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/services/candidateService.ts
git commit -m "feat: send notification when interview user is completed"
```

---

## Task 9: Backend Integration — Onboarding accepted notification

**Files:**
- Modify: `recruitment-hris-api/src/services/candidateService.ts:1336-1376`

- [ ] **Step 1: Add notification after onboarding acceptance**

In `acceptOnboarding()`, add after the employee request status update (after line 1367, before the final `findOnboardingByCandidateId` call):

```typescript
  // Send in-app notification to HR who invited the candidate
  try {
    const invitedBy = await candidateDetailRepository.getInvitedBy(candidateId)
    if (invitedBy) {
      const candidate = await candidateRepository.findById(candidateId)
      const candidateName = candidate.isSuccess()
        ? candidate.getValue()?.fullname || 'Unknown'
        : 'Unknown'

      await sendRecruitmentNotification({
        type: RECRUITMENT_NOTIFICATION_TYPE.ONBOARDING_ACCEPTED,
        candidateId,
        candidateName,
        targetUserIds: [invitedBy],
      })
    }
  } catch (err) {
    console.error('[NOTIFICATION] Failed to send onboarding accepted notification:', err)
  }
```

- [ ] **Step 2: Verify TypeScript compiles**

Run from `recruitment-hris-api/`:
```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/services/candidateService.ts
git commit -m "feat: send notification when candidate accepts onboarding"
```

---

## Task 10: Frontend — Add notification types and routing

**Files:**
- Modify: `recruitment-hris/src/lib/constants/notification.ts` (all 15 lines)
- Modify: `recruitment-hris/src/components/layout/NotificationBell.tsx:20-25`

- [ ] **Step 1: Add recruitment notification types**

In `src/lib/constants/notification.ts`, add after line 11 (before the closing `} as const`):

```typescript
  // Recruitment workflow
  RECRUITMENT_BIODATA_SUBMITTED: 'recruitment_biodata_submitted',
  RECRUITMENT_ASSESSOR_ASSIGNED: 'recruitment_assessor_assigned',
  RECRUITMENT_INTERVIEW_USER_COMPLETED: 'recruitment_interview_user_completed',
  RECRUITMENT_ONBOARDING_ACCEPTED: 'recruitment_onboarding_accepted',
```

- [ ] **Step 2: Update NotificationBell routing**

In `src/components/layout/NotificationBell.tsx`, replace the `getNotificationRoute()` function (lines 20-25) with:

```typescript
function getNotificationRoute(notification: Notification): string {
  if (notification.referenceType === 'employee_request' && notification.referenceId) {
    return `/employee-request/${notification.referenceId}`;
  }
  if (notification.referenceType === 'candidate' && notification.referenceId) {
    return `/recruitment/${notification.referenceId}`;
  }
  return '/recruitment';
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run from `recruitment-hris/`:
```bash
npx next build --no-lint 2>&1 | head -20
```
Or:
```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/constants/notification.ts src/components/layout/NotificationBell.tsx
git commit -m "feat: add recruitment notification types and candidate routing to bell"
```

---

## Task 11: End-to-End Verification

- [ ] **Step 1: Start backend**

Run from `recruitment-hris-api/`:
```bash
npm run dev
```
Expected: Server starts without errors.

- [ ] **Step 2: Start frontend**

Run from `recruitment-hris/`:
```bash
npm run dev
```
Expected: Dev server starts without errors.

- [ ] **Step 3: Manual test — Send invitation**

1. Log in as HR
2. Go to Recruitment → select a candidate → Send Invitation
3. Check DB: `candidate_recruitment_detail.invited_by` should be set to the HR user's ID

- [ ] **Step 4: Manual test — Biodata submitted**

1. Log in as candidate via portal
2. Fill and submit biodata
3. Check DB: `notification` table should have a row with `type = 'recruitment_biodata_submitted'` for the HR user

- [ ] **Step 5: Manual test — Assessor assigned**

1. Log in as HR
2. Go to candidate → Interview HR tab → assign assessors + submit
3. Check DB: `notification` table should have rows with `type = 'recruitment_assessor_assigned'` for each assigned assessor

- [ ] **Step 6: Manual test — Interview User completed**

1. Log in as assigned assessor (User)
2. Go to candidate → Interview User tab → submit pass/fail
3. Check DB: `notification` table should have a row with `type = 'recruitment_interview_user_completed'` for the HR user

- [ ] **Step 7: Manual test — Onboarding accepted**

1. Log in as candidate via portal
2. Accept onboarding
3. Check DB: `notification` table should have a row with `type = 'recruitment_onboarding_accepted'` for the HR user

- [ ] **Step 8: Manual test — Bell UI**

1. Log in as HR (or User with notifications)
2. Check notification bell shows unread count
3. Click notification → should navigate to `/recruitment/[candidateId]`
