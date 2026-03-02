"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  ClipboardCheck,
  Stethoscope,
  Lock,
  User,
  MapPin,
  CreditCard,
  IdCard,
  Heart,
  Users,
  FileText,
  PartyPopper,
  Send,
  Save,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  candidateService,
  type CandidateWithRelations,
  type AssessmentProgress,
} from "@/services/candidate.service";
import { formatShortDate, getInitials, cn } from "@/lib/utils";
import { showToast } from "@/lib/utils/toast-messages";

// Assessment stage configuration
const ASSESSMENT_STAGES = [
  {
    key: "interview1" as const,
    label: "Interview 1",
    description: "Initial interview with HR/Hiring Manager",
    icon: ClipboardCheck,
  },
  {
    key: "interview2" as const,
    label: "Interview 2",
    description: "Technical/Final interview with team",
    icon: Users,
  },
  {
    key: "mcu" as const,
    label: "Medical Check-Up",
    description: "Health examination and clearance",
    icon: Stethoscope,
  },
] as const;

type AssessmentStageKey = typeof ASSESSMENT_STAGES[number]["key"];

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // State
  const [candidate, setCandidate] = React.useState<CandidateWithRelations | null>(null);
  const [progress, setProgress] = React.useState<AssessmentProgress | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState("profile");

  // Assessment state
  const [assessmentNotes, setAssessmentNotes] = React.useState<Record<AssessmentStageKey, string>>({
    interview1: "",
    interview2: "",
    mcu: "",
  });
  const [isSubmitting, setIsSubmitting] = React.useState<AssessmentStageKey | null>(null);
  const [confirmDialog, setConfirmDialog] = React.useState<{
    open: boolean;
    stage: AssessmentStageKey;
    action: "PASSED" | "FAILED";
  } | null>(null);

  // Fetch candidate and assessment data
  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [candidateRes, progressRes] = await Promise.all([
        candidateService.getById(id),
        candidateService.getAssessmentProgress(id),
      ]);

      if (candidateRes.success && candidateRes.data) {
        setCandidate(candidateRes.data);

        // Pre-fill notes from existing assessment
        if (candidateRes.data.assessment) {
          setAssessmentNotes({
            interview1: candidateRes.data.assessment.interview1Desc || "",
            interview2: candidateRes.data.assessment.interview2Desc || "",
            mcu: candidateRes.data.assessment.mcuDesc || "",
          });
        }
      } else {
        setError(candidateRes.message || "Failed to load candidate");
        return;
      }

      if (progressRes.success && progressRes.data) {
        setProgress(progressRes.data);
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

  // Assessment handlers
  const handleAssessmentAction = async (stage: AssessmentStageKey, action: "PASSED" | "FAILED") => {
    setIsSubmitting(stage);

    try {
      const notes = assessmentNotes[stage];
      let response;

      switch (stage) {
        case "interview1":
          response = await candidateService.updateInterview1(id, action, notes);
          break;
        case "interview2":
          response = await candidateService.updateInterview2(id, action, notes);
          break;
        case "mcu":
          response = await candidateService.updateMcu(id, action, notes);
          break;
      }

      if (response?.success && response.data) {
        setProgress(response.data);
        showToast.success(`${stage === "mcu" ? "MCU" : stage === "interview1" ? "Interview 1" : "Interview 2"} marked as ${action.toLowerCase()}`);

        // Refresh candidate data to get updated assessment
        const candidateRes = await candidateService.getById(id);
        if (candidateRes.success && candidateRes.data) {
          setCandidate(candidateRes.data);
        }
      } else {
        showToast.error(response?.message || "Failed to update assessment");
      }
    } catch (err) {
      showToast.error("Failed to update assessment");
    } finally {
      setIsSubmitting(null);
      setConfirmDialog(null);
    }
  };

  // Check if onboarding is available
  const canStartOnboarding = progress?.allPassed === true;

  // Get stage status
  const getStageStatus = (stage: AssessmentStageKey) => {
    if (!progress) return { status: "pending", locked: stage !== "interview1" };

    const stageData = progress[stage];
    return {
      status: stageData.passed ? "passed" : stageData.failed ? "failed" : "pending",
      locked: "locked" in stageData ? stageData.locked : false,
    };
  };

  // Loading state
  if (isLoading) {
    return (
      <>
        <Header title="Candidate" />
        <PageContainer>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </PageContainer>
      </>
    );
  }

  // Error state
  if (error || !candidate) {
    return (
      <>
        <Header title="Candidate" />
        <PageContainer>
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-muted-foreground">{error || "Candidate not found"}</p>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Header title={candidate.fullname} />
      <PageContainer>
        <div className="space-y-6">
          {/* Back Button */}
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Recruitment
          </Button>

          {/* Candidate Header Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                  <AvatarFallback className="bg-accent/10 text-accent text-2xl font-semibold">
                    {getInitials(candidate.fullname)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <div>
                    <h1 className="text-2xl font-bold">{candidate.fullname}</h1>
                    {candidate.jobTitle && (
                      <p className="text-lg text-muted-foreground">
                        Applying for: {candidate.jobTitle.name}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-4 w-4" />
                      {candidate.email}
                    </span>
                    {candidate.mobilePhone && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-4 w-4" />
                        {candidate.mobilePhone}
                      </span>
                    )}
                    {candidate.employeeRequest && (
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="h-4 w-4" />
                        {candidate.employeeRequest.code}
                      </span>
                    )}
                  </div>

                  {/* Assessment Progress Summary */}
                  {progress && (
                    <div className="flex items-center gap-2 pt-2">
                      {progress.anyFailed ? (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="h-3.5 w-3.5" />
                          Assessment Failed
                        </Badge>
                      ) : progress.allPassed ? (
                        <Badge className="gap-1 bg-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          All Assessments Passed
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Stage: {progress.currentStage === "interview1" ? "Interview 1" :
                                  progress.currentStage === "interview2" ? "Interview 2" :
                                  progress.currentStage === "mcu" ? "MCU" : progress.currentStage}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="assessment">Assessment</TabsTrigger>
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

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6 mt-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Personal Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Gender</p>
                        <p className="font-medium">{candidate.gender === "M" ? "Male" : "Female"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Birth Date</p>
                        <p className="font-medium">{candidate.birthDate ? formatShortDate(candidate.birthDate) : "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Birth Place</p>
                        <p className="font-medium">{candidate.birthPlace || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Religion</p>
                        <p className="font-medium">{candidate.religion || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Marital Status</p>
                        <p className="font-medium">{candidate.marritalStatus || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Citizenship</p>
                        <p className="font-medium">{candidate.citizenship || "—"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Address</p>
                      <p className="font-medium">{candidate.address || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Resident Status</p>
                      <p className="font-medium">{candidate.residentStatus || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Mobile Phone</p>
                      <p className="font-medium">{candidate.mobilePhone || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Email</p>
                      <p className="font-medium">{candidate.email}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Identity Documents */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <IdCard className="h-5 w-5" />
                      Identity Documents
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">ID Number (KTP)</p>
                      <p className="font-medium font-mono">{candidate.idNo || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Tax ID (NPWP)</p>
                      <p className="font-medium font-mono">{candidate.taxId || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">BPJS ID</p>
                      <p className="font-medium font-mono">{candidate.bpjsId || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Driving License</p>
                      <p className="font-medium">{candidate.drivingLicense || "—"}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Application Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Application Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {candidate.detail && (
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Candidate Code</p>
                        <p className="font-medium font-mono">{candidate.detail.candidateCode}</p>
                      </div>
                    )}
                    {candidate.employeeRequest && (
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Employee Request</p>
                        <p className="font-medium">{candidate.employeeRequest.code}</p>
                      </div>
                    )}
                    {candidate.jobTitle && (
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Position Applied</p>
                        <p className="font-medium">{candidate.jobTitle.name}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Verification Status</p>
                      <Badge variant={candidate.verify === "VERIFIED" ? "default" : "secondary"}>
                        {candidate.verify}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Applied Date</p>
                      <p className="font-medium">{candidate.createdAt ? formatShortDate(candidate.createdAt) : "—"}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Assessment Tab */}
            <TabsContent value="assessment" className="space-y-6 mt-6">
              {/* Assessment Pipeline */}
              <div className="space-y-4">
                {ASSESSMENT_STAGES.map((stage, index) => {
                  const { status, locked } = getStageStatus(stage.key);
                  const Icon = stage.icon;
                  const isActive = !locked && status === "pending";

                  return (
                    <Card
                      key={stage.key}
                      className={cn(
                        "transition-all",
                        locked && "opacity-60",
                        status === "passed" && "border-emerald-500/50 bg-emerald-500/5",
                        status === "failed" && "border-destructive/50 bg-destructive/5"
                      )}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-full",
                              status === "passed" ? "bg-emerald-500/10" :
                              status === "failed" ? "bg-destructive/10" :
                              locked ? "bg-secondary" : "bg-accent/10"
                            )}>
                              {locked ? (
                                <Lock className="h-5 w-5 text-muted-foreground" />
                              ) : status === "passed" ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                              ) : status === "failed" ? (
                                <XCircle className="h-5 w-5 text-destructive" />
                              ) : (
                                <Icon className="h-5 w-5 text-accent" />
                              )}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{stage.label}</CardTitle>
                              <CardDescription>{stage.description}</CardDescription>
                            </div>
                          </div>
                          {/* Status Badge */}
                          {status === "passed" && (
                            <Badge className="bg-emerald-600">Passed</Badge>
                          )}
                          {status === "failed" && (
                            <Badge variant="destructive">Failed</Badge>
                          )}
                          {locked && (
                            <Badge variant="secondary">
                              <Lock className="mr-1 h-3 w-3" />
                              Locked
                            </Badge>
                          )}
                          {isActive && (
                            <Badge variant="outline" className="border-accent text-accent">
                              <Clock className="mr-1 h-3 w-3" />
                              Pending
                            </Badge>
                          )}
                        </div>
                      </CardHeader>

                      {/* Stage Content - Only show if not locked */}
                      {!locked && (
                        <CardContent className="pt-0">
                          <Separator className="mb-4" />

                          {/* Notes Section */}
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor={`${stage.key}-notes`}>Notes / Description</Label>
                              <Textarea
                                id={`${stage.key}-notes`}
                                placeholder={`Add notes for ${stage.label}...`}
                                value={assessmentNotes[stage.key]}
                                onChange={(e) => setAssessmentNotes(prev => ({
                                  ...prev,
                                  [stage.key]: e.target.value
                                }))}
                                disabled={status !== "pending"}
                                className="min-h-24"
                              />
                            </div>

                            {/* Action Buttons - Only show if pending */}
                            {status === "pending" && (
                              <div className="flex items-center gap-2 pt-2">
                                <Button
                                  variant="default"
                                  className="bg-emerald-600 hover:bg-emerald-700"
                                  disabled={isSubmitting === stage.key}
                                  onClick={() => setConfirmDialog({
                                    open: true,
                                    stage: stage.key,
                                    action: "PASSED"
                                  })}
                                >
                                  {isSubmitting === stage.key ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                  )}
                                  Pass
                                </Button>
                                <Button
                                  variant="destructive"
                                  disabled={isSubmitting === stage.key}
                                  onClick={() => setConfirmDialog({
                                    open: true,
                                    stage: stage.key,
                                    action: "FAILED"
                                  })}
                                >
                                  {isSubmitting === stage.key ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <XCircle className="mr-2 h-4 w-4" />
                                  )}
                                  Fail
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      )}

                      {/* Locked Message */}
                      {locked && (
                        <CardContent className="pt-0">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 rounded-lg p-3">
                            <Lock className="h-4 w-4" />
                            <span>
                              Complete {index === 1 ? "Interview 1" : "Interview 2"} first to unlock this stage
                            </span>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>

              {/* Assessment Failed Notice */}
              {progress?.anyFailed && (
                <Card className="border-destructive bg-destructive/5">
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                      <XCircle className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-destructive">Assessment Failed</h3>
                      <p className="text-sm text-muted-foreground">
                        This candidate has failed one of the assessment stages and cannot proceed further.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* All Passed Notice */}
              {progress?.allPassed && (
                <Card className="border-emerald-500 bg-emerald-500/5">
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                        <PartyPopper className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-emerald-600">All Assessments Passed!</h3>
                        <p className="text-sm text-muted-foreground">
                          This candidate has passed all assessment stages and is ready for onboarding.
                        </p>
                      </div>
                    </div>
                    <Button onClick={() => setActiveTab("onboarding")}>
                      Start Onboarding
                      <PartyPopper className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Onboarding Tab */}
            <TabsContent value="onboarding" className="space-y-6 mt-6">
              {canStartOnboarding ? (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PartyPopper className="h-5 w-5" />
                        Onboarding
                      </CardTitle>
                      <CardDescription>
                        Manage onboarding process including facilities and training programs
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <PartyPopper className="h-16 w-16 text-emerald-600 mb-4" />
                        <h3 className="text-lg font-semibold">Ready for Onboarding</h3>
                        <p className="text-muted-foreground max-w-md mt-2">
                          This candidate has passed all assessments. Click below to manage their onboarding process,
                          including assigning facilities and scheduling training programs.
                        </p>
                        <Button
                          className="mt-6"
                          onClick={() => router.push(`/onboarding/${id}`)}
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Go to Onboarding Page
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Lock className="h-16 w-16 text-muted-foreground/30" />
                    <h3 className="mt-4 text-lg font-medium">Onboarding Locked</h3>
                    <p className="text-muted-foreground text-center max-w-md mt-2">
                      The candidate must pass all assessment stages (Interview 1, Interview 2, and MCU)
                      before starting the onboarding process.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </PageContainer>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmDialog?.open || false}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog?.action === "PASSED" ? "Mark as Passed" : "Mark as Failed"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.action === "PASSED" ? (
                <>
                  Are you sure you want to mark{" "}
                  <strong>{confirmDialog?.stage === "mcu" ? "MCU" : confirmDialog?.stage === "interview1" ? "Interview 1" : "Interview 2"}</strong>{" "}
                  as passed? This will unlock the next stage.
                </>
              ) : (
                <>
                  Are you sure you want to mark{" "}
                  <strong>{confirmDialog?.stage === "mcu" ? "MCU" : confirmDialog?.stage === "interview1" ? "Interview 1" : "Interview 2"}</strong>{" "}
                  as failed? The candidate will not be able to proceed further.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDialog) {
                  handleAssessmentAction(confirmDialog.stage, confirmDialog.action);
                }
              }}
              disabled={isSubmitting !== null}
              className={cn(
                confirmDialog?.action === "PASSED"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-destructive hover:bg-destructive/90"
              )}
            >
              {isSubmitting !== null ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : confirmDialog?.action === "PASSED" ? (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
