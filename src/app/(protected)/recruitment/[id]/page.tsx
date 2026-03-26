"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Calendar,
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { formatShortDate, cn } from "@/lib/utils";
import { showToast } from "@/lib/utils/toast-messages";
import { hasBiodataSubmitted } from "@/lib/utils/recruitmentHelpers";

import { ProfileTab } from "@/components/recruitment/tabs/ProfileTab";
import { InterviewHRTab } from "@/components/recruitment/tabs/InterviewHRTab";
import { InterviewUserTab } from "@/components/recruitment/tabs/InterviewUserTab";
import { McuTab } from "@/components/recruitment/tabs/McuTab";
import { OnboardingTab } from "@/components/recruitment/tabs/OnboardingTab";
import { useAssessmentPermission, isHROrAdmin, type TabMode } from "@/hooks/useAssessmentPermission";
import { useAuthStore } from "@/stores/auth-store";

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
        <Header title="Candidate Details" />
        <PageContainer>
          <div className="mb-5">
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
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
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border bg-card p-6 space-y-4">
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
        </PageContainer>
      </>
    );
  }

  // Permission error state
  if (permissions.isError) {
    return (
      <>
        <Header title="Candidate Details" />
        <PageContainer>
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <p className="text-sm text-muted-foreground">Failed to load permissions</p>
            <Button variant="outline" onClick={permissions.refetch}>
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
        <Header title="Candidate Details" />
        <PageContainer>
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <p className="text-sm text-muted-foreground">{error || "Candidate not found"}</p>
            <Button variant="outline" onClick={() => router.back()}>
              Try Again
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Header title="Candidate Details" />
      <PageContainer>
        <div className="space-y-5">
          {/* Top Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="ghost"
              className="gap-1.5 text-muted-foreground w-fit h-auto px-2 py-1.5 text-sm"
              asChild
            >
              <Link href="/recruitment">
                <ArrowLeft className="h-4 w-4" />
                Recruitment
              </Link>
            </Button>
          </div>

          {/* Profile Header Card */}
          <div className="rounded-2xl border bg-card">
            <div className="p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-accent/10">
                  <User className="h-9 w-9 text-accent" />
                </div>
                <div className="flex-1 min-w-0 sm:pt-2">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    {candidate.fullname}
                  </h1>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {candidate.jobTitle && (
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-400">
                        {candidate.jobTitle.name}
                      </Badge>
                    )}
                    {candidate.verify && (
                      <Badge
                        variant="outline"
                        className={
                          candidate.verify === "VERIFIED"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                            : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400"
                        }
                      >
                        {candidate.verify}
                      </Badge>
                    )}
                    {progress && (
                      <>
                        {progress.anyFailed ? (
                          <Badge variant="destructive" className="text-xs">Assessment Failed</Badge>
                        ) : progress.allPassed ? (
                          <Badge className="text-xs bg-emerald-600">All Passed</Badge>
                        ) : null}
                      </>
                    )}
                  </div>
                  <div className="mt-5 pt-4 border-t border-border/60 grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Email</p>
                      <p className="mt-0.5 text-sm font-medium text-foreground">{candidate.email}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Phone</p>
                      <p className={`mt-0.5 text-sm font-medium ${candidate.mobilePhone ? "text-foreground" : "text-muted-foreground"}`}>
                        {candidate.mobilePhone || "No Data"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Request Code</p>
                      <p className={`mt-0.5 text-sm font-medium ${candidate.employeeRequest?.code ? "text-foreground" : "text-muted-foreground"}`}>
                        {candidate.employeeRequest?.code || "No Data"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Applied Date</p>
                      <p className={`mt-0.5 text-sm font-medium ${candidate.createdAt ? "text-foreground" : "text-muted-foreground"}`}>
                        {candidate.createdAt ? formatShortDate(candidate.createdAt) : "No Data"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Workflow Progress Stepper */}
          {!progress?.anyFailed && (
            <div className="rounded-2xl border border-accent/10 bg-gradient-to-br from-accent/5 to-transparent overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  {RECRUITMENT_WORKFLOW_STEPS.map((step, index) => {
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
                        {index < RECRUITMENT_WORKFLOW_STEPS.length - 1 && (
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
          )}

          {/* Start Interview Banner */}
          {hasBiodataSubmitted(candidate) && !interviewStarted && !progress?.anyFailed && (
            <div className="rounded-2xl border border-accent/30 bg-accent/5">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                      <ClipboardCheck className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-accent">Ready for Interview</h3>
                      <p className="text-sm text-muted-foreground">
                        Candidate biodata has been submitted. Schedule the interview to proceed.
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => setShowStartInterviewDialog(true)}>
                    <ClipboardCheck />
                    Schedule Interview
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Failed Banner */}
          {progress?.anyFailed && (
            <div className="rounded-2xl border border-destructive/50 bg-destructive/5">
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-9 w-9 rounded-full bg-destructive/10 flex items-center justify-center">
                    <XCircle className="h-4 w-4 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-destructive">Assessment Failed</h3>
                    <p className="text-sm text-muted-foreground">
                      This candidate has failed one of the assessment stages and cannot proceed further.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="assessment-hr" disabled={!interviewStarted}>
                {interviewStarted ? (
                  "Assessment HR"
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Assessment HR
                  </>
                )}
              </TabsTrigger>
              <TabsTrigger value="assessment-user" disabled={!interviewStarted || getStageStatus("interview2").locked}>
                {interviewStarted && !getStageStatus("interview2").locked ? (
                  "Assessment User"
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Assessment User
                  </>
                )}
              </TabsTrigger>
              <TabsTrigger value="mcu" disabled={!interviewStarted || getStageStatus("mcu").locked}>
                {interviewStarted && !getStageStatus("mcu").locked ? (
                  "MCU"
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    MCU
                  </>
                )}
              </TabsTrigger>
              <TabsTrigger value="onboarding" disabled={!canStartOnboarding}>
                {canStartOnboarding ? (
                  <>
                    <PartyPopper className="mr-2 h-4 w-4" />
                    Onboarding
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Onboarding
                  </>
                )}
              </TabsTrigger>
            </TabsList>

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
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <ClipboardCheck className="h-4 w-4 text-accent" />
              </div>
              Schedule Interview
            </DialogTitle>
            <DialogDescription>
              Set the interview date, time, and type for this candidate.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Interview Date & Time</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="interview-date" className="text-xs text-muted-foreground font-normal flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    Date
                  </Label>
                  <Input
                    id="interview-date"
                    type="date"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                    className="h-11 text-sm font-medium tabular-nums"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="interview-time" className="text-xs text-muted-foreground font-normal flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    Time
                  </Label>
                  <Input
                    id="interview-time"
                    type="time"
                    value={interviewTime}
                    onChange={(e) => setInterviewTime(e.target.value)}
                    className="h-11 text-sm font-medium tabular-nums"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Interview Type</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setInterviewType("onsite")}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all hover:border-accent/50",
                    interviewType === "onsite"
                      ? "border-accent bg-accent/5 text-accent"
                      : "border-border"
                  )}
                >
                  <Building2 className="h-6 w-6" />
                  <span className="text-sm font-medium">Onsite</span>
                  <span className="text-xs text-muted-foreground">In-person interview</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInterviewType("online")}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all hover:border-accent/50",
                    interviewType === "online"
                      ? "border-accent bg-accent/5 text-accent"
                      : "border-border"
                  )}
                >
                  <Monitor className="h-6 w-6" />
                  <span className="text-sm font-medium">Online</span>
                  <span className="text-xs text-muted-foreground">Video call interview</span>
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowStartInterviewDialog(false)}
              disabled={isStartingInterview}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartInterview}
              disabled={isStartingInterview || !interviewDate || !interviewTime || !interviewType}
            >
              {isStartingInterview ? (
                <Loader2 className="animate-spin" />
              ) : (
                <ClipboardCheck />
              )}
              {isStartingInterview ? "Scheduling..." : "Start Interview"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
