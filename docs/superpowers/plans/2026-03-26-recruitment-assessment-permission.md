# Recruitment Assessment Permission Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement role-based permission control on recruitment assessment form tabs, with component extraction from a 4600+ line monolith page.

**Architecture:** Custom hook `useAssessmentPermission` fetches assignee data and derives edit/view/locked permissions per tab. The monolith candidate detail page is decomposed into focused tab components that receive a `mode` prop (`'edit' | 'view' | 'locked'`). Onboarding content is extracted into a shared component consumed by both the candidate detail tab and the standalone onboarding page.

**Tech Stack:** Next.js 16 (App Router), React 18, TypeScript, shadcn/ui, Zustand (auth store), Axios (API client)

**Spec:** `docs/superpowers/specs/2026-03-26-recruitment-assessment-permission-design.md`

---

## File Structure

### New files

| File | Responsibility |
|---|---|
| `src/hooks/useAssessmentPermission.ts` | Hook: derives per-tab edit permission from user role + assignee data |
| `src/components/recruitment/tabs/ProfileTab.tsx` | Tab: candidate profile + biodata display (lines 1521-1949 of current page). Note: the spec lists a separate `BiodataTab.tsx` but in the current codebase biodata is part of the profile tab — we keep it combined as `ProfileTab` |
| `src/components/recruitment/tabs/InterviewHRTab.tsx` | Tab: Interview HR scoring form with draft/preview/submit (lines 1950-2320) |
| `src/components/recruitment/tabs/InterviewUserTab.tsx` | Tab: Interview User scoring form + assignee list (lines 2321-2748) |
| `src/components/recruitment/tabs/McuTab.tsx` | Tab: MCU schedule/upload/result (lines 2749-3092) |
| `src/components/recruitment/tabs/OnboardingTab.tsx` | Tab: thin wrapper that renders OnboardingContent |
| `src/components/onboarding/OnboardingContent.tsx` | Shared: onboarding facilities/programs/job placement/convert. Source of truth: the monolith's onboarding tab (lines 3093-end) since it is the more recent implementation. Diff against standalone onboarding page during extraction and reconcile any differences, preferring the monolith's version |

### Modified files

| File | Change |
|---|---|
| `src/lib/constants/routeAccess.ts` | Add `ROLES.HR_MANAGER` to recruitment + onboarding routes |
| `src/services/candidate.service.ts` | Add `assignAssessors()` and `removeAssessor()` methods |
| `src/app/(protected)/recruitment/[id]/page.tsx` | Slim down to ~200 lines: fetch data, derive modes, render tabs |
| `src/app/(protected)/onboarding/[candidateId]/page.tsx` | Extract content into OnboardingContent, consume shared component |

---

## Task 1: Add HR_MANAGER to route access

**Files:**
- Modify: `src/lib/constants/routeAccess.ts:25-26`

- [ ] **Step 1: Update routeAccess.ts**

Add `ROLES.HR_MANAGER` to the `/recruitment` and `/onboarding` route access arrays:

```typescript
// Line 25-26: Add ROLES.HR_MANAGER
'/recruitment':      [ROLES.SUPER_ADMIN, ROLES.HUMAN_RESOURCES, ROLES.HR_MANAGER, ROLES.MANAGER, ROLES.HOD, ROLES.MANAGEMENT],
'/onboarding':       [ROLES.SUPER_ADMIN, ROLES.HUMAN_RESOURCES, ROLES.HR_MANAGER, ROLES.MANAGER, ROLES.HOD, ROLES.MANAGEMENT],
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `cd /Users/diantnugraha/Documents/Documents/Development/recruitment-hris && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors related to routeAccess.ts

- [ ] **Step 3: Commit**

```bash
git add src/lib/constants/routeAccess.ts
git commit -m "feat: add HR_MANAGER to recruitment and onboarding route access"
```

---

## Task 2: Add assignee service methods

