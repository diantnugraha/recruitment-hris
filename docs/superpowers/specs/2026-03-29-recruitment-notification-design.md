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

- **HR who invited:** Resolved via new `invited_by` column on `candidate_recruitment_detail` table. This stores the `userId` of the HR who called `sendCandidateInvitation()`. If `invited_by` is null (candidate was created before this feature), the notification is silently skipped.
- **Assigned assessor (User):** Resolved from `candidate_assessment_assignee.employee_id` → query `user` where `user.employeeId = employee_id` to get `userId`. If the assessor employee has no user account, the notification for that assessor is silently skipped.

## Edge Cases

- **`invited_by` is null:** Candidates created/invited before this feature won't have `invited_by` set. Notifications requiring `invited_by` are silently skipped (no error).
- **Inviting HR user is deleted/trashed:** `upsertByReference` will still create the notification row (no FK constraint on `userId` to `user`). The notification simply won't be fetched since the user won't log in. No special handling needed.
- **Re-invitation:** If HR resends the invitation, `invited_by` is overwritten with the new sender's `userId`. This is intentional (last-sender-wins).
- **Candidate deleted:** Orphaned notification rows with `referenceType = 'candidate'` will remain (no FK on `referenceId`). Clicking them in the bell will navigate to a 404 page. This is acceptable and consistent with existing behavior for deleted employee requests.
- **`referenceId` type:** `upsertByReference` expects `bigint`. The helper must cast `BigInt(candidateId)` since service functions use `number`.

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

export const RECRUITMENT_NOTIFICATION_CONFIG: Record<RecruitmentNotificationType, { label: string; color: string }> = {
  [RECRUITMENT_NOTIFICATION_TYPE.BIODATA_SUBMITTED]: { label: 'Biodata Submitted', color: '#0032A0' },
  [RECRUITMENT_NOTIFICATION_TYPE.ASSESSOR_ASSIGNED]: { label: 'Assessor Assigned', color: '#0032A0' },
  [RECRUITMENT_NOTIFICATION_TYPE.INTERVIEW_USER_COMPLETED]: { label: 'Interview User Completed', color: '#0032A0' },
  [RECRUITMENT_NOTIFICATION_TYPE.ONBOARDING_ACCEPTED]: { label: 'Onboarding Accepted', color: '#16a34a' },
}
```

### 3. Helper — `src/services/recruitmentNotificationHelper.ts` (new file)

Single exported function:

```typescript
export async function sendRecruitmentNotification(params: {
  type: RecruitmentNotificationType
  candidateId: number
  candidateName: string
  targetUserIds: number[]
  extra?: string // e.g. pass/fail result
}): Promise<void>
```

- Builds `title` and `message` from `RECRUITMENT_NOTIFICATION_CONFIG` + `candidateName`
- Calls `notificationRepository.upsertByReference()` for each `targetUserId` with `referenceId: BigInt(candidateId)`
- `referenceType: 'candidate'`, `referenceId: BigInt(candidateId)`
- Wrapped in try-catch, failures logged but don't block the caller
- If `targetUserIds` is empty, returns immediately (no-op)

### 4. Service Changes — 4 integration points

**A. `candidateService.sendCandidateInvitation()` — Save `invited_by`**
- Add `userId` parameter (from `request.user.userId` in controller)
- After sending invitation email, run a separate Prisma update: `candidate_recruitment_detail.invited_by = userId`
- This is a separate update call, NOT part of `setPassword()` — keep concerns separate

**B. `candidateProfileService.submitBiodata()` — Biodata submitted**
- This function lives in `candidateProfileService.ts` (NOT `candidateService.ts`) and is called from the candidate portal via `candidateProfileController.ts`
- After biodata is submitted and candidate is verified
- Query `invited_by` from `candidate_recruitment_detail` for this candidate
- If `invited_by` is not null, call `sendRecruitmentNotification()` with type `BIODATA_SUBMITTED`

**C. `candidateService.updateInterview1()` — Assessor assigned**
- Assessors are assigned inside `updateInterview1()` (NOT `startAssessment()`) via the `setAssignees()` call using `scoringPayload.assessorIds`
- After assignees are saved to `candidate_assessment_assignee`
- Resolve each `employee_id` → `userId` via `prisma.user.findFirst({ where: { employeeId } })`
- Call `sendRecruitmentNotification()` with type `ASSESSOR_ASSIGNED` for resolved userIds

**D. `candidateService.updateInterview2()` — Interview User completed**
- After interview2 status is set to PASSED or FAILED
- Query `invited_by` from `candidate_recruitment_detail`
- Call `sendRecruitmentNotification()` with type `INTERVIEW_USER_COMPLETED`, include pass/fail in message

**E. `candidateService.acceptOnboarding()` — Candidate accepts onboarding**
- This function is called from `candidateAuthController.ts` (candidate portal route), NOT from the HR-facing controller
- The candidate self-accepts via their portal JWT — no HR `userId` is needed here since we read `invited_by` from DB
- After onboarding is accepted
- Query `invited_by` from `candidate_recruitment_detail`
- Call `sendRecruitmentNotification()` with type `ONBOARDING_ACCEPTED`

### 5. Controller/Route Changes

- `candidateController.ts` — Pass `request.user.userId` to `sendCandidateInvitation()` for saving `invited_by`
- No need to add `enrichUserContext` middleware — `request.user.userId` from `authenticate` is sufficient (lighter, no extra DB query)
- No changes needed to candidate portal routes/controllers — they only trigger notifications using `invited_by` from DB

## Frontend Changes

### 1. Constants — `src/lib/constants/notification.ts`

Add to `NOTIFICATION_TYPES`:

```typescript
RECRUITMENT_BIODATA_SUBMITTED: 'recruitment_biodata_submitted',
RECRUITMENT_ASSESSOR_ASSIGNED: 'recruitment_assessor_assigned',
RECRUITMENT_INTERVIEW_USER_COMPLETED: 'recruitment_interview_user_completed',
RECRUITMENT_ONBOARDING_ACCEPTED: 'recruitment_onboarding_accepted',
```

String values must exactly match backend constants to ensure correct routing.

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
| `prisma/schema.prisma` | Edit — add `invited_by` column to `candidate_recruitment_detail` |
| `prisma/migrations/..._add_invited_by/migration.sql` | New — auto-generated via `prisma migrate dev` |
| `src/constants/recruitmentNotificationConstants.ts` | New — notification type constants and config |
| `src/services/recruitmentNotificationHelper.ts` | New — `sendRecruitmentNotification()` helper |
| `src/services/candidateService.ts` | Edit — add userId param to `sendCandidateInvitation()`, call helper in `updateInterview1()`, `updateInterview2()`, `acceptOnboarding()` |
| `src/services/candidateProfileService.ts` | Edit — call helper in `submitBiodata()` after verification |
| `src/controllers/candidateController.ts` | Edit — pass `request.user.userId` to `sendCandidateInvitation()` |
| `src/repositories/candidateDetailRepository.ts` | Edit — add function to update `invited_by` field |

### Frontend (recruitment-hris)
| File | Action |
|------|--------|
| `src/lib/constants/notification.ts` | Edit — add 4 recruitment notification types |
| `src/components/layout/NotificationBell.tsx` | Edit — add `candidate` referenceType routing |
