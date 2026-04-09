# HR Role Reversal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reverse permissions between HUMAN_RESOURCES and HR_MANAGER roles so HR Managers have full access while HR Staff is limited to master data only.

**Architecture:** Update frontend constants and component checks to replace HUMAN_RESOURCES with HR_MANAGER for approval workflows and restricted routes. Backend changes coordinated separately.

**Tech Stack:** TypeScript, Next.js 16, React 18

---

## File Structure

This implementation modifies existing frontend files only:

**Constants:**
- `src/lib/constants/roles.ts` - HR_ROLES helper array
- `src/lib/constants/routeAccess.ts` - Route access control lists
- `src/lib/constants/employeeRequest.ts` - Workflow transition permissions

**Components:**
- `src/app/(protected)/employee-request/[id]/page.tsx` - Action button visibility

**Hooks:**
- `src/hooks/useAssessmentPermission.ts` - Assessment permission checks (review only)

**Note:** Backend changes in recruitment-hris-api repo are documented in the spec but implemented separately.

---

## Task 1: Update HR_ROLES Helper Array

**Files:**
- Modify: `src/lib/constants/roles.ts:94-98`

- [ ] **Step 1: Read current HR_ROLES definition**

Run: `cat src/lib/constants/roles.ts | grep -A 5 "export const HR_ROLES"`

Expected output:
```typescript
export const HR_ROLES: RoleId[] = [
  ROLES.HUMAN_RESOURCES,
  ROLES.HR_MANAGER,
  ROLES.SUPER_ADMIN,
];
```

- [ ] **Step 2: Update HR_ROLES to remove HUMAN_RESOURCES**

Replace the HR_ROLES array definition:

```typescript
/**
 * Roles allowed to CRUD master data and employee list.
 * Must match backend HR_ROLE_IDS in recruitment-hris-api/src/middlewares/roleMiddleware.ts.
 */
export const HR_ROLES: RoleId[] = [
  ROLES.HR_MANAGER,
  ROLES.SUPER_ADMIN,
];
```

- [ ] **Step 3: Verify isHrRole() function behavior**

The existing `isHrRole()` function uses the HR_ROLES array, so no code change needed. Verify it exists:

Run: `grep -A 3 "export function isHrRole" src/lib/constants/roles.ts`

Expected output showing the helper function that will now return `false` for HUMAN_RESOURCES (ID: 1) and `true` for HR_MANAGER (ID: 8).

- [ ] **Step 4: Check TypeScript compilation**

Run: `npm run type-check`

Expected: No type errors

- [ ] **Step 5: Commit**

```bash
git add src/lib/constants/roles.ts
git commit -m "refactor(roles): update HR_ROLES to use HR_MANAGER instead of HUMAN_RESOURCES

- Remove ROLES.HUMAN_RESOURCES from HR_ROLES array
- Keep ROLES.HR_MANAGER and ROLES.SUPER_ADMIN
- isHrRole() now returns false for HR staff, true for HR managers"
```

---

## Task 2: Update Route Access Configuration

**Files:**
- Modify: `src/lib/constants/routeAccess.ts:3-31`

- [ ] **Step 1: Read current route access configuration**

Run: `head -n 31 src/lib/constants/routeAccess.ts`

Expected: Shows `ALL_ACTIVE_ROLES` includes `ROLES.HUMAN_RESOURCES` and route access definitions.

- [ ] **Step 2: Update ALL_ACTIVE_ROLES array**

Replace the `ALL_ACTIVE_ROLES` definition (lines 3-10):

```typescript
const ALL_ACTIVE_ROLES: RoleId[] = [
  ROLES.SUPER_ADMIN,
  ROLES.HR_MANAGER,
  ROLES.MANAGER,
  ROLES.HOD,
  ROLES.MANAGEMENT,
  ROLES.EMPLOYEE,
];
```

- [ ] **Step 3: Update ROUTE_ACCESS object**

Replace the entire `ROUTE_ACCESS` object (lines 12-31):

