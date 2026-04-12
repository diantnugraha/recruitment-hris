"use client";

import * as React from "react";
import {
  CheckCircle2,
  XCircle,
  ClipboardCheck,
  Lock,
  Loader2,
  AlertTriangle,
  Send,
  Users,
  User,
  X,
  ChevronRight,
  Check,
  BarChart3,
  FileText,
  Award,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TuvBadge } from "@/components/shared/tuv-badge";

import {
  candidateService,
  type AssessmentProgress,
  type AssessmentScoringData,
  type AssessmentAssignee,
  type CandidateWithRelations,
} from "@/services/candidate.service";
import { employeeService } from "@/services/employee.service";
import type { EmployeeWithRelations } from "@/types";
import { cn, getInitials } from "@/lib/utils";
import { showToast } from "@/lib/utils/toast-messages";
import { LexicalEditor } from "@/components/shared/lexical-editor";
import { LexicalRenderer } from "@/components/shared/lexical-renderer";

import {
  HR_SCORING_CRITERIA,
  SCORE_OPTIONS,
} from "@/lib/constants/assessmentScoring";
import type { HRScoringKey, HRConclusion } from "@/lib/constants/assessmentScoring";
import type { TabMode } from "@/hooks/useAssessmentPermission";

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
  backgroundColor: "rgb(250, 55, 70)",
  borderColor: "rgb(250, 55, 70)",
  color: "var(--hsd-ui-color-gray-50, #fff)",
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
  headerRight,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
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

// LocalStorage key for User assessment form data
const USER_FORM_STORAGE_KEY = (id: string) => `user-assessment-form-${id}`;

interface InterviewUserTabProps {
  candidate: CandidateWithRelations;
  candidateId: string;
  mode: TabMode;
  progress: AssessmentProgress | null;
  canEditAssignees: boolean;
  onRefresh: () => void;
  onTabChange?: (tab: string) => void;
}

// Helper: score color based on value (TUV compatible inline styles)
const scoreColorStyle = (val: number): React.CSSProperties =>
  val >= 4.5
    ? { color: "#059669" }
    : val >= 3.5
    ? { color: "#2563eb" }
    : val >= 2.5
    ? { color: "#d97706" }
    : val >= 1
    ? { color: "#ef4444" }
    : { color: "var(--hsd-ui-color-gray-400)" };

// Helper: pill style for score buttons
const pillStyle = (val: number, selected: boolean): React.CSSProperties => {
  if (!selected)
    return {
      backgroundColor: "var(--hsd-ui-color-gray-100)",
      color: "var(--hsd-ui-color-gray-500)",
    };
  if (val <= 1) return { backgroundColor: "#ef4444", color: "#fff" };
  if (val <= 2) return { backgroundColor: "#f97316", color: "#fff" };
  if (val <= 3) return { backgroundColor: "#f59e0b", color: "#fff" };
  if (val <= 4) return { backgroundColor: "#3b82f6", color: "#fff" };
  return { backgroundColor: "#10b981", color: "#fff" };
};

// Pill dot color for score legend
const dotColor = (val: number): string => {
  if (val === 1) return "#ef4444";
  if (val === 2) return "#f97316";
  if (val === 3) return "#f59e0b";
  if (val === 4) return "#3b82f6";
  return "#10b981";
};

// Default empty scoring state
const DEFAULT_USER_SCORING: Record<HRScoringKey, number | null> = {
  relevanceOfExperience: null,
  trainingUndertaken: null,
  technicalSkills: null,
  nonTechnicalSkills: null,
  communicationSkills: null,
  emotionalMaturity: null,
  understandingOfPosition: null,
  teamworkAbility: null,
};

export function InterviewUserTab({
  candidate,
  candidateId,
  mode,
  progress,
  canEditAssignees,
  onRefresh,
  onTabChange,
}: InterviewUserTabProps) {
  // Locked mode
  if (mode === "locked") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "64px 0",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            height: "56px",
            width: "56px",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            backgroundColor: "var(--hsd-ui-color-gray-100)",
            marginBottom: "16px",
          }}
        >
          <Lock style={{ width: "24px", height: "24px", color: "var(--hsd-ui-color-gray-500)" }} />
        </div>
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            color: "var(--hsd-ui-color-gray-900)",
            margin: 0,
          }}
        >
          Assessment User Locked
        </h3>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--hsd-ui-color-gray-500)",
            marginTop: "4px",
            maxWidth: "24rem",
          }}
        >
          Complete Interview HR (Assessment HR) first to unlock this stage.
        </p>
      </div>
    );
  }

  return (
    <InterviewUserTabInner
      candidate={candidate}
      candidateId={candidateId}
      mode={mode}
      progress={progress}
      canEditAssignees={canEditAssignees}
      onRefresh={onRefresh}
      onTabChange={onTabChange}
    />
  );
}

/**
 * Inner component that handles both view and edit modes.
 * Separated so hooks are not called conditionally.
 */
