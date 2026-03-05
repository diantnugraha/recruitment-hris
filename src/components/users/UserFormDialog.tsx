"use client";

import * as React from "react";
import { Loader2, Eye, EyeOff, UserPlus } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";

import userService from "@/services/user.service";
import employeeService from "@/services/employee.service";
import roleService from "@/services/role.service";
import { UserManagement } from "@/types/user-management";
import { Role } from "@/types/role";
import { EmployeeWithRelations } from "@/types";
import { showToast } from "@/lib/utils/toast-messages";

// --- Props ---

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserManagement | null; // null = create mode, object = edit mode
  onSuccess: () => void;
}

// --- Form State ---

interface FormState {
  displayName: string;
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
  roleId: string;
  employeeId: string;
  superiorId: string;
}

const initialForm: FormState = {
  displayName: "",
  email: "",
  name: "",
  password: "",
  confirmPassword: "",
  roleId: "",
  employeeId: "",
  superiorId: "",
};

// --- Component ---

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: UserFormDialogProps) {
  const isEdit = !!user;

  const [form, setForm] = React.useState<FormState>(initialForm);
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [employees, setEmployees] = React.useState<EmployeeWithRelations[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Fetch roles and employees when dialog opens
  React.useEffect(() => {
    if (open) {
      const fetchData = async () => {
        setIsLoading(true);

        // Fetch roles
        const rolesRes = await roleService.fetchAll();
        if (rolesRes.success && rolesRes.data) {
          setRoles(rolesRes.data);
        }

        // Fetch employees
        const allEmployees: EmployeeWithRelations[] = [];
        let page = 1;
        let totalPages = 1;

        do {
          const res = await employeeService.getAll(page, 100);
          if (res.success && res.data) {
            allEmployees.push(...res.data.data);
            totalPages = res.data.pagination.totalPages;
          } else {
            break;
          }
          page++;
        } while (page <= totalPages);

        setEmployees(allEmployees);
        setIsLoading(false);
      };

      fetchData();
    }
  }, [open]);

  // Reset form when dialog opens or user changes
  React.useEffect(() => {
    if (open) {
      if (user) {
        // Edit mode - populate form with user data
        setForm({
          displayName: user.displayName || "",
          email: user.email || "",
          name: user.name || "",
          password: "",
          confirmPassword: "",
          roleId: user.roleId ? String(user.roleId) : "",
          employeeId: user.employeeId ? String(user.employeeId) : "",
          superiorId: user.superiorId ? String(user.superiorId) : "",
        });
      } else {
        // Create mode - reset form
        setForm(initialForm);
      }
      setErrors({});
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [open, user]);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.displayName.trim()) {
      newErrors.displayName = "Display name is required";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Invalid email format";
    }

    if (form.password && form.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (form.password && form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    if (isEdit && user) {
      // Update existing user
      const res = await userService.update(user.id, {
        displayName: form.displayName.trim(),
        email: form.email.trim(),
        name: form.name.trim() || undefined,
        newPassword: form.password || undefined,
        roleId: form.roleId ? Number(form.roleId) : undefined,
        employeeId: form.employeeId ? Number(form.employeeId) : undefined,
        superiorId: form.superiorId ? Number(form.superiorId) : undefined,
      });

      if (res.success) {
        showToast.updated("User");
        onOpenChange(false);
        onSuccess();
      } else {
        showToast.updateError("user", res.message);
      }
    } else {
      // Create new user
      const res = await userService.create({
        displayName: form.displayName.trim(),
        email: form.email.trim(),
        name: form.name.trim() || undefined,
        password: form.password || undefined,
        roleId: form.roleId ? Number(form.roleId) : undefined,
        employeeId: form.employeeId ? Number(form.employeeId) : undefined,
        superiorId: form.superiorId ? Number(form.superiorId) : undefined,
      });

      if (res.success) {
        showToast.created("User");
        onOpenChange(false);
        onSuccess();
      } else {
        showToast.createError("user", res.message);
      }
    }

    setIsSubmitting(false);
  };

  const employeeOptions = employees.map((emp) => ({
    value: String(emp.id),
    label: `${emp.firstName} ${emp.lastName}`.trim() || emp.email,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {isEdit ? "Edit User" : "Add New User"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update user account information"
              : "Create a new user account"}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName">
                Display Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="displayName"
                value={form.displayName}
                onChange={(e) => handleChange("displayName", e.target.value)}
                placeholder="Enter display name"
                className={errors.displayName ? "border-destructive" : ""}
              />
              {errors.displayName && (
                <p className="text-xs text-destructive">{errors.displayName}</p>
              )}
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="name">Username</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Enter username"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="Enter email"
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="roleId">Role</Label>
              <Select
                value={form.roleId}
                onValueChange={(value) => handleChange("roleId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.roleId} value={String(role.roleId)}>
                      {role.roleName || `Role ${role.roleId}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">
                {isEdit ? "New Password" : "Password"}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder={
                    isEdit
                      ? "Leave blank to keep current password"
                      : "Enter password (min. 8 characters)"
                  }
                  className={errors.password ? "border-destructive pr-10" : "pr-10"}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
              {isEdit && (
                <p className="text-xs text-muted-foreground">
                  Leave blank to keep the current password
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  placeholder="Confirm password"
                  className={errors.confirmPassword ? "border-destructive pr-10" : "pr-10"}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Link to Employee */}
            <div className="space-y-2">
              <Label htmlFor="employeeId">Link to Employee</Label>
              <SearchableSelect
                options={employeeOptions}
                value={form.employeeId}
                onValueChange={(value) => handleChange("employeeId", value)}
                placeholder="Select employee"
                searchPlaceholder="Search employee..."
                emptyText="No employee found"
              />
            </div>

            {/* Superior */}
            <div className="space-y-2">
              <Label htmlFor="superiorId">Superior</Label>
              <SearchableSelect
                options={employeeOptions}
                value={form.superiorId}
                onValueChange={(value) => handleChange("superiorId", value)}
                placeholder="Select superior"
                searchPlaceholder="Search superior..."
                emptyText="No employee found"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? "Save Changes" : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default UserFormDialog;