**Files:**
- Modify: `src/services/candidate.service.ts:784-802` (after existing `getAssessmentAssignees`)

- [ ] **Step 1: Add assignAssessors method**

Add after `getAssessmentAssignees` method (around line 802):

```typescript
async assignAssessors(
  candidateId: string | number,
  employeeIds: number[]
): Promise<ApiResponse<AssessmentAssignee[]>> {
  try {
    const response = await post<unknown, { employee_ids: number[] }>(
      `/v1/candidate/${candidateId}/assessment/assignees`,
      { employee_ids: employeeIds }
    );
    const res = response as { success?: boolean; data?: AssessmentAssignee[]; message?: string };

    if (res.success && res.data) {
      return { success: true, data: res.data };
    }

    return { success: false, message: res.message || "Unexpected response format" };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return { success: false, message: err.response?.data?.message || "Failed to assign assessors" };
  }
},
```

- [ ] **Step 2: Add removeAssessor method**

```typescript
async removeAssessor(
  candidateId: string | number,
  employeeId: number
): Promise<ApiResponse<void>> {
  try {
    await del<unknown>(
      `/v1/candidate/${candidateId}/assessment/assignees/${employeeId}`
    );
    return { success: true };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return { success: false, message: err.response?.data?.message || "Failed to remove assessor" };
  }
},
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd /Users/diantnugraha/Documents/Documents/Development/recruitment-hris && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/services/candidate.service.ts
git commit -m "feat: add assignAssessors and removeAssessor service methods"
```

---

## Task 3: Create useAssessmentPermission hook

**Files:**
- Create: `src/hooks/useAssessmentPermission.ts`

**Reference:**
- `src/stores/auth-store.ts` — `useAuthStore` for user data
- `src/lib/constants/roles.ts` — `ROLES` constants
- `src/services/candidate.service.ts` — `candidateService.getAssessmentAssignees()`
- `src/types/index.ts:2-13` — `User` type (has `employeeId?: number | null`)

- [ ] **Step 1: Create the hook file**

```typescript
import { useState, useEffect, useCallback } from 'react';

import { useAuthStore } from '@/stores/auth-store';
import { ROLES } from '@/lib/constants/roles';
import { candidateService } from '@/services/candidate.service';

export type TabMode = 'edit' | 'view' | 'locked';

export interface AssessmentPermission {
  canEditInterviewHR: boolean;
  canEditInterviewUser: boolean;
  canEditMCU: boolean;
  canEditOnboarding: boolean;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

const HR_ROLES = [ROLES.HUMAN_RESOURCES, ROLES.HR_MANAGER, ROLES.SUPER_ADMIN] as const;

export function isHROrAdmin(roleId: number): boolean {
  return HR_ROLES.includes(roleId as typeof HR_ROLES[number]);
}

export function useAssessmentPermission(candidateId: string): AssessmentPermission {
  const user = useAuthStore((state) => state.user);
  const [isAssignedAssessor, setIsAssignedAssessor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  // Extract stable primitives to avoid stale closure (per CLAUDE.md useCallback rules)
  const roleId = user?.roleId ?? null;
  const employeeId = user?.employeeId ?? null;
  const userIsHR = roleId !== null && isHROrAdmin(roleId);

  const fetchAssignees = useCallback(async () => {
    if (!roleId || userIsHR) return;

    // If user has no employeeId, they can't be an assignee
    if (!employeeId) {
      setIsAssignedAssessor(false);
      return;
    }

    setIsLoading(true);
    setIsError(false);

    const res = await candidateService.getAssessmentAssignees(candidateId);

    if (res.success && res.data) {
      const assigned = res.data.some(
        (assignee) => assignee.employeeId === employeeId
      );
      setIsAssignedAssessor(assigned);
    } else {
      // Deny-by-default on error
      setIsAssignedAssessor(false);
      setIsError(true);
    }

    setIsLoading(false);
  }, [candidateId, roleId, employeeId, userIsHR]);

  useEffect(() => {
    fetchAssignees();
  }, [fetchAssignees]);

  if (userIsHR) {
    return {
      canEditInterviewHR: true,
      canEditInterviewUser: true,
      canEditMCU: true,
      canEditOnboarding: true,
      isLoading: false,
      isError: false,
      refetch: fetchAssignees,
    };
  }

  return {
    canEditInterviewHR: false,
    canEditInterviewUser: isAssignedAssessor,
    canEditMCU: false,
    canEditOnboarding: false,
    isLoading,
    isError,
    refetch: fetchAssignees,
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/diantnugraha/Documents/Documents/Development/recruitment-hris && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useAssessmentPermission.ts
git commit -m "feat: add useAssessmentPermission hook for role-based tab permissions"
```

