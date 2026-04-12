"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, User, KeyRound, Users } from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TuvBadge } from "@/components/shared/tuv-badge";
import { Skeleton } from "@/components/ui/skeleton";

import { useAuthStore } from "@/stores/auth-store";
import { employeeService } from "@/services/employee.service";
import profileService from "@/services/profile.service";
import { showToast } from "@/lib/utils/toast-messages";
import { ROLE_LABELS, type RoleId } from "@/lib/constants/roles";
import { getInitials, formatShortDate } from "@/lib/utils";

import type { EmployeeWithRelations } from "@/types";

// --- Validation schema ---

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// --- TUV button style helpers (matching employee detail page) ---

const btnPrimary = {
  backgroundColor: "var(--hsd-ui-background-color-primary)",
  borderColor: "var(--hsd-ui-border-color-primary)",
  color: "var(--hsd-ui-text-color-primary)",
  borderRadius: "4px",
  height: "38px",
  padding: "0 16px",
  fontSize: "0.875rem",
  fontWeight: 500,
} as const;

const btnSecondary = {
  borderRadius: "4px",
  height: "38px",
  padding: "0 16px",
  fontSize: "0.875rem",
  fontWeight: 500,
  borderColor: "rgba(120,134,127,0.2)",
} as const;

// --- Reusable TUV detail item (same pattern as employee detail page) ---

function DetailItem({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div>
      <p
        style={{
          fontSize: "0.6875rem",
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "var(--hsd-ui-color-gray-500)",
          margin: 0,
        }}
      >
        {label}
      </p>
      {href && value ? (
        <a
          href={href}
          style={{
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "var(--hsd-ui-color-navy-500)",
            margin: "2px 0 0",
            display: "block",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.textDecoration = "underline";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.textDecoration = "none";
          }}
        >
          {value}
        </a>
      ) : (
        <p
          style={{
            fontSize: "0.875rem",
            fontWeight: 500,
            color: value
              ? "var(--hsd-ui-color-gray-900)"
              : "var(--hsd-ui-color-gray-400)",
            margin: "2px 0 0",
          }}
        >
          {value || "No Data"}
        </p>
      )}
    </div>
  );
}

// --- TUV section card wrapper (same pattern as employee detail page) ---

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
  }>;
  children: React.ReactNode;
}) {
  return (
    <section
      className="border"
      style={{
        borderRadius: "8px",
        backgroundColor: "#fff",
        borderColor: "rgba(120, 134, 127, 0.2)",
      }}
    >
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid rgba(120, 134, 127, 0.15)" }}
      >
        <h2
          style={{
            fontSize: "0.9375rem",
            fontWeight: 600,
            color: "var(--hsd-ui-color-gray-900)",
            margin: 0,
          }}
        >
          {title}
        </h2>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: "var(--hsd-ui-color-gray-100)" }}
        >
          <Icon
            style={{
              width: "16px",
              height: "16px",
              color: "var(--hsd-ui-color-gray-500)",
            }}
          />
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

// --- Loading skeleton ---

