# Merge Users into Employee Detail — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove standalone Users pages and integrate password + role management into Employee Detail/Edit pages.

**Architecture:** Frontend-only change. Employee Detail page gets a read-only "Account & Access" card showing role and verified status. Employee Edit page gets editable role dropdown + password fields. Both pages fetch linked user data via existing User API. Sidebar "Users" menu item removed.

**Tech Stack:** Next.js, React, TypeScript, shadcn/ui, Tailwind CSS, existing user.service.ts + role.service.ts

---

### Task 1: Add `getByEmployeeId` helper to user service

**Files:**
- Modify: `src/services/user.service.ts`

- [ ] **Step 1: Add `getByEmployeeId` method to `userService`**

This method fetches all users and finds the one linked to a given employee ID. The backend doesn't support `employeeId` filter, so we filter client-side. User count is small (< 100), so this is acceptable.

```typescript
// Add this method to the userService object, after the existing `fetchAll` method:

  // Get user linked to a specific employee ID
  async getByEmployeeId(employeeId: string): Promise<ApiResponse<UserManagement | null>> {
    try {
      const allRes = await this.fetchAll();
      if (!allRes.success || !allRes.data) {
        return { success: false, message: allRes.message || "Failed to fetch users" };
      }
      const user = allRes.data.find(
        (u) => String(u.employeeId) === String(employeeId)
      ) || null;
      return { success: true, data: user };
    } catch (error: unknown) {
      console.error("User getByEmployeeId Error:", error);
      return { success: false, message: "Failed to fetch user by employee ID" };
    }
  },
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to user.service.ts

- [ ] **Step 3: Commit**

```bash
git add src/services/user.service.ts
git commit -m "feat: add getByEmployeeId helper to user service"
```

---

### Task 2: Add "Account & Access" section to Employee Detail page

**Files:**
- Modify: `src/app/(protected)/employees/[id]/page.tsx`

- [ ] **Step 1: Add imports for user service, role types, and Shield icon**

At the top of the file, add these imports:

```typescript
import { Shield } from "lucide-react"; // add to existing lucide import
import userService from "@/services/user.service";
import type { UserManagement } from "@/types/user-management";
```

- [ ] **Step 2: Add user state and fetch logic**

Inside `EmployeeDetailPage` component, add state for user data:

```typescript
const [linkedUser, setLinkedUser] = React.useState<UserManagement | null>(null);
```

Update `fetchData` to also fetch the linked user. After the employee is successfully fetched (inside `if (empRes.success && empRes.data)`), add:

```typescript
// Fetch linked user account
const userRes = await userService.getByEmployeeId(empRes.data.employeeId || empRes.data.id);
if (userRes.success && userRes.data) {
  setLinkedUser(userRes.data);
}
```

- [ ] **Step 3: Add "Account & Access" card in the right column**

After the "Contact Info" section card (around line 504), add a new card inside the right column `div`:

```tsx
{/* Account & Access Card */}
<section className="rounded-2xl border bg-card">
  <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
    <h2 className="text-base font-semibold text-foreground">Account & Access</h2>
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
      <Shield className="h-4 w-4 text-muted-foreground" />
    </div>
  </div>
  <div className="px-6 py-5">
    {linkedUser ? (
      <div className="grid grid-cols-1 gap-x-8 gap-y-5">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Role
          </p>
          <div className="mt-1">
            <Badge variant="secondary" className="text-xs">
              {linkedUser.role?.roleName || "No Role"}
            </Badge>
          </div>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Email Verified
          </p>
          <div className="mt-1">
            <Badge
              variant={linkedUser.emailVerifiedAt ? "default" : "outline"}
              className="text-xs"
            >
              {linkedUser.emailVerifiedAt ? "Verified" : "Not Verified"}
            </Badge>
          </div>
        </div>
      </div>
    ) : (
      <p className="text-sm text-muted-foreground">
        No user account linked to this employee.
      </p>
    )}
  </div>
