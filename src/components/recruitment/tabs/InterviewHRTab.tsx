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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TuvBadge } from "@/components/shared/tuv-badge";
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

import {
  candidateService,
  type AssessmentProgress,
  type AssessmentScoringData,
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

// LocalStorage key for HR assessment form data
const HR_FORM_STORAGE_KEY = (id: string) => `hr-assessment-form-${id}`;

interface InterviewHRTabProps {
  candidate: CandidateWithRelations;
  candidateId: string;
  mode: TabMode;
  progress: AssessmentProgress | null;
  onRefresh: () => void;
}

// Helper: score color based on value (TUV inline style)
const scoreColorStyle = (val: number): React.CSSProperties => {
  if (val >= 4.5) return { color: "var(--hsd-ui-color-green-700, #186742)" };
  if (val >= 3.5) return { color: "var(--hsd-ui-color-blue-800, #1565c0)" };
  if (val >= 2.5) return { color: "var(--hsd-ui-color-gray-700, #48504c)" };
  if (val >= 1) return { color: "rgba(250, 55, 70, 1)" };
  return { color: "var(--hsd-ui-color-gray-400)" };
};

// Helper: pill style for score buttons
const pillStyle = (val: number, selected: boolean): React.CSSProperties => {
  if (!selected)
    return {
      backgroundColor: "var(--hsd-ui-color-gray-100)",
      color: "var(--hsd-ui-color-gray-500)",
    };
  if (val <= 1) return { backgroundColor: "rgba(250, 55, 70, 1)", color: "#fff" };
  if (val <= 2) return { backgroundColor: "#f97316", color: "#fff" };
  if (val <= 3) return { backgroundColor: "#eab308", color: "#fff" };
  if (val <= 4) return { backgroundColor: "var(--hsd-ui-color-blue-800, #1565c0)", color: "#fff" };
  return { backgroundColor: "var(--hsd-ui-color-green-700, #186742)", color: "#fff" };
};

// Score dot color for preview
const scoreDotColor = (score: number | null): string => {
  if (!score) return "var(--hsd-ui-color-gray-200)";
  if (score >= 4) return "var(--hsd-ui-color-green-700, #186742)";
  if (score >= 3) return "var(--hsd-ui-color-blue-800, #1565c0)";
  if (score >= 2) return "#eab308";
  return "rgba(250, 55, 70, 1)";
};

// Default empty scoring state
const DEFAULT_HR_SCORING: Record<HRScoringKey, number | null> = {
  relevanceOfExperience: null,
  trainingUndertaken: null,
  technicalSkills: null,
  nonTechnicalSkills: null,
  communicationSkills: null,
  emotionalMaturity: null,
  understandingOfPosition: null,
  teamworkAbility: null,
};

export function InterviewHRTab({
  candidate,
  candidateId,
  mode,
  progress,
  onRefresh,
}: InterviewHRTabProps) {
  // ── Locked mode ──
  if (mode === "locked") {
    return (
      <div
        className="flex flex-col items-center justify-center text-center"
        style={{ padding: "64px 0" }}
      >
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            height: "56px",
            width: "56px",
            backgroundColor: "var(--hsd-ui-color-gray-100)",
            marginBottom: "16px",
          }}
        >
          <Lock style={{ width: "24px", height: "24px", color: "var(--hsd-ui-color-gray-400)" }} />
        </div>
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            color: "var(--hsd-ui-color-gray-900)",
            margin: 0,
          }}
        >
          Stage Locked
        </h3>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--hsd-ui-color-gray-500)",
            margin: "4px 0 0",
            maxWidth: "24rem",
          }}
        >
          Complete previous stage first before accessing the HR Assessment.
        </p>
      </div>
    );
  }

  // ── View / Edit shared state ──
  return (
    <InterviewHRTabInner
      candidate={candidate}
      candidateId={candidateId}
      mode={mode}
      progress={progress}
      onRefresh={onRefresh}
    />
  );
}

/**
 * Inner component that handles both view and edit modes.
 * Separated so hooks are not called conditionally.
 */
