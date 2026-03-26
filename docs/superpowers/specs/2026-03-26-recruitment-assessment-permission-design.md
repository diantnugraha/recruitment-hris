# Recruitment Assessment Form — Role-Based Permission Design

**Date:** 2026-03-26
**Status:** Draft
**Scope:** Frontend permission system for assessment forms in candidate detail page

---

## Overview

Implement role-based permission control on the recruitment candidate assessment form. The candidate detail page (`/recruitment/[id]`) contains tabs for Interview HR, Interview User, MCU, and Onboarding. Each tab has different edit/view permissions based on the logged-in user's role and assignment status.

## Permission Matrix

| Section | HR / HR_MANAGER / SUPER_ADMIN | Assigned Assessor (MANAGER/HOD/MANAGEMENT) | Non-assigned (MANAGER/HOD/MANAGEMENT) |
|---|---|---|---|
| Interview HR | Edit & Submit | View only | View only |
| Interview User | Edit & Submit | Edit & Submit | View only |
| MCU | Edit & Submit | View only | View only |
| Onboarding | Edit & Submit | View only | View only |

**Route access:** Only roles listed in `ROUTE_ACCESS['/recruitment']` can access the candidate detail page (currently: SUPER_ADMIN, HUMAN_RESOURCES, MANAGER, HOD, MANAGEMENT). All other roles (EMPLOYEE, AUDITOR, FINANCE, CANDIDATES) are blocked at the route level by `RouteGuard`. `HR_MANAGER` should be added to the `/recruitment` and `/onboarding` route access lists.

**Assignable roles:** MANAGER, HOD, MANAGEMENT — can be assigned as Interview User assessors.

**Multiple assessors:** Multiple assessors can be assigned per candidate; all share the same form. Coordination of who fills the form is handled outside the system.

## Sequential Flow

Stages are strictly sequential and locked until the previous stage passes:

```
Interview HR (PASSED) -> Interview User (PASSED) -> MCU (PASSED) -> Onboarding
```

**Note:** Onboarding is not tracked as a separate `currentStage` in `AssessmentProgress`. It is unlocked when `mcu.passed === true`.

## Approach: Permission Hook + Props Drilling

### `useAssessmentPermission` Hook

**File:** `src/hooks/useAssessmentPermission.ts`

```typescript
interface AssessmentPermission {
  canEditInterviewHR: boolean;
  canEditInterviewUser: boolean;
  canEditMCU: boolean;
  canEditOnboarding: boolean;
  isLoading: boolean;
  isError: boolean;
}

function useAssessmentPermission(candidateId: string): AssessmentPermission
```

**Logic:**

1. Get `user` from auth store.
2. If `user.roleId` is HR, HR_MANAGER, or SUPER_ADMIN — return all `true` (no API call needed).
3. Otherwise, fetch assignees using the existing `candidateService.getAssessmentAssignees(candidateId)`.
4. Compare `user.employeeId` (number) against `assignee.employeeId` in the list. If `user.employeeId` is `null`, the user cannot be an assignee — all permissions `false`.
5. If user is in assignee list — `canEditInterviewUser = true`, rest `false`.
6. If user is not in assignee list — all `false`.

**Error handling (deny-by-default):** If the assignees API call fails, all permissions default to `false` and `isError = true`. The parent page should show an error state with retry option.

**Loading state:** While `isLoading` is true, the parent page should render tab navigation with a skeleton/loading overlay. No editable forms should be rendered until permissions resolve.

## Component Refactoring

### Current state

`src/app/(protected)/recruitment/[id]/page.tsx` is ~1400+ lines containing all tab content inline.

### Target structure

```
src/components/recruitment/tabs/
  ProfileTab.tsx
  BiodataTab.tsx
  InterviewHRTab.tsx
  InterviewUserTab.tsx
  McuTab.tsx
  OnboardingTab.tsx
```

### Shared props interface

```typescript
type TabMode = 'edit' | 'view' | 'locked';

interface AssessmentTabProps {
  candidate: CandidateWithRelations;
  candidateId: string;
  mode: TabMode;
  onRefresh: () => void;
}
```

**Mode derivation in parent:**

