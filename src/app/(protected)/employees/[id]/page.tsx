"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Pencil,
  Trash2,
  Loader2,
  User,
  Briefcase,
  Mail,
  AlertTriangle,
  Users,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { TuvBadge } from "@/components/shared/tuv-badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import employeeService from "@/services/employee.service";
import jobTitleService from "@/services/job-title.service";
import userService from "@/services/user.service";
import { EmployeeWithRelations, JobTitle } from "@/types";
import type { UserManagement } from "@/types/user-management";
import { formatShortDate, getInitials } from "@/lib/utils";
import { showToast } from "@/lib/utils/toast-messages";
import { useIsHr } from "@/hooks/useIsHr";
import { getEmployeeStatusConfig } from "@/lib/constants/employeeStatus";

/* TUV button style helpers */
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

const btnDanger = {
  backgroundColor: "rgba(250, 55, 70, 1)",
  borderColor: "rgba(250, 55, 70, 1)",
  color: "#fff",
  borderRadius: "4px",
  height: "38px",
  padding: "0 16px",
  fontSize: "0.875rem",
  fontWeight: 500,
} as const;

/* Reusable detail item — TUV tokens */
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

/* Section card wrapper — TUV border/colors */
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

/* Map employee status variant to TuvBadge variant */
function getStatusTuvVariant(
  variant: string
): "success" | "danger" | "info" | "warning" | "dark" | "brand" {
  switch (variant) {
    case "success":
      return "success";
    case "default":
      return "brand";
    case "secondary":
      return "warning";
    case "outline":
      return "dark";
    default:
      return "dark";
  }
}