---

## Task 4: Extract ProfileTab component

**Files:**
- Create: `src/components/recruitment/tabs/ProfileTab.tsx`
- Source: `src/app/(protected)/recruitment/[id]/page.tsx` lines 1521-1949 (`TabsContent value="profile"`)

This tab is always view-only (no edit mode), so it only needs `candidate` and `biodata` props.

- [ ] **Step 1: Create ProfileTab.tsx**

Extract the profile tab content from the monolith page. The component should:
- Accept props: `candidate: CandidateWithRelations`, `biodata: CandidateBiodata | null`, `isBiodataLoading: boolean`
- Contain the profile header card (avatar, name, email, phone, job title)
- Contain the personal information grid (address, birth date, religion, ID no, etc.)
- Contain the biodata sections (education, work experience, family, training, self assessment)
- Move all related imports (lucide icons, UI components) into the new file
- Keep module-level constants that are only used by this tab in this file

Read the full profile tab content from the monolith page (`src/app/(protected)/recruitment/[id]/page.tsx` lines 1521-1949), then extract it into this component. Preserve the exact JSX structure and styling.

```typescript
"use client";

import * as React from "react";
// ... relevant imports from the monolith page

import type { CandidateWithRelations, CandidateBiodata } from "@/services/candidate.service";

interface ProfileTabProps {
  candidate: CandidateWithRelations;
  biodata: CandidateBiodata | null;
  isBiodataLoading: boolean;
}

export function ProfileTab({ candidate, biodata, isBiodataLoading }: ProfileTabProps) {
  // ... extracted JSX from TabsContent value="profile"
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/diantnugraha/Documents/Documents/Development/recruitment-hris && npx tsc --noEmit --pretty 2>&1 | head -30`

- [ ] **Step 3: Commit**

```bash
git add src/components/recruitment/tabs/ProfileTab.tsx
git commit -m "feat: extract ProfileTab component from candidate detail page"
```

---

## Task 5: Extract InterviewHRTab component

**Files:**
- Create: `src/components/recruitment/tabs/InterviewHRTab.tsx`
- Source: `src/app/(protected)/recruitment/[id]/page.tsx` lines 1950-2320 (`TabsContent value="assessment-hr"`)

- [ ] **Step 1: Create InterviewHRTab.tsx**

Extract the Interview HR tab. The component should:
- Accept props matching the shared interface:
  ```typescript
  interface InterviewHRTabProps {
    candidate: CandidateWithRelations;
    candidateId: string;
    mode: TabMode;  // from useAssessmentPermission
    progress: AssessmentProgress | null;
    onRefresh: () => void;
  }
  ```
- Contain all HR scoring form state (hrScoring, hrKeyCompetencies, hrUserNotes, hrConclusion)
- Contain localStorage draft save/restore logic (key: `hr-assessment-form-{candidateId}`)
- Contain preview mode toggle
- Contain submit handler (`candidateService.updateInterview1`)
- Contain scoring data fetch for view mode (`candidateService.getAssessmentScoring`)
- Handle stale draft cleanup: on mount, if stage is already submitted (not PENDING), clear localStorage draft
- Handle conclusion casing: form uses lowercase (`"proceed"`) → API uses uppercase (`"PROCEED"`)
- When `mode === 'locked'`: show lock icon + "Complete previous stage first" message
- When `mode === 'view'`: show submitted scoring data as text/badges, no action buttons
- When `mode === 'edit'`: show full form with Save Draft / Preview / Submit