| Condition | mode |
|---|---|
| Previous stage not PASSED | `'locked'` |
| Stage unlocked but user has no edit permission | `'view'` |
| Stage unlocked and user has edit permission | `'edit'` |

### Parent page after refactor

The parent page (`recruitment/[id]/page.tsx`) becomes ~150-200 lines:

1. Fetch candidate data.
2. Call `useAssessmentPermission(candidateId)`.
3. Derive `TabMode` for each tab based on permission + stage status.
4. Render tab navigation.
5. Pass `mode` prop to each tab component.

### Mode behavior per tab

| Mode | Form fields | Action buttons (Submit, Save Draft) | Scoring inputs | UI treatment |
|---|---|---|---|---|
| `'edit'` | Enabled | Visible | Enabled | Normal form |
| `'view'` | Disabled | Hidden | Display as text/badge | Show submitted data |
| `'locked'` | N/A | N/A | N/A | Lock icon + message ("Complete previous stage first") |

## Tab Details

### Interview HR Tab

**File:** `src/components/recruitment/tabs/InterviewHRTab.tsx`

**Form fields:**

- 8 scoring criteria (Radio/Select 1-5): `relevanceOfExperience`, `trainingUndertaken`, `technicalSkills`, `nonTechnicalSkills`, `communicationSkills`, `emotionalMaturity`, `understandingOfPosition`, `teamworkAbility`
- Key Competencies (Textarea)
- Interviewer Notes (Textarea)
- Conclusion (Select): `proceed`, `recommended`, `rejected`

**Conclusion casing:** Form state uses lowercase values from `HRConclusion` type (`"proceed"`, `"recommended"`, `"rejected"`). On submit, transform to uppercase for the API payload (`InterviewUpdatePayload.conclusion` expects `"PROCEED"`, `"RECOMMENDED"`, `"REJECTED"`).

**Scoring aggregation:** The 8 criteria scores are informational. The `total_score` field is a sum. The conclusion (PASSED/FAILED) is determined by the HR's explicit selection, not derived from scores.

**Flow:** Fill form -> Save Draft (localStorage key: `hr-assessment-form-{candidateId}`) -> Preview -> Submit (`PUT /v1/candidate/:id/assessment/interview1`)

**ReadOnly mode (view):** Fetch scoring data from `GET /v1/candidate/:id/assessment/scoring?stage=interview1`. Display all values as text/badges. No Save Draft / Submit buttons.

**After submit:** Clear localStorage draft. If conclusion triggers PASSED -> unlock Interview User tab. Call `onRefresh()`.

### Interview User Tab

**File:** `src/components/recruitment/tabs/InterviewUserTab.tsx`

**Locked** until Interview HR status is PASSED.

**Assignee management (HR/HR_MANAGER/SUPER_ADMIN only):**

- Assign assessors: select from employees with role MANAGER/HOD/MANAGEMENT.
- Remove assessors from list.
- Other roles: view assignee list only.

**Form fields:** Same 8 scoring criteria, Key Competencies, Interviewer Notes, Conclusion as Interview HR. Same casing transform on submit.

**Permission detail:**

| User | Assignee section | Assessment form |
|---|---|---|
| HR / HR_MANAGER / SUPER_ADMIN | Edit (assign/remove) | Edit & Submit |
| Assigned MANAGER/HOD/MANAGEMENT | View only | Edit & Submit |
| Non-assigned MANAGER/HOD/MANAGEMENT | View only | View only |

**Flow:** HR assigns assessor(s) -> Assigned user fills form -> Save Draft (localStorage key: `user-assessment-form-{candidateId}`) -> Preview -> Submit (`PUT /v1/candidate/:id/assessment/interview2`)

**Post-submission state for multiple assessors:** After the form is submitted by any assessor, the tab becomes `'view'` mode for all users (including other assigned assessors). The view should display "Submitted by [assessor name] at [datetime]" notice at the top of the tab, so other assessors know it has been completed.

**After submit:** Clear localStorage draft. If PASSED -> unlock MCU tab. Call `onRefresh()`.

### MCU Tab

**File:** `src/components/recruitment/tabs/McuTab.tsx`

**Locked** until Interview User status is PASSED.

**Sub-sections:**