</section>
```

- [ ] **Step 4: Verify no TypeScript errors and test visually**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/app/(protected)/employees/[id]/page.tsx
git commit -m "feat: add Account & Access section to Employee Detail page"
```

---

### Task 3: Add "Account & Access" section to Employee Edit page

**Files:**
- Modify: `src/app/(protected)/employees/[id]/edit/page.tsx`

- [ ] **Step 1: Add imports**

```typescript
import { Shield, Eye, EyeOff } from "lucide-react"; // add to existing lucide import
import userService from "@/services/user.service";
import roleService from "@/services/role.service";
import type { UserManagement } from "@/types/user-management";
import type { Role } from "@/types/role";
```

- [ ] **Step 2: Add state for user data, roles, and password fields**

Inside `EmployeeEditPage` component, add:

```typescript
// Account & Access state
const [linkedUser, setLinkedUser] = React.useState<UserManagement | null>(null);
const [roles, setRoles] = React.useState<Role[]>([]);
const [accountRoleId, setAccountRoleId] = React.useState<string>("");
const [newPassword, setNewPassword] = React.useState("");
const [confirmPassword, setConfirmPassword] = React.useState("");
const [showPassword, setShowPassword] = React.useState(false);
const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
```

- [ ] **Step 3: Fetch linked user and roles in `fetchData`**

Inside `fetchData`, add `roleService.fetchAll()` to the `Promise.all` call, and fetch the linked user after the employee is loaded. Update the destructuring:

```typescript
const [empRes, titleRes, allEmpRes, roleRes] = await Promise.all([
  employeeService.getById(id),
  jobTitleService.fetchAll(),
  employeeService.getAll(1, 100),
  roleService.fetchAll(),
]);
```

After `setJobTitles(fetchedJobTitles)`, add role data:

```typescript
if (roleRes.success && roleRes.data) setRoles(roleRes.data);
```

Inside the `if (empRes.success && empRes.data)` block, after `setForm(formState)`, add:

```typescript
// Fetch linked user account
const userRes = await userService.getByEmployeeId(empRes.data.employeeId || empRes.data.id);
if (userRes.success && userRes.data) {
  setLinkedUser(userRes.data);
  setAccountRoleId(String(userRes.data.roleId));
}
```

- [ ] **Step 4: Update `performUpdate` to also save user account changes**

After the successful employee update (`if (response.success)`), add logic to update the user account if role or password changed:

```typescript
if (response.success) {
  // Update user account if role or password changed
  if (linkedUser) {
    const hasRoleChange = accountRoleId && String(linkedUser.roleId) !== accountRoleId;
    const hasPasswordChange = newPassword.length > 0;

    if (hasRoleChange || hasPasswordChange) {
      const userUpdateData: Record<string, unknown> = {
        displayName: linkedUser.displayName,
        email: linkedUser.email,
      };
      if (hasRoleChange) {
        userUpdateData.roleId = Number(accountRoleId);
      }
      if (hasPasswordChange) {
        userUpdateData.newPassword = newPassword;
      }

      const userRes = await userService.update(
        linkedUser.id,
        userUpdateData as import("@/types/user-management").UpdateUserRequest
      );
      if (!userRes.success) {
        showToast.updateError("user account", userRes.message);
      }
    }
  }

  showToast.updated("Employee");
  router.push(`/employees/${employee.id}`);
} else {
  showToast.updateError("employee", response.message);
}
```

Note: Move the existing `showToast.updated` and `router.push` lines into the new block above (remove the duplicate).

- [ ] **Step 5: Add password validation to form validity check**

Update the `isFormValid` variable to include password validation:

```typescript
const passwordValid = !newPassword || (newPassword.length >= 8 && newPassword === confirmPassword);

const isFormValid =
  form &&
  form.fullName.trim() &&
  form.birthDate &&
  form.jobTitleId &&
  form.joinDate &&
  form.email &&
  passwordValid &&
  (!structuralInfo.requireDepartmentSelection || form.departmentId);
```

- [ ] **Step 6: Add "Account & Access" form section in the JSX**

