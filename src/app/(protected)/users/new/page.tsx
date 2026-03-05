"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save, Eye, EyeOff } from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Role } from "@/types/role";
import { EmployeeWithRelations } from "@/types";
import { showToast } from "@/lib/utils/toast-messages";

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

export default function NewUserPage() {
  const router = useRouter();

  const [form, setForm] = React.useState<FormState>(initialForm);
  const [employees, setEmployees] = React.useState<EmployeeWithRelations[]>([]);
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Fetch employees and roles for dropdown
  React.useEffect(() => {
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
  }, []);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear error when field changes
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
      router.push("/users");
    } else {
      showToast.createError("user", res.message);
    }

    setIsSubmitting(false);
  };

  const employeeOptions = employees.map((emp) => ({
    value: String(emp.id),
    label: `${emp.firstName} ${emp.lastName}`.trim() || emp.email,
  }));

  return (
    <>
      <Header title="Add New User" />
      <PageContainer>
        <div className="space-y-4">
          {/* Top Bar */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/users")}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Users</span>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Account Information */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Account Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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

                  <div className="space-y-2">
                    <Label htmlFor="name">Username</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      placeholder="Enter username"
                    />
                  </div>

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
                </CardContent>
              </Card>

              {/* Password & Relations */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Password & Relations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => handleChange("password", e.target.value)}
                        placeholder="Enter password (min. 8 characters)"
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
                  </div>

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

                  <div className="space-y-2">
                    <Label htmlFor="employeeId">Link to Employee</Label>
                    <SearchableSelect
                      options={employeeOptions}
                      value={form.employeeId}
                      onValueChange={(value) => handleChange("employeeId", value)}
                      placeholder="Select employee"
                      searchPlaceholder="Search employee..."
                      emptyText="No employee found"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="superiorId">Superior</Label>
                    <SearchableSelect
                      options={employeeOptions}
                      value={form.superiorId}
                      onValueChange={(value) => handleChange("superiorId", value)}
                      placeholder="Select superior"
                      searchPlaceholder="Search superior..."
                      emptyText="No employee found"
                      disabled={isLoading}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Submit Button */}
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/users")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save User
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </PageContainer>
    </>
  );
}