Read the full assessment-hr tab content from the monolith page (lines 1950-2320), then extract it. Preserve the exact JSX structure and add mode handling.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/diantnugraha/Documents/Documents/Development/recruitment-hris && npx tsc --noEmit --pretty 2>&1 | head -30`

- [ ] **Step 3: Commit**

```bash
git add src/components/recruitment/tabs/InterviewHRTab.tsx
git commit -m "feat: extract InterviewHRTab with mode-based permission handling"
```

---

## Task 6: Extract InterviewUserTab component

**Files:**
- Create: `src/components/recruitment/tabs/InterviewUserTab.tsx`
- Source: `src/app/(protected)/recruitment/[id]/page.tsx` lines 2321-2748 (`TabsContent value="assessment-user"`)

- [ ] **Step 1: Create InterviewUserTab.tsx**

Extract the Interview User tab. The component should:
- Accept props:
  ```typescript
  interface InterviewUserTabProps {
    candidate: CandidateWithRelations;
    candidateId: string;
    mode: TabMode;
    progress: AssessmentProgress | null;
    canEditAssignees: boolean;  // true only for HR/HR_MANAGER/SUPER_ADMIN
    onRefresh: () => void;
  }
  ```
- Contain all user scoring form state (userScoring, userKeyCompetencies, userUserNotes, userConclusion)
- Contain localStorage draft save/restore logic (key: `user-assessment-form-{candidateId}`)
- Contain assignee management:
  - Fetch assignees on mount (`candidateService.getAssessmentAssignees`)
  - When `canEditAssignees === true`: show assign/remove buttons, employee search combobox
  - When `canEditAssignees === false`: show assignee list as read-only
- Contain post-submission state: if interview2 is already submitted, show "Submitted by [name] at [date]" notice, force view mode for all users
- Contain submit handler (`candidateService.updateInterview2`)
- Same mode handling as InterviewHRTab (locked/view/edit)
- Same stale draft cleanup and conclusion casing as InterviewHRTab

Read the full assessment-user tab content from the monolith page (lines 2321-2748), then extract it. Preserve the exact JSX structure and add mode + assignee permission handling.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/diantnugraha/Documents/Documents/Development/recruitment-hris && npx tsc --noEmit --pretty 2>&1 | head -30`

- [ ] **Step 3: Commit**

```bash
git add src/components/recruitment/tabs/InterviewUserTab.tsx
git commit -m "feat: extract InterviewUserTab with assignee management and permissions"
```

---

## Task 7: Extract McuTab component

**Files:**
- Create: `src/components/recruitment/tabs/McuTab.tsx`
- Source: `src/app/(protected)/recruitment/[id]/page.tsx` lines 2749-3092 (`TabsContent value="mcu"`)

- [ ] **Step 1: Create McuTab.tsx**

Extract the MCU tab. The component should:
- Accept props:
  ```typescript
  interface McuTabProps {
    candidate: CandidateWithRelations;
    candidateId: string;
    mode: TabMode;
    progress: AssessmentProgress | null;
    onRefresh: () => void;
  }
  ```
- Contain all MCU state (mcuDocument, schedule dialog, upload/delete handlers)
- Contain MCU schedule dialog (`candidateService.scheduleMcu`)
- Contain MCU document upload/view/delete (`candidateService.uploadMcuDocument`, `getMcuDocument`, `deleteMcuDocument`)
- Contain MCU result recording (`candidateService.updateMcu`)
- When `mode === 'locked'`: lock icon + message
- When `mode === 'view'`: show all MCU data as read-only (schedule, document link, result)
- When `mode === 'edit'`: show full controls (schedule button, upload button, result form)
- No localStorage draft — each action submits directly

