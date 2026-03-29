# Recruitment Notification System — Design Spec

**Date:** 2026-03-29
**Status:** Draft
**Approach:** Dedicated notification helper (Approach B)

---

## Overview

Extend the existing notification bell to cover the recruitment flow. Currently notifications only fire for Employee Request status transitions. This spec adds 4 new notification events for the candidate recruitment pipeline, targeting HR (the specific HR who invited the candidate) and User (Employee/Assessor assigned for Interview User).

## Notification Events

| # | Event | Type (DB value) | referenceType | referenceId | Recipient |
|---|-------|-----------------|---------------|-------------|-----------|
| 1 | Candidate submits biodata | `recruitment_biodata_submitted` | `candidate` | candidateId | HR who invited the candidate |
| 2 | Assessor assigned to candidate | `recruitment_assessor_assigned` | `candidate` | candidateId | Employee (User) who was assigned |
| 3 | Interview User completed (pass/fail) | `recruitment_interview_user_completed` | `candidate` | candidateId | HR who invited the candidate |
| 4 | Candidate accepts onboarding | `recruitment_onboarding_accepted` | `candidate` | candidateId | HR who invited the candidate |

No email notifications — in-app only. Email notifications already exist separately.

## Recipient Resolution

- **HR who invited:** Resolved via new `invited_by` column on `candidate_recruitment_detail` table. This stores the `userId` of the HR who called `sendCandidateInvitation()`.
- **Assigned assessor (User):** Resolved from `candidate_assessment_assignee.employee_id` → `user.employeeId` to get `userId`.

## Backend Changes

### 1. Database — Prisma Schema

Add column to `candidate_recruitment_detail`:

```prisma
invited_by  Int?  @map("invited_by")
```

Generate migration via: `npx prisma migrate dev --name add_invited_by_to_candidate_detail`

### 2. Constants — `src/constants/recruitmentNotificationConstants.ts` (new file)

```typescript
export const RECRUITMENT_NOTIFICATION_TYPE = {
  BIODATA_SUBMITTED: 'recruitment_biodata_submitted',
  ASSESSOR_ASSIGNED: 'recruitment_assessor_assigned',
  INTERVIEW_USER_COMPLETED: 'recruitment_interview_user_completed',
  ONBOARDING_ACCEPTED: 'recruitment_onboarding_accepted',
} as const

export type RecruitmentNotificationType =
  typeof RECRUITMENT_NOTIFICATION_TYPE[keyof typeof RECRUITMENT_NOTIFICATION_TYPE]

export const RECRUITMENT_NOTIFICATION_CONFIG: Record<RecruitmentNotificationType, { label: string }> = {
  [RECRUITMENT_NOTIFICATION_TYPE.BIODATA_SUBMITTED]: { label: 'Biodata Submitted' },
  [RECRUITMENT_NOTIFICATION_TYPE.ASSESSOR_ASSIGNED]: { label: 'Assessor Assigned' },
  [RECRUITMENT_NOTIFICATION_TYPE.INTERVIEW_USER_COMPLETED]: { label: 'Interview User Completed' },
  [RECRUITMENT_NOTIFICATION_TYPE.ONBOARDING_ACCEPTED]: { label: 'Onboarding Accepted' },
}
```

### 3. Helper — `src/services/recruitmentNotificationHelper.ts` (new file)

Single function:

```typescript
async function sendRecruitmentNotification(params: {
  type: RecruitmentNotificationType
  candidateId: number
  candidateName: string
  targetUserIds: number[]
  extra?: string // e.g. pass/fail result
}): Promise<void>
```

- Builds `title` and `message` from `RECRUITMENT_NOTIFICATION_CONFIG` + `candidateName`
- Calls `notificationRepository.upsertByReference()` for each `targetUserId`
- `referenceType: 'candidate'`, `referenceId: candidateId`
- Wrapped in try-catch, failures logged but don't block the caller

### 4. Service Changes — 4 integration points

