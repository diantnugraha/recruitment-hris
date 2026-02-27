"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2, Loader2 } from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { EmployeeWithRelations } from "@/types";
import { formatShortDate, getInitials } from "@/lib/utils";
import { showToast } from "@/lib/utils/toast-messages";

// Status configuration
const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "success" }
> = {
  active: { label: "Active", variant: "success" },
  permanent: { label: "Permanent", variant: "success" },
  contract: { label: "Contract", variant: "default" },
  probation: { label: "Probation", variant: "secondary" },
  outsource: { label: "Outsource", variant: "secondary" },
  on_leave: { label: "On Leave", variant: "secondary" },
  inactive: { label: "Inactive", variant: "outline" },
  terminated: { label: "Terminated", variant: "outline" },
  exit: { label: "Exit", variant: "outline" },
};

function getStatusConfig(status: string) {
  return (
    statusConfig[status] ?? {
      label: status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      variant: "secondary" as const,
    }
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  );
}

function formatDateField(date?: string | null): string {
  if (!date) return "";
  return formatShortDate(date);
}

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [employee, setEmployee] = React.useState<EmployeeWithRelations | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const fetchEmployee = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const res = await employeeService.getById(id);
    if (res.success && res.data) {
      setEmployee(res.data);
    } else {
      setError(res.message || "Failed to fetch employee");
    }
    setIsLoading(false);
  }, [id]);

  React.useEffect(() => {
    fetchEmployee();
  }, [fetchEmployee]);

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
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
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
            <p className="text-sm text-muted-foreground">{error || "Employee not found"}</p>
            <Button variant="outline" size="sm" onClick={fetchEmployee}>
              Try Again
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  const statusCfg = getStatusConfig(employee.status);
  const fullName = `${employee.firstName || ""} ${employee.lastName || ""}`.trim();
  const initials = getInitials(fullName || "?");
  const jobTitleName = employee.jobTitle?.name || "";
  const departmentName = employee.department?.name || "";
  const subtitle = [jobTitleName, departmentName].filter(Boolean).join(" · ");

  const maritalStatusLabel = employee.maritalStatus
    ? employee.maritalStatus.charAt(0).toUpperCase() + employee.maritalStatus.slice(1)
    : "";

  return (
    <>
      <Header title="Employee Details" />
      <PageContainer>
        <div className="space-y-4">
          {/* Top Bar: Back + Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/employees")}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Employee List
            </button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => router.push(`/employees/${employee.id}/edit`)}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>

          {/* Single card with all content */}
          <Card>
            <CardContent className="p-6 space-y-8">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  <span className="text-xl font-bold">{initials}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-lg font-bold">{fullName || "—"}</h1>
                    <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                  </div>
                  {subtitle && (
                    <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
                  )}
                </div>
              </div>

              <div className="border-t border-dashed" />

              {/* ========== SECTION: BIODATA ========== */}
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide mb-4">
                  Biodata
                </h2>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <DetailField label="NIK" value={employee.employeeNik || "No Data"} />
                  <DetailField label="Full Name" value={fullName} />
                  <DetailField label="Gender" value={employee.gender === "male" ? "Male" : "Female"} />
                  <DetailField label="Birth Date" value={formatDateField(employee.dateOfBirth)} />
                  <DetailField label="Religion" value={employee.religion || ""} />
                  <DetailField label="Ethnic" value={employee.ethnicity || ""} />
                </div>
              </div>

              <div className="border-t border-dashed" />

              {/* ========== SECTION: WORK DETAILS ========== */}
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide mb-4">
                  Work Details
                </h2>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <DetailField label="Employee Type" value={employee.employeeType || ""} />
                  <DetailField label="Job Level" value={employee.jobLevel?.name || ""} />
                  <DetailField label="Department" value={employee.department?.name || ""} />
                  <DetailField label="Job Title" value={employee.jobTitle?.name || ""} />
                  <DetailField label="FTE" value={employee.fte != null ? String(employee.fte) : ""} />
                  <DetailField label="Join Date" value={formatDateField(employee.hireDate)} />
                  <DetailField label="Mobile Phone No." value={employee.employeeContact || employee.phone || ""} />
                  <DetailField label="Email Address" value={employee.email} />
                  <DetailField label="Location" value={employee.location || ""} />
                  <DetailField label="Status" value={statusCfg.label} />
                  {employee.permanentDate && (
                    <DetailField label="Permanent Date" value={formatDateField(employee.permanentDate)} />
                  )}
                  {employee.contractEndDate && (
                    <DetailField label="Contract End" value={formatDateField(employee.contractEndDate)} />
                  )}
                  {employee.probationEndDate && (
                    <DetailField label="Probation End" value={formatDateField(employee.probationEndDate)} />
                  )}
                  {employee.exitDate && (
                    <DetailField label="Resigned Date" value={formatDateField(employee.exitDate)} />
                  )}
                </div>
              </div>

              <div className="border-t border-dashed" />

              {/* ========== SECTION: FAMILY ========== */}
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide mb-4">
                  Family
                </h2>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <DetailField label="Mothers Name" value={employee.motherName || ""} />
                  <DetailField label="Fathers Name" value={employee.fatherName || ""} />
                  <DetailField label="Marital Status" value={maritalStatusLabel} />
                  {employee.spouseName && (
                    <DetailField label="Spouse" value={employee.spouseName} />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium">{fullName}</span>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
