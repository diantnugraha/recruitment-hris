# HR Role Reversal: HUMAN_RESOURCES ↔ HR_MANAGER Permission Swap

**Date:** 2026-04-09
**Status:** Draft
**Scope:** Backend (recruitment-hris-api) + Frontend (recruitment-hris)

---

## 1. Overview

Reverse the permission levels between `HUMAN_RESOURCES` (role ID: 1) and `HR_MANAGER` (role ID: 8) to match organizational hierarchy:

- **HUMAN_RESOURCES** → Limited to master data only (HR Staff level)
- **HR_MANAGER** → Full HR access including approvals and recruitment (HR Manager level)

This is a permission reversal, not a simple rename. Both roles will continue to exist in the system with different access levels.

---

## 2. Business Context

### Current Problem
- `HUMAN_RESOURCES` role has full access to approvals, recruitment, and all HR features
- `HR_MANAGER` role only has access to recruitment and onboarding pages
- This doesn't match the organizational hierarchy where HR Managers should have more permissions than HR Staff

### Desired State
- **HR Staff** (HUMAN_RESOURCES role) manages master data: OBS, divisions, departments, job levels, job titles, employee list
- **HR Manager** (HR_MANAGER role) has full access: master data + employee budget + employee request approvals + recruitment + onboarding + user/role management

---

## 3. Permission Matrix

### Route Access Changes

| Route | HUMAN_RESOURCES (Before) | HUMAN_RESOURCES (After) | HR_MANAGER (Before) | HR_MANAGER (After) |
|-------|-------------------------|------------------------|--------------------|--------------------|
| `/dashboard` | ✅ | ✅ | ❌ | ✅ |
| `/organization/obs` | ✅ | ✅ | ❌ | ✅ |
| `/organization/divisions` | ✅ | ✅ | ❌ | ✅ |
| `/organization/departments` | ✅ | ✅ | ❌ | ✅ |
| `/organization/job-levels` | ✅ | ✅ | ❌ | ✅ |
| `/organization/job-titles` | ✅ | ✅ | ❌ | ✅ |
| `/employees` | ✅ | ✅ | ❌ | ✅ |
| `/employee-budget` | ✅ | ❌ | ❌ | ✅ |
| `/employee-request` | ✅ | ❌ | ❌ | ✅ |
| `/recruitment` | ✅ | ❌ | ✅ | ✅ |
| `/onboarding` | ✅ | ❌ | ✅ | ✅ |
| `/users` | ✅ | ❌ | ❌ | ✅ |
| `/roles-access` | ✅ | ❌ | ❌ | ✅ |

### Workflow Actions (Employee Request)

| Action Transition | HUMAN_RESOURCES (Before) | HUMAN_RESOURCES (After) | HR_MANAGER (Before) | HR_MANAGER (After) |
|-------------------|-------------------------|------------------------|--------------------|--------------------|
| `hod_reviewed` → `reviewed` (HR Approve) | ✅ | ❌ | ❌ | ✅ |
| `approved` → `in_recruitment` (Start Recruitment) | ✅ | ❌ | ❌ | ✅ |
| `in_recruitment` → `completed` (Complete) | ✅ | ❌ | ❌ | ✅ |

### Email Notification Targets

| Event | Current Recipients | After Change |
|-------|-------------------|--------------|
| HOD approves employee request | Users with role `'Human Resources'` OR `'HR Manager'` | Users with role `'HR Manager'` only |
| Management approves | Users with role `'Human Resources'` OR `'HR Manager'` + Requester | Users with role `'HR Manager'` only + Requester |

**SUPER_ADMIN** (role ID: 3) retains full access to all routes and actions (no changes).

---

## 4. Frontend Changes

### 4.1 Route Access Configuration

**File:** `src/lib/constants/routeAccess.ts`