| Sub-section | Fields | API |
|---|---|---|
| Schedule MCU | Date, Time, Location | `POST /v1/candidate/:id/assessment/mcu/schedule` |
| Document Upload | File upload (PDF/image) | `POST /v1/candidate/:id/assessment/mcu/document` |
| MCU Result | Result (PASSED/FAILED), Description | `PUT /v1/candidate/:id/assessment/mcu` |

**Supporting APIs:**

- View document: `GET /v1/candidate/:id/assessment/mcu/document`
- Delete document: `DELETE /v1/candidate/:id/assessment/mcu/document`

**Permission:** Only HR / HR_MANAGER / SUPER_ADMIN can edit. All others view only.

**No localStorage draft** — each action submits directly.

**After result submitted:** If PASSED -> unlock Onboarding tab. Call `onRefresh()`.

### Onboarding Tab

**File:** `src/components/recruitment/tabs/OnboardingTab.tsx`

**Locked** until MCU status is PASSED.

**Approach:** Extract content from `/onboarding/[candidateId]/page.tsx` into a shared component `src/components/onboarding/OnboardingContent.tsx`. Consumed by both:

- `/onboarding/[candidateId]/page.tsx` — `<OnboardingContent candidateId={id} mode="edit" />`
- Onboarding tab in candidate detail — `<OnboardingContent candidateId={id} mode={mode} />`

**Sub-sections:**

- Facilities (CRUD items: laptop, starter kit, etc.)
- Programs (CRUD orientation schedule)
- Job Placement (department, position, start date, contract type)
- Convert to Employee (final action)

**Permission:** Only HR / HR_MANAGER / SUPER_ADMIN can edit. All others view only.

**No localStorage draft** — data directly from API.

**After convert to employee:** Candidate status becomes `hired`. Call `onRefresh()`.

## localStorage Draft Handling

**Stale draft cleanup rules:**

1. On tab mount, check if the stage has already been submitted (assessment status is not PENDING). If submitted, ignore and clear any existing localStorage draft.
2. When candidate is rejected at any stage, clear all draft keys for that candidate (`hr-assessment-form-{candidateId}`, `user-assessment-form-{candidateId}`).
3. Draft is keyed per candidate ID — different candidates have independent drafts.
4. On successful submit, immediately clear the corresponding draft key.

## Backend Requirements

### Already exists (frontend service)

- `candidateService.getAssessmentAssignees(candidateId)` — fetch assigned assessor list.

### Not yet implemented (backend API)

The following backend endpoints need to be created:

1. `GET /v1/candidate/:id/assessment/assignees` — return list of assigned assessor objects for Interview User stage.
2. `POST /v1/candidate/:id/assessment/assignees` — assign assessor(s) to candidate.
3. `DELETE /v1/candidate/:id/assessment/assignees/:userId` — remove assessor from candidate.

### Route access update

Add `HR_MANAGER` to `ROUTE_ACCESS['/recruitment']` and `ROUTE_ACCESS['/onboarding']` in `src/lib/constants/routeAccess.ts`.

## Files to Create/Modify

### New files

| File | Purpose |
|---|---|
| `src/hooks/useAssessmentPermission.ts` | Permission hook |
| `src/components/recruitment/tabs/ProfileTab.tsx` | Profile tab extracted |
| `src/components/recruitment/tabs/BiodataTab.tsx` | Biodata tab extracted |
| `src/components/recruitment/tabs/InterviewHRTab.tsx` | Interview HR tab |
| `src/components/recruitment/tabs/InterviewUserTab.tsx` | Interview User tab |
| `src/components/recruitment/tabs/McuTab.tsx` | MCU tab |
| `src/components/recruitment/tabs/OnboardingTab.tsx` | Onboarding tab wrapper |
| `src/components/onboarding/OnboardingContent.tsx` | Shared onboarding content |

### Modified files

| File | Change |
|---|---|
| `src/app/(protected)/recruitment/[id]/page.tsx` | Refactor to use tab components + permission hook |
| `src/app/(protected)/onboarding/[candidateId]/page.tsx` | Extract content into OnboardingContent, consume shared component |
| `src/services/candidate.service.ts` | Add assignee assign/remove methods (get already exists) |
| `src/lib/constants/routeAccess.ts` | Add HR_MANAGER to recruitment and onboarding route access |