```typescript
export const ROUTE_ACCESS: Record<string, RoleId[]> = {
  // Master data - accessible to HUMAN_RESOURCES + all active roles
  '/dashboard':                [...ALL_ACTIVE_ROLES, ROLES.HUMAN_RESOURCES],
  '/organization/obs':         [...ALL_ACTIVE_ROLES, ROLES.HUMAN_RESOURCES],
  '/organization/divisions':   [...ALL_ACTIVE_ROLES, ROLES.HUMAN_RESOURCES],
  '/organization/departments': [...ALL_ACTIVE_ROLES, ROLES.HUMAN_RESOURCES],
  '/organization/job-levels':  [...ALL_ACTIVE_ROLES, ROLES.HUMAN_RESOURCES],
  '/organization/job-titles':  [...ALL_ACTIVE_ROLES, ROLES.HUMAN_RESOURCES],
  '/employees':                [...ALL_ACTIVE_ROLES, ROLES.HUMAN_RESOURCES],

  // Approval & recruitment - HR_MANAGER only (exclude HUMAN_RESOURCES)
  '/employee-budget':  [ROLES.SUPER_ADMIN, ROLES.HR_MANAGER, ROLES.MANAGER, ROLES.HOD, ROLES.MANAGEMENT],
  '/employee-request': [ROLES.SUPER_ADMIN, ROLES.HR_MANAGER, ROLES.MANAGER, ROLES.HOD, ROLES.MANAGEMENT],
  '/recruitment':      [ROLES.SUPER_ADMIN, ROLES.HR_MANAGER, ROLES.MANAGER, ROLES.HOD, ROLES.MANAGEMENT],
  '/onboarding':       [ROLES.SUPER_ADMIN, ROLES.HR_MANAGER, ROLES.MANAGER, ROLES.HOD, ROLES.MANAGEMENT],

  // Admin routes - HR_MANAGER only (exclude HUMAN_RESOURCES)
  '/users':        [ROLES.SUPER_ADMIN, ROLES.HR_MANAGER],
  '/roles-access': [ROLES.SUPER_ADMIN, ROLES.HR_MANAGER],
};
```

- [ ] **Step 4: Verify hasRouteAccess function unchanged**

The `hasRouteAccess()` function doesn't need modification. Verify it exists:

Run: `grep -A 15 "export function hasRouteAccess" src/lib/constants/routeAccess.ts`

Expected: Function definition that uses ROUTE_ACCESS object.

- [ ] **Step 5: Check TypeScript compilation**

Run: `npm run type-check`

Expected: No type errors

- [ ] **Step 6: Commit**

```bash
git add src/lib/constants/routeAccess.ts
git commit -m "refactor(routes): reverse HR role access permissions

- Remove HUMAN_RESOURCES from ALL_ACTIVE_ROLES
- Add HR_MANAGER to ALL_ACTIVE_ROLES
- Add HUMAN_RESOURCES explicitly to master data routes only
- Replace HUMAN_RESOURCES with HR_MANAGER in approval/recruitment routes
- HR Staff now limited to organization & employee master data
- HR Manager gains full access to all HR features"
```

---

## Task 3: Update Employee Request Workflow Transitions

**Files:**
- Modify: `src/lib/constants/employeeRequest.ts:217-231`

- [ ] **Step 1: Read current workflow transitions**

Run: `grep -A 15 "export const WORKFLOW_TRANSITIONS" src/lib/constants/employeeRequest.ts`

Expected: Shows workflow transitions with `ROLES.HUMAN_RESOURCES` in `hod_reviewed`, `approved`, and `in_recruitment` allowedRoles.

- [ ] **Step 2: Update WORKFLOW_TRANSITIONS object**

Replace the `WORKFLOW_TRANSITIONS` definition:

```typescript
// Workflow transitions - who can do what
export const WORKFLOW_TRANSITIONS: Record<EmployeeRequestStatus, {
  nextStatuses: EmployeeRequestStatus[];
  allowedRoles: number[];
}> = {
  draft:          { nextStatuses: ['created'],                         allowedRoles: [ROLES.MANAGER, ROLES.SUPER_ADMIN] },
  created:        { nextStatuses: ['hod_reviewed', 'revise'],          allowedRoles: [ROLES.HOD, ROLES.SUPER_ADMIN] },
  hod_reviewed:   { nextStatuses: ['reviewed', 'revise'],              allowedRoles: [ROLES.HR_MANAGER, ROLES.SUPER_ADMIN] },
  reviewed:       { nextStatuses: ['approved', 'rejected', 'revise'],  allowedRoles: [ROLES.MANAGEMENT, ROLES.SUPER_ADMIN] },
  approved:       { nextStatuses: ['in_recruitment'],                  allowedRoles: [ROLES.HR_MANAGER, ROLES.SUPER_ADMIN] },
  rejected:       { nextStatuses: [],                                  allowedRoles: [] },
  revise:         { nextStatuses: ['created'],                         allowedRoles: [ROLES.MANAGER, ROLES.SUPER_ADMIN] },
  in_recruitment: { nextStatuses: ['completed'],                       allowedRoles: [ROLES.HR_MANAGER, ROLES.SUPER_ADMIN] },
  completed:      { nextStatuses: [],                                  allowedRoles: [] },
};
```

