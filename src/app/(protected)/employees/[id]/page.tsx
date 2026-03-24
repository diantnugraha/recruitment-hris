"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Loader2,
  User,
  Briefcase,
  Mail,
  AlertTriangle,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { EmployeeWithRelations, JobTitle } from "@/types";
import { formatShortDate, getInitials } from "@/lib/utils";
import { showToast } from "@/lib/utils/toast-messages";
import { getEmployeeStatusConfig } from "@/lib/constants/employeeStatus";

// --- Reusable sub-components (module level) ---

function DetailItem({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {href && value ? (
        <a
          href={href}
          className="mt-0.5 text-sm font-medium text-accent hover:underline truncate block"
        >
          {value}
        </a>
      ) : (
        <p className={`mt-0.5 text-sm font-medium ${value ? "text-foreground" : "text-muted-foreground"}`}>
          {value || "No Data"}
        </p>
      )}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-5">
      {/* Profile header skeleton */}
      <div className="rounded-2xl border bg-card p-6">
        <div className="flex items-start gap-5">
          <Skeleton className="h-28 w-28 rounded-2xl shrink-0" />
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
          <div className="rounded-2xl border bg-card p-6 space-y-4">
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
          <div className="rounded-2xl border bg-card p-6 space-y-3">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="rounded-2xl bg-muted p-6 space-y-3">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
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

  const [employee, setEmployee] =
    React.useState<EmployeeWithRelations | null>(null);
  const [jobTitles, setJobTitles] = React.useState<JobTitle[]>([]);
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
          <div className="mb-5">
            <Skeleton className="h-8 w-20 rounded-md" />
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
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <p className="text-sm text-muted-foreground">
              {error || "Employee not found"}
            </p>
            <Button variant="outline" onClick={fetchData}>
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

  return (
    <>
      <Header title="Employee Details" />
      <PageContainer>
        <div className="space-y-5">
          {/* Top Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="ghost"
              className="gap-1.5 text-muted-foreground w-fit h-auto px-2 py-1.5 text-sm"
              asChild
            >
              <Link href="/employees">
                <ArrowLeft className="h-4 w-4" />
                Employees
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <Button
                className="gap-2"
                onClick={() =>
                  router.push(`/employees/${employee.id}/edit`)
                }
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button
                variant="outline"
                className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
          </div>

          {/* ===== Profile Header Card ===== */}
          <div className="rounded-2xl border bg-card">
            <div className="p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                {/* Avatar */}
                <Avatar className="h-28 w-28 shrink-0">
                  <AvatarFallback className="bg-accent/10 text-accent text-2xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0 sm:pt-2">
                  {/* Name & Badge */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                      {fullName || "No Data"}
                    </h1>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Employee ID: <span className="font-semibold text-foreground">{employee.employeeNik || "No Data"}</span>
                    </span>
                  </div>

                  {/* Status badge positioned below name on mobile, inline on desktop */}
                  <div className="mt-2">
                    <Badge variant={statusCfg.variant} className="text-xs uppercase tracking-wide">
                      {statusCfg.label}
                    </Badge>
                  </div>

                  {/* Key facts row */}
                  <div className="mt-5 pt-4 border-t border-border/60 grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
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

          {/* ===== Two-Column Content ===== */}
          <div className="grid gap-5 lg:grid-cols-5">
            {/* Left Column — Personal Information (wider) */}
            <div className="lg:col-span-3 space-y-5">
              <section className="rounded-2xl border bg-card">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
                  <h2 className="text-base font-semibold text-foreground">Personal Information</h2>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="px-6 py-5">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                    <DetailItem
                      label="Birth Date"
                      value={formatDateField(employee.dateOfBirth)}
                    />
                    <DetailItem label="Religion" value={employee.religion || ""} />
                    <DetailItem label="Ethnic" value={employee.ethnicity || ""} />
                    <DetailItem
                      label="Marital Status"
                      value={maritalStatusLabel}
                    />
                    <DetailItem label="Nationality" value={employee.nationality || ""} />
                  </div>

                  {/* Address — full width */}
                  <div className="mt-5 pt-4 border-t border-border/40">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Address
                    </p>
                    <p className={`mt-1 text-sm font-medium leading-relaxed ${employee.address ? "text-foreground" : "text-muted-foreground"}`}>
                      {employee.address || "No Data"}
                    </p>
                  </div>

                  {/* Family info */}
                  <div className="mt-5 pt-4 border-t border-border/40">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                      <DetailItem
                        label="Mother"
                        value={employee.motherName || ""}
                      />
                      <DetailItem
                        label="Father"
                        value={employee.fatherName || ""}
                      />
                      {employee.spouseName && (
                        <DetailItem label="Spouse" value={employee.spouseName} />
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Emergency Contact — below personal info on left column */}
              {hasEmergencyContact && (
                <section className="rounded-2xl border bg-card">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
                    <h2 className="text-base font-semibold text-foreground">Emergency Contact</h2>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="px-6 py-5">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
                      <DetailItem
                        label="Name"
                        value={employee.emergencyContactName || ""}
                      />
                      <DetailItem
                        label="Relation"
                        value={employee.emergencyContactRelation || ""}
                      />
                      <DetailItem
                        label="Phone"
                        value={employee.emergencyContactPhone || ""}
                      />
                    </div>
                  </div>
                </section>
              )}
            </div>

            {/* Right Column — Employment + Contact Info */}
            <div className="lg:col-span-2 space-y-5">
              {/* Employment Card */}
              <section className="rounded-2xl border bg-card">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
                  <h2 className="text-base font-semibold text-foreground">Employment</h2>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="px-6 py-5">
                  <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                    <DetailItem
                      label="Employee Type"
                      value={matchedJobTitle?.type || employee.employeeType || ""}
                    />
                    <DetailItem
                      label="Location"
                      value={employee.location || ""}
                    />
                    {conditionalDates.map((d) => (
                      <DetailItem key={d.label} label={d.label} value={d.value} />
                    ))}
                  </div>
                </div>
              </section>

              {/* Contact Info Card */}
              <section className="rounded-2xl border bg-card">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
                  <h2 className="text-base font-semibold text-foreground">Contact Info</h2>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="px-6 py-5">
                  <div className="grid grid-cols-1 gap-x-8 gap-y-5">
                    <DetailItem
                      label="Email"
                      value={contactEmail || ""}
                      href={contactEmail ? `mailto:${contactEmail}` : undefined}
                    />
                    <DetailItem
                      label="Phone"
                      value={contactPhone}
                      href={contactPhone ? `tel:${contactPhone}` : undefined}
                    />
                  </div>
                </div>
              </section>
            </div>
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
              Are you sure you want to delete{" "}
              <span className="font-medium">{fullName}</span>? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="animate-spin" />
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