Read the full MCU tab content from the monolith page (lines 2749-3092), then extract it.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/diantnugraha/Documents/Documents/Development/recruitment-hris && npx tsc --noEmit --pretty 2>&1 | head -30`

- [ ] **Step 3: Commit**

```bash
git add src/components/recruitment/tabs/McuTab.tsx
git commit -m "feat: extract McuTab with mode-based permission handling"
```

---

## Task 8: Extract OnboardingContent shared component

**Files:**
- Create: `src/components/onboarding/OnboardingContent.tsx`
- Source: `src/app/(protected)/onboarding/[candidateId]/page.tsx` (main content, ~1122 lines)

- [ ] **Step 1: Create OnboardingContent.tsx**

Extract the core onboarding content from the standalone onboarding page. The component should:
- Accept props:
  ```typescript
  interface OnboardingContentProps {
    candidateId: string;
    mode: TabMode;
    onRefresh?: () => void;  // Optional: called after convert-to-employee to refresh parent state
  }
  ```
- Contain all onboarding state (onboarding data, facility/program dialogs, convert state)
- Contain all onboarding API calls (getOnboarding, createOnboarding, updateOnboarding, CRUD facilities, CRUD programs, sendOnboardingEmail, convertToEmployee)
- When `mode === 'locked'`: lock icon + message
- When `mode === 'view'`: show all data as read-only
- When `mode === 'edit'`: show full CRUD controls
- Self-contained: fetches its own data via `candidateService.getOnboarding(candidateId)`

Read the full onboarding page content, then extract the body (everything inside the page container after the header) into this shared component. The page header/back button stays in the page file.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/diantnugraha/Documents/Documents/Development/recruitment-hris && npx tsc --noEmit --pretty 2>&1 | head -30`

- [ ] **Step 3: Commit**

```bash
git add src/components/onboarding/OnboardingContent.tsx
git commit -m "feat: extract OnboardingContent shared component from onboarding page"
```

---

## Task 9: Create OnboardingTab wrapper

**Files:**
- Create: `src/components/recruitment/tabs/OnboardingTab.tsx`

- [ ] **Step 1: Create OnboardingTab.tsx**

Thin wrapper that renders OnboardingContent:

```typescript
"use client";

import { OnboardingContent } from "@/components/onboarding/OnboardingContent";
import type { TabMode } from "@/hooks/useAssessmentPermission";

interface OnboardingTabProps {
  candidateId: string;
  mode: TabMode;
  onRefresh?: () => void;
}

export function OnboardingTab({ candidateId, mode, onRefresh }: OnboardingTabProps) {
  return <OnboardingContent candidateId={candidateId} mode={mode} onRefresh={onRefresh} />;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/recruitment/tabs/OnboardingTab.tsx
git commit -m "feat: add OnboardingTab wrapper component"
```

---

## Task 10: Update standalone onboarding page to use shared component

**Files:**
- Modify: `src/app/(protected)/onboarding/[candidateId]/page.tsx`

- [ ] **Step 1: Refactor onboarding page**

Replace the inline onboarding content with the shared component. Keep the page header (back button, candidate name) and wrap `OnboardingContent`:

```typescript
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { OnboardingContent } from "@/components/onboarding/OnboardingContent";

export default function OnboardingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = params.candidateId as string;

  return (
    <>
      <Header title="Onboarding Detail" />
      <PageContainer>
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>
        <OnboardingContent candidateId={candidateId} mode="edit" />
      </PageContainer>
    </>
  );
}
```

Note: The standalone onboarding page always uses `mode="edit"` because it's only accessible by HR roles (per route access). The mode-based permission check only matters when embedded in the candidate detail page.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/diantnugraha/Documents/Documents/Development/recruitment-hris && npx tsc --noEmit --pretty 2>&1 | head -30`

- [ ] **Step 3: Verify the page renders correctly**