- [ ] **Step 3: Verify changes in diff**

Run: `git diff src/lib/constants/employeeRequest.ts`

Expected: Shows 3 lines changed - `hod_reviewed`, `approved`, and `in_recruitment` now use `ROLES.HR_MANAGER` instead of `ROLES.HUMAN_RESOURCES`.

- [ ] **Step 4: Check TypeScript compilation**

Run: `npm run type-check`

Expected: No type errors

- [ ] **Step 5: Commit**

```bash
git add src/lib/constants/employeeRequest.ts
git commit -m "refactor(employee-request): update workflow transitions for HR_MANAGER

- Replace HUMAN_RESOURCES with HR_MANAGER in 3 workflow transitions
- hod_reviewed -> reviewed: only HR_MANAGER can approve
- approved -> in_recruitment: only HR_MANAGER can start recruitment
- in_recruitment -> completed: only HR_MANAGER can complete
- SUPER_ADMIN retains override access to all transitions"
```

---

## Task 4: Update Employee Request Detail Page Action Buttons

**Files:**
- Modify: `src/app/(protected)/employee-request/[id]/page.tsx:568,600,618`

- [ ] **Step 1: Locate HUMAN_RESOURCES checks in detail page**

Run: `grep -n "ROLES.HUMAN_RESOURCES" src/app/(protected)/employee-request/[id]/page.tsx`

Expected output showing 3 line numbers where HUMAN_RESOURCES is checked.

- [ ] **Step 2: Update HR Review action button (line ~568)**

Find and replace:

**Before:**
```typescript
{request.status === "hod_reviewed" && canPerformAction([ROLES.HUMAN_RESOURCES]) && (
```

**After:**
```typescript
{request.status === "hod_reviewed" && canPerformAction([ROLES.HR_MANAGER]) && (
```

- [ ] **Step 3: Update Start Recruitment action button (line ~600)**

Find and replace:

**Before:**
```typescript
{request.status === "approved" && canPerformAction([ROLES.HUMAN_RESOURCES]) && (
```

**After:**
```typescript
{request.status === "approved" && canPerformAction([ROLES.HR_MANAGER]) && (
```

- [ ] **Step 4: Update Complete action button (line ~618)**

Find and replace:

**Before:**
```typescript
{request.status === "in_recruitment" && canPerformAction([ROLES.HUMAN_RESOURCES]) && (
```

**After:**
```typescript
{request.status === "in_recruitment" && canPerformAction([ROLES.HR_MANAGER]) && (
```

- [ ] **Step 5: Verify all replacements**

Run: `grep -n "ROLES.HUMAN_RESOURCES" src/app/(protected)/employee-request/[id]/page.tsx`

Expected: No matches (all replaced)

Run: `grep -n "ROLES.HR_MANAGER" src/app/(protected)/employee-request/[id]/page.tsx`

Expected: 3 matches at the lines where action buttons check permissions

- [ ] **Step 6: Check TypeScript compilation**

Run: `npm run type-check`

Expected: No type errors

- [ ] **Step 7: Commit**

```bash
git add src/app/(protected)/employee-request/[id]/page.tsx
git commit -m "refactor(employee-request): update action buttons for HR_MANAGER role

- Replace HUMAN_RESOURCES with HR_MANAGER in 3 action button checks
- HR Approve button (hod_reviewed status)
- Start Recruitment button (approved status)
- Complete button (in_recruitment status)
- Action buttons now visible only to HR_MANAGER and SUPER_ADMIN"
```

---

## Task 5: Review Assessment Permission Hook

**Files:**
- Review: `src/hooks/useAssessmentPermission.ts`