After the Family section closing `</div>` and before `</CardContent>`, add:

```tsx
<div className="border-t border-dashed" />

{/* ========== SECTION: ACCOUNT & ACCESS ========== */}
<div>
  <h2 className="text-base font-semibold uppercase tracking-wide mb-4 flex items-center gap-2">
    <Shield className="h-4 w-4" />
    Account & Access
  </h2>
  {linkedUser ? (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Role</Label>
          <Select
            value={accountRoleId}
            onValueChange={setAccountRoleId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((r) => (
                <SelectItem key={r.roleId} value={String(r.roleId)}>
                  {r.roleName || `Role ${r.roleId}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="newPassword">New Password</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Leave blank to keep current"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {newPassword && newPassword.length < 8 && (
            <p className="text-xs text-destructive">Minimum 8 characters</p>
          )}
        </div>
        {newPassword && (
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-destructive">Passwords do not match</p>
            )}
          </div>
        )}
      </div>
    </div>
  ) : (
    <p className="text-sm text-muted-foreground">
      No user account linked to this employee.
    </p>
  )}
</div>
```

- [ ] **Step 7: Verify no TypeScript errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 8: Commit**

```bash
git add src/app/(protected)/employees/[id]/edit/page.tsx
git commit -m "feat: add Account & Access section to Employee Edit page"
```

---

### Task 4: Remove "Users" menu from sidebar

**Files:**
- Modify: `src/components/layout/sidebar.tsx`

- [ ] **Step 1: Remove the Users menu item from navigation array**

In `sidebar.tsx`, find the "User Management" section (around line 103-116). Remove the Users item:

```typescript
// BEFORE:
{
  title: "User Management",
  items: [
    {
      title: "Users",
      href: "/users",
      icon: UserCog,
    },
    {
      title: "Roles Access",
      href: "/roles-access",
      icon: Shield,
    },
  ],
},

// AFTER:
{
  title: "User Management",
  items: [
    {
      title: "Roles Access",
      href: "/roles-access",
      icon: Shield,
    },
  ],
},
```

- [ ] **Step 2: Remove unused `UserCog` import if no longer used elsewhere**

Check if `UserCog` is used elsewhere in the file. If not, remove it from the lucide-react import.

- [ ] **Step 3: Verify no TypeScript errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/sidebar.tsx
git commit -m "feat: remove Users menu item from sidebar navigation"
```

---

### Task 5: Delete Users pages and components

**Files:**
- Delete: `src/app/(protected)/users/` (entire directory)
- Delete: `src/components/users/` (entire directory)

- [ ] **Step 1: Delete the Users pages directory**

```bash
rm -rf src/app/\(protected\)/users/
```

- [ ] **Step 2: Delete the Users components directory**

```bash
rm -rf src/components/users/
```

- [ ] **Step 3: Check for any remaining imports of deleted files**

Search for any remaining references to the deleted paths:

```bash
grep -r "from.*components/users" src/ || echo "No references found"
grep -r "from.*protected)/users" src/ || echo "No references found"
grep -r "href.*\"/users\"" src/ --include="*.tsx" --include="*.ts" || echo "No references found"
```

Fix any broken references found. The sidebar was already updated in Task 4, so likely only the sidebar had a reference.

- [ ] **Step 4: Verify no TypeScript errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove standalone Users pages and components"
```

---

### Task 6: Verify everything works end-to-end

- [ ] **Step 1: Start dev server and test**

Run: `npm run dev`

Verify:
1. Navigate to `/employees` — list page works normally, no changes
2. Click an employee — detail page shows "Account & Access" card with role badge and verified status
3. Click Edit — edit page shows "Account & Access" section with role dropdown and password fields
4. Change role and save — verify role is updated (check by going back to detail page)
5. Sidebar — "Users" menu item is gone, "Roles Access" still present
6. Navigate to `/users` directly — should show 404 (page deleted)

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit --pretty`
Expected: No errors

- [ ] **Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address issues found during end-to-end testing"
```
