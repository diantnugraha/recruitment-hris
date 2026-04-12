"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Calendar,
  ChevronLeft,
  Loader2,
  XCircle,
  Clock,
  ClipboardCheck,
  Stethoscope,
  Lock,
  User,
  FileText,
  PartyPopper,
  Users,
  Check,
  Monitor,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TuvBadge } from "@/components/shared/tuv-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  candidateService,
  type CandidateWithRelations,
  type AssessmentProgress,
  type CandidateBiodata,
} from "@/services/candidate.service";
import { formatShortDate } from "@/lib/utils";
import { showToast } from "@/lib/utils/toast-messages";
import { hasBiodataSubmitted } from "@/lib/utils/recruitmentHelpers";

import { ProfileTab } from "@/components/recruitment/tabs/ProfileTab";
import { InterviewHRTab } from "@/components/recruitment/tabs/InterviewHRTab";
import { InterviewUserTab } from "@/components/recruitment/tabs/InterviewUserTab";
import { McuTab } from "@/components/recruitment/tabs/McuTab";
import { OnboardingTab } from "@/components/recruitment/tabs/OnboardingTab";
import { useAssessmentPermission, isHROrAdmin, type TabMode } from "@/hooks/useAssessmentPermission";
import { SlaBanner } from "@/components/shared/SlaBanner";
import { useAuthStore } from "@/stores/auth-store";

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
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="border p-6 space-y-4"
          style={{ borderRadius: "8px", backgroundColor: "#fff", borderColor: "rgba(120, 134, 127, 0.2)" }}
        >
          <Skeleton className="h-5 w-40" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, j) => (
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

// Workflow progress steps for visual stepper
const RECRUITMENT_WORKFLOW_STEPS = [
  { key: "biodata", label: "Biodata", icon: FileText },
  { key: "interview1", label: "Interview HR", icon: ClipboardCheck },
  { key: "interview2", label: "Interview User", icon: Users },
  { key: "mcu", label: "MCU", icon: Stethoscope },
  { key: "completed", label: "Completed", icon: PartyPopper },
];

function getTabMode(canEdit: boolean, isUnlocked: boolean): TabMode {
  if (!isUnlocked) return "locked";
  if (!canEdit) return "view";
  return "edit";
}

// --- Page component ---

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const initialTab = searchParams.get("tab") || "profile";

  // Core state
  const [candidate, setCandidate] = React.useState<CandidateWithRelations | null>(null);
  const [progress, setProgress] = React.useState<AssessmentProgress | null>(null);
  const [biodata, setBiodata] = React.useState<CandidateBiodata | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState(initialTab);

  // Start Interview dialog state
  const [isStartingInterview, setIsStartingInterview] = React.useState(false);
  const [showStartInterviewDialog, setShowStartInterviewDialog] = React.useState(false);
  const [interviewDate, setInterviewDate] = React.useState("");
  const [interviewTime, setInterviewTime] = React.useState("");
  const [interviewType, setInterviewType] = React.useState<"online" | "onsite" | "">("");

  // Permissions
  const user = useAuthStore((state) => state.user);
  const permissions = useAssessmentPermission(id);
  const canEditAssignees = user ? isHROrAdmin(user.roleId) : false;

  // Handle tab change and update URL
  const handleTabChange = React.useCallback((tab: string) => {
    setActiveTab(tab);
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("tab", tab);
    router.replace(`?${newParams.toString()}`, { scroll: false });
  }, [searchParams, router]);

  // Fetch candidate and assessment data
  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [candidateRes, progressRes, biodataRes] = await Promise.all([
        candidateService.getById(id),
        candidateService.getAssessmentProgress(id),
        candidateService.getBiodata(id),
      ]);

      if (candidateRes.success && candidateRes.data) {
        setCandidate(candidateRes.data);
      } else {
        setError(candidateRes.message || "Failed to load candidate");
        return;
      }

      if (progressRes.success && progressRes.data) {
        setProgress(progressRes.data);
      }

      if (biodataRes.success && biodataRes.data) {
        setBiodata(biodataRes.data);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("Failed to load candidate");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Stale draft cleanup on rejection
  React.useEffect(() => {
    if (progress?.anyFailed) {
      localStorage.removeItem(`hr-assessment-form-${id}`);
      localStorage.removeItem(`user-assessment-form-${id}`);
    }
  }, [progress?.anyFailed, id]);

  // Derived state
  const canStartOnboarding = progress?.allPassed === true;

  const interviewStarted =
    progress?.interviewStarted === true ||
    progress?.interview1?.locked === false ||
    progress?.interview1?.passed === true ||
    progress?.interview1?.failed === true ||
    progress?.interview2?.passed === true ||
    progress?.interview2?.failed === true ||
    progress?.mcu?.passed === true ||
    progress?.mcu?.failed === true;

  // Tab mode derivations
  const interviewHRMode = getTabMode(permissions.canEditInterviewHR, interviewStarted ?? false);
  const interviewUserMode = getTabMode(
    permissions.canEditInterviewUser,
    (interviewStarted ?? false) && (progress?.interview1.passed ?? false)
  );
  const mcuMode = getTabMode(permissions.canEditMCU, progress?.interview2.passed ?? false);
  const onboardingMode = getTabMode(permissions.canEditOnboarding, progress?.mcu.passed ?? false);

  // Stage status helper (for tab trigger disabled states)
  const getStageStatus = (stage: "interview1" | "interview2" | "mcu") => {
    if (!progress || !interviewStarted) {
      return { status: "pending", locked: true };
    }
    const stageData = progress[stage];
    return {
      status: stageData.passed ? "passed" : stageData.failed ? "failed" : "pending",
      locked: "locked" in stageData ? stageData.locked : false,
    };
  };

  // Workflow stepper current step
  const getCurrentStepIndex = () => {
    if (candidate && !hasBiodataSubmitted(candidate)) return 0;
    if (!interviewStarted) return 0;
    if (!progress) return 1;
    if (progress.anyFailed) return -1;
    if (progress.allPassed) return 4;
    if (progress.interview2.passed) return 3;
    if (progress.interview1.passed) return 2;
    return 1;
  };

  const currentStepIndex = getCurrentStepIndex();

  // Handle Start Interview
  const handleStartInterview = async () => {
    if (!interviewDate || !interviewTime || !interviewType) {
      showToast.error("Please fill in interview date, time, and type");
      return;
    }

    setIsStartingInterview(true);
    try {
      const response = await candidateService.startInterview(id, {
        interview_date: new Date(`${interviewDate}T${interviewTime}`).toISOString(),
        interview_type: interviewType,
      });
      if (response.success && response.data) {
        setProgress(response.data);
        setShowStartInterviewDialog(false);
        setInterviewDate("");
        setInterviewTime("");
        setInterviewType("");
        showToast.success("Interview scheduled! You can now proceed with Assessment HR.");
        handleTabChange("assessment-hr");
      } else {
        showToast.error(response.message || "Failed to start interview");
      }
    } catch (err) {
      showToast.error("Failed to start interview");
    } finally {
      setIsStartingInterview(false);
    }
  };

  // Loading state
  if (isLoading || permissions.isLoading) {
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

  // Permission error state
  if (permissions.isError) {
    return (
      <>
        <Header />
        <PageContainer>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "300px", gap: "12px" }}>
            <p style={{ fontSize: "0.875rem", color: "var(--hsd-ui-color-gray-500)", margin: 0 }}>
              Failed to load permissions
            </p>
            <Button variant="outline" onClick={permissions.refetch} style={btnSecondary}>
              Try Again
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  // Error state
  if (error || !candidate) {
    return (
      <>
        <Header />
        <PageContainer>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "300px", gap: "12px" }}>
            <p style={{ fontSize: "0.875rem", color: "var(--hsd-ui-color-gray-500)", margin: 0 }}>
              {error || "Candidate not found"}
            </p>
            <Button variant="outline" onClick={() => router.back()} style={btnSecondary}>
              Try Again
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Header />
      <PageContainer>
        <div className="space-y-5">
          {/* Top Bar -- back link + actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
          </div>

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
                  <User style={{ width: "36px", height: "36px", color: "var(--hsd-ui-color-navy-500)" }} />
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
                    {candidate.fullname}
                  </h1>

                  {/* Badges */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {candidate.jobTitle && (
                      <TuvBadge
                        text={candidate.jobTitle.name}
                        variant="info"
                        size="sm"
                        border
                      />
                    )}
                    {candidate.verify && (
                      <TuvBadge
                        text={candidate.verify}
                        variant={candidate.verify === "VERIFIED" ? "success" : "warning"}
                        size="sm"
                        border
                      />
                    )}
                    {progress && (
                      <>
                        {progress.anyFailed ? (
                          <TuvBadge text="Assessment Failed" variant="danger" size="sm" border />
                        ) : progress.allPassed ? (
                          <TuvBadge text="All Passed" variant="success" size="sm" border />
                        ) : null}
                      </>
                    )}
                  </div>

                  {/* Key facts row */}
                  <div
                    className="mt-5 pt-4 grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4"
                    style={{ borderTop: "1px solid rgba(120, 134, 127, 0.15)" }}
                  >
                    <DetailItem label="Email" value={candidate.email} />
                    <DetailItem label="Phone" value={candidate.mobilePhone || ""} />
                    <DetailItem label="Request Code" value={candidate.employeeRequest?.code || ""} />
                    <DetailItem label="Applied Date" value={candidate.createdAt ? formatShortDate(candidate.createdAt) : ""} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SLA Banner */}
          {candidate.employeeRequest?.sla && (
            <SlaBanner sla={candidate.employeeRequest.sla} showOnTrack={false} />
          )}

          {/* ===== Workflow Progress Stepper ===== */}
          {!progress?.anyFailed && (
            <div
              className="border"
              style={{ borderRadius: "8px", backgroundColor: "#fff", borderColor: "rgba(120, 134, 127, 0.2)" }}
            >
              <div style={{ padding: "24px 32px 20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${RECRUITMENT_WORKFLOW_STEPS.length}, 1fr)`, position: "relative" }}>
                  {/* Connector line — sits behind circles */}
                  <div
                    style={{
                      position: "absolute",
                      top: "16px",
                      left: "calc(50% / " + RECRUITMENT_WORKFLOW_STEPS.length + ")",
                      right: "calc(50% / " + RECRUITMENT_WORKFLOW_STEPS.length + ")",
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
                        left: "calc(50% / " + RECRUITMENT_WORKFLOW_STEPS.length + ")",
                        width: `calc(${((currentStepIndex) / (RECRUITMENT_WORKFLOW_STEPS.length - 1)) * 100}% - 50% / ${RECRUITMENT_WORKFLOW_STEPS.length} * 2)`,
                        height: "2px",
                        backgroundColor: "var(--hsd-ui-color-navy-500)",
                        transition: "width 0.5s ease",
                      }}
                    />
                  )}
                  {/* Steps */}
                  {RECRUITMENT_WORKFLOW_STEPS.map((step, index) => {
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

          {/* Start Interview Banner */}
          {hasBiodataSubmitted(candidate) && !interviewStarted && !progress?.anyFailed && (
            <div
              className="border"
              style={{
                borderRadius: "8px",
                backgroundColor: "rgba(0, 168, 120, 0.04)",
                borderColor: "rgba(0, 168, 120, 0.3)",
                padding: "24px",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(0, 168, 120, 0.1)",
                    }}
                  >
                    <ClipboardCheck style={{ width: "24px", height: "24px", color: "var(--hsd-ui-background-color-primary)" }} />
                  </div>
                  <div>
                    <h3
                      style={{
                        fontSize: "0.9375rem",
                        fontWeight: 600,
                        color: "var(--hsd-ui-background-color-primary)",
                        margin: 0,
                      }}
                    >
                      Ready for Interview
                    </h3>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--hsd-ui-color-gray-500)",
                        margin: "4px 0 0",
                      }}
                    >
                      Candidate biodata has been submitted. Schedule the interview to proceed.
                    </p>
                  </div>
                </div>
                <Button onClick={() => setShowStartInterviewDialog(true)} style={btnPrimary}>
                  <ClipboardCheck style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                  Schedule Interview
                </Button>
              </div>
            </div>
          )}

          {/* Failed Banner */}
          {progress?.anyFailed && (
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
                    Assessment Failed
                  </h3>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--hsd-ui-color-gray-500)",
                      margin: "4px 0 0",
                    }}
                  >
                    This candidate has failed one of the assessment stages and cannot proceed further.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ===== Tabs ===== */}
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <div
              className="border overflow-hidden"
              style={{ borderRadius: "8px", backgroundColor: "#fff", borderColor: "rgba(120, 134, 127, 0.2)" }}
            >
              <TabsList className="grid w-full grid-cols-5 bg-transparent h-auto p-0">
                {[
                  { value: "profile", label: "Profile", disabled: false, locked: false },
                  { value: "assessment-hr", label: "Assessment HR", disabled: !interviewStarted, locked: !interviewStarted },
                  { value: "assessment-user", label: "Assessment User", disabled: !interviewStarted || getStageStatus("interview2").locked, locked: !interviewStarted || getStageStatus("interview2").locked },
                  { value: "mcu", label: "MCU", disabled: !interviewStarted || getStageStatus("mcu").locked, locked: !interviewStarted || getStageStatus("mcu").locked },
                  { value: "onboarding", label: "Onboarding", disabled: !canStartOnboarding, locked: !canStartOnboarding },
                ].map((tab, index) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    disabled={tab.disabled}
                    className="data-[state=active]:shadow-none rounded-none py-3 text-sm font-medium"
                    style={{
                      borderBottom: activeTab === tab.value
                        ? "2px solid var(--hsd-ui-background-color-primary)"
                        : "2px solid transparent",
                      color: activeTab === tab.value
                        ? "var(--hsd-ui-background-color-primary)"
                        : tab.disabled
                        ? "var(--hsd-ui-color-gray-300)"
                        : "var(--hsd-ui-color-gray-500)",
                      fontSize: "0.875rem",
                      fontWeight: activeTab === tab.value ? 600 : 500,
                      backgroundColor: "transparent",
                    }}
                  >
                    {tab.locked && <Lock style={{ width: "14px", height: "14px", marginRight: "6px" }} />}
                    {tab.value === "onboarding" && canStartOnboarding && <PartyPopper style={{ width: "14px", height: "14px", marginRight: "6px" }} />}
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="profile" className="mt-6">
              <ProfileTab candidate={candidate} biodata={biodata} isBiodataLoading={false} />
            </TabsContent>
            <TabsContent value="assessment-hr" className="mt-6">
              <InterviewHRTab candidate={candidate} candidateId={id} mode={interviewHRMode} progress={progress} onRefresh={fetchData} />
            </TabsContent>
            <TabsContent value="assessment-user" className="mt-6">
              <InterviewUserTab candidate={candidate} candidateId={id} mode={interviewUserMode} progress={progress} canEditAssignees={canEditAssignees} onRefresh={fetchData} />
            </TabsContent>
            <TabsContent value="mcu" className="mt-6">
              <McuTab candidate={candidate} candidateId={id} mode={mcuMode} progress={progress} onRefresh={fetchData} />
            </TabsContent>
            <TabsContent value="onboarding" className="mt-6">
              <OnboardingTab candidateId={id} mode={onboardingMode} onRefresh={fetchData} />
            </TabsContent>
          </Tabs>
        </div>
      </PageContainer>

      {/* Start Interview Dialog */}
      <Dialog open={showStartInterviewDialog} onOpenChange={(open) => {
        setShowStartInterviewDialog(open);
        if (!open) {
          setInterviewDate("");
          setInterviewTime("");
          setInterviewType("");
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "1rem",
                fontWeight: 600,
                color: "var(--hsd-ui-color-gray-900)",
              }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(0, 168, 120, 0.1)",
                }}
              >
                <ClipboardCheck style={{ width: "16px", height: "16px", color: "var(--hsd-ui-background-color-primary)" }} />
              </div>
              Schedule Interview
            </DialogTitle>
            <DialogDescription
              style={{
                fontSize: "0.875rem",
                color: "var(--hsd-ui-color-gray-500)",
              }}
            >
              Set the interview date, time, and type for this candidate.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-3">
              <Label
                style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--hsd-ui-color-gray-700)" }}
              >
                Interview Date & Time
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="interview-date"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "0.75rem",
                      fontWeight: 400,
                      color: "var(--hsd-ui-color-gray-500)",
                    }}
                  >
                    <Calendar style={{ width: "12px", height: "12px" }} />
                    Date
                  </Label>
                  <Input
                    id="interview-date"
                    type="date"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                    className="h-11 text-sm font-medium tabular-nums"
                    style={{
                      height: "38px",
                      borderRadius: "4px",
                      border: "1px solid rgba(120, 134, 127, 0.2)",
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: 400,
                      color: "#232933",
                      padding: "0 12px",
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="interview-time"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "0.75rem",
                      fontWeight: 400,
                      color: "var(--hsd-ui-color-gray-500)",
                    }}
                  >
                    <Clock style={{ width: "12px", height: "12px" }} />
                    Time
                  </Label>
                  <Input
                    id="interview-time"
                    type="time"
                    value={interviewTime}
                    onChange={(e) => setInterviewTime(e.target.value)}
                    className="h-11 text-sm font-medium tabular-nums"
                    style={{
                      height: "38px",
                      borderRadius: "4px",
                      border: "1px solid rgba(120, 134, 127, 0.2)",
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: 400,
                      color: "#232933",
                      padding: "0 12px",
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label
                style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--hsd-ui-color-gray-700)" }}
              >
                Interview Type
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setInterviewType("onsite")}
                  className="flex flex-col items-center gap-2 p-4 transition-all"
                  style={{
                    borderRadius: "8px",
                    border: interviewType === "onsite"
                      ? "2px solid var(--hsd-ui-background-color-primary)"
                      : "2px solid rgba(120, 134, 127, 0.2)",
                    backgroundColor: interviewType === "onsite"
                      ? "rgba(0, 168, 120, 0.04)"
                      : "#fff",
                    color: interviewType === "onsite"
                      ? "var(--hsd-ui-background-color-primary)"
                      : "var(--hsd-ui-color-gray-700)",
                  }}
                >
                  <Building2 style={{ width: "24px", height: "24px" }} />
                  <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>Onsite</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--hsd-ui-color-gray-500)" }}>In-person interview</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInterviewType("online")}
                  className="flex flex-col items-center gap-2 p-4 transition-all"
                  style={{
                    borderRadius: "8px",
                    border: interviewType === "online"
                      ? "2px solid var(--hsd-ui-background-color-primary)"
                      : "2px solid rgba(120, 134, 127, 0.2)",
                    backgroundColor: interviewType === "online"
                      ? "rgba(0, 168, 120, 0.04)"
                      : "#fff",
                    color: interviewType === "online"
                      ? "var(--hsd-ui-background-color-primary)"
                      : "var(--hsd-ui-color-gray-700)",
                  }}
                >
                  <Monitor style={{ width: "24px", height: "24px" }} />
                  <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>Online</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--hsd-ui-color-gray-500)" }}>Video call interview</span>
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowStartInterviewDialog(false)}
              disabled={isStartingInterview}
              style={btnSecondary}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartInterview}
              disabled={isStartingInterview || !interviewDate || !interviewTime || !interviewType}
              style={btnPrimary}
            >
              {isStartingInterview ? (
                <Loader2 className="animate-spin" style={{ width: "16px", height: "16px", marginRight: "6px" }} />
              ) : (
                <ClipboardCheck style={{ width: "16px", height: "16px", marginRight: "6px" }} />
              )}
              {isStartingInterview ? "Scheduling..." : "Start Interview"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