- [ ] **Step 1: Check if hook uses HUMAN_RESOURCES role**

Run: `grep -n "HUMAN_RESOURCES" src/hooks/useAssessmentPermission.ts`

Expected: Either no matches, or matches showing where HUMAN_RESOURCES is checked.

- [ ] **Step 2: Read hook implementation**

Run: `cat src/hooks/useAssessmentPermission.ts`

Analyze whether this hook:
- Checks for HUMAN_RESOURCES role for recruitment/assessment features
- If yes → Replace with HR_MANAGER (assessment is approval-related)
- If no → No changes needed

- [ ] **Step 3a: If changes needed - Update role checks**

Replace any `ROLES.HUMAN_RESOURCES` with `ROLES.HR_MANAGER` where it relates to recruitment assessment permissions.

Example replacement:
```typescript
// Before
const canAssess = isHrRole(user?.roleId) || user?.roleId === ROLES.HUMAN_RESOURCES;

// After
const canAssess = isHrRole(user?.roleId) || user?.roleId === ROLES.HR_MANAGER;
```

- [ ] **Step 3b: If no changes needed - Document finding**

Create comment in git message documenting that no changes were required.

- [ ] **Step 4: Verify no other HUMAN_RESOURCES references**

Run: `grep -r "HUMAN_RESOURCES" src/ --include="*.ts" --include="*.tsx" | grep -v "node_modules"`

Expected: Only definitions in roles.ts constant and type definitions. No active usage in components/hooks.

- [ ] **Step 5: Check TypeScript compilation**

Run: `npm run type-check`

Expected: No type errors

- [ ] **Step 6: Commit (if changes made)**

```bash
git add src/hooks/useAssessmentPermission.ts
git commit -m "refactor(hooks): update assessment permissions for HR_MANAGER

- Replace HUMAN_RESOURCES with HR_MANAGER in permission checks
- Assessment features now require HR_MANAGER role"
```

Or if no changes needed:

```bash
git commit --allow-empty -m "chore: verify useAssessmentPermission hook requires no changes

- Hook does not reference HUMAN_RESOURCES role
- No updates needed for HR role reversal"
```

---

## Task 6: Frontend Build Verification

**Files:**
- None (verification only)

- [ ] **Step 1: Clean build**

Run: `npm run build`

Expected: Build completes successfully with no errors.

- [ ] **Step 2: Run type checking**

Run: `npm run type-check`

Expected: No TypeScript errors.

- [ ] **Step 3: Search for remaining HUMAN_RESOURCES usage**

Run: `grep -r "ROLES.HUMAN_RESOURCES" src/ --include="*.ts" --include="*.tsx" | grep -v "constants/roles.ts"`

Expected: No matches except in the roles.ts constant definition itself.

- [ ] **Step 4: Verify git status**

Run: `git status`

Expected: Working tree clean (all changes committed).

- [ ] **Step 5: Review commit history**

Run: `git log --oneline -6`

Expected: Shows 5-6 commits for the role reversal changes.

- [ ] **Step 6: Create summary commit (optional)**

```bash
git commit --allow-empty -m "feat: complete HR role reversal frontend implementation

Summary of changes:
- HR_ROLES helper now uses HR_MANAGER instead of HUMAN_RESOURCES
- Route access: HR_MANAGER gains full access, HUMAN_RESOURCES limited to master data
- Workflow transitions: HR_MANAGER handles all approval actions
- Action buttons: Updated employee request detail page for HR_MANAGER
- Build verification: All TypeScript checks pass

Backend changes required in recruitment-hris-api (see spec):
- Update notification target resolution
- Update authorization checks
- Update role-based filtering
- Update email templates

Deployment:
- Requires manual role migration before deployment
- Frontend and backend must deploy together
- See docs/superpowers/specs/2026-04-09-hr-role-reversal-design.md"
```

---

## Task 7: Manual Testing Preparation

**Files:**
- None (documentation only)

- [ ] **Step 1: Document test user requirements**

Create test plan file:

```bash
cat > docs/testing/hr-role-reversal-test-plan.md << 'EOF'
# HR Role Reversal Test Plan

## Test Users Required

1. **HUMAN_RESOURCES user** (role_id = 1)
   - Email: hr-staff@example.com
   - Should have LIMITED access

2. **HR_MANAGER user** (role_id = 8)
   - Email: hr-manager@example.com
   - Should have FULL access

3. **SUPER_ADMIN user** (role_id = 3)
   - Email: admin@example.com
   - Should have FULL access

## Pre-Deployment Tests (Staging)

### HUMAN_RESOURCES User Tests

- [ ] Login successful
- [ ] Can access /dashboard
- [ ] Can access /organization/departments
- [ ] Can access /employees
- [ ] CANNOT access /employee-request (redirected to /dashboard)
- [ ] CANNOT access /recruitment (redirected to /dashboard)
- [ ] CANNOT access /onboarding (redirected to /dashboard)
- [ ] CANNOT access /users (redirected to /dashboard)
- [ ] CANNOT access /roles-access (redirected to /dashboard)
- [ ] Navigation menu hides blocked routes

### HR_MANAGER User Tests

- [ ] Login successful
- [ ] Can access all routes including /dashboard
- [ ] Can access /organization/departments
- [ ] Can access /employees
- [ ] Can access /employee-budget
- [ ] Can access /employee-request
- [ ] Can access /recruitment
- [ ] Can access /onboarding
- [ ] Can access /users
- [ ] Can access /roles-access

### Employee Request Approval Flow

**Setup:**
- Create employee request as MANAGER user
- HOD approves (status: hod_reviewed)

**HR_MANAGER Tests:**
- [ ] Can see employee request in list
- [ ] Can view employee request detail
- [ ] "HR Approve" button visible on hod_reviewed request
- [ ] Can approve request (transitions to reviewed)
- [ ] After MANAGEMENT approves (status: approved):
  - [ ] "Start Recruitment" button visible
  - [ ] Can start recruitment (transitions to in_recruitment)
- [ ] "Complete" button visible on in_recruitment request
- [ ] Can complete request (transitions to completed)

**HUMAN_RESOURCES Tests:**
- [ ] CANNOT see employee request in list
- [ ] CANNOT access employee request detail page (403 or redirect)
- [ ] No action buttons visible (if somehow accessed)

### SUPER_ADMIN User Tests

- [ ] Can access all routes
- [ ] Can perform all actions on employee requests
- [ ] Can perform all workflow transitions

## Post-Deployment Tests (Production)

Repeat all tests above in production environment after deployment.

### Email Notification Tests

**Setup:**
1. Create employee request as MANAGER
2. HOD approves

**Verify:**
- [ ] Only HR_MANAGER users receive "HOD Approved" email
- [ ] HUMAN_RESOURCES users do NOT receive email

**Setup:**
1. HR_MANAGER approves (status: reviewed)
2. MANAGEMENT approves (status: approved)

**Verify:**
- [ ] Only HR_MANAGER users receive "Management Approved" email
- [ ] HUMAN_RESOURCES users do NOT receive email
- [ ] Original requester (MANAGER) receives email

## Browser Testing

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

## Console Error Check

For each test scenario:
- [ ] No JavaScript errors in browser console
- [ ] No 403 errors for authorized routes
- [ ] No infinite redirect loops

EOF
```

- [ ] **Step 2: Add test plan to git**

```bash
git add docs/testing/hr-role-reversal-test-plan.md
git commit -m "docs: add manual test plan for HR role reversal

- Test user requirements
- Pre-deployment staging tests
- Post-deployment production tests
- Email notification verification
- Browser compatibility testing"
```

- [ ] **Step 3: Document backend coordination checklist**

Create backend coordination doc:

```bash
cat > docs/deployment/hr-role-reversal-backend-checklist.md << 'EOF'
# HR Role Reversal Backend Coordination Checklist

**Repository:** recruitment-hris-api

## Backend Files to Modify

### High Priority

- [ ] `src/services/employeeRequestService.ts`
  - [ ] Update `resolveNotificationTargets()` - query 'HR Manager' only
  - [ ] Update `updateEmployeeRequestStatus()` - check for 'HR Manager' role
  - [ ] Add explicit block for 'Human Resources' role

- [ ] `src/repositories/employeeRequestRepository.ts`
  - [ ] Update `findAll()` - HR_MANAGER sees all, HUMAN_RESOURCES blocked
  - [ ] Update `getStats()` - same filtering logic

- [ ] `src/middlewares/roleMiddleware.ts`
  - [ ] Update `HR_ROLE_IDS` from [1] to [8]

### Medium Priority

- [ ] `src/services/emailService.ts`
  - [ ] Update `sendEmployeeRequestStatusEmail()`
  - [ ] Change "Human Resources" to "HR Manager" in subjects
  - [ ] Change "Human Resources" to "HR Manager" in email bodies

### Low Priority

- [ ] `src/constants/employeeRequestConstants.ts`
  - [ ] Update notification action labels if referencing "Human Resources"

## Deployment Coordination

- [ ] Frontend changes committed and ready
- [ ] Backend changes committed and ready
- [ ] User completes manual role migration in database
- [ ] Verify at least one active user has role_id = 8 (HR_MANAGER)
- [ ] Schedule deployment window (low-traffic period)
- [ ] Deploy backend first
- [ ] Deploy frontend immediately after
- [ ] Run post-deployment verification tests
- [ ] Monitor error logs for 403 errors
- [ ] Verify email notifications working correctly

## Rollback Plan

If issues detected:

**Option A: Full Rollback**
- [ ] Revert frontend to previous version
- [ ] Revert backend to previous version
- [ ] User reverts manual role changes
- [ ] Verify system operational

**Option B: Forward Fix**
- [ ] Identify issue
- [ ] Deploy hotfix
- [ ] Verify fix

EOF
```

- [ ] **Step 4: Add backend checklist to git**

```bash
git add docs/deployment/hr-role-reversal-backend-checklist.md
git commit -m "docs: add backend coordination checklist for HR role reversal

- Backend files to modify
- Deployment sequence
- Rollback procedures
- Coordination requirements between frontend and backend"
```

---

## Task 8: Update Design Documentation

**Files:**
- Modify: `docs/superpowers/specs/2026-03-29-employee-request-notification-design.md`
- Modify: `docs/superpowers/specs/2026-03-21-employee-request-multi-level-approval-design.md`

- [ ] **Step 1: Update notification design doc**

Open `docs/superpowers/specs/2026-03-29-employee-request-notification-design.md`

Find the notification matrix section (around line 23-26) and update:

**Before:**
```markdown
| `created -> hod_reviewed` | HOD approve | `employee_request_hod_approved` | All HR | Users with `role.roleName` in `['Human Resources', 'HR Manager']`, not deleted |
```

**After:**
```markdown
| `created -> hod_reviewed` | HOD approve | `employee_request_hod_approved` | All HR | Users with `role.roleName = 'HR Manager'`, not deleted |
```

Find line 125 (HOD approval target resolution) and update:

**Before:**
```markdown
2. `hod_approved` -> Query users WHERE `role.roleName IN ('Human Resources', 'HR Manager')`, `trash IS NULL`
```

**After:**
```markdown
2. `hod_approved` -> Query users WHERE `role.roleName = 'HR Manager'`, `trash IS NULL`
```

Find line 128 (approval notification targets) and update:

**Before:**
```markdown
4. `approved` -> Query HR users (by roleName) + `request.createdBy` (requester)
```

**After:**
```markdown
4. `approved` -> Query HR Manager users (role.roleName = 'HR Manager') + `request.createdBy` (requester)
```

- [ ] **Step 2: Update multi-level approval design doc**

Open `docs/superpowers/specs/2026-03-21-employee-request-multi-level-approval-design.md`

Find the role definitions section (around line 30-38) and update:

**Before:**
```markdown
| **Human Resources** | `role_access.role_name` = "Human Resources" | All requests |
```

**After:**
```markdown
| **HR Manager** | `role_access.role_name` = "HR Manager" | All requests |
```

Find the allowed transitions table (around line 55-69) and update all references:

Replace:
```markdown
| `hod_reviewed` → `reviewed` | Human Resources, Admin | No scope restriction |
| `hod_reviewed` → `revise` | Human Resources, Admin | No scope restriction |
| `approved` → `in_recruitment` | Human Resources, Admin | No scope restriction |
| `in_recruitment` → `completed` | Human Resources, Admin | No scope restriction |
```

With:
```markdown
| `hod_reviewed` → `reviewed` | HR Manager, Admin | No scope restriction |
| `hod_reviewed` → `revise` | HR Manager, Admin | No scope restriction |
| `approved` → `in_recruitment` | HR Manager, Admin | No scope restriction |
| `in_recruitment` → `completed` | HR Manager, Admin | No scope restriction |
```