function DetailSkeleton() {
  return (
    <div className="space-y-5">
      {/* Profile header skeleton */}
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
            <div className="pt-3 grid grid-cols-4 gap-4">
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
      {/* Content skeletons */}
      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div
            className="border p-6 space-y-4"
            style={{
              borderRadius: "8px",
              backgroundColor: "#fff",
              borderColor: "rgba(120, 134, 127, 0.2)",
            }}
          >
            <Skeleton className="h-5 w-40" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-2 space-y-5">
          <div
            className="border p-6 space-y-3"
            style={{
              borderRadius: "8px",
              backgroundColor: "#fff",
              borderColor: "rgba(120, 134, 127, 0.2)",
            }}
          >
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-10 w-full" style={{ borderRadius: "4px" }} />
            <Skeleton className="h-10 w-full" style={{ borderRadius: "4px" }} />
          </div>
          <div
            className="border p-6 space-y-3"
            style={{
              borderRadius: "8px",
              backgroundColor: "#fff",
              borderColor: "rgba(120, 134, 127, 0.2)",
            }}
          >
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-10 w-full" style={{ borderRadius: "4px" }} />
            <Skeleton className="h-10 w-full" style={{ borderRadius: "4px" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDateField(date?: string | null): string {
  if (!date) return "";
  return formatShortDate(date);
}

// --- Page component ---

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isHr = useIsHr();

  const [employee, setEmployee] =
    React.useState<EmployeeWithRelations | null>(null);
  const [jobTitles, setJobTitles] = React.useState<JobTitle[]>([]);
  const [linkedUser, setLinkedUser] = React.useState<UserManagement | null>(
    null
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const [empRes, jtRes] = await Promise.all([
      employeeService.getById(id),
      jobTitleService.fetchAll(),
    ]);

    if (empRes.success && empRes.data) {
      setEmployee(empRes.data);
      // Fetch linked user account
      const userRes = await userService.getByEmployeeId(empRes.data.id);
      if (userRes.success && userRes.data) {
        setLinkedUser(userRes.data);
      }
    } else {
      setError(empRes.message || "Failed to fetch employee");
    }

    if (jtRes.success && jtRes.data) {
      setJobTitles(jtRes.data);
    }

    setIsLoading(false);
  }, [id]);

  const matchedJobTitle = React.useMemo(() => {
    if (!employee || jobTitles.length === 0) return null;

    if (employee.jobTitleId) {
      const byId = jobTitles.find(
        (jt) => String(jt.id) === String(employee.jobTitleId)
      );
      if (byId) return byId;
    }

    if (employee.jobTitle?.name) {
      return jobTitles.find(
        (jt) =>
          jt.name.toLowerCase() === employee.jobTitle?.name?.toLowerCase()
      );
    }

    return null;
  }, [employee, jobTitles]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (!employee) return;
    setIsDeleting(true);
    const res = await employeeService.delete(employee.id);
    if (res.success) {
      showToast.deleted("Employee");
      router.push("/employees");
    } else {
      showToast.deleteError("employee", res.message);
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <>
        <Header title="Employee Details" />
        <PageContainer>
          <div style={{ marginBottom: "20px" }}>
            <Skeleton className="h-8 w-20" style={{ borderRadius: "4px" }} />
          </div>
          <DetailSkeleton />
        </PageContainer>
      </>
    );
  }

  // Error state
  if (error || !employee) {
    return (
      <>
        <Header title="Employee Details" />
        <PageContainer>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "256px",
              gap: "12px",
            }}
          >
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--hsd-ui-color-gray-500)",
              }}
            >
              {error || "Employee not found"}
            </p>
            <Button variant="outline" onClick={fetchData} style={btnSecondary}>
              Try Again
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  const statusCfg = getEmployeeStatusConfig(employee.status);
  const fullName =
    `${employee.firstName || ""} ${employee.lastName || ""}`.trim();
  const initials = getInitials(fullName || "?");
  const jobTitleName = employee.jobTitle?.name || "";
  const departmentName = employee.department?.name || "";

  const maritalStatusLabel = employee.maritalStatus
    ? employee.maritalStatus.charAt(0).toUpperCase() +
      employee.maritalStatus.slice(1)
    : "";

  // Conditional date fields
  const conditionalDates: { label: string; value: string }[] = [];
  if (employee.permanentDate) {
    conditionalDates.push({
      label: "Permanent Date",
      value: formatDateField(employee.permanentDate),
    });
  }
  if (employee.contractEndDate) {
    conditionalDates.push({
      label: "Contract End",
      value: formatDateField(employee.contractEndDate),
    });
  }
  if (employee.probationEndDate) {
    conditionalDates.push({
      label: "Probation End",
      value: formatDateField(employee.probationEndDate),
    });
  }
  if (employee.exitDate) {
    conditionalDates.push({
      label: "Resigned Date",
      value: formatDateField(employee.exitDate),
    });
  }

  const hasEmergencyContact =
    employee.emergencyContactName ||
    employee.emergencyContactPhone ||
    employee.emergencyContactRelation;

  const contactEmail = employee.email;
  const contactPhone = employee.employeeContact || employee.phone || "";

  const statusTuvVariant = getStatusTuvVariant(statusCfg.variant);

  return (
    <>
      <Header title="Employee Details" />
      <PageContainer>
        <div className="space-y-5">
          {/* Top Bar — back link + actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/employees"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "0.875rem",
                fontWeight: 400,
                color: "var(--hsd-ui-color-gray-500)",
                textDecoration: "none",
              }}
            >
              <ChevronLeft style={{ width: "16px", height: "16px" }} />
              Employees
            </Link>
            {isHr && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Button
                  onClick={() => setIsDeleteDialogOpen(true)}
                  style={btnDanger}
                >
                  <Trash2
                    style={{
                      width: "16px",
                      height: "16px",
                      marginRight: "6px",
                    }}
                  />
                  Delete
                </Button>
                <Button
                  onClick={() => router.push(`/employees/${employee.id}/edit`)}
                  style={btnPrimary}
                >
                  <Pencil
                    style={{
                      width: "16px",
                      height: "16px",
                      marginRight: "6px",
                    }}
                  />
                  Edit
                </Button>
              </div>
            )}
          </div>

          {/* ===== Profile Header Card ===== */}
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
                {/* Icon avatar */}
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
                    {fullName || "No Data"}
                  </h1>

                  {/* Badges row */}
                  <div
                    className="flex items-center gap-2 mt-2 flex-wrap"
                  >
                    <TuvBadge
                      text={statusCfg.label}
                      variant={statusTuvVariant}
                      size="sm"
                      border
                      dot
                    />
                    {employee.employeeNik && (
                      <TuvBadge
                        text={`NIK: ${employee.employeeNik}`}
                        variant="info"
                        size="sm"
                        border
                      />
                    )}
                    {jobTitleName && (
                      <TuvBadge
                        text={jobTitleName}
                        variant="brand"
                        size="sm"
                        border
                      />
                    )}
                  </div>

                  {/* Key facts row */}
                  <div
                    className="mt-5 pt-4 grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4"
                    style={{
                      borderTop: "1px solid rgba(120, 134, 127, 0.15)",
                    }}
                  >
                    <DetailItem label="Department" value={departmentName} />
                    <DetailItem label="Job Title" value={jobTitleName} />
                    <DetailItem
                      label="Job Level"
                      value={
                        matchedJobTitle?.jobLevel?.name ||
                        employee.jobLevel?.name ||
                        ""
                      }
                    />
                    <DetailItem
                      label="Join Date"
                      value={formatDateField(employee.hireDate)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== Personal Information — single section ===== */}
          <div className="space-y-5">
            <SectionCard title="Personal Information" icon={User}>
              {/* Basic info */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
                <DetailItem label="Birth Date" value={formatDateField(employee.dateOfBirth)} />
                <DetailItem label="Religion" value={employee.religion || ""} />
                <DetailItem label="Ethnic" value={employee.ethnicity || ""} />
                <DetailItem label="Marital Status" value={maritalStatusLabel} />
                <DetailItem label="Nationality" value={employee.nationality || ""} />
                <DetailItem label="Employee Type" value={matchedJobTitle?.type || employee.employeeType || ""} />
                <DetailItem label="Location" value={employee.location || ""} />
                {conditionalDates.map((d) => (
                  <DetailItem key={d.label} label={d.label} value={d.value} />
                ))}
              </div>

              {/* Contact */}
              <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(120, 134, 127, 0.12)" }}>
                <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
                  <DetailItem label="Email" value={contactEmail || ""} href={contactEmail ? `mailto:${contactEmail}` : undefined} />
                  <DetailItem label="Phone" value={contactPhone} href={contactPhone ? `tel:${contactPhone}` : undefined} />
                </div>
              </div>

              {/* Address */}
              <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(120, 134, 127, 0.12)" }}>
                <p style={{ fontSize: "0.6875rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--hsd-ui-color-gray-500)", margin: 0 }}>Address</p>
                <p style={{ fontSize: "0.875rem", fontWeight: 500, lineHeight: 1.6, color: employee.address ? "var(--hsd-ui-color-gray-900)" : "var(--hsd-ui-color-gray-400)", margin: "4px 0 0" }}>
                  {employee.address || "No Data"}
                </p>
              </div>

              {/* Family */}
              <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(120, 134, 127, 0.12)" }}>
                <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
                  <DetailItem label="Mother" value={employee.motherName || ""} />
                  <DetailItem label="Father" value={employee.fatherName || ""} />
                  {employee.spouseName && <DetailItem label="Spouse" value={employee.spouseName} />}
                </div>
              </div>

              {/* Account & Access */}
              {linkedUser && (
                <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(120, 134, 127, 0.12)" }}>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                    <div>
                      <p style={{ fontSize: "0.6875rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--hsd-ui-color-gray-500)", margin: 0 }}>Role</p>
                      <div style={{ marginTop: "4px" }}>
                        <TuvBadge text={linkedUser.role?.roleName || "No Role"} variant="dark" size="sm" border />
                      </div>
                    </div>
                    <div>
                      <p style={{ fontSize: "0.6875rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--hsd-ui-color-gray-500)", margin: 0 }}>Email Verified</p>
                      <div style={{ marginTop: "4px" }}>
                        <TuvBadge text={linkedUser.emailVerifiedAt ? "Verified" : "Not Verified"} variant={linkedUser.emailVerifiedAt ? "success" : "warning"} size="sm" border />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </SectionCard>

            {/* Emergency Contact */}
            {hasEmergencyContact && (
              <SectionCard title="Emergency Contact" icon={AlertTriangle}>
                <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
                  <DetailItem label="Name" value={employee.emergencyContactName || ""} />
                  <DetailItem label="Relation" value={employee.emergencyContactRelation || ""} />
                  <DetailItem label="Phone" value={employee.emergencyContactPhone || ""} />
                </div>
              </SectionCard>
            )}
          </div>
        </div>
      </PageContainer>

      {/* Delete Confirmation */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{fullName}&quot;? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} style={btnSecondary}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              style={btnDanger}
            >
              {isDeleting ? (
                <>
                  <Loader2
                    className="animate-spin"
                    style={{
                      width: "16px",
                      height: "16px",
                      marginRight: "6px",
                    }}
                  />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
