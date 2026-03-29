"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  RotateCcw,
  Users,
  Briefcase,
  UserCircle,
  PlayCircle,
  Sparkles,
  Send,
  Check,
  FileText,
  Activity,
  Download,
  Info,
  ClipboardList,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { LexicalRenderer, hasLexicalContent } from "@/components/shared/lexical-renderer";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import { cn, formatShortDate } from "@/lib/utils";
import { showToast } from "@/lib/utils/toast-messages";
import { employeeRequestService } from "@/services/employee-request.service";
import {
  EMPLOYEE_REQUEST_STATUS_CONFIG,
  EMPLOYMENT_TYPE_LABELS,
  REQUEST_REASON_LABELS,
  EDUCATION_LEVEL_LABELS,
  GENDER_PREFERENCE_LABELS,
  WORK_LOCATION_LABELS,
  type EmployeeRequestStatus,
  type EmploymentType,
  type RequestReason,
  type EducationLevel,
  type GenderPreference,
  type WorkLocation,
} from "@/lib/constants/employeeRequest";
import { ROLES } from "@/lib/constants/roles";
import { useAuthStore } from "@/stores/auth-store";
import type { EmployeeRequestWithRelations } from "@/types/employee-request";

// --- Reusable sub-components (module level) ---

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={`mt-0.5 text-sm font-medium ${value ? "text-foreground" : "text-muted-foreground"}`}>
        {value || "No Data"}
      </p>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border bg-card p-6">
        <div className="flex items-start gap-5">
          <Skeleton className="h-20 w-20 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-3 pt-1">
            <Skeleton className="h-7 w-56" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <div className="pt-3 grid grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border bg-card p-6 space-y-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

// Workflow steps visualization
const WORKFLOW_STEPS = [
  { key: "draft", label: "Draft", icon: Pencil },
  { key: "created", label: "Submitted", icon: Send },
  { key: "hod_reviewed", label: "HOD Review", icon: UserCircle },
  { key: "reviewed", label: "HR Review", icon: CheckCircle },
  { key: "approved", label: "Management", icon: Sparkles },
  { key: "in_recruitment", label: "Recruiting", icon: Users },
  { key: "completed", label: "Completed", icon: Check },
];

// --- Page component ---

