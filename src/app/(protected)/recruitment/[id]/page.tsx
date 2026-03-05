"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  Check,
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
} from "@/services/candidate.service";
import { formatShortDate, getInitials, cn } from "@/lib/utils";
import { showToast } from "@/lib/utils/toast-messages";
import { LexicalEditor } from "@/components/shared/lexical-editor";
import { LexicalRenderer } from "@/components/shared/lexical-renderer";

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

// Workflow progress steps for visual stepper
const RECRUITMENT_WORKFLOW_STEPS = [
  { key: "interview1", label: "Interview 1", icon: ClipboardCheck },
  { key: "interview2", label: "Interview 2", icon: Users },
  { key: "mcu", label: "MCU", icon: Stethoscope },
  { key: "completed", label: "Completed", icon: PartyPopper },
];

type AssessmentStageKey = typeof ASSESSMENT_STAGES[number]["key"];

// HR Assessment Scoring Criteria
const HR_SCORING_CRITERIA = [
  { key: "relevanceOfExperience", label: "Relevance of Experience" },
  { key: "trainingUndertaken", label: "Training Undertaken" },
  { key: "technicalSkills", label: "Technical Skills" },
  { key: "nonTechnicalSkills", label: "Non-Technical Skills" },
  { key: "communicationSkills", label: "Communication Skills" },
  { key: "emotionalMaturity", label: "Emotional Maturity" },
  { key: "understandingOfPosition", label: "Understanding of the Applied Position" },
  { key: "teamworkAbility", label: "Ability to Work Collaboratively in a Team" },
] as const;

const SCORE_OPTIONS = [
  { value: 1, label: "Very Poor" },
  { value: 2, label: "Poor" },
  { value: 3, label: "Fair" },
  { value: 4, label: "Good" },
  { value: 5, label: "Excellent" },
] as const;

type HRScoringKey = typeof HR_SCORING_CRITERIA[number]["key"];
type HRConclusion = "proceed" | "recommended" | "rejected" | null;