function ProfileSkeleton() {
  return (
    <div className="space-y-5">
      {/* Header skeleton */}
      <div
        className="border p-6"
        style={{
          borderRadius: "8px",
          backgroundColor: "#fff",
          borderColor: "rgba(120, 134, 127, 0.2)",
        }}
      >
        <div className="flex items-start gap-5">
          <Skeleton className="h-20 w-20 shrink-0" style={{ borderRadius: "8px" }} />
          <div className="flex-1 space-y-3 pt-1">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-36" />
            <div className="pt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Section skeleton */}
      <div
        className="border p-6 space-y-4"
        style={{
          borderRadius: "8px",
          backgroundColor: "#fff",
          borderColor: "rgba(120, 134, 127, 0.2)",
        }}
      >
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Page component ---

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [employee, setEmployee] = React.useState<EmployeeWithRelations | null>(null);
  const [loadingEmployee, setLoadingEmployee] = React.useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Fetch employee data if user has employeeId
  const fetchEmployee = React.useCallback(async (employeeId: number) => {
    setLoadingEmployee(true);
    try {
      const res = await employeeService.getById(employeeId);
      if (res.success && res.data) {
        setEmployee(res.data);
      }
    } catch {
      // Non-critical — profile info still shows auth data
    } finally {
      setLoadingEmployee(false);
    }
  }, []);

  React.useEffect(() => {
    if (user?.employeeId) {
      fetchEmployee(user.employeeId);
    }
  }, [user?.employeeId, fetchEmployee]);

  // Change password handler
  const onSubmitPassword = async (data: ChangePasswordFormData) => {
    if (!user?.id) return;

    try {
      const res = await profileService.changePassword(user.id, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      if (res.success) {
        showToast.success("Password updated successfully");
        reset();
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
      } else {
        showToast.error(res.message || "Failed to update password");
      }
    } catch (error: unknown) {
      showToast.updateError("Password", error);
    }
  };

  const displayName = user?.displayName || user?.name || "User";
  const initials = getInitials(displayName);
  const displayRoleName = user?.roleId
    ? ROLE_LABELS[user.roleId as RoleId] ?? user.roleName ?? null
    : null;

  // Employee-derived info for profile header
  const departmentName = employee?.department?.name || "";
  const jobTitleName = employee?.jobTitle?.name || "";
  const jobLevelName = employee?.jobLevel?.name || "";
  const joinDate = employee?.hireDate ? formatShortDate(employee.hireDate) : "";

  return (
    <>
      <Header />
      <PageContainer>
        <div className="space-y-5">
          {/* ===== Profile Header Card ===== */}
          {loadingEmployee && user?.employeeId ? (
            <ProfileSkeleton />
          ) : (
            <>
              <div
                className="border"
                style={{
                  borderRadius: "8px",
                  backgroundColor: "#fff",
                  borderColor: "rgba(120, 134, 127, 0.2)",
                }}
              >
                <div className="p-6">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                    {/* Avatar — rounded square, navy-50, matching employee detail */}
                    <div
                      className="flex h-20 w-20 shrink-0 items-center justify-center"
                      style={{
                        borderRadius: "8px",
                        backgroundColor: "var(--hsd-ui-color-navy-50)",
                      }}
                    >
                      {initials ? (
                        <span
                          style={{
                            fontSize: "1.5rem",
                            fontWeight: 700,
                            color: "var(--hsd-ui-color-navy-500)",
                          }}
                        >
                          {initials}
                        </span>
                      ) : (
                        <Users
                          style={{
                            width: "36px",
                            height: "36px",
                            color: "var(--hsd-ui-color-navy-500)",
                          }}
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 sm:pt-2">
                      {/* Name */}
                      <h1
                        style={{
                          fontSize: "1.5rem",
                          fontWeight: 600,
                          color: "var(--hsd-ui-color-gray-900)",
                          margin: 0,
                        }}
                      >
                        {displayName}
                      </h1>

                      {/* Badges row */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {displayRoleName && (
                          <TuvBadge
                            text={displayRoleName}
                            variant="brand"
                            size="sm"
                            border
                          />
                        )}
                        {employee?.employeeNik && (
                          <TuvBadge
                            text={`NIK: ${employee.employeeNik}`}
                            variant="info"
                            size="sm"
                            border
                          />
                        )}
                        {user?.email && (
                          <TuvBadge
                            text={user.email}
                            variant="dark"
                            size="sm"
                            border
                          />
                        )}
                      </div>

                      {/* Key facts row */}
                      {employee && (
                        <div
                          className="mt-5 pt-4 grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4"
                          style={{
                            borderTop: "1px solid rgba(120, 134, 127, 0.15)",
                          }}
                        >
                          <DetailItem label="Department" value={departmentName} />
                          <DetailItem label="Job Title" value={jobTitleName} />
                          <DetailItem label="Job Level" value={jobLevelName} />
                          <DetailItem label="Join Date" value={joinDate} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ===== Personal Information (from employee data) ===== */}
              {employee && (
                <SectionCard title="Personal Information" icon={User}>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
                    <DetailItem
                      label="Birth Date"
                      value={employee.dateOfBirth ? formatShortDate(employee.dateOfBirth) : ""}
                    />
                    <DetailItem label="Religion" value={employee.religion || ""} />
                    <DetailItem label="Ethnic" value={employee.ethnicity || ""} />
                    <DetailItem
                      label="Marital Status"
                      value={
                        employee.maritalStatus
                          ? employee.maritalStatus.charAt(0).toUpperCase() +
                            employee.maritalStatus.slice(1)
                          : ""
                      }
                    />
                    <DetailItem label="Nationality" value={employee.nationality || ""} />
                    <DetailItem label="Location" value={employee.location || ""} />
                  </div>

                  {/* Contact */}
                  <div
                    style={{
                      marginTop: "20px",
                      paddingTop: "16px",
                      borderTop: "1px solid rgba(120, 134, 127, 0.12)",
                    }}
                  >
                    <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
                      <DetailItem
                        label="Email"
                        value={employee.email || user?.email || ""}
                        href={
                          (employee.email || user?.email)
                            ? `mailto:${employee.email || user?.email}`
                            : undefined
                        }
                      />
                      <DetailItem
                        label="Phone"
                        value={employee.phone || ""}
                        href={employee.phone ? `tel:${employee.phone}` : undefined}
                      />
                    </div>
                  </div>

                  {/* Address */}
                  {employee.address && (
                    <div
                      style={{
                        marginTop: "20px",
                        paddingTop: "16px",
                        borderTop: "1px solid rgba(120, 134, 127, 0.12)",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "0.6875rem",
                          fontWeight: 500,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "var(--hsd-ui-color-gray-500)",
                          margin: 0,
                        }}
                      >
                        Address
                      </p>
                      <p
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: 500,
                          lineHeight: 1.6,
                          color: "var(--hsd-ui-color-gray-900)",
                          margin: "4px 0 0",
                        }}
                      >
                        {employee.address}
                      </p>
                    </div>
                  )}
                </SectionCard>
              )}

              {/* ===== Change Password ===== */}
              <SectionCard title="Change Password" icon={KeyRound}>
                <form
                  onSubmit={handleSubmit(onSubmitPassword)}
                  className="space-y-5"
                >
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    {/* Current Password */}
                    <div>
                      <p
                        style={{
                          fontSize: "0.6875rem",
                          fontWeight: 500,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "var(--hsd-ui-color-gray-500)",
                          margin: "0 0 6px",
                        }}
                      >
                        Current Password
                      </p>
                      <div className="relative">
                        <Input
                          type={showCurrentPassword ? "text" : "password"}
                          placeholder="Enter current password"
                          className="pr-10"
                          {...register("currentPassword")}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                          style={{ color: "var(--hsd-ui-color-gray-500)" }}
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? (
                            <EyeOff style={{ width: "16px", height: "16px" }} />
                          ) : (
                            <Eye style={{ width: "16px", height: "16px" }} />
                          )}
                        </button>
                      </div>
                      {errors.currentPassword && (
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: "rgba(250, 55, 70, 1)",
                            margin: "4px 0 0",
                          }}
                        >
                          {errors.currentPassword.message}
                        </p>
                      )}
                    </div>

                    {/* New Password */}
                    <div>
                      <p
                        style={{
                          fontSize: "0.6875rem",
                          fontWeight: 500,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "var(--hsd-ui-color-gray-500)",
                          margin: "0 0 6px",
                        }}
                      >
                        New Password
                      </p>
                      <div className="relative">
                        <Input
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Minimum 8 characters"
                          className="pr-10"
                          {...register("newPassword")}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                          style={{ color: "var(--hsd-ui-color-gray-500)" }}
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff style={{ width: "16px", height: "16px" }} />
                          ) : (
                            <Eye style={{ width: "16px", height: "16px" }} />
                          )}
                        </button>
                      </div>
                      {errors.newPassword && (
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: "rgba(250, 55, 70, 1)",
                            margin: "4px 0 0",
                          }}
                        >
                          {errors.newPassword.message}
                        </p>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <p
                        style={{
                          fontSize: "0.6875rem",
                          fontWeight: 500,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "var(--hsd-ui-color-gray-500)",
                          margin: "0 0 6px",
                        }}
                      >
                        Confirm Password
                      </p>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Re-enter new password"
                          className="pr-10"
                          {...register("confirmPassword")}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                          style={{ color: "var(--hsd-ui-color-gray-500)" }}
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff style={{ width: "16px", height: "16px" }} />
                          ) : (
                            <Eye style={{ width: "16px", height: "16px" }} />
                          )}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: "rgba(250, 55, 70, 1)",
                            margin: "4px 0 0",
                          }}
                        >
                          {errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    className="flex justify-end"
                    style={{
                      gap: "8px",
                      paddingTop: "8px",
                      borderTop: "1px solid rgba(120, 134, 127, 0.12)",
                    }}
                  >
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        reset();
                        setShowCurrentPassword(false);
                        setShowNewPassword(false);
                        setShowConfirmPassword(false);
                      }}
                      disabled={isSubmitting}
                      style={btnSecondary}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      style={btnPrimary}
                    >
                      {isSubmitting ? "Updating..." : "Update Password"}
                    </Button>
                  </div>
                </form>
              </SectionCard>
            </>
          )}
        </div>
      </PageContainer>
    </>
  );
}