Find the workflow transitions shape (around line 75-86) and update:

**Before:**
```typescript
hod_reviewed:   { nextStatuses: ['reviewed', 'revise'],              allowedRoles: ['hr', 'admin'] },
approved:       { nextStatuses: ['in_recruitment'],                  allowedRoles: ['hr', 'admin'] },
in_recruitment: { nextStatuses: ['completed'],                       allowedRoles: ['hr', 'admin'] },
```

**After:**
```typescript
hod_reviewed:   { nextStatuses: ['reviewed', 'revise'],              allowedRoles: ['hr_manager', 'admin'] },
approved:       { nextStatuses: ['in_recruitment'],                  allowedRoles: ['hr_manager', 'admin'] },
in_recruitment: { nextStatuses: ['completed'],                       allowedRoles: ['hr_manager', 'admin'] },
```

- [ ] **Step 3: Verify documentation changes**

Run: `git diff docs/superpowers/specs/`

Expected: Shows replacements of "Human Resources" with "HR Manager" in notification and approval design docs.

- [ ] **Step 4: Commit documentation updates**

```bash
git add docs/superpowers/specs/2026-03-29-employee-request-notification-design.md
git add docs/superpowers/specs/2026-03-21-employee-request-multi-level-approval-design.md
git commit -m "docs: update design specs to reflect HR_MANAGER role change

- Update notification matrix: HR_MANAGER as target instead of both HR roles
- Update approval transitions: HR_MANAGER as allowed role
- Update role definitions: HR_MANAGER replaces Human Resources
- Align design docs with implemented HR role reversal"
```

---

## Verification Checklist

After completing all tasks, verify:

### Code Quality
- [ ] `npm run build` completes without errors
- [ ] `npm run type-check` passes with no errors
- [ ] No `ROLES.HUMAN_RESOURCES` usage except in roles.ts definition
- [ ] All changes committed with clear commit messages
- [ ] Git history shows 8-10 commits for the feature

### Functional Requirements
- [ ] HR_ROLES array contains only HR_MANAGER and SUPER_ADMIN
- [ ] ALL_ACTIVE_ROLES contains HR_MANAGER, not HUMAN_RESOURCES
- [ ] Master data routes include HUMAN_RESOURCES explicitly
- [ ] Approval/recruitment routes use HR_MANAGER, not HUMAN_RESOURCES
- [ ] Workflow transitions use HR_MANAGER for 3 approval actions
- [ ] Employee request detail page uses HR_MANAGER in 3 button checks

### Documentation
- [ ] Design spec exists and is comprehensive
- [ ] Implementation plan exists and is complete
- [ ] Test plan created with clear test cases
- [ ] Backend coordination checklist created
- [ ] Related design docs updated

### Deployment Readiness
- [ ] Frontend changes complete and tested locally
- [ ] Backend changes documented (for separate implementation)
- [ ] Manual role migration instructions documented
- [ ] Deployment sequence documented
- [ ] Rollback plan documented
- [ ] Post-deployment verification plan exists

---

## Notes for Backend Implementation

The following backend changes are documented in the design spec but must be implemented in the **recruitment-hris-api** repository:

1. **Authorization updates:** Replace 'Human Resources' with 'HR Manager' in role checks
2. **Notification targeting:** Query only 'HR Manager' role for email notifications
3. **List filtering:** Block HUMAN_RESOURCES from viewing employee requests
4. **Email templates:** Update text from "Human Resources" to "HR Manager"
5. **Role middleware:** Update HR_ROLE_IDS from [1] to [8]

Coordinate with backend team to ensure frontend and backend deploy together.

---

## Success Criteria

Implementation is complete when:

1. ✅ All frontend files modified as specified
2. ✅ TypeScript compilation passes
3. ✅ Build succeeds without errors
4. ✅ No HUMAN_RESOURCES usage in active code (only in constants definition)
5. ✅ All changes committed with clear messages
6. ✅ Documentation updated
7. ✅ Test plan created
8. ✅ Backend coordination checklist created

Manual testing will verify:
- HR_MANAGER users can access all routes and approve requests
- HUMAN_RESOURCES users limited to master data routes
- SUPER_ADMIN retains full access