function InterviewHRTabInner({
  candidate,
  candidateId,
  mode,
  progress,
  onRefresh,
}: InterviewHRTabProps) {
  // ── Form state ──
  const [hrScoring, setHrScoring] = React.useState<Record<HRScoringKey, number | null>>(
    { ...DEFAULT_HR_SCORING }
  );
  const [hrKeyCompetencies, setHrKeyCompetencies] = React.useState("");
  const [hrUserNotes, setHrUserNotes] = React.useState("");
  const [hrConclusion, setHrConclusion] = React.useState<HRConclusion>(null);
  const [isSubmittingHR, setIsSubmittingHR] = React.useState(false);
  const [showHRPreview, setShowHRPreview] = React.useState(false);

  // ── Assessor assignment state ──
  const [showAssessorAssignment, setShowAssessorAssignment] = React.useState(false);
  const [selectedAssessors, setSelectedAssessors] = React.useState<EmployeeWithRelations[]>([]);
  const [availableEmployees, setAvailableEmployees] = React.useState<EmployeeWithRelations[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = React.useState(false);
  const [assessorSearchOpen, setAssessorSearchOpen] = React.useState(false);
  const [assessorSearchQuery, setAssessorSearchQuery] = React.useState("");

  // ── View mode: fetch scoring data ──
  const [viewScoringData, setViewScoringData] = React.useState<AssessmentScoringData | null>(null);
  const [isLoadingScoring, setIsLoadingScoring] = React.useState(false);

  // Derive interview1 status from progress
  const interview1Status = React.useMemo(() => {
    if (!progress) return "pending";
    const stage = progress.interview1;
    if (stage.passed) return "passed";
    if (stage.failed) return "failed";
    return "pending";
  }, [progress]);

  const isCompleted = interview1Status === "passed" || interview1Status === "failed";

  // ── Populate form from scoring data ──
  const populateFromScoring = React.useCallback((scoring: AssessmentScoringData) => {
    setHrScoring({
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
    setHrConclusion(conclusion);
    if (scoring.key_competencies) setHrKeyCompetencies(scoring.key_competencies);
    if (scoring.interviewer_notes) setHrUserNotes(scoring.interviewer_notes);
  }, []);

  // ── Fetch scoring data from API (view mode OR completed edit mode) ──
  React.useEffect(() => {
    if (mode === "locked") return;
    if (mode === "edit" && !isCompleted) return;
    let cancelled = false;

    const fetchScoring = async () => {
      setIsLoadingScoring(true);
      try {
        const res = await candidateService.getAssessmentScoring(candidateId, "interview1");
        if (!cancelled && res.success && res.data) {
          // API may return array or single object
          const scoring = Array.isArray(res.data) ? res.data[0] : res.data;
          if (scoring) {
            setViewScoringData(scoring);
            populateFromScoring(scoring);
          }
        }
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setIsLoadingScoring(false);
      }
    };

    fetchScoring();
    return () => { cancelled = true; };
  }, [mode, candidateId, isCompleted, populateFromScoring]);

  // ── Edit mode: stale draft cleanup ──
  React.useEffect(() => {
    if (mode !== "edit") return;
    if (isCompleted) {
      localStorage.removeItem(HR_FORM_STORAGE_KEY(candidateId));
    }
  }, [mode, isCompleted, candidateId]);

  // ── Edit mode: restore draft from localStorage ──
  React.useEffect(() => {
    if (mode !== "edit" || isCompleted) return;
    const storageKey = HR_FORM_STORAGE_KEY(candidateId);
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
  }, [mode, candidateId, isCompleted]);

  // ── Edit mode: save draft to localStorage when form changes ──
  React.useEffect(() => {
    if (mode !== "edit" || isCompleted) return;
    const storageKey = HR_FORM_STORAGE_KEY(candidateId);
    const dataToSave = {
      hrScoring,
      hrKeyCompetencies,
      hrUserNotes,
      hrConclusion,
    };
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
  }, [mode, candidateId, isCompleted, hrScoring, hrKeyCompetencies, hrUserNotes, hrConclusion]);

  // ── Clear localStorage after successful submit ──
  const clearHRFormStorage = React.useCallback(() => {
    localStorage.removeItem(HR_FORM_STORAGE_KEY(candidateId));
  }, [candidateId]);

  // ── Fetch employees for assessor assignment ──
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

  // ── Open assessor assignment dialog ──
  const handleOpenAssessorAssignment = React.useCallback(() => {
    setShowHRPreview(false);
    setShowAssessorAssignment(true);
    setSelectedAssessors([]);
    setAssessorSearchQuery("");
    fetchEmployeesForAssignment();
  }, [fetchEmployeesForAssignment]);

  // ── Toggle assessor selection ──
  const toggleAssessor = React.useCallback((employee: EmployeeWithRelations) => {
    setSelectedAssessors((prev) => {
      const exists = prev.some((e) => e.id === employee.id);
      if (exists) {
        return prev.filter((e) => e.id !== employee.id);
      }
      return [...prev, employee];
    });
  }, []);

  // ── Remove assessor ──
  const removeAssessor = React.useCallback((employeeId: string) => {
    setSelectedAssessors((prev) => prev.filter((e) => e.id !== employeeId));
  }, []);

  // ── Submit handler ──
  const handleHRAssessmentSubmit = async () => {
    if (!hrConclusion) {
      showToast.error("Please select Interview Result Conclusion");
      return;
    }

    const allScoresFilled = Object.values(hrScoring).every((score) => score !== null);
    if (!allScoresFilled) {
      showToast.error("Please fill in all scoring criteria");
      return;
    }

    if (hrConclusion !== "rejected" && selectedAssessors.length === 0) {
      showToast.error("Please select at least one assessor for Interview User");
      return;
    }

    setIsSubmittingHR(true);

    try {
      const action: "PASSED" | "FAILED" = hrConclusion === "rejected" ? "FAILED" : "PASSED";

      const response = await candidateService.updateInterview1(candidateId, {
        status: action,
        description: "",
        scoring: {
          relevance_of_experience: hrScoring.relevanceOfExperience!,
          training_undertaken: hrScoring.trainingUndertaken!,
          technical_skills: hrScoring.technicalSkills!,
          non_technical_skills: hrScoring.nonTechnicalSkills!,
          communication_skills: hrScoring.communicationSkills!,
          emotional_maturity: hrScoring.emotionalMaturity!,
          understanding_of_position: hrScoring.understandingOfPosition!,
          teamwork_ability: hrScoring.teamworkAbility!,
        },
        conclusion: hrConclusion!.toUpperCase() as "PROCEED" | "RECOMMENDED" | "REJECTED",
        key_competencies: hrKeyCompetencies || null,
        interviewer_notes: hrUserNotes || null,
        assessor_ids: selectedAssessors.map((e) => parseInt(e.id, 10)),
      });

      if (response?.success && response.data) {
        showToast.success("HR Assessment submitted successfully");
        clearHRFormStorage();
        setShowAssessorAssignment(false);
        setShowHRPreview(false);
        setSelectedAssessors([]);
        onRefresh();
      } else {
        showToast.error(response?.message || "Failed to submit HR Assessment");
      }
    } catch {
      showToast.error("Failed to submit HR Assessment");
    } finally {
      setIsSubmittingHR(false);
    }
  };

  // ── Score statistics ──
  const filledScores = Object.values(hrScoring).filter((s): s is number => s !== null);
  const totalFilled = filledScores.length;
  const totalCriteria = HR_SCORING_CRITERIA.length;
  const averageScore = totalFilled > 0 ? filledScores.reduce((a, b) => a + b, 0) / totalFilled : 0;
  const totalScore = filledScores.reduce((a, b) => a + b, 0);
  const maxTotal = totalCriteria * 5;
  const progressPercent = Math.round((totalFilled / totalCriteria) * 100);

  // ── View mode loading ──
  if (mode === "view" && isLoadingScoring) {
    return (
      <div className="flex items-center justify-center" style={{ padding: "64px 0" }}>
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
      {/* Status Banner — Passed */}
      {interview1Status === "passed" && (
        <SectionCard title="Assessment Result" icon={CheckCircle2}>
          <div
            className="flex items-center gap-3"
            style={{
              borderRadius: "8px",
              backgroundColor: "rgba(0, 168, 120, 0.06)",
              border: "1px solid rgba(0, 168, 120, 0.2)",
              padding: "12px 16px",
            }}
          >
            <CheckCircle2
              style={{ width: "20px", height: "20px", color: "var(--hsd-ui-color-green-700, #186742)", flexShrink: 0 }}
            />
            <div>
              <p
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "var(--hsd-ui-color-green-700, #186742)",
                  margin: 0,
                }}
              >
                Assessment HR — Passed
              </p>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--hsd-ui-color-gray-500)",
                  margin: "2px 0 0",
                }}
              >
                Candidate cleared HR assessment. Proceed to the next stage.
              </p>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Status Banner — Failed */}
      {interview1Status === "failed" && (
        <SectionCard title="Assessment Result" icon={XCircle}>
          <div
            className="flex items-center gap-3"
            style={{
              borderRadius: "8px",
              backgroundColor: "rgba(250, 55, 70, 0.04)",
              border: "1px solid rgba(250, 55, 70, 0.2)",
              padding: "12px 16px",
            }}
          >
            <XCircle
              style={{ width: "20px", height: "20px", color: "rgba(250, 55, 70, 1)", flexShrink: 0 }}
            />
            <div>
              <p
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "rgba(250, 55, 70, 1)",
                  margin: 0,
                }}
              >
                Assessment HR — Failed
              </p>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--hsd-ui-color-gray-500)",
                  margin: "2px 0 0",
                }}
              >
                Candidate did not pass the HR assessment and cannot proceed further.
              </p>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Score Overview */}
      <SectionCard title="Score Overview" icon={BarChart3}>
        <div className="grid grid-cols-3 gap-x-8">
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
            <div className="flex items-end gap-1.5" style={{ marginTop: "4px" }}>
              <span
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--hsd-ui-color-gray-900)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {totalFilled}
              </span>
              <span
                style={{
                  fontSize: "0.875rem",
                  color: "var(--hsd-ui-color-gray-400)",
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
            <div className="flex items-end gap-1.5" style={{ marginTop: "4px" }}>
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
                  color: "var(--hsd-ui-color-gray-400)",
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
                margin: "4px 0 0",
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
            <div className="flex items-end gap-1.5" style={{ marginTop: "4px" }}>
              <span
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--hsd-ui-color-gray-900)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {totalScore}
              </span>
              <span
                style={{
                  fontSize: "0.875rem",
                  color: "var(--hsd-ui-color-gray-400)",
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
                margin: "4px 0 0",
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
          className="flex items-center justify-end gap-4"
          style={{
            marginBottom: "12px",
            paddingBottom: "12px",
            borderBottom: "1px solid rgba(120, 134, 127, 0.15)",
          }}
        >
          {SCORE_OPTIONS.map((opt) => (
            <div key={opt.value} className="flex items-center gap-1.5">
              <div
                style={{
                  height: "10px",
                  width: "10px",
                  borderRadius: "50%",
                  backgroundColor:
                    opt.value === 1
                      ? "rgba(250, 55, 70, 1)"
                      : opt.value === 2
                      ? "#f97316"
                      : opt.value === 3
                      ? "#eab308"
                      : opt.value === 4
                      ? "var(--hsd-ui-color-blue-800, #1565c0)"
                      : "var(--hsd-ui-color-green-700, #186742)",
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

        <div className="space-y-1">
          {HR_SCORING_CRITERIA.map((criteria, index) => {
            const currentScore = hrScoring[criteria.key];
            return (
              <div
                key={criteria.key}
                className="flex items-center justify-between"
                style={{
                  padding: "12px",
                  margin: "0 -12px",
                  borderRadius: "8px",
                  transition: "background-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (currentScore === null && !isCompleted && mode === "edit") {
                    e.currentTarget.style.backgroundColor = "var(--hsd-ui-color-gray-100)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
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
                    }}
                    className="truncate"
                  >
                    {criteria.label}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-4">
                  {SCORE_OPTIONS.map((option) => {
                    const isSelected = currentScore === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        disabled={isCompleted || mode === "view"}
                        onClick={() =>
                          setHrScoring((prev) => ({
                            ...prev,
                            [criteria.key]: option.value,
                          }))
                        }
                        title={option.label}
                        style={{
                          height: "32px",
                          width: "32px",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          border: "none",
                          cursor: isCompleted || mode === "view" ? "not-allowed" : "pointer",
                          opacity: isCompleted || mode === "view" ? 0.6 : 1,
                          transition: "all 0.2s",
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
                      transition: "opacity 0.2s",
                      opacity: currentScore ? 1 : 0,
                      color: "var(--hsd-ui-color-gray-500)",
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
        <div className="space-y-5">
          <div className="space-y-2">
            <label
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: "var(--hsd-ui-color-gray-700)",
              }}
            >
              Key Competencies Required by the Department / Company
            </label>
            {isCompleted || mode === "view" ? (
              <div
                style={{
                  borderRadius: "8px",
                  border: "1px solid rgba(120, 134, 127, 0.2)",
                  backgroundColor: "var(--hsd-ui-color-gray-100)",
                  padding: "12px",
                  fontSize: "0.875rem",
                  minHeight: "80px",
                  opacity: 0.6,
                }}
              >
                {hrKeyCompetencies ? (
                  <LexicalRenderer value={hrKeyCompetencies} />
                ) : (
                  <span style={{ color: "var(--hsd-ui-color-gray-400)", fontStyle: "italic" }}>No content</span>
                )}
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
            <label
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: "var(--hsd-ui-color-gray-700)",
              }}
            >
              Interviewer Notes
            </label>
            {isCompleted || mode === "view" ? (
              <div
                style={{
                  borderRadius: "8px",
                  border: "1px solid rgba(120, 134, 127, 0.2)",
                  backgroundColor: "var(--hsd-ui-color-gray-100)",
                  padding: "12px",
                  fontSize: "0.875rem",
                  minHeight: "80px",
                  opacity: 0.6,
                }}
              >
                {hrUserNotes ? (
                  <LexicalRenderer value={hrUserNotes} />
                ) : (
                  <span style={{ color: "var(--hsd-ui-color-gray-400)", fontStyle: "italic" }}>No content</span>
                )}
              </div>
            ) : (
              <LexicalEditor
                value={hrUserNotes}
                onChange={setHrUserNotes}
                placeholder="Enter your observations and notes..."
              />
            )}
          </div>
        </div>
      </SectionCard>

      {/* Interview Result Conclusion */}
      <SectionCard title="Interview Result Conclusion" icon={Award}>
        <div className="grid grid-cols-3 gap-3">
          {([
            {
              value: "proceed" as const,
              label: "Proceed",
              desc: "Advance to next stage",
              icon: CheckCircle2,
              activeColor: "var(--hsd-ui-color-green-700, #186742)",
              activeBg: "rgba(0, 168, 120, 0.06)",
              activeBorder: "rgba(0, 168, 120, 0.3)",
            },
            {
              value: "recommended" as const,
              label: "Recommended",
              desc: "Conditionally advance",
              icon: ClipboardCheck,
              activeColor: "var(--hsd-ui-color-blue-800, #1565c0)",
              activeBg: "rgba(21, 101, 192, 0.06)",
              activeBorder: "rgba(21, 101, 192, 0.3)",
            },
            {
              value: "rejected" as const,
              label: "Rejected",
              desc: "Do not proceed",
              icon: XCircle,
              activeColor: "rgba(250, 55, 70, 1)",
              activeBg: "rgba(250, 55, 70, 0.04)",
              activeBorder: "rgba(250, 55, 70, 0.3)",
            },
          ]).map((option) => {
            const Icon = option.icon;
            const isSelected = hrConclusion === option.value;
            return (
              <button
                key={option.value}
                type="button"
                disabled={isCompleted || mode === "view"}
                onClick={() => setHrConclusion(option.value)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                  borderRadius: "8px",
                  border: `2px solid ${isSelected ? option.activeBorder : "rgba(120, 134, 127, 0.2)"}`,
                  backgroundColor: isSelected ? option.activeBg : "#fff",
                  padding: "20px",
                  textAlign: "center",
                  transition: "all 0.2s",
                  cursor: isCompleted || mode === "view" ? "not-allowed" : "pointer",
                  opacity: isCompleted || mode === "view" ? 0.6 : 1,
                  position: "relative",
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
                      backgroundColor: option.activeColor,
                    }}
                  />
                )}
                <div
                  className="flex items-center justify-center"
                  style={{
                    height: "40px",
                    width: "40px",
                    borderRadius: "50%",
                    backgroundColor: isSelected ? "rgba(255,255,255,0.6)" : "var(--hsd-ui-color-gray-100)",
                    transition: "background-color 0.2s",
                  }}
                >
                  <Icon
                    style={{
                      width: "20px",
                      height: "20px",
                      color: isSelected ? option.activeColor : "var(--hsd-ui-color-gray-400)",
                    }}
                  />
                </div>
                <div>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: isSelected ? option.activeColor : "var(--hsd-ui-color-gray-900)",
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

      {/* Action Buttons — edit mode only, not completed */}
      {mode === "edit" && !isCompleted && (
        <div className="flex items-center justify-between" style={{ paddingTop: "8px" }}>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--hsd-ui-color-gray-500)",
              margin: 0,
            }}
          >
            {totalFilled < totalCriteria
              ? `${totalCriteria - totalFilled} scoring criteria remaining`
              : hrConclusion
              ? "Ready to submit"
              : "Select a conclusion to submit"}
          </p>
          <Button onClick={() => setShowHRPreview(true)} style={btnPrimary}>
            <Send style={{ width: "16px", height: "16px", marginRight: "6px" }} />
            Submit Assessment
          </Button>
        </div>
      )}

      {/* ── HR Preview Dialog ── */}
      <Dialog open={showHRPreview} onOpenChange={setShowHRPreview}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0">
          {/* Header */}
          <div
            style={{
              borderBottom: "1px solid rgba(120, 134, 127, 0.15)",
              padding: "24px 24px 16px",
            }}
          >
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center"
                  style={{
                    height: "44px",
                    width: "44px",
                    borderRadius: "8px",
                    backgroundColor: "var(--hsd-ui-color-gray-100)",
                  }}
                >
                  <ClipboardCheck
                    style={{ width: "20px", height: "20px", color: "var(--hsd-ui-color-gray-500)" }}
                  />
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
                    Review your HR Assessment before submitting
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div style={{ padding: "0 24px 24px" }} className="space-y-5">
            {/* Candidate Card */}
            {candidate && (
              <div
                className="flex items-center gap-4"
                style={{
                  padding: "16px",
                  borderRadius: "8px",
                  border: "1px solid rgba(120, 134, 127, 0.2)",
                  backgroundColor: "var(--hsd-ui-color-gray-100)",
                  marginTop: "20px",
                }}
              >
                <Avatar className="h-12 w-12">
                  <AvatarFallback
                    style={{
                      backgroundColor: "var(--hsd-ui-background-color-primary)",
                      color: "var(--hsd-ui-text-color-primary)",
                      fontWeight: 600,
                    }}
                  >
                    {getInitials(candidate.fullname)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p
                    style={{
                      fontWeight: 600,
                      color: "var(--hsd-ui-color-gray-900)",
                      margin: 0,
                    }}
                    className="truncate"
                  >
                    {candidate.fullname}
                  </p>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--hsd-ui-color-gray-500)",
                      margin: "2px 0 0",
                    }}
                    className="truncate"
                  >
                    {candidate.jobTitle?.name}
                  </p>
                </div>
                {hrConclusion && (
                  <TuvBadge
                    text={
                      hrConclusion === "proceed"
                        ? "Proceed"
                        : hrConclusion === "recommended"
                        ? "Recommended"
                        : "Rejected"
                    }
                    variant={
                      hrConclusion === "proceed"
                        ? "success"
                        : hrConclusion === "recommended"
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
              const previewFilledScores = Object.values(hrScoring).filter((s): s is number => s !== null);
              const previewTotalFilled = previewFilledScores.length;
              const previewTotalCriteria = HR_SCORING_CRITERIA.length;
              const previewAverageScore =
                previewTotalFilled > 0 ? previewFilledScores.reduce((a, b) => a + b, 0) / previewTotalFilled : 0;
              const previewTotalScore = previewFilledScores.reduce((a, b) => a + b, 0);
              const previewMaxTotal = previewTotalCriteria * 5;

              return (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Criteria Filled", value: `${previewTotalFilled}/${previewTotalCriteria}` },
                    { label: "Avg. Score", value: previewAverageScore.toFixed(1) },
                    { label: "Total Points", value: `${previewTotalScore}/${previewMaxTotal}` },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        borderRadius: "8px",
                        border: "1px solid rgba(120, 134, 127, 0.2)",
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
                        {item.value}
                      </p>
                      <p
                        style={{
                          fontSize: "0.6875rem",
                          fontWeight: 500,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "var(--hsd-ui-color-gray-500)",
                          margin: "4px 0 0",
                        }}
                      >
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Scoring Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div
                  style={{
                    height: "4px",
                    width: "4px",
                    borderRadius: "50%",
                    backgroundColor: "var(--hsd-ui-background-color-primary)",
                  }}
                />
                <h4
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
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
                style={{
                  borderRadius: "8px",
                  border: "1px solid rgba(120, 134, 127, 0.2)",
                  overflow: "hidden",
                }}
              >
                {HR_SCORING_CRITERIA.map((criteria, index) => {
                  const score = hrScoring[criteria.key];
                  const scoreLabel = score ? SCORE_OPTIONS.find((opt) => opt.value === score)?.label : null;
                  return (
                    <div
                      key={criteria.key}
                      className="flex items-center justify-between"
                      style={{
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
                        <div className="flex items-center gap-2">
                          <div className="flex" style={{ gap: "2px" }}>
                            {[1, 2, 3, 4, 5].map((dot) => (
                              <div
                                key={dot}
                                style={{
                                  height: "6px",
                                  width: "6px",
                                  borderRadius: "50%",
                                  backgroundColor:
                                    score && dot <= score
                                      ? scoreDotColor(score)
                                      : "var(--hsd-ui-color-gray-200)",
                                }}
                              />
                            ))}
                          </div>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: 500,
                              ...scoreColorStyle(score ?? 0),
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
            {(hrKeyCompetencies || hrUserNotes) && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div
                    style={{
                      height: "4px",
                      width: "4px",
                      borderRadius: "50%",
                      backgroundColor: "var(--hsd-ui-background-color-primary)",
                    }}
                  />
                  <h4
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "var(--hsd-ui-color-gray-500)",
                      margin: 0,
                    }}
                  >
                    Additional Notes
                  </h4>
                </div>
                <div className="space-y-3">
                  {hrKeyCompetencies && (
                    <div
                      style={{
                        borderRadius: "8px",
                        border: "1px solid rgba(120, 134, 127, 0.2)",
                        padding: "16px",
                        backgroundColor: "var(--hsd-ui-color-gray-100)",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "0.625rem",
                          fontWeight: 500,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "var(--hsd-ui-color-gray-500)",
                          margin: "0 0 8px",
                        }}
                      >
                        Key Competencies
                      </p>
                      <div style={{ fontSize: "0.875rem", color: "var(--hsd-ui-color-gray-900)" }}>
                        <LexicalRenderer value={hrKeyCompetencies} />
                      </div>
                    </div>
                  )}
                  {hrUserNotes && (
                    <div
                      style={{
                        borderRadius: "8px",
                        border: "1px solid rgba(120, 134, 127, 0.2)",
                        padding: "16px",
                        backgroundColor: "var(--hsd-ui-color-gray-100)",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "0.625rem",
                          fontWeight: 500,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "var(--hsd-ui-color-gray-500)",
                          margin: "0 0 8px",
                        }}
                      >
                        Interviewer Notes
                      </p>
                      <div style={{ fontSize: "0.875rem", color: "var(--hsd-ui-color-gray-900)" }}>
                        <LexicalRenderer value={hrUserNotes} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Warning for incomplete */}
            {(() => {
              const incFilledScores = Object.values(hrScoring).filter((s): s is number => s !== null);
              const incTotalFilled = incFilledScores.length;
              const incTotalCriteria = HR_SCORING_CRITERIA.length;
              const isIncomplete = incTotalFilled < incTotalCriteria || !hrConclusion;

              if (isIncomplete) {
                return (
                  <div
                    className="flex items-start gap-3"
                    style={{
                      borderRadius: "8px",
                      border: "1px solid rgba(234, 179, 8, 0.3)",
                      backgroundColor: "rgba(234, 179, 8, 0.05)",
                      padding: "16px",
                    }}
                  >
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        height: "32px",
                        width: "32px",
                        borderRadius: "8px",
                        backgroundColor: "rgba(234, 179, 8, 0.1)",
                      }}
                    >
                      <AlertTriangle
                        style={{ width: "16px", height: "16px", color: "#b45309" }}
                      />
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: 500,
                          color: "#b45309",
                          margin: 0,
                        }}
                      >
                        Incomplete Assessment
                      </p>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "rgba(180, 83, 9, 0.8)",
                          margin: "2px 0 0",
                        }}
                      >
                        {incTotalFilled < incTotalCriteria && `${incTotalCriteria - incTotalFilled} scoring criteria not filled. `}
                        {!hrConclusion && "Interview conclusion not selected."}
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
            <div className="flex items-center justify-between">
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--hsd-ui-color-gray-500)",
                  margin: 0,
                }}
              >
                {hrConclusion === "rejected"
                  ? "This will reject the candidate and end the recruitment process"
                  : "Next: Assign assessors for Interview User"}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowHRPreview(false)} style={btnSecondary}>
                  Cancel
                </Button>
                {hrConclusion === "rejected" ? (
                  <Button
                    onClick={() => {
                      setShowHRPreview(false);
                      handleHRAssessmentSubmit();
                    }}
                    disabled={isSubmittingHR}
                    style={btnDanger}
                  >
                    {isSubmittingHR ? (
                      <>
                        <Loader2
                          className="animate-spin"
                          style={{ width: "16px", height: "16px", marginRight: "6px" }}
                        />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <XCircle style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                        Reject Candidate
                      </>
                    )}
                  </Button>
                ) : (
                  <Button onClick={handleOpenAssessorAssignment} style={btnPrimary}>
                    <Users style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                    Continue
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Assessor Assignment Dialog ── */}
      <Dialog open={showAssessorAssignment} onOpenChange={setShowAssessorAssignment}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-hidden p-0">
          {/* Header */}
          <div
            style={{
              borderBottom: "1px solid rgba(120, 134, 127, 0.15)",
              padding: "24px 24px 16px",
            }}
          >
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center"
                  style={{
                    height: "48px",
                    width: "48px",
                    borderRadius: "8px",
                    backgroundColor: "var(--hsd-ui-color-navy-50)",
                    border: "1px solid var(--hsd-ui-color-navy-100)",
                  }}
                >
                  <Users
                    style={{ width: "24px", height: "24px", color: "var(--hsd-ui-color-navy-500)" }}
                  />
                </div>
                <div>
                  <DialogTitle
                    style={{
                      fontSize: "1.125rem",
                      fontWeight: 600,
                      color: "var(--hsd-ui-color-gray-900)",
                    }}
                  >
                    Assign Assessors
                  </DialogTitle>
                  <DialogDescription
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--hsd-ui-color-gray-500)",
                    }}
                  >
                    Select employees for Interview User stage
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div style={{ padding: "0 24px 8px" }} className="space-y-4">
            {/* Selected Assessors */}
            {selectedAssessors.length > 0 && (
              <div className="space-y-2" style={{ marginTop: "16px" }}>
                <p
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "var(--hsd-ui-color-navy-500)",
                    margin: 0,
                  }}
                >
                  Selected ({selectedAssessors.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedAssessors.map((emp) => (
                    <div
                      key={emp.id}
                      className="flex items-center gap-2"
                      style={{
                        paddingLeft: "4px",
                        paddingRight: "8px",
                        paddingTop: "4px",
                        paddingBottom: "4px",
                        borderRadius: "9999px",
                        border: "1px solid var(--hsd-ui-color-navy-200)",
                        backgroundColor: "var(--hsd-ui-color-navy-50)",
                      }}
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarFallback
                          style={{
                            backgroundColor: "var(--hsd-ui-color-navy-500)",
                            color: "#fff",
                            fontSize: "10px",
                            fontWeight: 500,
                          }}
                        >
                          {getInitials(`${emp.firstName} ${emp.lastName}`)}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          color: "var(--hsd-ui-color-navy-700)",
                        }}
                      >
                        {emp.firstName} {emp.lastName}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAssessor(emp.id)}
                        style={{
                          marginLeft: "2px",
                          height: "16px",
                          width: "16px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "var(--hsd-ui-color-navy-100)",
                          color: "var(--hsd-ui-color-navy-500)",
                          border: "none",
                          cursor: "pointer",
                          transition: "background-color 0.15s, color 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(250, 55, 70, 1)";
                          e.currentTarget.style.color = "#fff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "var(--hsd-ui-color-navy-100)";
                          e.currentTarget.style.color = "var(--hsd-ui-color-navy-500)";
                        }}
                      >
                        <X style={{ width: "10px", height: "10px" }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search & Select */}
            <div className="space-y-2" style={selectedAssessors.length === 0 ? { marginTop: "16px" } : undefined}>
              <p
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--hsd-ui-color-navy-500)",
                  margin: 0,
                }}
              >
                Search Employees
              </p>
              <Popover open={assessorSearchOpen} onOpenChange={setAssessorSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={assessorSearchOpen}
                    className="w-full justify-between"
                    style={{
                      height: "44px",
                      padding: "0 12px",
                      backgroundColor: "#fff",
                      borderColor: "var(--hsd-ui-color-navy-200)",
                      borderRadius: "8px",
                    }}
                  >
                    <span
                      style={{
                        color: "var(--hsd-ui-color-gray-500)",
                        fontSize: "0.875rem",
                      }}
                    >
                      Click to search and select employees...
                    </span>
                    <ChevronRight
                      className={cn(
                        "transition-transform duration-200",
                        assessorSearchOpen && "rotate-90"
                      )}
                      style={{
                        width: "16px",
                        height: "16px",
                        color: "var(--hsd-ui-color-navy-500)",
                      }}
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
                          <div className="flex items-center justify-center gap-2" style={{ padding: "24px 0" }}>
                            <Loader2
                              className="animate-spin"
                              style={{ width: "16px", height: "16px", color: "var(--hsd-ui-color-gray-400)" }}
                            />
                            <span style={{ fontSize: "0.875rem", color: "var(--hsd-ui-color-gray-500)" }}>
                              Loading employees...
                            </span>
                          </div>
                        ) : (
                          <div style={{ padding: "24px 0", textAlign: "center", fontSize: "0.875rem", color: "var(--hsd-ui-color-gray-500)" }}>
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
                              const isSelected = selectedAssessors.some((s) => s.id === emp.id);
                              return (
                                <CommandItem
                                  key={emp.id}
                                  value={`${emp.firstName} ${emp.lastName} ${emp.email}`}
                                  onSelect={() => toggleAssessor(emp)}
                                  className="cursor-pointer"
                                >
                                  <div className="flex items-center gap-3 w-full" style={{ padding: "4px 0" }}>
                                    <div style={{ position: "relative" }}>
                                      <Avatar className="h-9 w-9">
                                        <AvatarFallback
                                          style={{
                                            fontSize: "0.75rem",
                                            fontWeight: 500,
                                            backgroundColor: isSelected
                                              ? "var(--hsd-ui-background-color-primary)"
                                              : "var(--hsd-ui-color-gray-100)",
                                            color: isSelected
                                              ? "var(--hsd-ui-text-color-primary)"
                                              : "var(--hsd-ui-color-gray-900)",
                                            transition: "all 0.15s",
                                          }}
                                        >
                                          {getInitials(`${emp.firstName} ${emp.lastName}`)}
                                        </AvatarFallback>
                                      </Avatar>
                                      {isSelected && (
                                        <div
                                          className="flex items-center justify-center"
                                          style={{
                                            position: "absolute",
                                            bottom: "-2px",
                                            right: "-2px",
                                            height: "16px",
                                            width: "16px",
                                            borderRadius: "50%",
                                            backgroundColor: "var(--hsd-ui-color-green-700, #186742)",
                                            border: "2px solid #fff",
                                          }}
                                        >
                                          <Check style={{ width: "10px", height: "10px", color: "#fff" }} />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p
                                        style={{
                                          fontSize: "0.875rem",
                                          fontWeight: 500,
                                          color: "var(--hsd-ui-color-gray-900)",
                                          margin: 0,
                                        }}
                                        className="truncate"
                                      >
                                        {emp.firstName} {emp.lastName}
                                      </p>
                                      <p
                                        style={{
                                          fontSize: "0.75rem",
                                          color: "var(--hsd-ui-color-gray-500)",
                                          margin: "2px 0 0",
                                        }}
                                        className="truncate"
                                      >
                                        {emp.jobTitle?.name || emp.email}
                                      </p>
                                    </div>
                                    {isSelected && (
                                      <TuvBadge text="Selected" variant="success" size="xs" border />
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
            </div>
          </div>

          {/* Info Banner */}
          <div
            className="flex items-start gap-3"
            style={{
              margin: "0 24px 16px",
              borderRadius: "8px",
              border: "1px solid var(--hsd-ui-color-blue-200, #90caf9)",
              backgroundColor: "var(--hsd-ui-color-blue-50, #e3f2fd)",
              padding: "16px",
            }}
          >
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                height: "32px",
                width: "32px",
                borderRadius: "8px",
                backgroundColor: "#fff",
                border: "1px solid var(--hsd-ui-color-blue-200, #90caf9)",
              }}
            >
              <User
                style={{ width: "16px", height: "16px", color: "var(--hsd-ui-color-blue-600, #1e88e5)" }}
              />
            </div>
            <div>
              <p
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--hsd-ui-color-blue-800, #1565c0)",
                  margin: 0,
                }}
              >
                Interview User Assignment
              </p>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--hsd-ui-color-blue-700, #1976d2)",
                  margin: "2px 0 0",
                }}
              >
                Selected employees will be assigned to conduct the Interview User stage for this candidate.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              borderTop: "1px solid rgba(120, 134, 127, 0.15)",
              backgroundColor: "var(--hsd-ui-color-gray-100)",
              padding: "16px 24px",
            }}
          >
            <div className="flex items-center justify-between">
              <p
                style={{
                  fontSize: "0.75rem",
                  fontWeight: selectedAssessors.length > 0 ? 600 : 400,
                  color: selectedAssessors.length > 0
                    ? "var(--hsd-ui-color-navy-500)"
                    : "var(--hsd-ui-color-gray-500)",
                  margin: 0,
                }}
              >
                {selectedAssessors.length === 0
                  ? "Select at least one assessor"
                  : `${selectedAssessors.length} assessor${selectedAssessors.length > 1 ? "s" : ""} selected`}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAssessorAssignment(false);
                    setShowHRPreview(true);
                  }}
                  style={btnSecondary}
                >
                  Back
                </Button>
                <Button
                  onClick={handleHRAssessmentSubmit}
                  disabled={isSubmittingHR || (hrConclusion !== "rejected" && selectedAssessors.length === 0)}
                  style={btnPrimary}
                >
                  {isSubmittingHR ? (
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
                      Submit Assessment
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