// LocalStorage key for HR assessment form data
const HR_FORM_STORAGE_KEY = (id: string) => `hr-assessment-form-${id}`;
const USER_FORM_STORAGE_KEY = (id: string) => `user-assessment-form-${id}`;

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;

  // Get initial tab from URL or default to "profile"
  const initialTab = searchParams.get("tab") || "profile";

  // State
  const [candidate, setCandidate] = React.useState<CandidateWithRelations | null>(null);
  const [progress, setProgress] = React.useState<AssessmentProgress | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState(initialTab);

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

  // HR Assessment Form State
  const [hrScoring, setHrScoring] = React.useState<Record<HRScoringKey, number | null>>({
    relevanceOfExperience: null,
    trainingUndertaken: null,
    technicalSkills: null,
    nonTechnicalSkills: null,
    communicationSkills: null,
    emotionalMaturity: null,
    understandingOfPosition: null,
    teamworkAbility: null,
  });
  const [hrKeyCompetencies, setHrKeyCompetencies] = React.useState("");
  const [hrUserNotes, setHrUserNotes] = React.useState("");
  const [hrConclusion, setHrConclusion] = React.useState<HRConclusion>(null);
  const [isSubmittingHR, setIsSubmittingHR] = React.useState(false);
  const [showHRPreview, setShowHRPreview] = React.useState(false);

  // User Assessment Form State (Interview 2)
  const [userScoring, setUserScoring] = React.useState<Record<HRScoringKey, number | null>>({
    relevanceOfExperience: null,
    trainingUndertaken: null,
    technicalSkills: null,
    nonTechnicalSkills: null,
    communicationSkills: null,
    emotionalMaturity: null,
    understandingOfPosition: null,
    teamworkAbility: null,
  });
  const [userKeyCompetencies, setUserKeyCompetencies] = React.useState("");
  const [userUserNotes, setUserUserNotes] = React.useState("");
  const [userConclusion, setUserConclusion] = React.useState<HRConclusion>(null);
  const [isSubmittingUser, setIsSubmittingUser] = React.useState(false);
  const [showUserPreview, setShowUserPreview] = React.useState(false);

  // Handle tab change and update URL
  const handleTabChange = React.useCallback((tab: string) => {
    setActiveTab(tab);
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("tab", tab);
    router.replace(`?${newParams.toString()}`, { scroll: false });
  }, [searchParams, router]);

  // Restore HR form data from localStorage on mount
  React.useEffect(() => {
    if (!id) return;
    const storageKey = HR_FORM_STORAGE_KEY(id);
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.hrScoring) setHrScoring(parsed.hrScoring);
        if (parsed.hrKeyCompetencies) setHrKeyCompetencies(parsed.hrKeyCompetencies);
        if (parsed.hrUserNotes) setHrUserNotes(parsed.hrUserNotes);
        if (parsed.hrConclusion) setHrConclusion(parsed.hrConclusion);
      } catch (e) {
        console.warn("Failed to restore HR form data:", e);
      }
    }
  }, [id]);

  // Save HR form data to localStorage when it changes
  React.useEffect(() => {
    if (!id) return;
    const storageKey = HR_FORM_STORAGE_KEY(id);
    const dataToSave = {
      hrScoring,
      hrKeyCompetencies,
      hrUserNotes,
      hrConclusion,
    };
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
  }, [id, hrScoring, hrKeyCompetencies, hrUserNotes, hrConclusion]);

  // Clear localStorage after successful submit
  const clearHRFormStorage = React.useCallback(() => {
    if (!id) return;
    localStorage.removeItem(HR_FORM_STORAGE_KEY(id));
  }, [id]);

  // Restore User form data from localStorage on mount
  React.useEffect(() => {
    if (!id) return;
    const storageKey = USER_FORM_STORAGE_KEY(id);
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.userScoring) setUserScoring(parsed.userScoring);
        if (parsed.userKeyCompetencies) setUserKeyCompetencies(parsed.userKeyCompetencies);
        if (parsed.userUserNotes) setUserUserNotes(parsed.userUserNotes);
        if (parsed.userConclusion) setUserConclusion(parsed.userConclusion);
      } catch (e) {
        console.warn("Failed to restore User form data:", e);
      }
    }
  }, [id]);

  // Save User form data to localStorage when it changes
  React.useEffect(() => {
    if (!id) return;
    const storageKey = USER_FORM_STORAGE_KEY(id);
    const dataToSave = {
      userScoring,
      userKeyCompetencies,
      userUserNotes,
      userConclusion,
    };
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
  }, [id, userScoring, userKeyCompetencies, userUserNotes, userConclusion]);

  // Clear User localStorage after successful submit
  const clearUserFormStorage = React.useCallback(() => {
    if (!id) return;
    localStorage.removeItem(USER_FORM_STORAGE_KEY(id));
  }, [id]);

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

  // HR Assessment Submit Handler
  const handleHRAssessmentSubmit = async () => {
    if (!hrConclusion) {
      showToast.error("Please select Interview Result Conclusion");
      return;
    }

    // Check if all scores are filled
    const allScoresFilled = Object.values(hrScoring).every(score => score !== null);
    if (!allScoresFilled) {
      showToast.error("Please fill in all scoring criteria");
      return;
    }

    setIsSubmittingHR(true);

    try {
      // Map conclusion to action
      const action: "PASSED" | "FAILED" = hrConclusion === "rejected" ? "FAILED" : "PASSED";

      // Compose notes with all form data
      const formattedNotes = [
        "=== SCORING ===",
        ...HR_SCORING_CRITERIA.map(criteria => {
          const score = hrScoring[criteria.key];
          const scoreLabel = SCORE_OPTIONS.find(opt => opt.value === score)?.label || "-";
          return `${criteria.label}: ${scoreLabel} (${score}/5)`;
        }),
        "",
        "=== ADDITIONAL INFORMATION ===",
        `Key Competencies: ${hrKeyCompetencies || "-"}`,
        `User Notes: ${hrUserNotes || "-"}`,
        `Conclusion: ${hrConclusion?.toUpperCase() || "-"}`,
      ].join("\n");

      const response = await candidateService.updateInterview1(id, action, formattedNotes);

      if (response?.success && response.data) {
        setProgress(response.data);
        showToast.success("HR Assessment submitted successfully");

        // Clear localStorage after successful submit
        clearHRFormStorage();

        // Refresh candidate data
        const candidateRes = await candidateService.getById(id);
        if (candidateRes.success && candidateRes.data) {
          setCandidate(candidateRes.data);
        }
      } else {
        showToast.error(response?.message || "Failed to submit HR Assessment");
      }
    } catch (err) {
      showToast.error("Failed to submit HR Assessment");
    } finally {
      setIsSubmittingHR(false);
    }
  };

  // User Assessment Submit Handler (Interview 2)
  const handleUserAssessmentSubmit = async () => {
    if (!userConclusion) {
      showToast.error("Please select Interview Result Conclusion");
      return;
    }

    // Check if all scores are filled
    const allScoresFilled = Object.values(userScoring).every(score => score !== null);
    if (!allScoresFilled) {
      showToast.error("Please fill in all scoring criteria");
      return;
    }

    setIsSubmittingUser(true);

    try {
      // Map conclusion to action
      const action: "PASSED" | "FAILED" = userConclusion === "rejected" ? "FAILED" : "PASSED";

      // Compose notes with all form data
      const formattedNotes = [
        "=== SCORING ===",
        ...HR_SCORING_CRITERIA.map(criteria => {
          const score = userScoring[criteria.key];
          const scoreLabel = SCORE_OPTIONS.find(opt => opt.value === score)?.label || "-";
          return `${criteria.label}: ${scoreLabel} (${score}/5)`;
        }),
        "",
        "=== ADDITIONAL INFORMATION ===",
        `Key Competencies: ${userKeyCompetencies || "-"}`,
        `User Notes: ${userUserNotes || "-"}`,
        `Conclusion: ${userConclusion?.toUpperCase() || "-"}`,
      ].join("\n");

      const response = await candidateService.updateInterview2(id, action, formattedNotes);

      if (response?.success && response.data) {
        setProgress(response.data);
        showToast.success("User Assessment submitted successfully");

        // Clear localStorage after successful submit
        clearUserFormStorage();

        // Refresh candidate data
        const candidateRes = await candidateService.getById(id);
        if (candidateRes.success && candidateRes.data) {
          setCandidate(candidateRes.data);
        }
      } else {
        showToast.error(response?.message || "Failed to submit User Assessment");
      }
    } catch (err) {
      showToast.error("Failed to submit User Assessment");
    } finally {
      setIsSubmittingUser(false);
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

  // Get current recruitment workflow step index
  const getCurrentStepIndex = () => {
    if (!progress) return 0;
    if (progress.anyFailed) return -1;
    if (progress.allPassed) return 3;
    if (progress.interview2.passed) return 2;
    if (progress.interview1.passed) return 1;
    return 0;
  };

  const currentStepIndex = getCurrentStepIndex();

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
      <Header title="Assessment Form" />
      <PageContainer>
        <div className="space-y-6">
          {/* Back Button */}
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Recruitment
          </Button>

          {/* Candidate Header Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10 border">
                  <AvatarFallback className="bg-accent/10 text-accent font-medium">
                    {getInitials(candidate.fullname)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h2 className="text-base font-semibold tracking-tight">{candidate.fullname}</h2>
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
                  {candidate.jobTitle && (
                    <p className="mt-1.5 text-sm text-foreground/80">
                      Applying for: {candidate.jobTitle.name}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-4 w-4" />
                      {candidate.email}
                    </div>
                    {candidate.mobilePhone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-4 w-4" />
                        {candidate.mobilePhone}
                      </div>
                    )}
                    {candidate.employeeRequest && (
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="h-4 w-4" />
                        {candidate.employeeRequest.code}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Workflow Progress */}
          {!progress?.anyFailed && (
            <Card className="overflow-hidden border-accent/10 bg-gradient-to-br from-accent/5 to-transparent">
              <CardContent className="p-4">
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
              </CardContent>
            </Card>
          )}

          {/* Failed Banner */}
          {progress?.anyFailed && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="p-6">
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
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="assessment-hr">Assessment HR</TabsTrigger>
              <TabsTrigger value="assessment-user">Assessment User</TabsTrigger>
              <TabsTrigger value="mcu">MCU</TabsTrigger>
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

            {/* Assessment HR Tab */}
            <TabsContent value="assessment-hr" className="space-y-6 mt-6">
              {(() => {
                const { status } = getStageStatus("interview1");
                const isCompleted = status === "passed" || status === "failed";

                return (
                  <>
                    {/* Status Banner */}
                    {status === "passed" && (
                      <Card className="border-emerald-500 bg-emerald-500/5">
                        <CardContent className="flex items-center justify-between p-6">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-emerald-600">Assessment HR Completed!</h3>
                              <p className="text-sm text-muted-foreground">
                                This candidate has passed the HR assessment. Proceed to Assessment User for the next stage.
                              </p>
                            </div>
                          </div>
                          <Button onClick={() => handleTabChange("assessment-user")}>
                            Go to Assessment User
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    {status === "failed" && (
                      <Card className="border-destructive bg-destructive/5">
                        <CardContent className="flex items-center gap-4 p-6">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                            <XCircle className="h-6 w-6 text-destructive" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-destructive">Assessment HR Failed</h3>
                            <p className="text-sm text-muted-foreground">
                              This candidate has been rejected in the HR assessment and cannot proceed further.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Scoring Section */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Scoring</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {HR_SCORING_CRITERIA.map((criteria, index) => (
                            <div key={criteria.key} className="flex items-center justify-between py-2 border-b last:border-b-0">
                              <span className="text-sm font-medium">
                                {index + 1}. {criteria.label}
                              </span>
                              <div className="flex gap-1">
                                {SCORE_OPTIONS.map((option) => (
                                  <button
                                    key={option.value}
                                    type="button"
                                    disabled={isCompleted}
                                    onClick={() => setHrScoring(prev => ({
                                      ...prev,
                                      [criteria.key]: option.value
                                    }))}
                                    className={cn(
                                      "px-3 py-1.5 text-xs font-medium rounded border transition-colors min-w-[70px]",
                                      hrScoring[criteria.key] === option.value
                                        ? "bg-accent text-accent-foreground border-accent"
                                        : "bg-background hover:bg-secondary border-border",
                                      isCompleted && "opacity-60 cursor-not-allowed"
                                    )}
                                  >
                                    {option.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Additional Information Section */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Additional Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>
                            Key Competencies Required by the Department / Company
                          </Label>
                          {isCompleted ? (
                            <div className="rounded-md border border-input bg-muted/30 p-3 text-sm min-h-20 opacity-60">
                              {hrKeyCompetencies || <span className="text-muted-foreground">No content</span>}
                            </div>
                          ) : (
                            <LexicalEditor
                              value={hrKeyCompetencies}
                              onChange={setHrKeyCompetencies}
                              placeholder="Enter key competencies required..."
                            />
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>User Notes</Label>
                          {isCompleted ? (
                            <div className="rounded-md border border-input bg-muted/30 p-3 text-sm min-h-20 opacity-60">
                              {hrUserNotes || <span className="text-muted-foreground">No content</span>}
                            </div>
                          ) : (
                            <LexicalEditor
                              value={hrUserNotes}
                              onChange={setHrUserNotes}
                              placeholder="Enter your notes..."
                            />
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>Interview Result Conclusion</Label>
                          <div className="flex gap-2 pt-1">
                            {[
                              { value: "proceed" as const, label: "Proceed", color: "emerald" },
                              { value: "recommended" as const, label: "Recommended", color: "blue" },
                              { value: "rejected" as const, label: "Rejected", color: "red" },
                            ].map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                disabled={isCompleted}
                                onClick={() => setHrConclusion(option.value)}
                                className={cn(
                                  "flex-1 px-4 py-3 text-sm font-medium rounded-lg border-2 transition-all",
                                  hrConclusion === option.value
                                    ? option.color === "emerald"
                                      ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                                      : option.color === "blue"
                                      ? "bg-blue-50 border-blue-500 text-blue-700"
                                      : "bg-red-50 border-red-500 text-red-700"
                                    : "bg-background border-border hover:border-muted-foreground/50",
                                  isCompleted && "opacity-60 cursor-not-allowed"
                                )}
                              >
                                <div className="flex items-center justify-center gap-2">
                                  <div
                                    className={cn(
                                      "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                                      hrConclusion === option.value
                                        ? option.color === "emerald"
                                          ? "border-emerald-500"
                                          : option.color === "blue"
                                          ? "border-blue-500"
                                          : "border-red-500"
                                        : "border-muted-foreground/30"
                                    )}
                                  >
                                    {hrConclusion === option.value && (
                                      <div
                                        className={cn(
                                          "h-2 w-2 rounded-full",
                                          option.color === "emerald"
                                            ? "bg-emerald-500"
                                            : option.color === "blue"
                                            ? "bg-blue-500"
                                            : "bg-red-500"
                                        )}
                                      />
                                    )}
                                  </div>
                                  {option.label}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    {!isCompleted && (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowHRPreview(true)}
                        >
                          Preview
                        </Button>
                        <Button
                          onClick={handleHRAssessmentSubmit}
                          disabled={isSubmittingHR}
                        >
                          {isSubmittingHR ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            "Submit"
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                );
              })()}
            </TabsContent>

            {/* Assessment User Tab */}
            <TabsContent value="assessment-user" className="space-y-6 mt-6">
              {(() => {
                const { status, locked } = getStageStatus("interview2");
                const isCompleted = status === "passed" || status === "failed";

                return (
                  <>
                    {/* Locked State */}
                    {locked && (
                      <Card className="opacity-60">
                        <CardContent className="flex flex-col items-center justify-center py-16">
                          <Lock className="h-16 w-16 text-muted-foreground/30" />
                          <h3 className="mt-4 text-lg font-medium">Assessment User Locked</h3>
                          <p className="text-muted-foreground text-center max-w-md mt-2">
                            Complete Interview 1 (Assessment HR) first to unlock this stage.
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Status Banner */}
                    {!locked && status === "passed" && (
                      <Card className="border-emerald-500 bg-emerald-500/5">
                        <CardContent className="flex items-center justify-between p-6">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-emerald-600">Assessment User Completed!</h3>
                              <p className="text-sm text-muted-foreground">
                                This candidate has passed the User assessment. Proceed to MCU for the next stage.
                              </p>
                            </div>
                          </div>
                          <Button onClick={() => handleTabChange("mcu")}>
                            Proceed to MCU
                            <Stethoscope className="ml-2 h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    {!locked && status === "failed" && (
                      <Card className="border-destructive bg-destructive/5">
                        <CardContent className="flex items-center gap-4 p-6">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                            <XCircle className="h-6 w-6 text-destructive" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-destructive">Assessment User Failed</h3>
                            <p className="text-sm text-muted-foreground">
                              This candidate has been rejected in the User assessment and cannot proceed further.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Form Content - Only show if not locked */}
                    {!locked && (
                      <>
                        {/* Scoring Section */}
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Scoring</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {HR_SCORING_CRITERIA.map((criteria, index) => (
                                <div key={criteria.key} className="flex items-center justify-between py-2 border-b last:border-b-0">
                                  <span className="text-sm font-medium">
                                    {index + 1}. {criteria.label}
                                  </span>
                                  <div className="flex gap-1">
                                    {SCORE_OPTIONS.map((option) => (
                                      <button
                                        key={option.value}
                                        type="button"
                                        disabled={isCompleted}
                                        onClick={() => setUserScoring(prev => ({
                                          ...prev,
                                          [criteria.key]: option.value
                                        }))}
                                        className={cn(
                                          "px-3 py-1.5 text-xs font-medium rounded border transition-colors min-w-[70px]",
                                          userScoring[criteria.key] === option.value
                                            ? "bg-accent text-accent-foreground border-accent"
                                            : "bg-background hover:bg-secondary border-border",
                                          isCompleted && "opacity-60 cursor-not-allowed"
                                        )}
                                      >
                                        {option.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Additional Information Section */}
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Additional Information</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-2">
                              <Label>
                                Key Competencies Required by the Department / Company
                              </Label>
                              {isCompleted ? (
                                <div className="rounded-md border border-input bg-muted/30 p-3 text-sm min-h-20 opacity-60">
                                  {userKeyCompetencies || <span className="text-muted-foreground">No content</span>}
                                </div>
                              ) : (
                                <LexicalEditor
                                  value={userKeyCompetencies}
                                  onChange={setUserKeyCompetencies}
                                  placeholder="Enter key competencies required..."
                                />
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label>User Notes</Label>
                              {isCompleted ? (
                                <div className="rounded-md border border-input bg-muted/30 p-3 text-sm min-h-20 opacity-60">
                                  {userUserNotes || <span className="text-muted-foreground">No content</span>}
                                </div>
                              ) : (
                                <LexicalEditor
                                  value={userUserNotes}
                                  onChange={setUserUserNotes}
                                  placeholder="Enter your notes..."
                                />
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label>Interview Result Conclusion</Label>
                              <div className="flex gap-2 pt-1">
                                {[
                                  { value: "proceed" as const, label: "Proceed", color: "emerald" },
                                  { value: "recommended" as const, label: "Recommended", color: "blue" },
                                  { value: "rejected" as const, label: "Rejected", color: "red" },
                                ].map((option) => (
                                  <button
                                    key={option.value}
                                    type="button"
                                    disabled={isCompleted}
                                    onClick={() => setUserConclusion(option.value)}
                                    className={cn(
                                      "flex-1 px-4 py-3 text-sm font-medium rounded-lg border-2 transition-all",
                                      userConclusion === option.value
                                        ? option.color === "emerald"
                                          ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                                          : option.color === "blue"
                                          ? "bg-blue-50 border-blue-500 text-blue-700"
                                          : "bg-red-50 border-red-500 text-red-700"
                                        : "bg-background border-border hover:border-muted-foreground/50",
                                      isCompleted && "opacity-60 cursor-not-allowed"
                                    )}
                                  >
                                    <div className="flex items-center justify-center gap-2">
                                      <div
                                        className={cn(
                                          "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                                          userConclusion === option.value
                                            ? option.color === "emerald"
                                              ? "border-emerald-500"
                                              : option.color === "blue"
                                              ? "border-blue-500"
                                              : "border-red-500"
                                            : "border-muted-foreground/30"
                                        )}
                                      >
                                        {userConclusion === option.value && (
                                          <div
                                            className={cn(
                                              "h-2 w-2 rounded-full",
                                              option.color === "emerald"
                                                ? "bg-emerald-500"
                                                : option.color === "blue"
                                                ? "bg-blue-500"
                                                : "bg-red-500"
                                            )}
                                          />
                                        )}
                                      </div>
                                      {option.label}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Action Buttons */}
                        {!isCompleted && (
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setShowUserPreview(true)}
                            >
                              Preview
                            </Button>
                            <Button
                              onClick={handleUserAssessmentSubmit}
                              disabled={isSubmittingUser}
                            >
                              {isSubmittingUser ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Submitting...
                                </>
                              ) : (
                                "Submit"
                              )}
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </>
                );
              })()}
            </TabsContent>

            {/* MCU Tab */}
            <TabsContent value="mcu" className="space-y-6 mt-6">
              {/* MCU - Medical Check-Up */}
              <div className="space-y-4">
                {ASSESSMENT_STAGES.filter(stage => stage.key === "mcu").map((stage) => {
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
                              Complete Interview 2 (Assessment User) first to unlock MCU
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
                    <Button onClick={() => handleTabChange("onboarding")}>
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

      {/* HR Assessment Preview Dialog */}
      <Dialog open={showHRPreview} onOpenChange={setShowHRPreview}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assessment HR Preview</DialogTitle>
            <DialogDescription>
              Review the assessment details before submitting
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Candidate Info */}
            {candidate && (
              <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-accent/10 text-accent text-sm">
                    {getInitials(candidate.fullname)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{candidate.fullname}</p>
                  <p className="text-sm text-muted-foreground">{candidate.jobTitle?.name}</p>
                </div>
              </div>
            )}

            {/* Scoring Preview */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Scoring</h4>
              <div className="border rounded-lg divide-y">
                {HR_SCORING_CRITERIA.map((criteria, index) => {
                  const score = hrScoring[criteria.key];
                  const scoreLabel = score ? SCORE_OPTIONS.find(opt => opt.value === score)?.label : null;
                  return (
                    <div key={criteria.key} className="flex items-center justify-between px-3 py-2">
                      <span className="text-sm">{index + 1}. {criteria.label}</span>
                      {scoreLabel ? (
                        <Badge variant="secondary">{scoreLabel} ({score}/5)</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Not filled</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Additional Information Preview */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Additional Information</h4>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Key Competencies</p>
                <div className="border rounded-lg p-3 text-sm min-h-16 bg-secondary/20">
                  {hrKeyCompetencies ? (
                    <LexicalRenderer value={hrKeyCompetencies} />
                  ) : (
                    <span className="text-muted-foreground italic">Not filled</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">User Notes</p>
                <div className="border rounded-lg p-3 text-sm min-h-16 bg-secondary/20">
                  {hrUserNotes ? (
                    <LexicalRenderer value={hrUserNotes} />
                  ) : (
                    <span className="text-muted-foreground italic">Not filled</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Interview Result Conclusion</p>
                {hrConclusion ? (
                  <Badge
                    className={cn(
                      "text-sm",
                      hrConclusion === "proceed" && "bg-emerald-100 text-emerald-700 border-emerald-300",
                      hrConclusion === "recommended" && "bg-blue-100 text-blue-700 border-blue-300",
                      hrConclusion === "rejected" && "bg-red-100 text-red-700 border-red-300"
                    )}
                  >
                    {hrConclusion === "proceed" ? "Proceed" : hrConclusion === "recommended" ? "Recommended" : "Rejected"}
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground italic">Not selected</span>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHRPreview(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setShowHRPreview(false);
                handleHRAssessmentSubmit();
              }}
              disabled={isSubmittingHR}
            >
              {isSubmittingHR ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Assessment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Assessment Preview Dialog */}
      <Dialog open={showUserPreview} onOpenChange={setShowUserPreview}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assessment User Preview</DialogTitle>
            <DialogDescription>
              Review the assessment details before submitting
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Candidate Info */}
            {candidate && (
              <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-accent/10 text-accent text-sm">
                    {getInitials(candidate.fullname)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{candidate.fullname}</p>
                  <p className="text-sm text-muted-foreground">{candidate.jobTitle?.name}</p>
                </div>
              </div>
            )}

            {/* Scoring Preview */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Scoring</h4>
              <div className="border rounded-lg divide-y">
                {HR_SCORING_CRITERIA.map((criteria, index) => {
                  const score = userScoring[criteria.key];
                  const scoreLabel = score ? SCORE_OPTIONS.find(opt => opt.value === score)?.label : null;
                  return (
                    <div key={criteria.key} className="flex items-center justify-between px-3 py-2">
                      <span className="text-sm">{index + 1}. {criteria.label}</span>
                      {scoreLabel ? (
                        <Badge variant="secondary">{scoreLabel} ({score}/5)</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Not filled</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Additional Information Preview */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Additional Information</h4>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Key Competencies</p>
                <div className="border rounded-lg p-3 text-sm min-h-16 bg-secondary/20">
                  {userKeyCompetencies ? (
                    <LexicalRenderer value={userKeyCompetencies} />
                  ) : (
                    <span className="text-muted-foreground italic">Not filled</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">User Notes</p>
                <div className="border rounded-lg p-3 text-sm min-h-16 bg-secondary/20">
                  {userUserNotes ? (
                    <LexicalRenderer value={userUserNotes} />
                  ) : (
                    <span className="text-muted-foreground italic">Not filled</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Interview Result Conclusion</p>
                {userConclusion ? (
                  <Badge
                    className={cn(
                      "text-sm",
                      userConclusion === "proceed" && "bg-emerald-100 text-emerald-700 border-emerald-300",
                      userConclusion === "recommended" && "bg-blue-100 text-blue-700 border-blue-300",
                      userConclusion === "rejected" && "bg-red-100 text-red-700 border-red-300"
                    )}
                  >
                    {userConclusion === "proceed" ? "Proceed" : userConclusion === "recommended" ? "Recommended" : "Rejected"}
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground italic">Not selected</span>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserPreview(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setShowUserPreview(false);
                handleUserAssessmentSubmit();
              }}
              disabled={isSubmittingUser}
            >
              {isSubmittingUser ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Assessment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