Run: `cd /Users/diantnugraha/Documents/Documents/Development/recruitment-hris && npm run dev`
Navigate to an onboarding page to verify it works the same as before.

- [ ] **Step 4: Commit**

```bash
git add src/app/(protected)/onboarding/[candidateId]/page.tsx
git commit -m "refactor: use shared OnboardingContent in standalone onboarding page"
```

---

## Task 11: Refactor candidate detail page to use extracted components

**Files:**
- Modify: `src/app/(protected)/recruitment/[id]/page.tsx` (4616 lines → ~200 lines)

This is the critical task. The monolith page becomes a thin orchestrator.

- [ ] **Step 1: Rewrite the candidate detail page**

The refactored page should:

1. **Imports:** Import all tab components, `useAssessmentPermission`, and `TabMode`
2. **State:** Keep only:
   - `candidate`, `progress`, `biodata` (fetched data)
   - `isLoading`, `error` (loading states)
   - `activeTab` (URL-synced tab state)
   - Start interview dialog state (this stays in parent since it affects all tabs)
3. **Hook:** Call `useAssessmentPermission(id)` to get permission flags
4. **Mode derivation:** Compute `TabMode` for each tab:

```typescript
import { useAssessmentPermission, isHROrAdmin, type TabMode } from "@/hooks/useAssessmentPermission";
import { useAuthStore } from "@/stores/auth-store";

// Inside the component:
const user = useAuthStore((state) => state.user);
const permissions = useAssessmentPermission(id);
// Derive canEditAssignees directly from role, not from permission flags
const canEditAssignees = user ? isHROrAdmin(user.roleId) : false;

function getTabMode(
  canEdit: boolean,
  isUnlocked: boolean
): TabMode {
  if (!isUnlocked) return 'locked';
  if (!canEdit) return 'view';
  return 'edit';
}

const interviewStarted = progress?.interviewStarted ?? false;

const interviewHRMode = getTabMode(
  permissions.canEditInterviewHR,
  interviewStarted
);

const interviewUserMode = getTabMode(
  permissions.canEditInterviewUser,
  interviewStarted && (progress?.interview1.passed ?? false)
);

const mcuMode = getTabMode(
  permissions.canEditMCU,
  progress?.interview2.passed ?? false
);

const onboardingMode = getTabMode(
  permissions.canEditOnboarding,
  progress?.mcu.passed ?? false
);
```

5. **Render:** Tab navigation + tab content using extracted components:

```tsx
<Tabs value={activeTab} onValueChange={handleTabChange}>
  <TabsList>
    <TabsTrigger value="profile">Profile</TabsTrigger>
    <TabsTrigger value="assessment-hr" disabled={!interviewStarted}>
      Interview HR
    </TabsTrigger>
    <TabsTrigger value="assessment-user" disabled={interviewUserMode === 'locked'}>
      Interview User
    </TabsTrigger>
    <TabsTrigger value="mcu" disabled={mcuMode === 'locked'}>
      MCU
    </TabsTrigger>
    <TabsTrigger value="onboarding" disabled={onboardingMode === 'locked'}>
      Onboarding
    </TabsTrigger>
  </TabsList>

  <TabsContent value="profile">
    <ProfileTab candidate={candidate} biodata={biodata} isBiodataLoading={false} />
  </TabsContent>

  <TabsContent value="assessment-hr">
    <InterviewHRTab
      candidate={candidate}
      candidateId={id}
      mode={interviewHRMode}
      progress={progress}
      onRefresh={fetchData}
    />
  </TabsContent>

  <TabsContent value="assessment-user">
    <InterviewUserTab
      candidate={candidate}
      candidateId={id}
      mode={interviewUserMode}
      progress={progress}
      canEditAssignees={canEditAssignees}
      onRefresh={fetchData}
    />
  </TabsContent>

  <TabsContent value="mcu">
    <McuTab
      candidate={candidate}
      candidateId={id}
      mode={mcuMode}
      progress={progress}
      onRefresh={fetchData}
    />
  </TabsContent>

  <TabsContent value="onboarding">
    <OnboardingTab candidateId={id} mode={onboardingMode} onRefresh={fetchData} />
  </TabsContent>
</Tabs>
```

