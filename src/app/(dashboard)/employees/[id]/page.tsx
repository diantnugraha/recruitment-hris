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

// Status configuration
const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "success" }
> = {
  active: { label: "Active", variant: "success" },
  on_leave: { label: "On Leave", variant: "secondary" },
  inactive: { label: "Inactive", variant: "outline" },
  terminated: { label: "Terminated", variant: "outline" },
};

function getStatusConfig(status: string) {
  return (
    statusConfig[status] ?? {
      label: status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      variant: "secondary" as const,
    }
  );
}

// Detail field component — label on top, value below
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
      router.push("/employees");
    } else {
      setError(res.message || "Failed to delete employee");
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
          <Card className="border-0 shadow-none">
            <CardContent className="p-6 space-y-6">
              {/* Profile Header */}
              <div className="flex items-center justify-between">
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
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {employee.employeeNik || employee.employeeId || "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dashed separator */}
              <div className="border-t border-dashed" />

              {/* Personal Information */}
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide mb-4">
                  Personal Information
                </h2>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <DetailField label="NIK" value={employee.employeeNik || employee.employeeId || ""} />
                  <DetailField label="Email" value={employee.email} />
                  <DetailField label="Phone" value={employee.employeeContact || employee.phone || ""} />
                  <DetailField label="Address" value={employee.address} />
                  <DetailField label="Date of Birth" value={employee.dateOfBirth ? formatShortDate(employee.dateOfBirth) : ""} />
                  <DetailField label="Join Date" value={employee.hireDate ? formatShortDate(employee.hireDate) : ""} />
                </div>
              </div>

              {/* Dashed separator */}
              <div className="border-t border-dashed" />

              {/* Position Information */}
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide mb-4">
                  Position Information
                </h2>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <DetailField label="Job Title" value={employee.jobTitle?.name || ""} />
                  <DetailField label="Department" value={employee.department?.name || ""} />
                  <DetailField label="Division" value={employee.division?.name || ""} />
                  <DetailField label="Job Level" value={employee.jobLevel?.name || ""} />
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
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