**Update `ALL_ACTIVE_ROLES`:**
```typescript
const ALL_ACTIVE_ROLES: RoleId[] = [
  ROLES.SUPER_ADMIN,
  ROLES.HR_MANAGER,        // Added (was not in list)
  ROLES.MANAGER,
  ROLES.HOD,
  ROLES.MANAGEMENT,
  ROLES.EMPLOYEE,
  // HUMAN_RESOURCES removed from active roles
];
```

**Update `ROUTE_ACCESS` object:**
```typescript
export const ROUTE_ACCESS: Record<string, RoleId[]> = {
  // Master data - include HUMAN_RESOURCES explicitly
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

### 4.2 Workflow Transitions

**File:** `src/lib/constants/employeeRequest.ts`

**Update `WORKFLOW_TRANSITIONS`:**
```typescript
export const WORKFLOW_TRANSITIONS: Record<EmployeeRequestStatus, {
  nextStatuses: EmployeeRequestStatus[];
  allowedRoles: number[];
}> = {
  draft:          { nextStatuses: ['created'],                         allowedRoles: [ROLES.MANAGER, ROLES.SUPER_ADMIN] },
  created:        { nextStatuses: ['hod_reviewed', 'revise'],          allowedRoles: [ROLES.HOD, ROLES.SUPER_ADMIN] },
  hod_reviewed:   { nextStatuses: ['reviewed', 'revise'],              allowedRoles: [ROLES.HR_MANAGER, ROLES.SUPER_ADMIN] },  // Changed
  reviewed:       { nextStatuses: ['approved', 'rejected', 'revise'],  allowedRoles: [ROLES.MANAGEMENT, ROLES.SUPER_ADMIN] },
  approved:       { nextStatuses: ['in_recruitment'],                  allowedRoles: [ROLES.HR_MANAGER, ROLES.SUPER_ADMIN] },  // Changed
  rejected:       { nextStatuses: [],                                  allowedRoles: [] },
  revise:         { nextStatuses: ['created'],                         allowedRoles: [ROLES.MANAGER, ROLES.SUPER_ADMIN] },
  in_recruitment: { nextStatuses: ['completed'],                       allowedRoles: [ROLES.HR_MANAGER, ROLES.SUPER_ADMIN] },  // Changed
  completed:      { nextStatuses: [],                                  allowedRoles: [] },
};
```

### 4.3 HR_ROLES Helper Array

**File:** `src/lib/constants/roles.ts`

**Update `HR_ROLES`:**
```typescript
// Before
export const HR_ROLES: RoleId[] = [
  ROLES.HUMAN_RESOURCES,
  ROLES.HR_MANAGER,
  ROLES.SUPER_ADMIN,
];