export default function EmployeeRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // Auth
  const { user } = useAuthStore();
  const userRoleId = user?.roleId ?? 0;
  const isAdmin = userRoleId === ROLES.SUPER_ADMIN;

  const canPerformAction = (allowedRoles: number[]) => {
    if (isAdmin) return true;
    return allowedRoles.includes(userRoleId);
  };

  // State
  const [request, setRequest] = React.useState<EmployeeRequestWithRelations | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Dialog states
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [showActionDialog, setShowActionDialog] = React.useState(false);
  const [actionType, setActionType] = React.useState<"submit" | "resubmit" | "hod_review" | "hr_review" | "approve" | "reject" | "revise" | "complete" | null>(null);
  const [actionComment, setActionComment] = React.useState("");
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Fetch data
  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await employeeRequestService.getById(id);

      if (response.success && response.data) {
        setRequest(response.data);
      } else {
        setError(response.message || "Request not found");
      }
    } catch (err) {
      setError("Failed to load request details");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handlers
  const handleAction = async () => {
    if (!request || !actionType) return;

    setIsProcessing(true);

    try {
      let newStatus: EmployeeRequestStatus = request.status;
      let message = "";

      switch (actionType) {
        case "submit":
          newStatus = "created";
          message = "Request submitted for review";
          break;
        case "resubmit":
          newStatus = "created";
          message = "Request resubmitted for review";
          break;
        case "hod_review":
          newStatus = "hod_reviewed";
          message = "Request reviewed by HOD, forwarded to HR";
          break;
        case "hr_review":
          newStatus = "reviewed";
          message = "Request reviewed by HR, forwarded to Management";
          break;
        case "approve":
          newStatus = "approved";
          message = "Request approved by Management";
          break;
        case "reject":
          newStatus = "rejected";
          message = "Request rejected";
          break;
        case "revise":
          newStatus = "revise";
          message = "Request returned for revision";
          break;
        case "complete":
          newStatus = "completed";
          message = "Request marked as completed";
          break;
      }

      const response = await employeeRequestService.updateStatus(id, {
        status: newStatus,
        comment: actionComment || undefined,
      });

      if (response.success && response.data) {
        setRequest(response.data);
        showToast.success(message);
      } else {
        showToast.error(response.message || "Failed to update status");
      }
    } catch (err) {
      showToast.error("Failed to update status");
    } finally {
      setIsProcessing(false);
      setShowActionDialog(false);
      setActionComment("");
      setActionType(null);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await employeeRequestService.delete(id);
      if (response.success) {
        showToast.deleted("Employee Request");
        router.push("/employee-request");
      } else {
        showToast.error(response.message || "Failed to delete");
      }
    } catch (err) {
      showToast.error("Failed to delete");
    }
  };

  const handleStartRecruitment = async () => {
    if (!request) return;

    setIsProcessing(true);
    try {
      const response = await employeeRequestService.updateStatus(id, {
        status: "in_recruitment",
      });

      if (response.success && response.data) {
        setRequest(response.data);
        showToast.success("Recruitment process started");
      } else {
        showToast.error(response.message || "Failed to start recruitment");
      }
    } catch (err) {
      showToast.error("Failed to start recruitment");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!request) return;

    setIsProcessing(true);
    try {
      await employeeRequestService.downloadPdf(id);
    } catch (err) {
      showToast.error("Failed to download PDF");
    } finally {
      setIsProcessing(false);
    }
  };

  const openActionDialog = (type: typeof actionType) => {
    setActionType(type);
    setShowActionDialog(true);
  };

  const getStatusBadge = (status: EmployeeRequestStatus) => {
    const config = EMPLOYEE_REQUEST_STATUS_CONFIG[status];
    return (
      <Badge variant={config?.variant || "secondary"} className="text-xs font-medium">
        {config?.label || status}
      </Badge>
    );
  };

  const getActionDialogContent = () => {
    switch (actionType) {
      case "submit":
        return { title: "Submit Request", description: "Submit this request for HOD review.", buttonText: "Submit", buttonVariant: "default" as const };
      case "resubmit":
        return { title: "Resubmit Request", description: "Resubmit this revised request for HOD review.", buttonText: "Resubmit", buttonVariant: "default" as const };
      case "hod_review":
        return { title: "HOD Review", description: "Mark this request as reviewed by HOD and forward to HR for review.", buttonText: "Approve & Forward to HR", buttonVariant: "default" as const };
      case "hr_review":
        return { title: "HR Review", description: "Mark this request as reviewed by HR and forward to Management for approval.", buttonText: "Approve & Forward to Management", buttonVariant: "default" as const };
      case "approve":
        return { title: "Management Approval", description: "Approve this employee request. Recruitment can begin after approval.", buttonText: "Approve", buttonVariant: "default" as const };
      case "reject":
        return { title: "Reject Request", description: "Reject this employee request. Please provide a reason for rejection.", buttonText: "Reject", buttonVariant: "destructive" as const };
      case "revise":
        return { title: "Request Revision", description: "Return this request for revision. Please specify what needs to be changed.", buttonText: "Request Revision", buttonVariant: "outline" as const };
      case "complete":
        return { title: "Complete Request", description: "Mark this recruitment request as completed.", buttonText: "Complete", buttonVariant: "default" as const };
      default:
        return { title: "", description: "", buttonText: "", buttonVariant: "default" as const };
    }
  };

  const getCurrentStepIndex = (status: EmployeeRequestStatus) => {
    if (status === "rejected") return -1;
    if (status === "revise") return 0;
    return WORKFLOW_STEPS.findIndex(s => s.key === status);
  };

  // Loading state
  if (isLoading) {
    return (
      <>
        <Header title="Employee Request" />
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
  if (error || !request) {
    return (
      <>
        <Header title="Employee Request" />
        <PageContainer>
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <p className="text-sm text-muted-foreground">{error || "Request not found"}</p>
            <Button variant="outline" onClick={fetchData}>
              Try Again
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  const dialogContent = getActionDialogContent();
  const currentStepIndex = getCurrentStepIndex(request.status);

  return (
    <>
      <Header title="Employee Request" />
      <PageContainer>
        <div className="space-y-5">
          {/* Top Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="ghost"
              className="gap-1.5 text-muted-foreground w-fit h-auto px-2 py-1.5 text-sm"
              asChild
            >
              <Link href="/employee-request">
                <ArrowLeft className="h-4 w-4" />
                Employee Requests
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground mr-1">
                Updated {new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(request.updatedAt))}
              </span>
              {/* Manager actions: draft, revise — owner or admin */}
              {["draft", "revise"].includes(request.status) && (request.requestedById === Number(user?.id) || isAdmin) && (
                <>
                  <Button className="gap-2" onClick={() => router.push(`/employee-request/${id}/edit`)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  {request.status === "draft" && (
                    <>
                      <Button
                        variant="outline"
                        className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => setShowDeleteDialog(true)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                      <Button className="gap-2" onClick={() => openActionDialog("submit")}>
                        <Send className="h-3.5 w-3.5" />
                        Submit
                      </Button>
                    </>
                  )}
                </>
              )}

              {/* HOD actions: created */}
              {request.status === "created" && canPerformAction([ROLES.HOD]) && (
                <>
                  <Button variant="outline" className="gap-2" onClick={() => openActionDialog("revise")}>
                    <RotateCcw className="h-3.5 w-3.5" />
                    Request Revision
                  </Button>
                  <Button className="gap-2" onClick={() => openActionDialog("hod_review")}>
                    <CheckCircle className="h-3.5 w-3.5" />
                    HOD Approve
                  </Button>
                </>
              )}

              {/* HR actions: hod_reviewed */}
              {request.status === "hod_reviewed" && canPerformAction([ROLES.HUMAN_RESOURCES]) && (
                <>
                  <Button variant="outline" className="gap-2" onClick={() => openActionDialog("revise")}>
                    <RotateCcw className="h-3.5 w-3.5" />
                    Request Revision
                  </Button>
                  <Button className="gap-2" onClick={() => openActionDialog("hr_review")}>
                    <CheckCircle className="h-3.5 w-3.5" />
                    HR Approve
                  </Button>
                </>
              )}

              {/* Management actions: reviewed */}
              {request.status === "reviewed" && canPerformAction([ROLES.MANAGEMENT]) && (
                <>
                  <Button variant="outline" className="gap-2" onClick={() => openActionDialog("revise")}>
                    <RotateCcw className="h-3.5 w-3.5" />
                    Request Revision
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => openActionDialog("reject")}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject
                  </Button>
                  <Button className="gap-2" onClick={() => openActionDialog("approve")}>
                    <CheckCircle className="h-3.5 w-3.5" />
                    Management Approve
                  </Button>
                </>
              )}

              {/* HR actions: approved */}
              {request.status === "approved" && canPerformAction([ROLES.HUMAN_RESOURCES]) && (
                <>
                  <Button variant="outline" className="gap-2" onClick={handleDownloadPdf} disabled={isProcessing}>
                    <Download className="h-3.5 w-3.5" />
                    Download PDF
                  </Button>
                  <Button className="gap-2" onClick={handleStartRecruitment} disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />}
                    Start Recruitment
                  </Button>
                </>
              )}

              {/* HR actions: in_recruitment */}
              {request.status === "in_recruitment" && canPerformAction([ROLES.HUMAN_RESOURCES]) && (
                <Button className="gap-2" onClick={() => openActionDialog("complete")}>
                  <Check className="h-3.5 w-3.5" />
                  Complete
                </Button>
              )}

              {/* Download PDF for completed/in_recruitment */}
              {["in_recruitment", "completed"].includes(request.status) && (
                <Button variant="outline" className="gap-2" onClick={handleDownloadPdf} disabled={isProcessing}>
                  <Download className="h-3.5 w-3.5" />
                  Download PDF
                </Button>
              )}
            </div>
          </div>

          {/* ===== Workflow Progress ===== */}
          {request.status !== "rejected" && (
            <div className="rounded-2xl border bg-card overflow-hidden">
              <div className="p-5">
                <div className="overflow-x-auto pb-2">
                  <div className="flex items-center justify-between min-w-[600px]">
                    {WORKFLOW_STEPS.map((step, index) => {
                      const StepIcon = step.icon;
                      const isActive = index === currentStepIndex;
                      const isCompleted = index < currentStepIndex;
                      const isPending = index > currentStepIndex;

                      return (
                        <React.Fragment key={step.key}>
                          <div className="flex flex-col items-center gap-2">
                            <div
                              className={cn(
                                "h-9 w-9 rounded-full flex items-center justify-center transition-all duration-500",
                                isActive && "bg-accent text-accent-foreground ring-4 ring-accent/20",
                                isCompleted && "bg-accent/20 text-accent",
                                isPending && "bg-secondary text-muted-foreground"
                              )}
                            >
                              {isCompleted ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                            </div>
                            <span
                              className={cn(
                                "text-xs font-medium text-center transition-colors",
                                isActive && "text-accent",
                                isCompleted && "text-accent/80",
                                isPending && "text-muted-foreground"
                              )}
                            >
                              {step.label}
                            </span>
                          </div>
                          {index < WORKFLOW_STEPS.length - 1 && (
                            <div
                              className={cn(
                                "flex-1 h-0.5 mx-2 transition-colors duration-500",
                                index < currentStepIndex ? "bg-accent" : "bg-secondary"
                              )}
                            />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rejected Banner */}
          {request.status === "rejected" && (
            <div className="rounded-2xl border border-destructive/50 bg-destructive/5 p-6">
              <div className="flex items-center gap-4">
                <div className="h-9 w-9 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                  <XCircle className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold text-destructive">Request Rejected</h3>
                  <p className="text-sm text-muted-foreground">
                    This employee request has been rejected by management.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ===== Profile Header Card ===== */}
          <div className="rounded-2xl border bg-card">
            <div className="p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                {/* Icon */}
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-accent/10">
                  <Briefcase className="h-9 w-9 text-accent" />
                </div>

                <div className="flex-1 min-w-0 sm:pt-2">
                  {/* Code & Title */}
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                      {request.code}
                    </h1>
                    {getStatusBadge(request.status)}
                  </div>
                  <p className="mt-1 text-sm text-foreground/80">{request.jobTitle?.name}</p>

                  {/* Recruitment Code Badge */}
                  {request.recruitmentCode && (
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary">
                        {request.recruitmentCode}
                      </Badge>
                    </div>
                  )}

                  {/* Key facts row */}
                  <div className="mt-5 pt-4 border-t border-border/60 grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
                    <DetailItem label="Department" value={request.department?.name || ""} />
                    <DetailItem label="Quantity" value={`${request.quantity} ${request.quantity > 1 ? "positions" : "position"}`} />
                    <DetailItem label="Headcount" value={`${request.headcount} ${request.headcount > 1 ? "people" : "person"}`} />
                    <DetailItem label="Reason" value={REQUEST_REASON_LABELS[request.reason as RequestReason] || ""} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== General Information ===== */}
          <section className="rounded-2xl border bg-card">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
              <h2 className="text-base font-semibold text-foreground">General Information</h2>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="px-6 py-5">
              <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                <DetailItem label="Request Code" value={request.code} />
                <DetailItem label="Job Title" value={request.jobTitle?.name || ""} />
                <DetailItem label="Department" value={request.department?.name || ""} />
                <DetailItem label="Employment Type" value={EMPLOYMENT_TYPE_LABELS[request.employmentType as EmploymentType] || ""} />
                <DetailItem label="Work Location" value={WORK_LOCATION_LABELS[request.jobPlacement as WorkLocation] || request.jobPlacement || ""} />
                <DetailItem label="Expected Onboard" value={request.expectedOnboardDate ? formatShortDate(request.expectedOnboardDate) : ""} />
                <DetailItem label="Requested By" value={request.requestedByName || ""} />
                <DetailItem label="Reason" value={REQUEST_REASON_LABELS[request.reason as RequestReason] || ""} />
                <DetailItem label="Created" value={formatShortDate(request.createdAt)} />
              </div>

              {/* Purpose */}
              <div className="mt-5 pt-4 border-t border-border/40">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Purpose / Justification
                </p>
                <p className="mt-1.5 text-sm font-medium text-foreground whitespace-pre-wrap">
                  {request.purpose || "No Data"}
                </p>
              </div>
            </div>
          </section>

          {/* ===== Requirements ===== */}
          <section className="rounded-2xl border bg-card">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
              <h2 className="text-base font-semibold text-foreground">Requirements</h2>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="px-6 py-5">
              <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                <DetailItem label="Education" value={EDUCATION_LEVEL_LABELS[request.education as EducationLevel] || ""} />
                <DetailItem label="Experience" value={request.experience || ""} />
                <DetailItem label="Gender Preference" value={GENDER_PREFERENCE_LABELS[request.genderPreference as GenderPreference] || ""} />
                <DetailItem
                  label="Age Range"
                  value={
                    request.ageMin && request.ageMax
                      ? `${request.ageMin} - ${request.ageMax} years`
                      : request.ageMin
                      ? `Min ${request.ageMin} years`
                      : request.ageMax
                      ? `Max ${request.ageMax} years`
                      : ""
                  }
                />
              </div>
            </div>
          </section>

          {/* ===== Rich Text Sections ===== */}
          {hasLexicalContent(request.generalJobPurpose) && (
            <section className="rounded-2xl border bg-card">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
                <h2 className="text-base font-semibold text-foreground">General Job Purpose</h2>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="px-6 py-5">
                <LexicalRenderer value={request.generalJobPurpose} />
              </div>
            </section>
          )}

          {hasLexicalContent(request.jobDescription) && (
            <section className="rounded-2xl border bg-card">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
                <h2 className="text-base font-semibold text-foreground">Job Description</h2>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="px-6 py-5">
                <LexicalRenderer value={request.jobDescription} />
              </div>
            </section>
          )}

          {hasLexicalContent(request.jobRequirement) && (
            <section className="rounded-2xl border bg-card">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
                <h2 className="text-base font-semibold text-foreground">Job Requirement</h2>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="px-6 py-5">
                <LexicalRenderer value={request.jobRequirement} />
              </div>
            </section>
          )}

          {/* ===== Activity History ===== */}
          <section className="rounded-2xl border bg-card">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
              <h2 className="text-base font-semibold text-foreground">Activity History</h2>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="px-6 py-5">
              {request.comments && request.comments.length > 0 ? (
                <div className="space-y-6">
                  {request.comments.map((comment, index) => (
                    <div key={comment.id} className={cn("flex gap-4", index !== 0 && "pt-6 border-t")}>
                      <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <UserCircle className="h-4 w-4 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{comment.userName}</span>
                            {comment.userRole && (
                              <Badge variant="outline" className="text-xs">{comment.userRole}</Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {formatShortDate(comment.createdAt)}
                          </span>
                        </div>
                        {comment.newStatus && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Status changed to{" "}
                            <Badge variant="secondary" className="ml-1">
                              {EMPLOYEE_REQUEST_STATUS_CONFIG[comment.newStatus]?.label || comment.newStatus}
                            </Badge>
                          </p>
                        )}
                        {comment.comment && (
                          <p className="text-sm mt-2 text-foreground/80">{comment.comment}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No activity history yet</p>
              )}
            </div>
          </section>
        </div>
      </PageContainer>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium">{request.code}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? (
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

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogContent.title}</DialogTitle>
            <DialogDescription>{dialogContent.description}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="comment">Comment {actionType === "reject" || actionType === "revise" ? "(required)" : "(optional)"}</Label>
            <Textarea
              id="comment"
              placeholder="Add a comment..."
              value={actionComment}
              onChange={(e) => setActionComment(e.target.value)}
              rows={3}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setShowActionDialog(false); setActionComment(""); setActionType(null); }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant={dialogContent.buttonVariant}
              onClick={handleAction}
              disabled={isProcessing || ((actionType === "reject" || actionType === "revise") && !actionComment)}
            >
              {isProcessing && <Loader2 className="animate-spin" />}
              {dialogContent.buttonText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
