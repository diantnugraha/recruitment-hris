"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Loader2,
  CheckCircle,
  XCircle,
  RotateCcw,
  Users,
  Pencil,
  PlayCircle,
  Sparkles,
  Send,
  Check,
  Mail,
  UserPlus,
  Search,
  ChevronRight,
  UserCircle,
  Briefcase,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TuvBadge } from "@/components/shared/tuv-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { formatShortDate } from "@/lib/utils";
import { showToast } from "@/lib/utils/toast-messages";
import { hasBiodataSubmitted } from "@/lib/utils/recruitmentHelpers";
import { employeeRequestService } from "@/services/employee-request.service";
import { candidateService, type CandidateWithRelations } from "@/services/candidate.service";
import {
  EMPLOYEE_REQUEST_STATUS_CONFIG,
  EMPLOYMENT_TYPE_LABELS,
  WORK_LOCATION_LABELS,
  type EmployeeRequestStatus,
  type EmploymentType,
  type WorkLocation,
} from "@/lib/constants/employeeRequest";
import {
  CANDIDATE_STATUS,
  CANDIDATE_STATUS_CONFIG,
  type CandidateStatus,
} from "@/lib/constants/candidateStatus";
import type { EmployeeRequestWithRelations } from "@/types/employee-request";
import { SlaBanner } from "@/components/shared/SlaBanner";

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
  headerRight,
  titleBadge,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  headerRight?: React.ReactNode;
  titleBadge?: React.ReactNode;
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
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
        {titleBadge}
        </div>
        <div className="flex items-center gap-2">
          {headerRight}
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: "var(--hsd-ui-color-gray-100)" }}
          >
            <Icon
              style={{ width: "16px", height: "16px", color: "var(--hsd-ui-color-gray-500)" }}
            />
          </div>
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
      {Array.from({ length: 2 }).map((_, i) => (
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

const CANDIDATE_STATUS_BADGE_VARIANT: Record<string, "success" | "danger" | "info" | "warning" | "dark" | "brand" | "purple" | "rose"> = {
  waiting_biodata: "dark",
  screening: "info",
  interview_1: "brand",
  interview_2: "purple",
  mcu: "warning",
  waiting_accepted: "info",
  hired: "success",
  rejected: "danger",
};

// Workflow steps for the timeline
const WORKFLOW_STEPS = [
  { key: "draft", label: "Draft", icon: Pencil },
  { key: "created", label: "Submitted", icon: Send },
  { key: "hod_review", label: "HOD Review", icon: UserCircle },
  { key: "reviewed", label: "HR Review", icon: CheckCircle },
  { key: "approved", label: "Approved", icon: Sparkles },
  { key: "in_recruitment", label: "Recruiting", icon: Users },
  { key: "completed", label: "Completed", icon: Check },
] as const;

function getCurrentStepIndex(status: EmployeeRequestStatus): number {
  if (status === "rejected" || status === "revise") return 0;
  return WORKFLOW_STEPS.findIndex((s) => s.key === status);
}

// --- Page component ---

export default function RecruitmentRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // State
  const [request, setRequest] = React.useState<EmployeeRequestWithRelations | null>(null);
  const [candidates, setCandidates] = React.useState<CandidateWithRelations[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [candidateSearch, setCandidateSearch] = React.useState("");

  // Dialog states
  const [showActionDialog, setShowActionDialog] = React.useState(false);
  const [actionType, setActionType] = React.useState<"review" | "approve" | "reject" | "revise" | "start_recruitment" | null>(null);
  const [actionComment, setActionComment] = React.useState("");
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Send Invitation dialog state
  const [showInviteDialog, setShowInviteDialog] = React.useState(false);
  const [inviteFullName, setInviteFullName] = React.useState("");
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [isSendingInvite, setIsSendingInvite] = React.useState(false);

  // Fetch data
  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await employeeRequestService.getById(id);

      if (response.success && response.data) {
        setRequest(response.data);

        try {
          const candidatesRes = await candidateService.getByEmployeeRequest(
            Number(response.data.id),
            1,
            100
          );
          if (candidatesRes.success && candidatesRes.data) {
            const candidatesList = candidatesRes.data.data;

            // For candidates who passed MCU, fetch onboarding to get onboardingAcceptedAt
            const mcuPassedCandidates = candidatesList.filter(
              (c) => c.assessment?.mcuStatus === "PASSED"
            );

            if (mcuPassedCandidates.length > 0) {
              const onboardingResults = await Promise.allSettled(
                mcuPassedCandidates.map((c) =>
                  candidateService.getOnboarding(c.id)
                )
              );

              onboardingResults.forEach((result, index) => {
                if (result.status === "fulfilled" && result.value.success && result.value.data) {
                  const candidateId = mcuPassedCandidates[index].id;
                  const target = candidatesList.find((c) => c.id === candidateId);
                  if (target) {
                    target.onboardingAcceptedAt = result.value.data.onboardingAcceptedAt;
                  }
                }
              });
            }

            setCandidates(candidatesList);
          }
        } catch (candidateErr) {
          console.warn("Failed to fetch candidates:", candidateErr);
        }
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

  // Action handlers
  const handleAction = async () => {
    if (!request || !actionType) return;
    setIsProcessing(true);

    try {
      let newStatus: EmployeeRequestStatus = request.status;
      let message = "";

      switch (actionType) {
        case "review":
          newStatus = "reviewed";
          message = "Request reviewed and forwarded for approval";
          break;
        case "approve":
          newStatus = "approved";
          message = "Request approved successfully";
          break;
        case "reject":
          newStatus = "rejected";
          message = "Request rejected";
          break;
        case "revise":
          newStatus = "revise";
          message = "Request returned for revision";
          break;
        case "start_recruitment":
          newStatus = "in_recruitment";
          message = "Recruitment process started";
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

  // Send Invitation handler
  const handleSendInvitation = async () => {
    if (!request || !inviteFullName.trim() || !inviteEmail.trim()) {
      showToast.error("Please fill in all required fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      showToast.error("Please enter a valid email address");
      return;
    }

    setIsSendingInvite(true);

    try {
      const createRes = await candidateService.create({
        fullname: inviteFullName.trim(),
        email: inviteEmail.trim(),
        employee_request_id: Number(request.id),
        job_title_id: Number(request.jobTitleId),
      });

      if (!createRes.success || !createRes.data) {
        showToast.error(createRes.message || "Failed to create candidate");
        return;
      }

      const newCandidate = createRes.data;
      const inviteRes = await candidateService.sendInvitation(newCandidate.id);

      if (inviteRes.success) {
        showToast.success(`Invitation sent to ${inviteEmail}`);
      } else {
        showToast.error(inviteRes.message || "Candidate created but failed to send invitation");
      }

      setCandidates(prev => [...prev, newCandidate]);
      setInviteFullName("");
      setInviteEmail("");
      setShowInviteDialog(false);
    } catch (err) {
      showToast.error("Failed to send invitation");
    } finally {
      setIsSendingInvite(false);
    }
  };

  const openActionDialog = (type: typeof actionType) => {
    setActionType(type);
    setShowActionDialog(true);
  };

  const deriveCandidateStatus = (candidate: CandidateWithRelations): CandidateStatus => {
    // If candidate hasn't submitted biodata yet
    if (!hasBiodataSubmitted(candidate)) return CANDIDATE_STATUS.WAITING_BIODATA;

    const assessment = candidate.assessment;

    // If no assessment, show SCREENING (ready for interview)
    if (!assessment) return CANDIDATE_STATUS.SCREENING;

    // Check if any interview has progressed beyond PENDING
    const interview1Started = assessment.interview1Status && assessment.interview1Status !== "PENDING";
    const interview2Started = assessment.interview2Status && assessment.interview2Status !== "PENDING";
    const mcuStarted = assessment.mcuStatus && assessment.mcuStatus !== "PENDING";

    // MCU completed
    if (assessment.mcuStatus === "PASSED") {
      // If onboarding accepted, show HIRED
      if (candidate.onboardingAcceptedAt) return CANDIDATE_STATUS.HIRED;
      // If not yet accepted, show WAITING_ACCEPTED
      return CANDIDATE_STATUS.WAITING_ACCEPTED;
    }
    if (assessment.mcuStatus === "FAILED") return CANDIDATE_STATUS.REJECTED;
    if (mcuStarted) return CANDIDATE_STATUS.MCU;

    // Interview 2 completed
    if (assessment.interview2Status === "PASSED") return CANDIDATE_STATUS.MCU;
    if (assessment.interview2Status === "FAILED") return CANDIDATE_STATUS.REJECTED;
    if (interview2Started) return CANDIDATE_STATUS.INTERVIEW_2;

    // Interview 1 completed
    if (assessment.interview1Status === "PASSED") return CANDIDATE_STATUS.INTERVIEW_2;
    if (assessment.interview1Status === "FAILED") return CANDIDATE_STATUS.REJECTED;
    if (interview1Started) return CANDIDATE_STATUS.INTERVIEW_1;

    // Assessment exists but all statuses are PENDING -- interview process was started
    return CANDIDATE_STATUS.INTERVIEW_1;
  };

  const getActionDialogContent = () => {
    switch (actionType) {
      case "review":
        return { title: "Review Request", description: "Mark this request as reviewed and forward to management for approval.", buttonText: "Mark as Reviewed", isDanger: false };
      case "approve":
        return { title: "Approve Request", description: "Approve this employee request. Recruitment can begin after approval.", buttonText: "Approve", isDanger: false };
      case "reject":
        return { title: "Reject Request", description: "Reject this employee request. Please provide a reason for rejection.", buttonText: "Reject", isDanger: true };
      case "revise":
        return { title: "Request Revision", description: "Return this request for revision. Please specify what needs to be changed.", buttonText: "Request Revision", isDanger: false };
      case "start_recruitment":
        return { title: "Start Recruitment", description: "Start the recruitment process. You can then invite candidates to apply.", buttonText: "Start Recruitment", isDanger: false };
      default:
        return { title: "", description: "", buttonText: "", isDanger: false };
    }
  };

  // Filtered candidates by search
  const filteredCandidates = React.useMemo(() => {
    if (candidateSearch.length < 2) return candidates;
    const q = candidateSearch.toLowerCase();
    return candidates.filter(
      (c) =>
        c.fullname.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.detail?.candidateCode?.toLowerCase().includes(q)
    );
  }, [candidates, candidateSearch]);

  const canInviteCandidates = request ? ["approved", "in_recruitment"].includes(request.status) : false;

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
          {/* Top Bar -- back link + title + actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                href="/recruitment"
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
                Recruitment
              </Link>
              <h1
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  color: "var(--hsd-ui-color-gray-900)",
                  margin: "8px 0 0",
                }}
              >
                {request.recruitmentCode
                  ? request.recruitmentCode.replace("REC-", "RC.").replace(/-/g, "")
                  : request.code}
              </h1>
            </div>
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

              {/* Action Buttons */}
              {request.status === "created" && (
                <>
                  <Button variant="outline" onClick={() => openActionDialog("revise")} style={btnSecondary}>
                    <RotateCcw style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                    Request Revision
                  </Button>
                  <Button onClick={() => openActionDialog("review")} style={btnPrimary}>
                    <CheckCircle style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                    Mark as Reviewed
                  </Button>
                </>
              )}
              {request.status === "reviewed" && (
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
                    Approve
                  </Button>
                </>
              )}
              {request.status === "approved" && (
                <Button onClick={() => openActionDialog("start_recruitment")} style={btnPrimary}>
                  <PlayCircle style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                  Start Recruitment
                </Button>
              )}
            </div>
          </div>

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

          {/* SLA Banner */}
          {request.sla && (
            <SlaBanner sla={request.sla} />
          )}

          {/* Workflow Progress */}
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

          {/* Profile Header Card */}
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
                      fontSize: "1.25rem",
                      fontWeight: 600,
                      color: "var(--hsd-ui-color-gray-900)",
                      margin: 0,
                    }}
                  >
                    {request.jobTitle?.name}
                  </h1>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 400,
                      color: "var(--hsd-ui-color-gray-600)",
                      margin: "4px 0 0",
                    }}
                  >
                    {request.department?.name}
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
                    <DetailItem label="Openings" value={`${request.quantity} ${request.quantity > 1 ? "positions" : "position"}`} />
                    <DetailItem label="Work Location" value={request.jobPlacement ? (WORK_LOCATION_LABELS[request.jobPlacement as WorkLocation] || request.jobPlacement) : ""} />
                    <DetailItem label="Target Onboard" value={request.expectedOnboardDate ? formatShortDate(request.expectedOnboardDate) : ""} />
                    <DetailItem
                      label="Employee Request"
                      value={request.code}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Job Details */}
          <SectionCard
            title="Job Details"
            icon={Briefcase}
            headerRight={
              <button
                onClick={() => router.push(`/employee-request/${request.id}`)}
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  color: "var(--hsd-ui-background-color-primary)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "none",
                }}
              >
                {request.code}
              </button>
            }
          >
            <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
              <DetailItem label="Position" value={request.jobTitle?.name || ""} />
              <DetailItem label="Department" value={request.department?.name || ""} />
              <DetailItem label="Employment Type" value={request.employmentType ? EMPLOYMENT_TYPE_LABELS[request.employmentType as EmploymentType] : ""} />
              <DetailItem label="Work Location" value={request.jobPlacement ? (WORK_LOCATION_LABELS[request.jobPlacement as WorkLocation] || request.jobPlacement) : ""} />
              <DetailItem label="Openings" value={String(request.quantity)} />
              <DetailItem label="Target Onboard" value={request.expectedOnboardDate ? formatShortDate(request.expectedOnboardDate) : ""} />
            </div>
          </SectionCard>

          {/* Candidates Section */}
          <SectionCard
            title="Candidates"
            icon={Users}
            titleBadge={candidates.length > 0 ? <TuvBadge text={String(candidates.length)} variant="info" size="xs" border /> : undefined}
            headerRight={
              <div className="flex items-center gap-2">
                {candidates.length > 0 && (
                  <div className="relative">
                    <Search
                      className="absolute left-2.5 top-1/2 -translate-y-1/2"
                      style={{ width: "14px", height: "14px", color: "var(--hsd-ui-color-gray-400)" }}
                    />
                    <Input
                      placeholder="Search..."
                      value={candidateSearch}
                      onChange={(e) => setCandidateSearch(e.target.value)}
                      className="pl-8 h-9 text-sm w-[160px]"
                      style={{ borderColor: "rgba(120,134,127,0.2)", borderRadius: "4px" }}
                    />
                  </div>
                )}
                {canInviteCandidates && (
                  <Button onClick={() => setShowInviteDialog(true)} style={btnPrimary}>
                    <Mail style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                    Invite
                  </Button>
                )}
              </div>
            }
          >
            {candidates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-xl"
                  style={{ backgroundColor: "var(--hsd-ui-color-gray-100)" }}
                >
                  <Users style={{ width: "28px", height: "28px", color: "var(--hsd-ui-color-gray-400)" }} />
                </div>
                <h4
                  style={{
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    color: "var(--hsd-ui-color-gray-900)",
                    margin: "16px 0 0",
                  }}
                >
                  No candidates yet
                </h4>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--hsd-ui-color-gray-500)",
                    margin: "4px 0 0",
                    maxWidth: "280px",
                  }}
                >
                  Invite candidates to apply for this position
                </p>
                {canInviteCandidates && (
                  <Button
                    variant="outline"
                    onClick={() => setShowInviteDialog(true)}
                    style={{ ...btnSecondary, marginTop: "16px" }}
                  >
                    <UserPlus style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                    Invite Candidate
                  </Button>
                )}
              </div>
            ) : (
              <div
                style={{
                  margin: "0 -24px -20px",
                  border: "1px solid rgba(120, 134, 127, 0.2)",
                  borderRadius: "0 0 8px 8px",
                  borderTop: "none",
                  overflow: "hidden",
                }}
              >
                <Table>
                  <TableHeader>
                    <TableRow
                      onMouseOver={undefined}
                      onMouseOut={undefined}
                      style={{ backgroundColor: "#F8F9FB", borderBottom: "1px solid rgba(120, 134, 127, 0.2)" }}
                    >
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead style={{ width: "40px" }} />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCandidates.map((candidate) => {
                      const candidateStatus = deriveCandidateStatus(candidate);
                      const statusConf = CANDIDATE_STATUS_CONFIG[candidateStatus];
                      return (
                        <TableRow
                          key={candidate.id}
                          className="group cursor-pointer"
                          onClick={() => router.push(`/recruitment/${candidate.id}`)}
                        >
                          <TableCell>
                            <span
                              style={{
                                fontSize: "0.875rem",
                                fontWeight: 500,
                                color: "var(--hsd-ui-color-navy-500)",
                              }}
                            >
                              {candidate.detail?.candidateCode || `CND-${candidate.id}`}
                            </span>
                          </TableCell>
                          <TableCell>
                            <p
                              style={{
                                fontSize: "0.875rem",
                                fontWeight: 500,
                                color: "var(--hsd-ui-color-gray-900)",
                                margin: 0,
                              }}
                            >
                              {candidate.fullname}
                            </p>
                            <p
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--hsd-ui-color-gray-500)",
                                margin: "2px 0 0",
                              }}
                            >
                              {candidate.email}
                            </p>
                          </TableCell>
                          <TableCell
                            style={{
                              fontSize: "0.875rem",
                              color: "var(--hsd-ui-color-gray-500)",
                            }}
                          >
                            {candidate.createdAt ? formatShortDate(candidate.createdAt) : "No Data"}
                          </TableCell>
                          <TableCell>
                            <TuvBadge
                              text={statusConf?.label || candidateStatus}
                              variant={CANDIDATE_STATUS_BADGE_VARIANT[candidateStatus] || "dark"}
                              size="sm"
                              border
                            />
                          </TableCell>
                          <TableCell>
                            <ChevronRight
                              style={{
                                width: "16px",
                                height: "16px",
                                color: "var(--hsd-ui-color-gray-400)",
                                opacity: 0,
                                transition: "opacity 0.15s",
                              }}
                              className="group-hover:opacity-100"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </SectionCard>
        </div>
      </PageContainer>

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

      {/* Send Invitation Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Mail style={{ width: "20px", height: "20px" }} />
              Send Invitation
            </DialogTitle>
            <DialogDescription>
              Enter the candidate&apos;s details to send them an invitation email for the {request?.jobTitle?.name} position.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <Label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--hsd-ui-color-gray-700)" }}>
                Full Name <span style={{ color: "rgba(250, 55, 70, 1)" }}>*</span>
              </Label>
              <Input
                id="fullname"
                placeholder="Enter candidate's full name"
                value={inviteFullName}
                onChange={(e) => setInviteFullName(e.target.value)}
                disabled={isSendingInvite}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <Label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--hsd-ui-color-gray-700)" }}>
                Email Address <span style={{ color: "rgba(250, 55, 70, 1)" }}>*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter candidate's email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={isSendingInvite}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setShowInviteDialog(false); setInviteFullName(""); setInviteEmail(""); }}
              disabled={isSendingInvite}
              style={btnSecondary}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendInvitation}
              disabled={isSendingInvite || !inviteFullName.trim() || !inviteEmail.trim()}
              style={btnPrimary}
            >
              {isSendingInvite ? (
                <>
                  <Loader2 className="animate-spin" style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                  Sending...
                </>
              ) : (
                <>
                  <Send style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