**A. `sendCandidateInvitation()` — Save `invited_by`**
- Add `userId` parameter (from `request.user.userId` in controller)
- After sending invitation, update `candidate_recruitment_detail.invited_by = userId`

**B. Candidate portal — Biodata submitted (verify candidate)**
- After candidate submits biodata and is verified
- Query `invited_by` from `candidate_recruitment_detail`
- Call `sendRecruitmentNotification()` with type `BIODATA_SUBMITTED`

**C. `startAssessment()` or assessor assignment flow**
- After assessors are assigned via `candidate_assessment_assignee`
- Resolve `employee_id` → `userId` via `user.employeeId`
- Call `sendRecruitmentNotification()` with type `ASSESSOR_ASSIGNED`

**D. `updateInterview2()` — Interview User completed**
- After interview2 status is set to PASSED or FAILED
- Query `invited_by` from `candidate_recruitment_detail`
- Call `sendRecruitmentNotification()` with type `INTERVIEW_USER_COMPLETED`, include pass/fail in message

**E. `acceptOnboarding()` — Candidate accepts onboarding**
- After onboarding is accepted
- Query `invited_by` from `candidate_recruitment_detail`
- Call `sendRecruitmentNotification()` with type `ONBOARDING_ACCEPTED`

### 5. Controller/Route Changes

- `candidateRoutes.ts` — Add `enrichUserContext` middleware (or pass `request.user.userId` directly)
- `candidateController.ts` — Pass `request.user.userId` to `sendCandidateInvitation()` call

## Frontend Changes

### 1. Constants — `src/lib/constants/notification.ts`

Add to `NOTIFICATION_TYPES`:

```typescript
RECRUITMENT_BIODATA_SUBMITTED: 'recruitment_biodata_submitted',
RECRUITMENT_ASSESSOR_ASSIGNED: 'recruitment_assessor_assigned',
RECRUITMENT_INTERVIEW_USER_COMPLETED: 'recruitment_interview_user_completed',
RECRUITMENT_ONBOARDING_ACCEPTED: 'recruitment_onboarding_accepted',
```

### 2. NotificationBell.tsx — Update routing

Add case in `getNotificationRoute()`:

```typescript
if (notification.referenceType === 'candidate' && notification.referenceId) {
  return `/recruitment/${notification.referenceId}`;
}
```

Routes to candidate detail page (`/recruitment/[id]`).

### 3. No other frontend changes needed

- `notification.service.ts` — already generic
- Polling mechanism — already in place (60s interval)
- Bell UI — already renders `title` + `message` from API

## Notification Message Templates

| Type | Title | Message |
|---|---|---|
| `recruitment_biodata_submitted` | Biodata Submitted | {candidateName} has submitted their biodata and is ready for review |
| `recruitment_assessor_assigned` | Assessment Assignment | You have been assigned to assess candidate {candidateName} for Interview User |
| `recruitment_interview_user_completed` | Interview User {result} | Candidate {candidateName} has {passed/failed} the Interview User assessment |
| `recruitment_onboarding_accepted` | Onboarding Accepted | Candidate {candidateName} has accepted the onboarding offer |

## Files Changed

### Backend (recruitment-hris-api)
| File | Action |
|------|--------|
| `prisma/schema.prisma` | Edit — add `invited_by` column |
| `prisma/migrations/..._add_invited_by/migration.sql` | New — auto-generated |
| `src/constants/recruitmentNotificationConstants.ts` | New |
| `src/services/recruitmentNotificationHelper.ts` | New |
| `src/services/candidateService.ts` | Edit — call helper at 4 points, add userId param to sendInvitation |
| `src/controllers/candidateController.ts` | Edit — pass userId to service |
| `src/routes/candidateRoutes.ts` | Edit — add enrichUserContext middleware |
| `src/repositories/candidateDetailRepository.ts` | Edit — update setPassword/invitation to save invited_by |

### Frontend (recruitment-hris)
| File | Action |
|------|--------|
| `src/lib/constants/notification.ts` | Edit — add 4 types |
| `src/components/layout/NotificationBell.tsx` | Edit — add candidate routing |
