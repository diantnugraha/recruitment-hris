"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Loader2,
  User,
  Briefcase,
  Heart,
  Building2,
  MapPin,
  Calendar,
  Mail,
  Phone,
  IdCard,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm font-medium ${!value ? "text-muted-foreground" : ""}`}>
        {value || "No data"}
      </p>
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

  // Find matching job title to get type and job level
  // Try to match by ID first, then by name as fallback
  const matchedJobTitle = React.useMemo(() => {
    if (!employee || jobTitles.length === 0) return null;

    // Try matching by jobTitleId first (most reliable)
    if (employee.jobTitleId) {
      const byId = jobTitles.find(
        (jt) => String(jt.id) === String(employee.jobTitleId)
      );
      if (byId) return byId;
    }

    // Fallback: match by name
    if (employee.jobTitle?.name) {
      return jobTitles.find(
        (jt) => jt.name.toLowerCase() === employee.jobTitle?.name?.toLowerCase()
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
            <Button variant="outline" onClick={fetchData}>
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
        <div className="space-y-6">
          {/* Top Bar: Back + Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
               
                className="gap-2"
                onClick={() => router.push(`/employees/${employee.id}/edit`)}
              >
                <Pencil />
                Edit
              </Button>
              <Button
                variant="outline"
               
                className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 />
                Delete
              </Button>
            </div>
          </div>

          {/* Profile Header Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 border-2">
                  <AvatarFallback className="bg-accent text-accent-foreground text-lg font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-lg font-bold truncate">{fullName || "—"}</h1>
                    <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                  </div>
                  <p className="mt-0.5 text-sm font-medium text-accent">
                    {employee.employeeNik || "No NIK"}
                  </p>
                  {subtitle && (
                    <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Biodata */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                  <IdCard className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Biodata</CardTitle>
                  <CardDescription>Personal information and identity</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                  <IdCard className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <DetailField label="NIK" value={employee.employeeNik || "No Data"} />
                </div>
                <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <DetailField label="Full Name" value={fullName} />
                </div>
                <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <DetailField label="Birth Date" value={formatDateField(employee.dateOfBirth)} />
                </div>
                <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <DetailField label="Religion" value={employee.religion || ""} />
                </div>
                <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <DetailField label="Ethnic" value={employee.ethnicity || ""} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Details */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950">
                  <Briefcase className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Work Details</CardTitle>
                  <CardDescription>Employment information and contact</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                  <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <DetailField label="Employee Type" value={matchedJobTitle?.type || employee.employeeType || ""} />
                </div>
                <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                  <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <DetailField label="Job Level" value={matchedJobTitle?.jobLevel?.name || employee.jobLevel?.name || ""} />
                </div>
                <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                  <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <DetailField label="Department" value={employee.department?.name || ""} />
                </div>
                <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                  <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <DetailField label="Job Title" value={employee.jobTitle?.name || ""} />
                </div>
                <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <DetailField label="Join Date" value={formatDateField(employee.hireDate)} />
                </div>
                <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <DetailField label="Mobile Phone No." value={employee.employeeContact || employee.phone || ""} />
                </div>
                <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <DetailField label="Email Address" value={employee.email} />
                </div>
                <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <DetailField label="Location" value={employee.location || ""} />
                </div>
                <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                  <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <DetailField label="Status" value={statusCfg.label} />
                </div>
                {employee.permanentDate && (
                  <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <DetailField label="Permanent Date" value={formatDateField(employee.permanentDate)} />
                  </div>
                )}
                {employee.contractEndDate && (
                  <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <DetailField label="Contract End" value={formatDateField(employee.contractEndDate)} />
                  </div>
                )}
                {employee.probationEndDate && (
                  <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <DetailField label="Probation End" value={formatDateField(employee.probationEndDate)} />
                  </div>
                )}
                {employee.exitDate && (
                  <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <DetailField label="Resigned Date" value={formatDateField(employee.exitDate)} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Family */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950">
                  <Heart className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Family</CardTitle>
                  <CardDescription>Family members and marital information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <DetailField label="Mother's Name" value={employee.motherName || ""} />
                </div>
                <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <DetailField label="Father's Name" value={employee.fatherName || ""} />
                </div>
                <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                  <Heart className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <DetailField label="Marital Status" value={maritalStatusLabel} />
                </div>
                {employee.spouseName && (
                  <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <DetailField label="Spouse" value={employee.spouseName} />
                  </div>
                )}
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