// After
export const HR_ROLES: RoleId[] = [
  ROLES.HR_MANAGER,      // Removed HUMAN_RESOURCES
  ROLES.SUPER_ADMIN,
];
```

**Impact:** The `isHrRole()` helper function will now return:
- `isHrRole(1)` → `false` (HUMAN_RESOURCES excluded)
- `isHrRole(8)` → `true` (HR_MANAGER included)
- `isHrRole(3)` → `true` (SUPER_ADMIN included)

### 4.4 Action Button Visibility

**File:** `src/app/(protected)/employee-request/[id]/page.tsx`

**Replace in 3 locations:**

**Line ~568 (HR Review action):**
```typescript
// Before
{request.status === "hod_reviewed" && canPerformAction([ROLES.HUMAN_RESOURCES]) && (

// After
{request.status === "hod_reviewed" && canPerformAction([ROLES.HR_MANAGER]) && (
```

**Line ~600 (Start Recruitment action):**
```typescript
// Before
{request.status === "approved" && canPerformAction([ROLES.HUMAN_RESOURCES]) && (

// After
{request.status === "approved" && canPerformAction([ROLES.HR_MANAGER]) && (
```

**Line ~618 (Complete action):**
```typescript
// Before
{request.status === "in_recruitment" && canPerformAction([ROLES.HUMAN_RESOURCES]) && (

// After
{request.status === "in_recruitment" && canPerformAction([ROLES.HR_MANAGER]) && (
```

### 4.5 Other Components

**File:** `src/hooks/useAssessmentPermission.ts`

Review and update any `ROLES.HUMAN_RESOURCES` checks if they relate to recruitment assessment features (should be `ROLES.HR_MANAGER` if approval-related).

---

## 5. Backend Changes

### 5.1 Notification Target Resolution

**File:** `src/services/employeeRequestService.ts`

**Function:** `resolveNotificationTargets()`

**Update role query for HR notifications:**

**Before:**
```typescript
// Query users with role.roleName IN ('Human Resources', 'HR Manager')
const hrUsers = await prisma.user.findMany({
  where: {
    trash: null,
    role: {
      roleName: { in: ['Human Resources', 'HR Manager'] }
    }
  },
  include: { role: true }
});
```

**After:**
```typescript
// Query users with role.roleName = 'HR Manager' only
const hrUsers = await prisma.user.findMany({
  where: {
    trash: null,
    role: {
      roleName: 'HR Manager'
    }
  },
  include: { role: true }
});
```

**Affected notification events:**
- `employee_request_hod_approved` — when HOD approves, notify HR_MANAGER users
- `employee_request_approved` — when Management approves, notify HR_MANAGER users + requester

### 5.2 Authorization Checks

**File:** `src/services/employeeRequestService.ts`

**Function:** `updateEmployeeRequestStatus()`

**Update role authorization:**

**Before:**
```typescript
if (transition.requiredRole === 'hr') {
  if (user.roleName !== 'Human Resources' && user.roleName !== 'admin') {
    throw new ForbiddenError('Only HR can perform this action');
  }
}
```

**After:**
```typescript
if (transition.requiredRole === 'hr') {
  if (user.roleName !== 'HR Manager' && user.roleName !== 'admin') {
    throw new ForbiddenError('Only HR Manager can perform this action');
  }
}
```

**Add explicit block for HUMAN_RESOURCES:**
```typescript
// Block HUMAN_RESOURCES from employee request actions
if (user.roleName === 'Human Resources') {
  throw new ForbiddenError('You do not have permission to manage employee requests');
}
```

### 5.3 List Filtering (Role-Based Visibility)

**File:** `src/repositories/employeeRequestRepository.ts`

**Functions:** `findAll()` and `getStats()`

**Update filtering logic:**

**Before:**
```typescript
if (user.roleName === 'Human Resources') {
  // Show all requests except drafts
  whereClause.status_employee_request = { in: [1, 8, 2, 3, 4, 5, 6, 7] };
}
```

**After:**
```typescript
if (user.roleName === 'HR Manager') {
  // Show all requests except drafts
  whereClause.status_employee_request = { in: [1, 8, 2, 3, 4, 5, 6, 7] };
}

if (user.roleName === 'Human Resources') {
  // HUMAN_RESOURCES has no access to employee requests
  // Option 1: Return empty result
  return { data: [], total: 0 };

  // Option 2: Throw error (preferred for clarity)
  throw new ForbiddenError('You do not have permission to view employee requests');
}
```

### 5.4 Role Middleware/Constants

**File:** `src/middlewares/roleMiddleware.ts` (if exists)

**Update HR role ID constant:**

**Before:**
```typescript
export const HR_ROLE_IDS = [1]; // Human Resources
```

**After:**
```typescript
export const HR_ROLE_IDS = [8]; // HR Manager
```

This constant is used for checking HR-level permissions on master data CRUD endpoints.

### 5.5 Email Templates

**File:** `src/services/emailService.ts`

**Function:** `sendEmployeeRequestStatusEmail()`

**Update text references:**
- Change "Human Resources" to "HR Manager" in email subject lines
- Update email body: "Reviewed by HR" → "Reviewed by HR Manager"
- Update action labels in notification templates

**Example:**
```typescript
// Before
subject: 'Employee Request - Reviewed by HR'
body: '...has been reviewed by Human Resources team...'

// After
subject: 'Employee Request - Reviewed by HR Manager'
body: '...has been reviewed by HR Manager...'
```

---

## 6. Deployment Strategy

### 6.1 Pre-Deployment Requirements

**Manual User Role Migration (Performed by User):**

The user will manually reassign roles before code deployment:

1. **Identify HR users:**
   ```sql
   SELECT id, name, email, role_id
   FROM users
   WHERE role_id IN (1, 8) AND trash IS NULL;
   ```

2. **Reassign based on organizational hierarchy:**
   - **HR Managers** (need full access) → Set `role_id = 8`
   - **HR Staff** (only master data) → Keep `role_id = 1`

3. **Verification:**
   - Ensure at least one active user has `role_id = 8` (HR_MANAGER)
   - Confirm no orphaned employee requests waiting for approval

**Critical:** No automated migration script will be provided. User performs manual SQL updates or through admin UI.

### 6.2 Deployment Sequence

**Timeline:** Deploy during low-traffic period (evening/weekend)

```
Step 1: User completes manual role migration in database
        ↓
Step 2: Deploy backend (recruitment-hris-api)
        - Authorization checks updated
        - Notification targeting updated
        - Route filtering updated
        ↓
Step 3: Deploy frontend (recruitment-hris) immediately after backend
        - Route access updated
        - Action buttons updated
        - Workflow transitions updated
        ↓
Step 4: (Optional) Clear user sessions
        - Force re-login to refresh cached role permissions
        ↓
Step 5: Verification testing with actual users
```

**Critical:** Backend and frontend **must deploy together** in the same maintenance window. A mismatch will cause authorization errors.

### 6.3 Rollback Plan

If issues arise post-deployment:

**Option A: Full Rollback**
1. Revert frontend code to previous version
2. Revert backend code to previous version
3. User reverts manual role changes in database
4. Verify system returns to original state

**Option B: Forward Fix**
1. Keep role changes in database
2. Deploy hotfix to code if needed
3. Faster than full rollback if issue is minor

### 6.4 Post-Deployment Verification

**Test matrix with actual users:**

| Role | Test Case | Expected Result |
|------|-----------|-----------------|
| HUMAN_RESOURCES | Navigate to `/employee-request` | ❌ Redirected to `/dashboard` or 403 error |
| HUMAN_RESOURCES | Navigate to `/organization/departments` | ✅ Page loads, can CRUD |
| HUMAN_RESOURCES | Navigate to `/employees` | ✅ Page loads, can CRUD |
| HR_MANAGER | Navigate to `/employee-request` | ✅ Page loads, can see list |
| HR_MANAGER | Approve employee request at `hod_reviewed` status | ✅ Button visible, action succeeds |
| HR_MANAGER | Start recruitment from `approved` status | ✅ Button visible, action succeeds |
| HR_MANAGER | Navigate to `/organization/departments` | ✅ Page loads, can CRUD |
| HR_MANAGER | Navigate to `/users` | ✅ Page loads, can manage users |
| SUPER_ADMIN | All routes and actions | ✅ Full access maintained |

**Email notification test:**
1. Create employee request as Manager
2. HOD approves → Verify only HR_MANAGER users receive email (not HUMAN_RESOURCES)
3. HR_MANAGER approves → Verify only Management users receive email
4. Management approves → Verify only HR_MANAGER users + requester receive email

---

## 7. Edge Cases and Error Handling

### 7.1 HUMAN_RESOURCES Accessing Blocked Routes

**Scenario:** User with HUMAN_RESOURCES role tries to access `/employee-request`

**Frontend behavior:**
- `hasRouteAccess()` returns `false`
- Router guard redirects to `/dashboard`
- Navigation menu hides `/employee-request`, `/recruitment`, `/onboarding`, `/users`, `/roles-access` links

**Backend behavior:**
- API endpoint checks `user.roleName`
- Returns `403 Forbidden` if HUMAN_RESOURCES
- Error response: `{ success: false, message: "You do not have permission to access this resource" }`

### 7.2 Active Employee Requests in Progress

**Scenario:** Employee request is at `hod_reviewed` status when deployment happens

**Before deployment:**
- HUMAN_RESOURCES users can see and approve it

**After deployment:**
- Only HR_MANAGER users can see and approve it
- HUMAN_RESOURCES users lose visibility (filtered out by backend)

**Mitigation:**
- Verify at least one HR_MANAGER user exists before deployment
- Communicate to HR staff about role changes
- No requests should be orphaned if migration is done correctly

### 7.3 Email Notifications During Deployment

**Scenario:** Notification email is queued before deployment, delivers after

**Handling:**
- Backend queries fresh user data when sending (not cached)
- Notifications resolved at send-time, not queue-time
- If using inline notification (no queue), no issue
- If using background queue, ensure worker processes use new code after deployment

### 7.4 Mixed Sessions (User Logged In During Deployment)

**Scenario:** User has old frontend cached in browser, backend updates first

**Handling:**
- Backend rejects unauthorized requests with `403 Forbidden`
- Frontend shows error toast: "Permission denied. Please refresh the page."
- User hard-refreshes to get new frontend bundle
- Recommendation: Deploy during low-traffic period to minimize impact

### 7.5 HR_ROLES Helper Function Impact

**File:** `src/lib/constants/roles.ts`

**Function:**
```typescript
export function isHrRole(roleId: number | undefined | null): boolean {
  return roleId != null && (HR_ROLES as number[]).includes(roleId);
}
```

**Behavior change:**
- `isHrRole(1)` → `false` (HUMAN_RESOURCES excluded)
- `isHrRole(8)` → `true` (HR_MANAGER included)
- `isHrRole(3)` → `true` (SUPER_ADMIN included)

**Impact:** Any component using `isHrRole()` for permission checks will automatically enforce new permissions after deployment.

---

## 8. Files to Modify

### Frontend (recruitment-hris)

| File | Change Summary | Priority |
|------|---------------|----------|
| `src/lib/constants/roles.ts` | Update `HR_ROLES` array: remove `HUMAN_RESOURCES`, keep only `HR_MANAGER` and `SUPER_ADMIN` | High |
| `src/lib/constants/routeAccess.ts` | Update `ALL_ACTIVE_ROLES`: remove `HUMAN_RESOURCES`, add `HR_MANAGER`<br>Add `HUMAN_RESOURCES` explicitly to master data routes<br>Replace `HUMAN_RESOURCES` with `HR_MANAGER` in approval/recruitment routes | High |
| `src/lib/constants/employeeRequest.ts` | Update `WORKFLOW_TRANSITIONS`: replace `ROLES.HUMAN_RESOURCES` with `ROLES.HR_MANAGER` in 3 transitions | High |
| `src/app/(protected)/employee-request/[id]/page.tsx` | Replace `ROLES.HUMAN_RESOURCES` with `ROLES.HR_MANAGER` in 3 action button checks | High |
| `src/hooks/useAssessmentPermission.ts` | Review and update if contains HUMAN_RESOURCES checks related to recruitment | Medium |

### Backend (recruitment-hris-api)

| File | Change Summary | Priority |
|------|---------------|----------|
| `src/services/employeeRequestService.ts` | Update `resolveNotificationTargets()`: query `'HR Manager'` only<br>Update `updateEmployeeRequestStatus()`: check for `'HR Manager'` role<br>Add explicit block for `'Human Resources'` role | High |
| `src/repositories/employeeRequestRepository.ts` | Update `findAll()`: HR_MANAGER sees all, HUMAN_RESOURCES blocked<br>Update `getStats()`: same filtering logic | High |
| `src/middlewares/roleMiddleware.ts` | Update `HR_ROLE_IDS` constant from `[1]` to `[8]` (if exists) | High |
| `src/services/emailService.ts` | Update email templates: change "Human Resources" to "HR Manager" in subject/body | Medium |
| `src/constants/employeeRequestConstants.ts` | Update notification action labels if they reference "Human Resources" | Low |

### Documentation

| File | Change Summary | Priority |
|------|---------------|----------|
| `docs/superpowers/specs/2026-03-29-employee-request-notification-design.md` | Update notification matrix: change HR recipients to HR_MANAGER only | Low |
| `docs/superpowers/specs/2026-03-21-employee-request-multi-level-approval-design.md` | Update role definitions table to reflect HR_MANAGER as approval role | Low |

---

## 9. Testing Checklist

### Pre-Deployment Tests (Staging)

- [ ] Frontend builds without errors
- [ ] Backend builds without errors
- [ ] Unit tests pass (if role-based tests exist)
- [ ] Test user with HUMAN_RESOURCES role cannot access `/employee-request`
- [ ] Test user with HR_MANAGER role can access all routes
- [ ] Test employee request approval flow with HR_MANAGER role
- [ ] Test notification emails go to HR_MANAGER only

### Post-Deployment Tests (Production)

- [ ] HUMAN_RESOURCES user: Access master data pages (success)
- [ ] HUMAN_RESOURCES user: Access `/employee-request` (blocked)
- [ ] HUMAN_RESOURCES user: Access `/recruitment` (blocked)
- [ ] HR_MANAGER user: Access all routes (success)
- [ ] HR_MANAGER user: Approve employee request (success)
- [ ] HR_MANAGER user: Start recruitment (success)
- [ ] SUPER_ADMIN user: All actions (success)
- [ ] Email notifications: Only HR_MANAGER receives HR-level notifications
- [ ] No console errors in browser
- [ ] No 500 errors in backend logs

---

## 10. Out of Scope

The following are explicitly NOT part of this change:

- Automated database migration script for user roles
- Changes to other role permissions (MANAGER, HOD, MANAGEMENT, etc.)
- New features or workflow changes beyond role reversal
- Role creation or deletion (both roles already exist)
- UI redesign of role management pages
- Audit logging of role changes
- Real-time notification system (using existing polling)

---

## 11. Known Limitations

1. **Manual migration required** — User must manually reassign roles in database before deployment
2. **No gradual rollout** — Must deploy backend + frontend together
3. **Session cache** — Users may need to re-login to see updated permissions
4. **Existing notification queue** — If background queue is used, old notifications may target wrong role
5. **Documentation lag** — Existing design docs reference old role structure until updated

---

## 12. Success Criteria

Deployment is considered successful when:

1. ✅ HR_MANAGER users can approve employee requests
2. ✅ HUMAN_RESOURCES users can only access master data pages
3. ✅ HUMAN_RESOURCES users are blocked from `/employee-request`, `/recruitment`, `/onboarding`, `/users`, `/roles-access`
4. ✅ Email notifications for employee request approval go only to HR_MANAGER users
5. ✅ SUPER_ADMIN retains full access to all features
6. ✅ No 403 errors for authorized users
7. ✅ No orphaned employee requests (all have at least one HR_MANAGER who can approve)

---

## 13. Communication Plan

### Before Deployment

**Notify affected users:**
- HR staff (HUMAN_RESOURCES role) — explain access will be limited to master data
- HR managers (HR_MANAGER role) — explain they will gain approval permissions
- Managers with pending employee requests — confirm HR_MANAGER will handle approvals

**Message template:**
> We are updating HR role permissions on [DATE]. After the update:
> - **HR Staff** will have access to organization master data and employee lists only
> - **HR Managers** will handle all employee request approvals and recruitment processes
>
> If you have questions about your access level, please contact IT support.

### After Deployment

**Verification email:**
> HR role permissions have been updated. Please verify you can access the features you need. If you encounter permission errors, please clear your browser cache and re-login. Contact IT support if issues persist.

---

## 14. Related Documents

- [Employee Request Multi-Level Approval](./2026-03-21-employee-request-multi-level-approval-design.md)
- [Employee Request Notification Design](./2026-03-29-employee-request-notification-design.md)
- [Role Access Constants](../../src/lib/constants/roles.ts)
- [Workflow Transitions](../../src/lib/constants/employeeRequest.ts)
