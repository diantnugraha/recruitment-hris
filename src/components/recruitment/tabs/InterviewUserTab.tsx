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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

// Helper: score color class based on value
const scoreColor = (val: number) =>
  val >= 4.5
    ? "text-emerald-600"
    : val >= 3.5
    ? "text-blue-600"
    : val >= 2.5
    ? "text-amber-600"
    : val >= 1
    ? "text-red-500"
    : "text-muted-foreground";

// Helper: pill color for score buttons
const pillColor = (val: number, selected: boolean) => {
  if (!selected) return "bg-secondary/80 text-muted-foreground hover:bg-secondary";
  if (val <= 1) return "bg-red-500 text-white shadow-sm shadow-red-500/25";
  if (val <= 2) return "bg-orange-500 text-white shadow-sm shadow-orange-500/25";
  if (val <= 3) return "bg-amber-500 text-white shadow-sm shadow-amber-500/25";
  if (val <= 4) return "bg-blue-500 text-white shadow-sm shadow-blue-500/25";
  return "bg-emerald-500 text-white shadow-sm shadow-emerald-500/25";
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
  // ── Locked mode ──
  if (mode === "locked") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold text-foreground">Assessment User Locked</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
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
  // ── Form state ──
  const [userScoring, setUserScoring] = React.useState<Record<HRScoringKey, number | null>>(
    { ...DEFAULT_USER_SCORING }
  );
  const [userKeyCompetencies, setUserKeyCompetencies] = React.useState("");
  const [userUserNotes, setUserUserNotes] = React.useState("");
  const [userConclusion, setUserConclusion] = React.useState<HRConclusion>(null);
  const [isSubmittingUser, setIsSubmittingUser] = React.useState(false);
  const [showUserPreview, setShowUserPreview] = React.useState(false);

  // ── Assignee state ──
  const [assignedAssessors, setAssignedAssessors] = React.useState<AssessmentAssignee[]>([]);
  const [isLoadingAssignees, setIsLoadingAssignees] = React.useState(false);

  // ── Assignee management state (for canEditAssignees) ──
  const [availableEmployees, setAvailableEmployees] = React.useState<EmployeeWithRelations[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = React.useState(false);
  const [assessorSearchOpen, setAssessorSearchOpen] = React.useState(false);
  const [assessorSearchQuery, setAssessorSearchQuery] = React.useState("");
  const [isAssigning, setIsAssigning] = React.useState(false);
  const [isRemoving, setIsRemoving] = React.useState<number | null>(null);

  // ── View mode: fetch scoring data ──
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

  // ── Populate form from scoring data ──
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

  // ── Fetch scoring data for view mode or completed state ──
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

  // ── Fetch assigned assessors on mount ──
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

  // ── Edit mode: stale draft cleanup ──
  React.useEffect(() => {
    if (modeProp !== "edit") return;
    if (isCompleted) {
      localStorage.removeItem(USER_FORM_STORAGE_KEY(candidateId));
    }
  }, [modeProp, isCompleted, candidateId]);

  // ── Edit mode: restore draft from localStorage ──
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

  // ── Edit mode: save draft to localStorage when form changes ──
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

  // ── Clear localStorage after successful submit ──
  const clearUserFormStorage = React.useCallback(() => {
    localStorage.removeItem(USER_FORM_STORAGE_KEY(candidateId));
  }, [candidateId]);

  // ── Fetch employees for assignee management ──
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

  // ── Load employees when canEditAssignees ──
  React.useEffect(() => {
    if (canEditAssignees && !isCompleted) {
      fetchEmployeesForAssignment();
    }
  }, [canEditAssignees, isCompleted, fetchEmployeesForAssignment]);

  // ── Assign assessor ──
  const handleAssignAssessor = React.useCallback(async (employee: EmployeeWithRelations) => {
    // Check if already assigned
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

  // ── Remove assessor ──
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

  // ── Submit handler ──
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

  // ── Score statistics ──
  const filledScores = Object.values(userScoring).filter((s): s is number => s !== null);
  const totalFilled = filledScores.length;
  const totalCriteria = HR_SCORING_CRITERIA.length;
  const averageScore = totalFilled > 0 ? filledScores.reduce((a, b) => a + b, 0) / totalFilled : 0;
  const totalScore = filledScores.reduce((a, b) => a + b, 0);
  const maxTotal = totalCriteria * 5;
  const progressPercent = Math.round((totalFilled / totalCriteria) * 100);

  // ── View mode loading ──
  if (mode === "view" && isLoadingScoring) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading assessment data...</span>
      </div>
    );
  }

  return (
    <>
      {/* Post-submission notice */}
      {isCompleted && modeProp === "edit" && (
        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-500/5 via-blue-500/3 to-transparent overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
          <div className="flex items-center gap-4 p-5 pl-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500/10 ring-4 ring-blue-500/5">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-700 dark:text-blue-400 text-sm">Assessment Already Submitted</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                This assessment has already been submitted. Viewing in read-only mode.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status Banner -- Passed */}
      {interview2Status === "passed" && (
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 via-emerald-500/3 to-transparent overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <div className="flex items-center justify-between p-5 pl-6">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10 ring-4 ring-emerald-500/5">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm">Assessment User -- Passed</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Candidate cleared User assessment. Proceed to MCU for the next stage.
                </p>
              </div>
            </div>
            {onTabChange && (
              <Button onClick={() => onTabChange("mcu")}>
                Proceed to MCU
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Status Banner -- Failed */}
      {interview2Status === "failed" && (
        <div className="rounded-2xl border border-destructive/30 bg-gradient-to-r from-destructive/5 via-destructive/3 to-transparent overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-destructive" />
          <div className="flex items-center gap-4 p-5 pl-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10 ring-4 ring-destructive/5">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h3 className="font-semibold text-destructive text-sm">Assessment User -- Failed</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Candidate did not pass the User assessment and cannot proceed further.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Assigned Assessors Card */}
      {assignedAssessors.length > 0 && (
        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-500/5 via-blue-500/3 to-transparent overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-blue-400" />
          <div className="p-5 pl-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500/10 ring-4 ring-blue-500/5 shrink-0">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-blue-700 text-sm mb-3">Assigned Assessors</h3>
                <div className="flex flex-wrap gap-2">
                  {assignedAssessors.map((assessor) => (
                    <div
                      key={assessor.employeeId}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-blue-100 shadow-sm"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-white text-xs font-medium">
                        {assessor.employeeName ? assessor.employeeName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {assessor.employeeName || "No Data"}
                        </p>
                        {assessor.employeeEmail && (
                          <p className="text-xs text-gray-500 truncate">
                            {assessor.employeeEmail}
                          </p>
                        )}
                      </div>
                      {/* Remove button only for canEditAssignees and not completed */}
                      {canEditAssignees && !isCompleted && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAssessor(assessor.employeeId)}
                          disabled={isRemoving === assessor.employeeId}
                          className="ml-1 h-5 w-5 rounded-full flex items-center justify-center bg-secondary/80 text-muted-foreground hover:bg-destructive hover:text-white transition-colors"
                        >
                          {isRemoving === assessor.employeeId ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assignee Management -- Add Assessor (only for canEditAssignees and not completed) */}
      {canEditAssignees && !isCompleted && (
        <div className="rounded-2xl border bg-card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/10 text-blue-600">
                <User className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Manage Assessors</h2>
                <p className="text-xs text-muted-foreground">Add or remove assessors for Interview User stage</p>
              </div>
            </div>
          </div>
          <div className="px-6 py-5">
            <Popover open={assessorSearchOpen} onOpenChange={setAssessorSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={assessorSearchOpen}
                  className="w-full justify-between h-11 px-3 bg-secondary/30 hover:bg-secondary/50 border-secondary"
                  disabled={isAssigning}
                >
                  <span className="text-muted-foreground text-sm">
                    {isAssigning ? "Assigning..." : "Click to search and add assessors..."}
                  </span>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform duration-200",
                      assessorSearchOpen && "rotate-90"
                    )}
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
                        <div className="flex items-center justify-center py-6 gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Loading employees...</span>
                        </div>
                      ) : (
                        <div className="py-6 text-center text-sm text-muted-foreground">No employees found</div>
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
                                <div className="flex items-center gap-3 w-full py-1">
                                  <div className="relative">
                                    <Avatar className="h-9 w-9 ring-2 ring-transparent">
                                      <AvatarFallback
                                        className={cn(
                                          "text-xs font-medium transition-colors",
                                          isAssigned ? "bg-blue-600 text-white" : "bg-secondary text-foreground"
                                        )}
                                      >
                                        {getInitials(`${emp.firstName} ${emp.lastName}`)}
                                      </AvatarFallback>
                                    </Avatar>
                                    {isAssigned && (
                                      <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center ring-2 ring-background">
                                        <Check className="h-2.5 w-2.5 text-white" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate text-foreground">
                                      {emp.firstName} {emp.lastName}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {emp.jobTitle?.name || emp.email}
                                    </p>
                                  </div>
                                  {isAssigned && (
                                    <Badge className="bg-blue-500/20 text-blue-600 border-0 text-[10px]">
                                      Assigned
                                    </Badge>
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
      )}

      {/* Score Overview Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border bg-card relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />
          <div className="relative p-5">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Progress</p>
            <div className="flex items-end gap-2 mt-2">
              <span className="text-3xl font-bold tabular-nums">{totalFilled}</span>
              <span className="text-sm text-muted-foreground mb-1">/ {totalCriteria}</span>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border bg-card relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
          <div className="relative p-5">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Average</p>
            <div className="flex items-end gap-2 mt-2">
              <span className={cn("text-3xl font-bold tabular-nums", scoreColor(averageScore))}>
                {totalFilled > 0 ? averageScore.toFixed(1) : "No Data"}
              </span>
              <span className="text-sm text-muted-foreground mb-1">/ 5.0</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
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
        </div>
        <div className="rounded-2xl border bg-card relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
          <div className="relative p-5">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Score</p>
            <div className="flex items-end gap-2 mt-2">
              <span className="text-3xl font-bold tabular-nums">{totalScore}</span>
              <span className="text-sm text-muted-foreground mb-1">/ {maxTotal}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              {totalFilled > 0 ? `${Math.round((totalScore / maxTotal) * 100)}% of maximum` : "Start scoring below"}
            </p>
          </div>
        </div>
      </div>

      {/* Section 1 -- Scoring */}
      <div className="rounded-2xl border bg-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-accent text-xs font-bold">1</div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Interview Scoring</h2>
              <p className="text-xs text-muted-foreground">Rate each criterion from 1 (Very Poor) to 5 (Excellent)</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-5">
          {/* Score legend */}
          <div className="flex items-center justify-end gap-4 mb-3 pb-3 border-b">
            {SCORE_OPTIONS.map((opt) => (
              <div key={opt.value} className="flex items-center gap-1.5">
                <div
                  className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    opt.value === 1 && "bg-red-500",
                    opt.value === 2 && "bg-orange-500",
                    opt.value === 3 && "bg-amber-500",
                    opt.value === 4 && "bg-blue-500",
                    opt.value === 5 && "bg-emerald-500"
                  )}
                />
                <span className="text-[11px] text-muted-foreground">{opt.label}</span>
              </div>
            ))}
          </div>

          <div className="space-y-1">
            {HR_SCORING_CRITERIA.map((criteria, index) => {
              const currentScore = userScoring[criteria.key];
              return (
                <div
                  key={criteria.key}
                  className={cn(
                    "group flex items-center justify-between py-3 px-3 -mx-3 rounded-lg transition-colors",
                    currentScore === null && !isCompleted && mode === "edit" && "hover:bg-secondary/50"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-muted-foreground font-mono w-5 text-right shrink-0">{index + 1}.</span>
                    <span className="text-sm font-medium truncate">{criteria.label}</span>
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
                            setUserScoring((prev) => ({
                              ...prev,
                              [criteria.key]: option.value,
                            }))
                          }
                          title={option.label}
                          className={cn(
                            "relative h-8 w-8 rounded-md text-xs font-semibold transition-all duration-200",
                            pillColor(option.value, isSelected),
                            !isSelected && !isCompleted && mode === "edit" && "hover:scale-110 hover:bg-secondary",
                            (isCompleted || mode === "view") && "cursor-not-allowed opacity-60"
                          )}
                        >
                          {option.value}
                        </button>
                      );
                    })}
                    {/* Selected label */}
                    <span
                      className={cn(
                        "ml-2 text-[11px] font-medium w-16 text-right transition-opacity",
                        currentScore ? "opacity-100" : "opacity-0"
                      )}
                    >
                      {currentScore ? SCORE_OPTIONS.find((o) => o.value === currentScore)?.label : ""}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 2 -- Additional Information */}
      <div className="rounded-2xl border bg-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-accent text-xs font-bold">2</div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Additional Information</h2>
              <p className="text-xs text-muted-foreground">Provide qualitative notes and competency observations</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div className="space-y-2">
            <Label className="text-sm">Key Competencies Required by the Department / Company</Label>
            {isCompleted || mode === "view" ? (
              <div className="rounded-lg border border-input bg-muted/30 p-3 text-sm min-h-20 opacity-60">
                {userKeyCompetencies ? (
                  <LexicalRenderer value={userKeyCompetencies} />
                ) : (
                  <span className="text-muted-foreground">No content</span>
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

          <div className="space-y-2">
            <Label className="text-sm">Interviewer Notes</Label>
            {isCompleted || mode === "view" ? (
              <div className="rounded-lg border border-input bg-muted/30 p-3 text-sm min-h-20 opacity-60">
                {userUserNotes ? (
                  <LexicalRenderer value={userUserNotes} />
                ) : (
                  <span className="text-muted-foreground">No content</span>
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
      </div>

      {/* Section 3 -- Conclusion */}
      <div className="rounded-2xl border bg-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-accent text-xs font-bold">3</div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Interview Result Conclusion</h2>
              <p className="text-xs text-muted-foreground">Select the final recommendation for this candidate</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-3 gap-3">
            {([
              {
                value: "proceed" as const,
                label: "Proceed",
                desc: "Advance to next stage",
                icon: CheckCircle2,
                colors: {
                  active: "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20",
                  icon: "text-emerald-600",
                  dot: "bg-emerald-500",
                },
              },
              {
                value: "recommended" as const,
                label: "Recommended",
                desc: "Conditionally advance",
                icon: ClipboardCheck,
                colors: {
                  active: "border-blue-500 bg-blue-50 ring-2 ring-blue-500/20",
                  icon: "text-blue-600",
                  dot: "bg-blue-500",
                },
              },
              {
                value: "rejected" as const,
                label: "Rejected",
                desc: "Do not proceed",
                icon: XCircle,
                colors: {
                  active: "border-red-500 bg-red-50 ring-2 ring-red-500/20",
                  icon: "text-red-600",
                  dot: "bg-red-500",
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
                  className={cn(
                    "relative flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition-all duration-200 text-center",
                    isSelected
                      ? option.colors.active
                      : "border-border bg-background hover:border-muted-foreground/30 hover:bg-secondary/30",
                    (isCompleted || mode === "view") && "opacity-60 cursor-not-allowed"
                  )}
                >
                  {isSelected && (
                    <div className={cn("absolute top-2.5 right-2.5 h-2.5 w-2.5 rounded-full", option.colors.dot)} />
                  )}
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                      isSelected ? "bg-white/60" : "bg-secondary"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", isSelected ? option.colors.icon : "text-muted-foreground")} />
                  </div>
                  <div>
                    <p className={cn("text-sm font-semibold", isSelected ? option.colors.icon : "text-foreground")}>
                      {option.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{option.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Buttons -- edit mode only, not completed */}
      {mode === "edit" && !isCompleted && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            {totalFilled < totalCriteria
              ? `${totalCriteria - totalFilled} scoring criteria remaining`
              : userConclusion
              ? "Ready to submit"
              : "Select a conclusion to submit"}
          </p>
          <Button onClick={() => setShowUserPreview(true)}>
            <Send />
            Submit Assessment
          </Button>
        </div>
      )}

      {/* ── User Preview Dialog ── */}
      <Dialog open={showUserPreview} onOpenChange={setShowUserPreview}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0">
          {/* Header with gradient accent */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 via-blue-500/4 to-transparent" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <DialogHeader className="relative px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 ring-1 ring-blue-500/20">
                  <ClipboardCheck className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold">Confirm Submission</DialogTitle>
                  <DialogDescription className="text-sm">
                    Review your User Assessment before submitting
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="px-6 pb-6 space-y-5">
            {/* Candidate Card */}
            {candidate && (
              <div className="flex items-center gap-4 p-4 rounded-xl border bg-gradient-to-r from-secondary/50 to-secondary/20">
                <Avatar className="h-12 w-12 ring-2 ring-background shadow-sm">
                  <AvatarFallback className="bg-blue-500 text-white font-semibold">
                    {getInitials(candidate.fullname)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{candidate.fullname}</p>
                  <p className="text-sm text-muted-foreground truncate">{candidate.jobTitle?.name}</p>
                </div>
                {userConclusion && (
                  <div
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide",
                      userConclusion === "proceed" && "bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/30",
                      userConclusion === "recommended" && "bg-blue-500/15 text-blue-600 ring-1 ring-blue-500/30",
                      userConclusion === "rejected" && "bg-red-500/15 text-red-600 ring-1 ring-red-500/30"
                    )}
                  >
                    {userConclusion === "proceed" ? "Proceed" : userConclusion === "recommended" ? "Recommended" : "Rejected"}
                  </div>
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
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border bg-gradient-to-br from-background to-secondary/30 p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">
                      {previewTotalFilled}/{previewTotalCriteria}
                    </p>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1">Criteria Filled</p>
                  </div>
                  <div className="rounded-xl border bg-gradient-to-br from-background to-secondary/30 p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{previewAverageScore.toFixed(1)}</p>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1">Avg. Score</p>
                  </div>
                  <div className="rounded-xl border bg-gradient-to-br from-background to-secondary/30 p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">
                      {previewTotalScore}/{previewMaxTotal}
                    </p>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1">Total Points</p>
                  </div>
                </div>
              );
            })()}

            {/* Scoring Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-blue-500" />
                <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Scoring Breakdown</h4>
              </div>
              <div className="rounded-xl border overflow-hidden">
                {HR_SCORING_CRITERIA.map((criteria, index) => {
                  const score = userScoring[criteria.key];
                  const scoreLabel = score ? SCORE_OPTIONS.find((opt) => opt.value === score)?.label : null;
                  const detailScoreColor =
                    score && score >= 4
                      ? "text-emerald-600"
                      : score && score >= 3
                      ? "text-blue-600"
                      : score && score >= 2
                      ? "text-amber-600"
                      : score
                      ? "text-red-500"
                      : "text-muted-foreground";
                  return (
                    <div
                      key={criteria.key}
                      className={cn(
                        "flex items-center justify-between px-4 py-2.5 transition-colors",
                        index % 2 === 0 ? "bg-secondary/20" : "bg-transparent"
                      )}
                    >
                      <span className="text-sm text-foreground">{criteria.label}</span>
                      {scoreLabel ? (
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((dot) => (
                              <div
                                key={dot}
                                className={cn(
                                  "h-1.5 w-1.5 rounded-full transition-colors",
                                  score && dot <= score
                                    ? score >= 4
                                      ? "bg-emerald-500"
                                      : score >= 3
                                      ? "bg-blue-500"
                                      : score >= 2
                                      ? "bg-amber-500"
                                      : "bg-red-500"
                                    : "bg-secondary"
                                )}
                              />
                            ))}
                          </div>
                          <span className={cn("text-xs font-medium", detailScoreColor)}>{scoreLabel}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/60 italic">Not rated</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Additional Information */}
            {(userKeyCompetencies || userUserNotes) && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-blue-500" />
                  <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Additional Notes</h4>
                </div>
                <div className="space-y-3">
                  {userKeyCompetencies && (
                    <div className="rounded-xl border p-4 bg-secondary/10">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2">
                        Key Competencies
                      </p>
                      <div className="text-sm text-foreground">
                        <LexicalRenderer value={userKeyCompetencies} />
                      </div>
                    </div>
                  )}
                  {userUserNotes && (
                    <div className="rounded-xl border p-4 bg-secondary/10">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2">
                        Interviewer Notes
                      </p>
                      <div className="text-sm text-foreground">
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
                  <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-amber-700">Incomplete Assessment</p>
                      <p className="text-xs text-amber-600/80 mt-0.5">
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
          <div className="border-t bg-secondary/30 px-6 py-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                This action cannot be undone
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowUserPreview(false)} className="px-4">
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowUserPreview(false);
                    handleUserAssessmentSubmit();
                  }}
                  disabled={isSubmittingUser}
                  className="px-5 gap-2"
                >
                  {isSubmittingUser ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Confirm & Submit
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
