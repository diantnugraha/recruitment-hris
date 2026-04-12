# Profile Page & Header Click Area Separation

## Overview

Add a profile page where users can view their information and change their password. Modify the header so clicking the avatar/name navigates to the profile page, while only the chevron icon triggers the logout dropdown.

## Header Modification

### Current State

The entire user section (avatar + name/email + chevron) is a single `DropdownMenuTrigger`. Clicking anywhere opens the dropdown with "Logout".

### New Behavior

Split into two distinct click areas:

- **Avatar + name/email**: Wrapped in `<Link href="/profile">`. Navigates directly to profile page. Subtle hover effect (opacity or background change).
- **Chevron icon only**: Remains as `DropdownMenuTrigger`. Opens dropdown with "Logout" item, which triggers the existing logout confirmation dialog.
- **Click target**: Chevron button has minimum 32x32px click area for accessibility.
- **Mobile**: Chevron is currently `hidden md:block`. Change to always visible so mobile users can still access logout. On mobile: avatar → profile link, chevron → logout dropdown.

### File Changed

`src/components/layout/header.tsx`

## Profile Page

### Route

`app/(protected)/profile/page.tsx` — client component inside the existing protected layout.

### Layout

Two Cards stacked vertically:

**Card 1 — Profile Information (read-only)**

- Large avatar (64px) with user initials, same style as header avatar but bigger
- Display name, email, role badge (navy style, same as header)
- Separator
- Employee data section (only shown if `user.employeeId` exists):
  - Employee ID
  - Department(s)
  - Division(s)
  - Job Title
  - Job Level

**Card 2 — Change Password**

- Form with 3 fields: Current Password, New Password, Confirm Password
- All fields use password input type with toggle visibility
- "Cancel" button resets form, "Update Password" button submits
- Button disabled during submission, text changes to "Updating..."

### Styling

- Page background: `var(--hsd-ui-color-gray-100)`
- Cards: white background, `border: 1px solid var(--hsd-ui-color-gray-300)`, `border-radius: var(--hsd-ui-radii-md)`
- Headings: navy-900 or gray-900, font-weight 500
- Labels: gray-500, font-weight 300
- Values: gray-900, font-weight 400
- All using TUV design tokens and Poppins font

## Data Flow

### Loading Profile

1. Auth data (`displayName`, `email`, `name`, `roleId`, `roleName`) from `useAuthStore()` — already available client-side.
2. Employee data fetched via `GET /employees/:employeeId` using the existing `employee.service.ts`, only if `user.employeeId` is not null.

### Change Password

1. Frontend validates via Zod schema:
   - `currentPassword`: required string
   - `newPassword`: min 8 characters
   - `confirmPassword`: must match `newPassword`
2. API call: `PUT /users/:id/password` with body `{ currentPassword, newPassword }`
3. `confirmPassword` is frontend-only validation, not sent to backend.

### Service

New file `src/services/profile.service.ts`:
- `changePassword(userId: string, data: { currentPassword: string; newPassword: string })` — calls `PUT /users/${userId}/password`

Separate from `user.service.ts` which is for admin user management.

## Error Handling

- Wrong current password: backend returns error, displayed via toast using `getErrorMessage()`
- Success: toast "Password updated successfully", form reset to empty
- Network error: toast with error message
- Loading state: submit button disabled + "Updating..." text

## Validation Schema

Added to `src/lib/schemas.ts`:

```typescript
export const changePasswordSchema = z.object({
  currentPassword: requiredString('Current password'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Confirm password is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
```

## Files to Create/Modify

| Action | File |
|--------|------|
| Modify | `src/components/layout/header.tsx` — split click areas |
| Create | `src/app/(protected)/profile/page.tsx` — profile page |
| Create | `src/services/profile.service.ts` — change password API |
| Modify | `src/lib/schemas.ts` — add changePasswordSchema |