function InterviewUserTabInner({
  candidate,
  candidateId,
  mode: modeProp,
  progress,
  canEditAssignees,
  onRefresh,
  onTabChange,
}: InterviewUserTabProps) {
  // Form state
  const [userScoring, setUserScoring] = React.useState<Record<HRScoringKey, number | null>>(
    { ...DEFAULT_USER_SCORING }
  );
  const [userKeyCompetencies, setUserKeyCompetencies] = React.useState("");
  const [userUserNotes, setUserUserNotes] = React.useState("");
  const [userConclusion, setUserConclusion] = React.useState<HRConclusion>(null);
  const [isSubmittingUser, setIsSubmittingUser] = React.useState(false);
  const [showUserPreview, setShowUserPreview] = React.useState(false);

  // Assignee state
  const [assignedAssessors, setAssignedAssessors] = React.useState<AssessmentAssignee[]>([]);
  const [isLoadingAssignees, setIsLoadingAssignees] = React.useState(false);

  // Assignee management state (for canEditAssignees)
  const [availableEmployees, setAvailableEmployees] = React.useState<EmployeeWithRelations[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = React.useState(false);
  const [assessorSearchOpen, setAssessorSearchOpen] = React.useState(false);
  const [assessorSearchQuery, setAssessorSearchQuery] = React.useState("");
  const [isAssigning, setIsAssigning] = React.useState(false);
  const [isRemoving, setIsRemoving] = React.useState<number | null>(null);

  // View mode: fetch scoring data
  const [viewScoringData, setViewScoringData] = React.useState<AssessmentScoringData | null>(null);
  const [isLoadingScoring, setIsLoadingScoring] = React.useState(false);

  // Derive interview2 status from progress
  const interview2Status = React.useMemo(() => {
    if (!progress) return "pending";
    const stage = progress.interview2;
    if (stage.passed) return "passed";
    if (stage.failed) return "failed";
    return "pending";
  }, [progress]);

  const isCompleted = interview2Status === "passed" || interview2Status === "failed";

  // Post-submission state: force view mode if already submitted
  const mode: TabMode = isCompleted ? "view" : modeProp;

  // Populate form from scoring data
  const populateFromScoring = React.useCallback((scoring: AssessmentScoringData) => {
    setUserScoring({
      relevanceOfExperience: scoring.relevance_of_experience,
      trainingUndertaken: scoring.training_undertaken,
      technicalSkills: scoring.technical_skills,
      nonTechnicalSkills: scoring.non_technical_skills,
      communicationSkills: scoring.communication_skills,
      emotionalMaturity: scoring.emotional_maturity,
      understandingOfPosition: scoring.understanding_of_position,
      teamworkAbility: scoring.teamwork_ability,
    });
    const conclusion = scoring.conclusion?.toLowerCase() as HRConclusion;
    setUserConclusion(conclusion);
    if (scoring.key_competencies) setUserKeyCompetencies(scoring.key_competencies);
    if (scoring.interviewer_notes) setUserUserNotes(scoring.interviewer_notes);
  }, []);

  // Fetch scoring data for view mode or completed state
  React.useEffect(() => {
    if (mode !== "view") return;
    let cancelled = false;

    const fetchScoring = async () => {
      setIsLoadingScoring(true);
      try {
        const res = await candidateService.getAssessmentScoring(candidateId, "interview2");
        if (!cancelled && res.success && res.data) {
          const scoring = Array.isArray(res.data) ? res.data[0] : res.data;
          if (scoring) {
            setViewScoringData(scoring);
            populateFromScoring(scoring);
          }
        }
      } catch {
        // silently fail for view mode
      } finally {
        if (!cancelled) setIsLoadingScoring(false);
      }
    };

    fetchScoring();
    return () => { cancelled = true; };
  }, [mode, candidateId, populateFromScoring]);

  // Fetch assigned assessors on mount
  React.useEffect(() => {
    let cancelled = false;

    const fetchAssignees = async () => {
      setIsLoadingAssignees(true);
      try {
        const res = await candidateService.getAssessmentAssignees(candidateId);
        if (!cancelled && res.success && res.data) {
          setAssignedAssessors(res.data);
        }
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setIsLoadingAssignees(false);
      }
    };

    fetchAssignees();
    return () => { cancelled = true; };
  }, [candidateId]);

  // Edit mode: stale draft cleanup
  React.useEffect(() => {
    if (modeProp !== "edit") return;
    if (isCompleted) {
      localStorage.removeItem(USER_FORM_STORAGE_KEY(candidateId));
    }
  }, [modeProp, isCompleted, candidateId]);

  // Edit mode: restore draft from localStorage
  React.useEffect(() => {
    if (mode !== "edit" || isCompleted) return;
    const storageKey = USER_FORM_STORAGE_KEY(candidateId);
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
  }, [mode, candidateId, isCompleted]);

  // Edit mode: save draft to localStorage when form changes
  React.useEffect(() => {
    if (mode !== "edit" || isCompleted) return;
    const storageKey = USER_FORM_STORAGE_KEY(candidateId);
    const dataToSave = {
      userScoring,
      userKeyCompetencies,
      userUserNotes,
      userConclusion,
    };
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
  }, [mode, candidateId, isCompleted, userScoring, userKeyCompetencies, userUserNotes, userConclusion]);

  // Clear localStorage after successful submit
  const clearUserFormStorage = React.useCallback(() => {
    localStorage.removeItem(USER_FORM_STORAGE_KEY(candidateId));
  }, [candidateId]);

  // Fetch employees for assignee management
  const fetchEmployeesForAssignment = React.useCallback(async () => {
    setIsLoadingEmployees(true);
    try {
      const allEmployees: EmployeeWithRelations[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await employeeService.getAll(page, 100);
        if (response.success && response.data?.data) {
          allEmployees.push(...response.data.data);
          const pagination = response.data.pagination;
          if (pagination) {
            hasMore = page < pagination.totalPages;
            page++;
          } else {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }

      setAvailableEmployees(allEmployees);
    } catch (err) {
      console.error("Failed to fetch employees:", err);
    } finally {
      setIsLoadingEmployees(false);
    }
  }, []);

  // Load employees when canEditAssignees
  React.useEffect(() => {
    if (canEditAssignees && !isCompleted) {
      fetchEmployeesForAssignment();
    }
  }, [canEditAssignees, isCompleted, fetchEmployeesForAssignment]);

  // Assign assessor
  const handleAssignAssessor = React.useCallback(async (employee: EmployeeWithRelations) => {
    if (assignedAssessors.some((a) => a.employeeId === parseInt(employee.id, 10))) {
      return;
    }

    setIsAssigning(true);
    try {
      const res = await candidateService.assignAssessors(candidateId, [parseInt(employee.id, 10)]);
      if (res.success && res.data) {
        setAssignedAssessors(res.data);
        showToast.success(`${employee.firstName} ${employee.lastName} assigned as assessor`);
      } else {
        showToast.error(res.message || "Failed to assign assessor");
      }
    } catch {
      showToast.error("Failed to assign assessor");
    } finally {
      setIsAssigning(false);
      setAssessorSearchOpen(false);
      setAssessorSearchQuery("");
    }
  }, [candidateId, assignedAssessors]);

  // Remove assessor
  const handleRemoveAssessor = React.useCallback(async (employeeId: number) => {
    setIsRemoving(employeeId);
    try {
      const res = await candidateService.removeAssessor(candidateId, employeeId);
      if (res.success) {
        setAssignedAssessors((prev) => prev.filter((a) => a.employeeId !== employeeId));
        showToast.success("Assessor removed");
      } else {
        showToast.error(res.message || "Failed to remove assessor");
      }
    } catch {
      showToast.error("Failed to remove assessor");
    } finally {
      setIsRemoving(null);
    }
  }, [candidateId]);

  // Submit handler
  const handleUserAssessmentSubmit = async () => {
    if (!userConclusion) {
      showToast.error("Please select Interview Result Conclusion");
      return;
    }

    const allScoresFilled = Object.values(userScoring).every((score) => score !== null);
    if (!allScoresFilled) {
      showToast.error("Please fill in all scoring criteria");
      return;
    }

    setIsSubmittingUser(true);

    try {
      const action: "PASSED" | "FAILED" = userConclusion === "rejected" ? "FAILED" : "PASSED";

      const response = await candidateService.updateInterview2(candidateId, {
        status: action,
        description: "",
        scoring: {
          relevance_of_experience: userScoring.relevanceOfExperience!,
          training_undertaken: userScoring.trainingUndertaken!,
          technical_skills: userScoring.technicalSkills!,
          non_technical_skills: userScoring.nonTechnicalSkills!,
          communication_skills: userScoring.communicationSkills!,
          emotional_maturity: userScoring.emotionalMaturity!,
          understanding_of_position: userScoring.understandingOfPosition!,
          teamwork_ability: userScoring.teamworkAbility!,
        },
        conclusion: userConclusion!.toUpperCase() as "PROCEED" | "RECOMMENDED" | "REJECTED",
        key_competencies: userKeyCompetencies || null,
        interviewer_notes: userUserNotes || null,
      });

      if (response?.success && response.data) {
        showToast.success("User Assessment submitted successfully");
        clearUserFormStorage();
        setShowUserPreview(false);
        onRefresh();
      } else {
        showToast.error(response?.message || "Failed to submit User Assessment");
      }
    } catch {
      showToast.error("Failed to submit User Assessment");
    } finally {
      setIsSubmittingUser(false);
    }
  };

  // Score statistics
  const filledScores = Object.values(userScoring).filter((s): s is number => s !== null);
  const totalFilled = filledScores.length;
  const totalCriteria = HR_SCORING_CRITERIA.length;
  const averageScore = totalFilled > 0 ? filledScores.reduce((a, b) => a + b, 0) / totalFilled : 0;
  const totalScore = filledScores.reduce((a, b) => a + b, 0);
  const maxTotal = totalCriteria * 5;
  const progressPercent = Math.round((totalFilled / totalCriteria) * 100);

  // View mode loading
  if (mode === "view" && isLoadingScoring) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "64px 0",
        }}
      >
        <Loader2
          className="animate-spin"
          style={{ width: "24px", height: "24px", color: "var(--hsd-ui-color-gray-400)" }}
        />
        <span
          style={{
            marginLeft: "8px",
            fontSize: "0.875rem",
            color: "var(--hsd-ui-color-gray-500)",
          }}
        >
          Loading assessment data...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Post-submission notice */}
      {isCompleted && modeProp === "edit" && (
        <SectionCard title="Assessment Status" icon={CheckCircle2}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              borderRadius: "8px",
              backgroundColor: "var(--hsd-ui-color-blue-50, #e3f2fd)",
              border: "1px solid var(--hsd-ui-color-blue-300, #64b5f6)",
              padding: "12px 16px",
            }}
          >
            <CheckCircle2 style={{ width: "20px", height: "20px", color: "#1565c0", flexShrink: 0 }} />
            <div>
              <p
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#1565c0",
                  margin: 0,
                }}
              >
                Assessment Already Submitted
              </p>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--hsd-ui-color-gray-500)",
                  margin: "2px 0 0",
                }}
              >
                This assessment has already been submitted. Viewing in read-only mode.
              </p>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Status Banner -- Passed */}
      {interview2Status === "passed" && (
        <SectionCard title="Assessment Result" icon={CheckCircle2}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              borderRadius: "8px",
              backgroundColor: "var(--hsd-ui-color-lime-50, #f4fee6)",
              border: "1px solid var(--hsd-ui-color-green-300, #75dead)",
              padding: "12px 16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <CheckCircle2 style={{ width: "20px", height: "20px", color: "#059669", flexShrink: 0 }} />
              <div>
                <p
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "#186742",
                    margin: 0,
                  }}
                >
                  Assessment User — Passed
                </p>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--hsd-ui-color-gray-500)",
                    margin: "2px 0 0",
                  }}
                >
                  Candidate cleared User assessment. Proceed to MCU for the next stage.
                </p>
              </div>
            </div>
            {onTabChange && (
              <Button
                size="default"
                onClick={() => onTabChange("mcu")}
                style={btnPrimary}
              >
                Proceed to MCU
                <ChevronRight style={{ marginLeft: "4px", width: "16px", height: "16px" }} />
              </Button>
            )}
          </div>
        </SectionCard>
      )}

      {/* Status Banner -- Failed */}
      {interview2Status === "failed" && (
        <SectionCard title="Assessment Result" icon={XCircle}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              borderRadius: "8px",
              backgroundColor: "rgba(250, 55, 70, 0.04)",
              border: "1px solid rgba(250, 55, 70, 0.3)",
              padding: "12px 16px",
            }}
          >
            <XCircle style={{ width: "20px", height: "20px", color: "rgba(250, 55, 70, 1)", flexShrink: 0 }} />
            <div>
              <p
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "rgba(250, 55, 70, 1)",
                  margin: 0,
                }}
              >
                Assessment User — Failed
              </p>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--hsd-ui-color-gray-500)",
                  margin: "2px 0 0",
                }}
              >
                Candidate did not pass the User assessment and cannot proceed further.
              </p>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Assigned Assessors */}
      {assignedAssessors.length > 0 && (
        <SectionCard title="Assigned Assessors" icon={Users}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            {assignedAssessors.map((assessor) => (
              <div
                key={assessor.employeeId}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 16px 8px 8px",
                  borderRadius: "4px",
                  border: "1px solid rgba(0, 30, 210, 0.12)",
                  backgroundColor: "rgba(0, 30, 210, 0.03)",
                }}
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback
                    style={{
                      backgroundColor: "var(--hsd-ui-background-color-primary)",
                      color: "#fff",
                      fontSize: "0.6875rem",
                      fontWeight: 500,
                    }}
                  >
                    {assessor.employeeName ? assessor.employeeName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?"}
                  </AvatarFallback>
                </Avatar>
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      color: "var(--hsd-ui-color-gray-900)",
                      margin: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {assessor.employeeName || "No Data"}
                  </p>
                  {assessor.employeeEmail && (
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--hsd-ui-color-gray-500)",
                        margin: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {assessor.employeeEmail}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Manage Assessors */}
      {canEditAssignees && !isCompleted && assignedAssessors.length === 0 && (
        <SectionCard title="Manage Assessors" icon={User}>
          <Popover open={assessorSearchOpen} onOpenChange={setAssessorSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={assessorSearchOpen}
                disabled={isAssigning}
                className="w-full justify-between"
                style={{
                  height: "44px",
                  padding: "0 12px",
                  backgroundColor: "var(--hsd-ui-color-gray-100)",
                  borderColor: "rgba(120, 134, 127, 0.2)",
                  borderRadius: "8px",
                }}
              >
                <span
                  style={{
                    color: "var(--hsd-ui-color-gray-500)",
                    fontSize: "0.875rem",
                  }}
                >
                  {isAssigning ? "Assigning..." : "Click to search and add assessors..."}
                </span>
                <ChevronRight
                  className={cn(
                    "transition-transform duration-200",
                    assessorSearchOpen && "rotate-90"
                  )}
                  style={{ width: "16px", height: "16px", color: "var(--hsd-ui-color-gray-400)" }}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command className="border-0">
                <CommandInput
                  placeholder="Type to search employees..."
                  value={assessorSearchQuery}
                  onValueChange={setAssessorSearchQuery}
                  className="h-11"
                />
                <CommandList>
                  <CommandEmpty>
                    {isLoadingEmployees ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "24px 0",
                          gap: "8px",
                        }}
                      >
                        <Loader2
                          className="animate-spin"
                          style={{ width: "16px", height: "16px", color: "var(--hsd-ui-color-gray-400)" }}
                        />
                        <span style={{ fontSize: "0.875rem", color: "var(--hsd-ui-color-gray-500)" }}>
                          Loading employees...
                        </span>
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: "24px 0",
                          textAlign: "center",
                          fontSize: "0.875rem",
                          color: "var(--hsd-ui-color-gray-500)",
                        }}
                      >
                        No employees found
                      </div>
                    )}
                  </CommandEmpty>
                  <CommandGroup>
                    <ScrollArea className="h-[240px]">
                      {availableEmployees
                        .filter((emp) => {
                          const name = `${emp.firstName} ${emp.lastName}`.toLowerCase();
                          const query = assessorSearchQuery.toLowerCase();
                          return name.includes(query) || emp.email?.toLowerCase().includes(query);
                        })
                        .map((emp) => {
                          const isAssigned = assignedAssessors.some(
                            (a) => a.employeeId === parseInt(emp.id, 10)
                          );
                          return (
                            <CommandItem
                              key={emp.id}
                              value={`${emp.firstName} ${emp.lastName} ${emp.email}`}
                              onSelect={() => handleAssignAssessor(emp)}
                              disabled={isAssigned}
                              className="cursor-pointer group"
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "12px",
                                  width: "100%",
                                  padding: "4px 0",
                                }}
                              >
                                <div style={{ position: "relative" }}>
                                  <Avatar className="h-9 w-9">
                                    <AvatarFallback
                                      style={{
                                        fontSize: "0.6875rem",
                                        fontWeight: 500,
                                        backgroundColor: isAssigned
                                          ? "#2563eb"
                                          : "var(--hsd-ui-color-gray-100)",
                                        color: isAssigned
                                          ? "#fff"
                                          : "var(--hsd-ui-color-gray-700)",
                                      }}
                                    >
                                      {getInitials(`${emp.firstName} ${emp.lastName}`)}
                                    </AvatarFallback>
                                  </Avatar>
                                  {isAssigned && (
                                    <div
                                      style={{
                                        position: "absolute",
                                        bottom: "-2px",
                                        right: "-2px",
                                        height: "16px",
                                        width: "16px",
                                        borderRadius: "50%",
                                        backgroundColor: "#10b981",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        border: "2px solid #fff",
                                      }}
                                    >
                                      <Check style={{ width: "10px", height: "10px", color: "#fff" }} />
                                    </div>
                                  )}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p
                                    style={{
                                      fontSize: "0.875rem",
                                      fontWeight: 500,
                                      color: "var(--hsd-ui-color-gray-900)",
                                      margin: 0,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {emp.firstName} {emp.lastName}
                                  </p>
                                  <p
                                    style={{
                                      fontSize: "0.75rem",
                                      color: "var(--hsd-ui-color-gray-500)",
                                      margin: 0,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {emp.jobTitle?.name || emp.email}
                                  </p>
                                </div>
                                {isAssigned && (
                                  <TuvBadge text="Assigned" variant="info" size="xs" border />
                                )}
                              </div>
                            </CommandItem>
                          );
                        })}
                    </ScrollArea>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </SectionCard>
      )}

      {/* Score Overview */}
      <SectionCard title="Score Overview" icon={BarChart3}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "32px",
          }}
        >
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
              Progress
            </p>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", marginTop: "4px" }}>
              <span
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                  color: "var(--hsd-ui-color-gray-900)",
                }}
              >
                {totalFilled}
              </span>
              <span
                style={{
                  fontSize: "0.875rem",
                  color: "var(--hsd-ui-color-gray-500)",
                  marginBottom: "2px",
                }}
              >
                / {totalCriteria}
              </span>
            </div>
            <div
              style={{
                marginTop: "8px",
                height: "6px",
                width: "100%",
                borderRadius: "9999px",
                backgroundColor: "var(--hsd-ui-color-gray-100)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  borderRadius: "9999px",
                  backgroundColor: "var(--hsd-ui-background-color-primary)",
                  transition: "width 0.5s ease-out",
                  width: `${progressPercent}%`,
                }}
              />
            </div>
          </div>
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
              Average
            </p>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", marginTop: "4px" }}>
              <span
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                  ...scoreColorStyle(averageScore),
                }}
              >
                {totalFilled > 0 ? averageScore.toFixed(1) : "\u2014"}
              </span>
              <span
                style={{
                  fontSize: "0.875rem",
                  color: "var(--hsd-ui-color-gray-500)",
                  marginBottom: "2px",
                }}
              >
                / 5.0
              </span>
            </div>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--hsd-ui-color-gray-500)",
                marginTop: "4px",
              }}
            >
              {totalFilled === 0
                ? "No scores yet"
                : averageScore >= 4.5
                ? "Excellent"
                : averageScore >= 3.5
                ? "Good"
                : averageScore >= 2.5
                ? "Fair"
                : averageScore >= 1.5
                ? "Poor"
                : "Very Poor"}
            </p>
          </div>
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
              Total Score
            </p>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", marginTop: "4px" }}>
              <span
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                  color: "var(--hsd-ui-color-gray-900)",
                }}
              >
                {totalScore}
              </span>
              <span
                style={{
                  fontSize: "0.875rem",
                  color: "var(--hsd-ui-color-gray-500)",
                  marginBottom: "2px",
                }}
              >
                / {maxTotal}
              </span>
            </div>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--hsd-ui-color-gray-500)",
                marginTop: "4px",
              }}
            >
              {totalFilled > 0 ? `${Math.round((totalScore / maxTotal) * 100)}% of maximum` : "Start scoring below"}
            </p>
          </div>
        </div>
      </SectionCard>

      {/* Interview Scoring */}
      <SectionCard title="Interview Scoring" icon={ClipboardCheck}>
        {/* Score legend */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "16px",
            marginBottom: "12px",
            paddingBottom: "12px",
            borderBottom: "1px solid rgba(120, 134, 127, 0.15)",
          }}
        >
          {SCORE_OPTIONS.map((opt) => (
            <div key={opt.value} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  height: "10px",
                  width: "10px",
                  borderRadius: "50%",
                  backgroundColor: dotColor(opt.value),
                }}
              />
              <span
                style={{
                  fontSize: "0.6875rem",
                  color: "var(--hsd-ui-color-gray-500)",
                }}
              >
                {opt.label}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {HR_SCORING_CRITERIA.map((criteria, index) => {
            const currentScore = userScoring[criteria.key];
            return (
              <div
                key={criteria.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px",
                  margin: "0 -12px",
                  borderRadius: "8px",
                  transition: "background-color 0.15s",
                  ...(currentScore === null && !isCompleted && mode === "edit"
                    ? {}
                    : {}),
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--hsd-ui-color-gray-400)",
                      fontFamily: "monospace",
                      width: "20px",
                      textAlign: "right",
                      flexShrink: 0,
                    }}
                  >
                    {index + 1}.
                  </span>
                  <span
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      color: "var(--hsd-ui-color-gray-700)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {criteria.label}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0, marginLeft: "16px" }}>
                  {SCORE_OPTIONS.map((option) => {
                    const isSelected = currentScore === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        disabled={isCompleted || mode === "view"}
                        onClick={() =>
                          setUserScoring((prev) => ({
                            ...prev,
                            [criteria.key]: option.value,
                          }))
                        }
                        title={option.label}
                        style={{
                          position: "relative",
                          height: "32px",
                          width: "32px",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          transition: "all 0.2s",
                          border: "none",
                          cursor: isCompleted || mode === "view" ? "not-allowed" : "pointer",
                          opacity: isCompleted || mode === "view" ? 0.6 : 1,
                          ...pillStyle(option.value, isSelected),
                        }}
                      >
                        {option.value}
                      </button>
                    );
                  })}
                  {/* Selected label */}
                  <span
                    style={{
                      marginLeft: "8px",
                      fontSize: "0.6875rem",
                      fontWeight: 500,
                      width: "64px",
                      textAlign: "right",
                      transition: "opacity 0.15s",
                      opacity: currentScore ? 1 : 0,
                      color: "var(--hsd-ui-color-gray-700)",
                    }}
                  >
                    {currentScore ? SCORE_OPTIONS.find((o) => o.value === currentScore)?.label : ""}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Additional Information */}
      <SectionCard title="Additional Information" icon={FileText}>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <Label
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: "var(--hsd-ui-color-gray-700)",
              }}
            >
              Key Competencies Required by the Department / Company
            </Label>
            {isCompleted || mode === "view" ? (
              <div
                className="border"
                style={{
                  borderRadius: "8px",
                  borderColor: "rgba(120, 134, 127, 0.2)",
                  backgroundColor: "var(--hsd-ui-color-gray-100)",
                  padding: "12px",
                  fontSize: "0.875rem",
                  minHeight: "80px",
                  opacity: 0.6,
                }}
              >
                {userKeyCompetencies ? (
                  <LexicalRenderer value={userKeyCompetencies} />
                ) : (
                  <span style={{ color: "var(--hsd-ui-color-gray-400)", fontStyle: "italic" }}>
                    No content
                  </span>
                )}
              </div>
            ) : (
              <LexicalEditor
                value={userKeyCompetencies}
                onChange={setUserKeyCompetencies}
                placeholder="Enter key competencies required..."
              />
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <Label
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: "var(--hsd-ui-color-gray-700)",
              }}
            >
              Interviewer Notes
            </Label>
            {isCompleted || mode === "view" ? (
              <div
                className="border"
                style={{
                  borderRadius: "8px",
                  borderColor: "rgba(120, 134, 127, 0.2)",
                  backgroundColor: "var(--hsd-ui-color-gray-100)",
                  padding: "12px",
                  fontSize: "0.875rem",
                  minHeight: "80px",
                  opacity: 0.6,
                }}
              >
                {userUserNotes ? (
                  <LexicalRenderer value={userUserNotes} />
                ) : (
                  <span style={{ color: "var(--hsd-ui-color-gray-400)", fontStyle: "italic" }}>
                    No content
                  </span>
                )}
              </div>
            ) : (
              <LexicalEditor
                value={userUserNotes}
                onChange={setUserUserNotes}
                placeholder="Enter your observations and notes..."
              />
            )}
          </div>
        </div>
      </SectionCard>

      {/* Interview Result Conclusion */}
      <SectionCard title="Interview Result Conclusion" icon={Award}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px",
          }}
        >
          {([
            {
              value: "proceed" as const,
              label: "Proceed",
              desc: "Advance to next stage",
              icon: CheckCircle2,
              activeColors: {
                border: "#10b981",
                bg: "rgba(16, 185, 129, 0.06)",
                iconColor: "#059669",
                dotColor: "#10b981",
              },
            },
            {
              value: "recommended" as const,
              label: "Recommended",
              desc: "Conditionally advance",
              icon: ClipboardCheck,
              activeColors: {
                border: "#3b82f6",
                bg: "rgba(59, 130, 246, 0.06)",
                iconColor: "#2563eb",
                dotColor: "#3b82f6",
              },
            },
            {
              value: "rejected" as const,
              label: "Rejected",
              desc: "Do not proceed",
              icon: XCircle,
              activeColors: {
                border: "#ef4444",
                bg: "rgba(239, 68, 68, 0.06)",
                iconColor: "#dc2626",
                dotColor: "#ef4444",
              },
            },
          ]).map((option) => {
            const Icon = option.icon;
            const isSelected = userConclusion === option.value;
            return (
              <button
                key={option.value}
                type="button"
                disabled={isCompleted || mode === "view"}
                onClick={() => setUserConclusion(option.value)}
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                  borderRadius: "8px",
                  border: `2px solid ${isSelected ? option.activeColors.border : "rgba(120, 134, 127, 0.2)"}`,
                  backgroundColor: isSelected ? option.activeColors.bg : "#fff",
                  padding: "20px",
                  textAlign: "center",
                  transition: "all 0.2s",
                  cursor: isCompleted || mode === "view" ? "not-allowed" : "pointer",
                  opacity: isCompleted || mode === "view" ? 0.6 : 1,
                }}
              >
                {isSelected && (
                  <div
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      height: "10px",
                      width: "10px",
                      borderRadius: "50%",
                      backgroundColor: option.activeColors.dotColor,
                    }}
                  />
                )}
                <div
                  style={{
                    display: "flex",
                    height: "40px",
                    width: "40px",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    backgroundColor: isSelected
                      ? "rgba(255, 255, 255, 0.6)"
                      : "var(--hsd-ui-color-gray-100)",
                    transition: "background-color 0.15s",
                  }}
                >
                  <Icon
                    style={{
                      width: "20px",
                      height: "20px",
                      color: isSelected ? option.activeColors.iconColor : "var(--hsd-ui-color-gray-400)",
                    }}
                  />
                </div>
                <div>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: isSelected ? option.activeColors.iconColor : "var(--hsd-ui-color-gray-900)",
                      margin: 0,
                    }}
                  >
                    {option.label}
                  </p>
                  <p
                    style={{
                      fontSize: "0.6875rem",
                      color: "var(--hsd-ui-color-gray-500)",
                      margin: "2px 0 0",
                    }}
                  >
                    {option.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* Action Buttons -- edit mode only, not completed */}
      {mode === "edit" && !isCompleted && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "8px",
          }}
        >
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--hsd-ui-color-gray-500)",
              margin: 0,
            }}
          >
            {totalFilled < totalCriteria
              ? `${totalCriteria - totalFilled} scoring criteria remaining`
              : userConclusion
              ? "Ready to submit"
              : "Select a conclusion to submit"}
          </p>
          <Button onClick={() => setShowUserPreview(true)} style={btnPrimary}>
            <Send style={{ width: "16px", height: "16px", marginRight: "6px" }} />
            Submit Assessment
          </Button>
        </div>
      )}

      {/* User Preview Dialog */}
      <Dialog open={showUserPreview} onOpenChange={setShowUserPreview}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0">
          {/* Header */}
          <div
            style={{
              padding: "24px 24px 16px",
              borderBottom: "1px solid rgba(120, 134, 127, 0.15)",
            }}
          >
            <DialogHeader>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    display: "flex",
                    height: "44px",
                    width: "44px",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "8px",
                    backgroundColor: "var(--hsd-ui-color-navy-50)",
                  }}
                >
                  <ClipboardCheck style={{ width: "20px", height: "20px", color: "var(--hsd-ui-color-navy-500)" }} />
                </div>
                <div>
                  <DialogTitle
                    style={{
                      fontSize: "1.125rem",
                      fontWeight: 600,
                      color: "var(--hsd-ui-color-gray-900)",
                    }}
                  >
                    Confirm Submission
                  </DialogTitle>
                  <DialogDescription
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--hsd-ui-color-gray-500)",
                    }}
                  >
                    Review your User Assessment before submitting
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Candidate Card */}
            {candidate && (
              <div
                className="border"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "16px",
                  borderRadius: "8px",
                  borderColor: "rgba(120, 134, 127, 0.2)",
                  backgroundColor: "var(--hsd-ui-color-gray-100)",
                }}
              >
                <Avatar className="h-12 w-12">
                  <AvatarFallback
                    style={{
                      backgroundColor: "var(--hsd-ui-color-navy-50)",
                      color: "var(--hsd-ui-color-navy-500)",
                      fontWeight: 600,
                    }}
                  >
                    {getInitials(candidate.fullname)}
                  </AvatarFallback>
                </Avatar>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontWeight: 600,
                      color: "var(--hsd-ui-color-gray-900)",
                      margin: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {candidate.fullname}
                  </p>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--hsd-ui-color-gray-500)",
                      margin: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {candidate.jobTitle?.name}
                  </p>
                </div>
                {userConclusion && (
                  <TuvBadge
                    text={
                      userConclusion === "proceed"
                        ? "Proceed"
                        : userConclusion === "recommended"
                        ? "Recommended"
                        : "Rejected"
                    }
                    variant={
                      userConclusion === "proceed"
                        ? "success"
                        : userConclusion === "recommended"
                        ? "info"
                        : "danger"
                    }
                    size="sm"
                    border
                  />
                )}
              </div>
            )}

            {/* Score Summary Card */}
            {(() => {
              const previewFilledScores = Object.values(userScoring).filter((s): s is number => s !== null);
              const previewTotalFilled = previewFilledScores.length;
              const previewTotalCriteria = HR_SCORING_CRITERIA.length;
              const previewAverageScore =
                previewTotalFilled > 0 ? previewFilledScores.reduce((a, b) => a + b, 0) / previewTotalFilled : 0;
              const previewTotalScore = previewFilledScores.reduce((a, b) => a + b, 0);
              const previewMaxTotal = previewTotalCriteria * 5;

              return (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "12px",
                  }}
                >
                  <div
                    className="border"
                    style={{
                      borderRadius: "8px",
                      borderColor: "rgba(120, 134, 127, 0.2)",
                      backgroundColor: "#fff",
                      padding: "16px",
                      textAlign: "center",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 700,
                        color: "var(--hsd-ui-color-gray-900)",
                        margin: 0,
                      }}
                    >
                      {previewTotalFilled}/{previewTotalCriteria}
                    </p>
                    <p
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: 500,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--hsd-ui-color-gray-500)",
                        marginTop: "4px",
                      }}
                    >
                      Criteria Filled
                    </p>
                  </div>
                  <div
                    className="border"
                    style={{
                      borderRadius: "8px",
                      borderColor: "rgba(120, 134, 127, 0.2)",
                      backgroundColor: "#fff",
                      padding: "16px",
                      textAlign: "center",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 700,
                        color: "var(--hsd-ui-color-gray-900)",
                        margin: 0,
                      }}
                    >
                      {previewAverageScore.toFixed(1)}
                    </p>
                    <p
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: 500,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--hsd-ui-color-gray-500)",
                        marginTop: "4px",
                      }}
                    >
                      Avg. Score
                    </p>
                  </div>
                  <div
                    className="border"
                    style={{
                      borderRadius: "8px",
                      borderColor: "rgba(120, 134, 127, 0.2)",
                      backgroundColor: "#fff",
                      padding: "16px",
                      textAlign: "center",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 700,
                        color: "var(--hsd-ui-color-gray-900)",
                        margin: 0,
                      }}
                    >
                      {previewTotalScore}/{previewMaxTotal}
                    </p>
                    <p
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: 500,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--hsd-ui-color-gray-500)",
                        marginTop: "4px",
                      }}
                    >
                      Total Points
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Scoring Details */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    height: "4px",
                    width: "4px",
                    borderRadius: "50%",
                    backgroundColor: "var(--hsd-ui-color-navy-500)",
                  }}
                />
                <h4
                  style={{
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "var(--hsd-ui-color-gray-500)",
                    margin: 0,
                  }}
                >
                  Scoring Breakdown
                </h4>
              </div>
              <div
                className="border"
                style={{
                  borderRadius: "8px",
                  borderColor: "rgba(120, 134, 127, 0.2)",
                  overflow: "hidden",
                }}
              >
                {HR_SCORING_CRITERIA.map((criteria, index) => {
                  const score = userScoring[criteria.key];
                  const scoreLabel = score ? SCORE_OPTIONS.find((opt) => opt.value === score)?.label : null;
                  const detailScoreColorVal =
                    score && score >= 4
                      ? "#059669"
                      : score && score >= 3
                      ? "#2563eb"
                      : score && score >= 2
                      ? "#d97706"
                      : score
                      ? "#ef4444"
                      : "var(--hsd-ui-color-gray-400)";
                  return (
                    <div
                      key={criteria.key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 16px",
                        backgroundColor: index % 2 === 0 ? "var(--hsd-ui-color-gray-100)" : "#fff",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--hsd-ui-color-gray-900)",
                        }}
                      >
                        {criteria.label}
                      </span>
                      {scoreLabel ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ display: "flex", gap: "2px" }}>
                            {[1, 2, 3, 4, 5].map((dot) => (
                              <div
                                key={dot}
                                style={{
                                  height: "6px",
                                  width: "6px",
                                  borderRadius: "50%",
                                  backgroundColor:
                                    score && dot <= score
                                      ? score >= 4
                                        ? "#10b981"
                                        : score >= 3
                                        ? "#3b82f6"
                                        : score >= 2
                                        ? "#f59e0b"
                                        : "#ef4444"
                                      : "var(--hsd-ui-color-gray-200)",
                                }}
                              />
                            ))}
                          </div>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: 500,
                              color: detailScoreColorVal,
                            }}
                          >
                            {scoreLabel}
                          </span>
                        </div>
                      ) : (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--hsd-ui-color-gray-400)",
                            fontStyle: "italic",
                          }}
                        >
                          Not rated
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Additional Information */}
            {(userKeyCompetencies || userUserNotes) && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div
                    style={{
                      height: "4px",
                      width: "4px",
                      borderRadius: "50%",
                      backgroundColor: "var(--hsd-ui-color-navy-500)",
                    }}
                  />
                  <h4
                    style={{
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "var(--hsd-ui-color-gray-500)",
                      margin: 0,
                    }}
                  >
                    Additional Notes
                  </h4>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {userKeyCompetencies && (
                    <div
                      className="border"
                      style={{
                        borderRadius: "8px",
                        borderColor: "rgba(120, 134, 127, 0.2)",
                        padding: "16px",
                        backgroundColor: "var(--hsd-ui-color-gray-100)",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "0.625rem",
                          color: "var(--hsd-ui-color-gray-500)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          fontWeight: 500,
                          marginBottom: "8px",
                        }}
                      >
                        Key Competencies
                      </p>
                      <div style={{ fontSize: "0.875rem", color: "var(--hsd-ui-color-gray-900)" }}>
                        <LexicalRenderer value={userKeyCompetencies} />
                      </div>
                    </div>
                  )}
                  {userUserNotes && (
                    <div
                      className="border"
                      style={{
                        borderRadius: "8px",
                        borderColor: "rgba(120, 134, 127, 0.2)",
                        padding: "16px",
                        backgroundColor: "var(--hsd-ui-color-gray-100)",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "0.625rem",
                          color: "var(--hsd-ui-color-gray-500)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          fontWeight: 500,
                          marginBottom: "8px",
                        }}
                      >
                        Interviewer Notes
                      </p>
                      <div style={{ fontSize: "0.875rem", color: "var(--hsd-ui-color-gray-900)" }}>
                        <LexicalRenderer value={userUserNotes} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Warning for incomplete */}
            {(() => {
              const incFilledScores = Object.values(userScoring).filter((s): s is number => s !== null);
              const incTotalFilled = incFilledScores.length;
              const incTotalCriteria = HR_SCORING_CRITERIA.length;
              const isIncomplete = incTotalFilled < incTotalCriteria || !userConclusion;

              if (isIncomplete) {
                return (
                  <div
                    className="border"
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                      borderRadius: "8px",
                      borderColor: "var(--hsd-ui-color-orange-300, #ffcb69)",
                      backgroundColor: "var(--hsd-ui-color-yellow-50, #fffde6)",
                      padding: "16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        height: "32px",
                        width: "32px",
                        flexShrink: 0,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "8px",
                        backgroundColor: "rgba(245, 158, 11, 0.1)",
                      }}
                    >
                      <AlertTriangle style={{ width: "16px", height: "16px", color: "#d97706" }} />
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: 500,
                          color: "#92400e",
                          margin: 0,
                        }}
                      >
                        Incomplete Assessment
                      </p>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "#b45309",
                          margin: "2px 0 0",
                        }}
                      >
                        {incTotalFilled < incTotalCriteria && `${incTotalCriteria - incTotalFilled} scoring criteria not filled. `}
                        {!userConclusion && "Interview conclusion not selected."}
                      </p>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>

          {/* Footer */}
          <div
            style={{
              borderTop: "1px solid rgba(120, 134, 127, 0.15)",
              backgroundColor: "var(--hsd-ui-color-gray-100)",
              padding: "16px 24px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--hsd-ui-color-gray-500)",
                  margin: 0,
                }}
              >
                This action cannot be undone
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                <Button
                  variant="outline"
                  onClick={() => setShowUserPreview(false)}
                  style={btnSecondary}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowUserPreview(false);
                    handleUserAssessmentSubmit();
                  }}
                  disabled={isSubmittingUser}
                  style={btnPrimary}
                >
                  {isSubmittingUser ? (
                    <>
                      <Loader2
                        className="animate-spin"
                        style={{ width: "16px", height: "16px", marginRight: "6px" }}
                      />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                      Confirm & Submit
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