6. **Keep in parent:** Start interview dialog/banner, assessment pipeline stepper, loading/error states, candidate header section, the `fetchData` function

7. **Remove from parent:** All tab-specific state (scoring, drafts, MCU docs, onboarding CRUD, facility/program dialogs) — these now live in their respective tab components

8. **Permission loading guard:** While `permissions.isLoading` is true, show skeleton overlay on tabs area. If `permissions.isError`, show error with retry button that calls `permissions.refetch()`.

9. **Stale draft cleanup on rejection:** Add a `useEffect` that watches `progress?.anyFailed`. When it becomes `true`, clear all localStorage drafts for this candidate:

```typescript
React.useEffect(() => {
  if (progress?.anyFailed) {
    localStorage.removeItem(`hr-assessment-form-${id}`);
    localStorage.removeItem(`user-assessment-form-${id}`);
  }
}, [progress?.anyFailed, id]);
```

**Important dependency note:** Task 11 depends on ALL Tasks 3-10 completing successfully. Do not start this task until all prior tasks compile without errors.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/diantnugraha/Documents/Documents/Development/recruitment-hris && npx tsc --noEmit --pretty 2>&1 | head -30`

- [ ] **Step 3: Verify the page renders correctly**

Run dev server and test the following scenarios:
- Load candidate detail as HR user → all tabs editable
- Check tab switching works
- Check URL sync (tab param)
- Check loading and error states

- [ ] **Step 4: Commit**

```bash
git add src/app/(protected)/recruitment/[id]/page.tsx
git commit -m "refactor: slim candidate detail page to use extracted tab components with permissions"
```

---

## Task 12: End-to-end verification

- [ ] **Step 1: Verify TypeScript compilation**

Run: `cd /Users/diantnugraha/Documents/Documents/Development/recruitment-hris && npx tsc --noEmit --pretty`
Expected: No errors

- [ ] **Step 2: Verify build succeeds**

Run: `cd /Users/diantnugraha/Documents/Documents/Development/recruitment-hris && npm run build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 3: Manual verification checklist**

Test these scenarios with dev server running:

**HR user:**
- [ ] Can see all tabs
- [ ] Can edit Interview HR form (fill scoring, save draft, preview, submit)
- [ ] Can manage assignees in Interview User tab (assign/remove)
- [ ] Can edit Interview User form
- [ ] Can schedule MCU, upload document, record result
- [ ] Can manage onboarding (facilities, programs, convert)

**Manager/HOD/Management user (assigned as assessor):**
- [ ] Can see all tabs
- [ ] Interview HR tab is view-only (shows submitted data)
- [ ] Interview User tab: assignee list is view-only, but form is editable
- [ ] MCU tab is view-only
- [ ] Onboarding tab is view-only

**Manager/HOD/Management user (NOT assigned):**
- [ ] All assessment tabs are view-only

**Sequential flow:**
- [ ] Interview User is locked until Interview HR is PASSED
- [ ] MCU is locked until Interview User is PASSED
- [ ] Onboarding is locked until MCU is PASSED

**Onboarding standalone page:**
- [ ] `/onboarding/[candidateId]` still works as before
- [ ] Full edit mode for HR user

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: recruitment assessment form with role-based permissions

- Add useAssessmentPermission hook for per-tab edit/view/locked modes
- Extract ProfileTab, InterviewHRTab, InterviewUserTab, McuTab, OnboardingTab
- Extract shared OnboardingContent component
- Add HR_MANAGER to recruitment/onboarding route access
- Add assignAssessors/removeAssessor service methods
- Slim candidate detail page from 4600+ to ~200 lines"
```
