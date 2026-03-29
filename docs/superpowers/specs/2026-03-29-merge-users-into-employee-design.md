# Design: Merge Users into Employee Detail (Frontend-Only)

**Date:** 2026-03-29
**Approach:** Frontend-Only Merge (Approach 1)

## Summary

Remove the standalone Users management pages and move password + role management into Employee Detail/Edit pages. Backend remains unchanged — both `users` and `employee_list` tables stay separate. The frontend calls existing User API endpoints from within Employee pages.

## Decisions

- All users must have an employee record (enforced by workflow, not DB)
- Employee create flow unchanged: user account auto-created with default role "Employee" + random password + welcome email
- Role and password editing happens in Employee Edit page
- Employee list page: no changes
- Backend: no changes

## What Gets Removed

1. **Pages:**
   - `src/app/(protected)/users/page.tsx` (list)
   - `src/app/(protected)/users/[id]/page.tsx` (detail)
   - `src/app/(protected)/users/new/page.tsx` (create)
   - `src/app/(protected)/users/[id]/edit/page.tsx` (edit)

2. **Components:**
   - `src/components/users/UserFormDialog.tsx`
   - `src/components/users/UserDetailDialog.tsx`

3. **Sidebar:** Remove "Users" menu item from navigation

## What Gets Added

### Employee Detail Page (`/employees/[id]`)

New Card section "Account & Access" after existing info sections:
- **Role:** Badge showing role name (e.g., "Super Admin", "HR")
- **Email Verified:** Green/gray badge
- **Edge case:** If no user account linked, show "No account linked" message + "Create Account" button

### Employee Edit Page (`/employees/[id]/edit`)

New form section "Account & Access" below existing form sections:
- **Role:** Select dropdown (fetches role list from API)
- **New Password:** Optional input (blank = no change, min 8 chars)
- **Confirm Password:** Appears when New Password is filled

### Data Flow

1. Employee Detail/Edit fetches employee data as usual
2. Use employee's linked user data: call `GET /v1/user-rest` filtered by employee ID to get user account (role, verified status, user ID)
3. On save role/password: call `PUT /v1/user-rest/:userId`

## Files Modified

| File | Change |
|------|--------|
| `src/app/(protected)/employees/[id]/page.tsx` | Add "Account & Access" card section |
| `src/app/(protected)/employees/[id]/edit/page.tsx` | Add role select + password fields |
| `src/services/user.service.ts` | Keep as-is, import in employee pages |
| `src/components/layout/Sidebar.tsx` (or equivalent) | Remove Users menu item |

## Files Deleted

| File | Reason |
|------|--------|
| `src/app/(protected)/users/` (entire directory) | Replaced by Employee Detail |
| `src/components/users/` (entire directory) | No longer needed |

## Out of Scope

- Backend changes (no DB migration, no API changes)
- Employee list page changes
- Employee create page changes (auto-create user flow stays)
- `user.service.ts` deletion (still needed for API calls from employee pages)
