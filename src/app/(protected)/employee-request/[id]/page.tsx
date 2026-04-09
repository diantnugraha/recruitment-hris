"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { TuvBadge } from "@/components/shared/tuv-badge";
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

// --- TUV button style helpers ---

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

// --- TUV reusable sub-components (module level) ---

function DetailItem({ label, value }: { label: string; value: string }) {
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
      <p
        style={{
          fontSize: "0.875rem",
          fontWeight: 500,
          color: value ? "var(--hsd-ui-color-gray-900)" : "var(--hsd-ui-color-gray-400)",
          margin: "2px 0 0",
        }}
      >
        {value || "No Data"}
      </p>
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
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
            style={{ width: "16px", height: "16px", color: "var(--hsd-ui-color-gray-500)" }}
          />
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-5">
      <div
        className="border p-6"
        style={{ borderRadius: "8px", backgroundColor: "#fff", borderColor: "rgba(120, 134, 127, 0.2)" }}
      >
        <div className="flex items-start gap-5">
          <Skeleton className="h-20 w-20 shrink-0" style={{ borderRadius: "8px" }} />
          <div className="flex-1 space-y-3 pt-1">
            <Skeleton className="h-7 w-56" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20" style={{ borderRadius: "4px" }} />
              <Skeleton className="h-5 w-20" style={{ borderRadius: "4px" }} />
            </div>
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
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="border p-6 space-y-4"
          style={{ borderRadius: "8px", backgroundColor: "#fff", borderColor: "rgba(120, 134, 127, 0.2)" }}
        >
          <Skeleton className="h-5 w-40" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, j) => (
              <div key={j} className="space-y-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Status to TuvBadge variant mapping ---

const STATUS_BADGE_VARIANT: Record<EmployeeRequestStatus, "success" | "danger" | "info" | "warning" | "dark" | "brand" | "purple" | "rose"> = {
  draft: "dark",
  created: "info",
  hod_reviewed: "brand",
  reviewed: "purple",
  approved: "success",
  rejected: "danger",
  revise: "warning",
  in_recruitment: "brand",
  completed: "success",
};

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

  const getActionDialogContent = () => {
    switch (actionType) {
      case "submit":
        return { title: "Submit Request", description: "Submit this request for HOD review.", buttonText: "Submit", isDanger: false };
      case "resubmit":
        return { title: "Resubmit Request", description: "Resubmit this revised request for HOD review.", buttonText: "Resubmit", isDanger: false };
      case "hod_review":
        return { title: "HOD Review", description: "Mark this request as reviewed by HOD and forward to HR for review.", buttonText: "Approve & Forward to HR", isDanger: false };
      case "hr_review":
        return { title: "HR Review", description: "Mark this request as reviewed by HR and forward to Management for approval.", buttonText: "Approve & Forward to Management", isDanger: false };
      case "approve":
        return { title: "Management Approval", description: "Approve this employee request. Recruitment can begin after approval.", buttonText: "Approve", isDanger: false };
      case "reject":
        return { title: "Reject Request", description: "Reject this employee request. Please provide a reason for rejection.", buttonText: "Reject", isDanger: true };
      case "revise":
        return { title: "Request Revision", description: "Return this request for revision. Please specify what needs to be changed.", buttonText: "Request Revision", isDanger: false };
      case "complete":
        return { title: "Complete Request", description: "Mark this recruitment request as completed.", buttonText: "Complete", isDanger: false };
      default:
        return { title: "", description: "", buttonText: "", isDanger: false };
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
        <Header />
        <PageContainer>
          <div className="mb-5">
            <Skeleton className="h-5 w-40" style={{ borderRadius: "4px" }} />
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
        <Header />
        <PageContainer>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "300px", gap: "12px" }}>
            <p style={{ fontSize: "0.875rem", color: "var(--hsd-ui-color-gray-500)", margin: 0 }}>
              {error || "Request not found"}
            </p>
            <Button variant="outline" onClick={fetchData} style={btnSecondary}>
              Try Again
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  const dialogContent = getActionDialogContent();
  const currentStepIndex = getCurrentStepIndex(request.status);
  const statusConfig = EMPLOYEE_REQUEST_STATUS_CONFIG[request.status];

  return (
    <>
      <Header />
      <PageContainer>
        <div className="space-y-5">
          {/* Top Bar -- back link + actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/employee-request"
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
              Employee Requests
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--hsd-ui-color-gray-400)",
                  marginRight: "4px",
                }}
              >
                Updated {new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(request.updatedAt))}
              </span>

              {/* Manager actions: draft, revise -- owner or admin */}
              {["draft", "revise"].includes(request.status) && (request.requestedById === Number(user?.id) || isAdmin) && (
                <>
                  <Button onClick={() => router.push(`/employee-request/${id}/edit`)} style={btnPrimary}>
                    <Pencil style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                    Edit
                  </Button>
                  {request.status === "draft" && (
                    <>
                      <Button onClick={() => setShowDeleteDialog(true)} style={btnDanger}>
                        <Trash2 style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                        Delete
                      </Button>
                      <Button onClick={() => openActionDialog("submit")} style={btnPrimary}>
                        <Send style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                        Submit
                      </Button>
                    </>
                  )}
                </>
              )}

              {/* HOD actions: created */}
              {request.status === "created" && canPerformAction([ROLES.HOD]) && (
                <>
                  <Button variant="outline" onClick={() => openActionDialog("revise")} style={btnSecondary}>
                    <RotateCcw style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                    Request Revision
                  </Button>
                  <Button onClick={() => openActionDialog("hod_review")} style={btnPrimary}>
                    <CheckCircle style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                    HOD Approve
                  </Button>
                </>
              )}

              {/* HR actions: hod_reviewed */}
              {request.status === "hod_reviewed" && canPerformAction([ROLES.HR_MANAGER]) && (
                <>
                  <Button variant="outline" onClick={() => openActionDialog("revise")} style={btnSecondary}>
                    <RotateCcw style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                    Request Revision
                  </Button>
                  <Button onClick={() => openActionDialog("hr_review")} style={btnPrimary}>
                    <CheckCircle style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                    HR Approve
                  </Button>
                </>
              )}

              {/* Management actions: reviewed */}
              {request.status === "reviewed" && canPerformAction([ROLES.MANAGEMENT]) && (
                <>
                  <Button variant="outline" onClick={() => openActionDialog("revise")} style={btnSecondary}>
                    <RotateCcw style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                    Request Revision
                  </Button>
                  <Button onClick={() => openActionDialog("reject")} style={btnDanger}>
                    <XCircle style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                    Reject
                  </Button>
                  <Button onClick={() => openActionDialog("approve")} style={btnPrimary}>
                    <CheckCircle style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                    Management Approve
                  </Button>
                </>
              )}

              {/* HR actions: approved */}
              {request.status === "approved" && canPerformAction([ROLES.HR_MANAGER]) && (
                <>
                  <Button variant="outline" onClick={handleDownloadPdf} disabled={isProcessing} style={btnSecondary}>
                    <Download style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                    Download PDF
                  </Button>
                  <Button onClick={handleStartRecruitment} disabled={isProcessing} style={btnPrimary}>
                    {isProcessing ? (
                      <Loader2 className="animate-spin" style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                    ) : (
                      <PlayCircle style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                    )}
                    Start Recruitment
                  </Button>
                </>
              )}

              {/* HR actions: in_recruitment */}
              {request.status === "in_recruitment" && canPerformAction([ROLES.HR_MANAGER]) && (
                <Button onClick={() => openActionDialog("complete")} style={btnPrimary}>
                  <Check style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                  Complete
                </Button>
              )}

              {/* Download PDF for completed/in_recruitment */}
              {["in_recruitment", "completed"].includes(request.status) && (
                <Button variant="outline" onClick={handleDownloadPdf} disabled={isProcessing} style={btnSecondary}>
                  <Download style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                  Download PDF
                </Button>
              )}
            </div>
          </div>

          {/* ===== Workflow Progress ===== */}
          {request.status !== "rejected" && (
            <div
              className="border"
              style={{ borderRadius: "8px", backgroundColor: "#fff", borderColor: "rgba(120, 134, 127, 0.2)" }}
            >
              <div style={{ padding: "24px 32px 20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${WORKFLOW_STEPS.length}, 1fr)`, position: "relative" }}>
                  {/* Connector line — sits behind circles */}
                  <div
                    style={{
                      position: "absolute",
                      top: "16px",
                      left: "calc(50% / " + WORKFLOW_STEPS.length + ")",
                      right: "calc(50% / " + WORKFLOW_STEPS.length + ")",
                      height: "2px",
                      backgroundColor: "var(--hsd-ui-color-gray-200)",
                    }}
                  />
                  {/* Completed connector overlay */}
                  {currentStepIndex > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "16px",
                        left: "calc(50% / " + WORKFLOW_STEPS.length + ")",
                        width: `calc(${((currentStepIndex) / (WORKFLOW_STEPS.length - 1)) * 100}% - 50% / ${WORKFLOW_STEPS.length} * 2)`,
                        height: "2px",
                        backgroundColor: "var(--hsd-ui-color-navy-500)",
                        transition: "width 0.5s ease",
                      }}
                    />
                  )}
                  {/* Steps */}
                  {WORKFLOW_STEPS.map((step, index) => {
                    const StepIcon = step.icon;
                    const isActive = index === currentStepIndex;
                    const isCompleted = index < currentStepIndex;

                    return (
                      <div key={step.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", position: "relative" }}>
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: isActive
                              ? "var(--hsd-ui-color-navy-500)"
                              : isCompleted
                              ? "var(--hsd-ui-color-navy-50)"
                              : "var(--hsd-ui-color-gray-100)",
                            color: isActive
                              ? "#fff"
                              : isCompleted
                              ? "var(--hsd-ui-color-navy-500)"
                              : "var(--hsd-ui-color-gray-400)",
                            border: isCompleted
                              ? "1.5px solid var(--hsd-ui-color-navy-200)"
                              : isActive
                              ? "none"
                              : "1.5px solid var(--hsd-ui-color-gray-200)",
                            boxShadow: isActive ? "0 0 0 3px var(--hsd-ui-color-navy-100)" : "none",
                            transition: "all 0.3s ease",
                          }}
                        >
                          {isCompleted ? (
                            <Check style={{ width: "16px", height: "16px", strokeWidth: 2.5 }} />
                          ) : (
                            <StepIcon style={{ width: "15px", height: "15px" }} />
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: "var(--hsd-ui-fontSizes-sm)",
                            fontWeight: isActive ? 500 : 400,
                            color: isActive
                              ? "var(--hsd-ui-color-navy-500)"
                              : isCompleted
                              ? "var(--hsd-ui-color-gray-900)"
                              : "var(--hsd-ui-color-gray-400)",
                            textAlign: "center",
                            lineHeight: "1.25",
                            transition: "color 0.3s ease",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Rejected Banner */}
          {request.status === "rejected" && (
            <div
              className="border"
              style={{
                borderRadius: "8px",
                backgroundColor: "rgba(250, 55, 70, 0.04)",
                borderColor: "rgba(250, 55, 70, 0.3)",
                padding: "24px",
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(250, 55, 70, 0.1)",
                  }}
                >
                  <XCircle style={{ width: "16px", height: "16px", color: "rgba(250, 55, 70, 1)" }} />
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: "0.9375rem",
                      fontWeight: 600,
                      color: "rgba(250, 55, 70, 1)",
                      margin: 0,
                    }}
                  >
                    Request Rejected
                  </h3>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--hsd-ui-color-gray-500)",
                      margin: "4px 0 0",
                    }}
                  >
                    This employee request has been rejected by management.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ===== Profile Header Card ===== */}
          <div
            className="border"
            style={{ borderRadius: "8px", backgroundColor: "#fff", borderColor: "rgba(120, 134, 127, 0.2)" }}
          >
            <div className="p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                {/* Icon */}
                <div
                  className="flex h-20 w-20 shrink-0 items-center justify-center"
                  style={{ borderRadius: "8px", backgroundColor: "var(--hsd-ui-color-navy-50)" }}
                >
                  <Briefcase style={{ width: "36px", height: "36px", color: "var(--hsd-ui-color-navy-500)" }} />
                </div>

                <div className="flex-1 min-w-0 sm:pt-2">
                  {/* Code & Title */}
                  <h1
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 600,
                      color: "var(--hsd-ui-color-gray-900)",
                      margin: 0,
                    }}
                  >
                    {request.code}
                  </h1>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 400,
                      color: "var(--hsd-ui-color-gray-600)",
                      margin: "4px 0 0",
                    }}
                  >
                    {request.jobTitle?.name}
                  </p>

                  {/* Badges */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <TuvBadge
                      text={statusConfig?.label || request.status}
                      variant={STATUS_BADGE_VARIANT[request.status]}
                      size="sm"
                      border
                    />
                    <TuvBadge
                      text={EMPLOYMENT_TYPE_LABELS[request.employmentType as EmploymentType] || request.employmentType}
                      variant="info"
                      size="sm"
                      border
                    />
                    {request.recruitmentCode && (
                      <TuvBadge
                        text={request.recruitmentCode}
                        variant="purple"
                        size="sm"
                        border
                      />
                    )}
                  </div>

                  {/* Key facts row */}
                  <div
                    className="mt-5 pt-4 grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4"
                    style={{ borderTop: "1px solid rgba(120, 134, 127, 0.15)" }}
                  >
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
          <SectionCard title="General Information" icon={Info}>
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
            <div className="mt-5 pt-4" style={{ borderTop: "1px solid rgba(120, 134, 127, 0.12)" }}>
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
                Purpose / Justification
              </p>
              <p
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: request.purpose ? "var(--hsd-ui-color-gray-700)" : "var(--hsd-ui-color-gray-400)",
                  margin: "4px 0 0",
                  whiteSpace: "pre-wrap",
                  fontStyle: request.purpose ? "normal" : "italic",
                }}
              >
                {request.purpose || "No Data"}
              </p>
            </div>
          </SectionCard>

          {/* ===== Requirements ===== */}
          <SectionCard title="Requirements" icon={Sparkles}>
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
          </SectionCard>

          {/* ===== Rich Text Sections ===== */}
          {hasLexicalContent(request.generalJobPurpose) && (
            <SectionCard title="General Job Purpose" icon={ClipboardList}>
              <LexicalRenderer value={request.generalJobPurpose} />
            </SectionCard>
          )}

          {hasLexicalContent(request.jobDescription) && (
            <SectionCard title="Job Description" icon={FileText}>
              <LexicalRenderer value={request.jobDescription} />
            </SectionCard>
          )}

          {hasLexicalContent(request.jobRequirement) && (
            <SectionCard title="Job Requirement" icon={CheckCircle}>
              <LexicalRenderer value={request.jobRequirement} />
            </SectionCard>
          )}

          {/* ===== Activity History ===== */}
          <SectionCard title="Activity History" icon={Activity}>
            {request.comments && request.comments.length > 0 ? (
              <div className="space-y-6">
                {request.comments.map((comment, index) => (
                  <div
                    key={comment.id}
                    className="flex gap-4"
                    style={index !== 0 ? { paddingTop: "24px", borderTop: "1px solid rgba(120, 134, 127, 0.12)" } : undefined}
                  >
                    <div
                      className="flex items-center justify-center flex-shrink-0"
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        backgroundColor: "var(--hsd-ui-color-navy-50)",
                      }}
                    >
                      <UserCircle style={{ width: "16px", height: "16px", color: "var(--hsd-ui-color-navy-500)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <span
                            style={{
                              fontSize: "0.875rem",
                              fontWeight: 600,
                              color: "var(--hsd-ui-color-gray-900)",
                            }}
                          >
                            {comment.userName}
                          </span>
                          {comment.userRole && (
                            <TuvBadge text={comment.userRole} variant="dark" size="xs" border />
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--hsd-ui-color-gray-400)",
                            flexShrink: 0,
                          }}
                        >
                          {formatShortDate(comment.createdAt)}
                        </span>
                      </div>
                      {comment.newStatus && (
                        <div style={{ marginTop: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <span
                            style={{
                              fontSize: "0.875rem",
                              color: "var(--hsd-ui-color-gray-500)",
                            }}
                          >
                            Status changed to
                          </span>
                          <TuvBadge
                            text={EMPLOYEE_REQUEST_STATUS_CONFIG[comment.newStatus]?.label || comment.newStatus}
                            variant={STATUS_BADGE_VARIANT[comment.newStatus as EmployeeRequestStatus] || "dark"}
                            size="xs"
                            border
                          />
                        </div>
                      )}
                      {comment.comment && (
                        <p
                          style={{
                            fontSize: "0.875rem",
                            color: "var(--hsd-ui-color-gray-600)",
                            margin: "8px 0 0",
                          }}
                        >
                          {comment.comment}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--hsd-ui-color-gray-400)",
                  margin: 0,
                  fontStyle: "italic",
                }}
              >
                No activity history yet
              </p>
            )}
          </SectionCard>
        </div>
      </PageContainer>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{request.code}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing} style={btnSecondary}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isProcessing} style={btnDanger}>
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin" style={{ width: "16px", height: "16px", marginRight: "6px" }} />
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
            <Label
              htmlFor="comment"
              style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--hsd-ui-color-gray-700)" }}
            >
              Comment {actionType === "reject" || actionType === "revise" ? "(required)" : "(optional)"}
            </Label>
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
              style={btnSecondary}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={isProcessing || ((actionType === "reject" || actionType === "revise") && !actionComment)}
              style={dialogContent.isDanger ? btnDanger : btnPrimary}
            >
              {isProcessing && (
                <Loader2 className="animate-spin" style={{ width: "16px", height: "16px", marginRight: "6px" }} />
              )}
              {dialogContent.buttonText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
