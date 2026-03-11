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
  AlertTriangle,
  CheckCircle2,
  XCircle,
  X,
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
  GraduationCap,
  Award,
  ClipboardList,
  ChevronRight,
  Upload,
  Download,
  Trash2,
  File,
  Eye,
  Plus,
  Pencil,
  Package,
  UserCheck,
  Monitor,
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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  type CandidateBiodata,
  type AssessmentScoringData,
  type Onboarding,
  type Facility,
  type OnboardingProgram,
} from "@/services/candidate.service";
import { formatShortDate, getInitials, cn } from "@/lib/utils";
import { showToast } from "@/lib/utils/toast-messages";
import { hasBiodataSubmitted } from "@/lib/utils/recruitmentHelpers";
import { LexicalEditor } from "@/components/shared/lexical-editor";
import { LexicalRenderer } from "@/components/shared/lexical-renderer";
import { employeeService } from "@/services/employee.service";
import type { EmployeeWithRelations } from "@/types";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

// Assessment stage configuration
const ASSESSMENT_STAGES = [
  {
    key: "interview1" as const,
    label: "Interview HR",
    description: "Initial interview with HR/Hiring Manager",
    icon: ClipboardCheck,
  },
  {
    key: "interview2" as const,
    label: "Interview User",
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
  { key: "biodata", label: "Biodata", icon: FileText },
  { key: "interview1", label: "Interview HR", icon: ClipboardCheck },
  { key: "interview2", label: "Interview User", icon: Users },
  { key: "mcu", label: "MCU", icon: Stethoscope },
  { key: "completed", label: "Completed", icon: PartyPopper },
];

type AssessmentStageKey = typeof ASSESSMENT_STAGES[number]["key"];

// HR Assessment Scoring — shared constants
import { HR_SCORING_CRITERIA, SCORE_OPTIONS } from "@/lib/constants/assessmentScoring";
import type { HRScoringKey, HRConclusion } from "@/lib/constants/assessmentScoring";

// LocalStorage key for HR assessment form data
const HR_FORM_STORAGE_KEY = (id: string) => `hr-assessment-form-${id}`;
const USER_FORM_STORAGE_KEY = (id: string) => `user-assessment-form-${id}`;

// Format snake_case to Title Case (e.g., head_office_jakarta -> Head Office Jakarta)
const formatJobPlacement = (value: string): string => {
  if (!value) return "";
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

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
  const [biodata, setBiodata] = React.useState<CandidateBiodata | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isBiodataLoading, setIsBiodataLoading] = React.useState(false);
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

  // Assessor Assignment State (after HR Assessment confirm)
  const [showAssessorAssignment, setShowAssessorAssignment] = React.useState(false);
  const [selectedAssessors, setSelectedAssessors] = React.useState<EmployeeWithRelations[]>([]);
  const [availableEmployees, setAvailableEmployees] = React.useState<EmployeeWithRelations[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = React.useState(false);
  const [assessorSearchOpen, setAssessorSearchOpen] = React.useState(false);
  const [assessorSearchQuery, setAssessorSearchQuery] = React.useState("");

  // Assigned Assessors Display State (for showing who is assigned)
  const [assignedAssessors, setAssignedAssessors] = React.useState<{ employeeId: number; employeeName: string | null; employeeEmail: string | null }[]>([]);
  const [isLoadingAssignees, setIsLoadingAssignees] = React.useState(false);

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

  // MCU Document State
  const [mcuDocument, setMcuDocument] = React.useState<{
    url: string | null;
    name: string | null;
    presignedUrl: string | null;
  } | null>(null);
  const [isUploadingMcu, setIsUploadingMcu] = React.useState(false);
  const [isDeletingMcuDoc, setIsDeletingMcuDoc] = React.useState(false);
  const mcuFileInputRef = React.useRef<HTMLInputElement>(null);

  // Start Interview dialog state
  const [isStartingInterview, setIsStartingInterview] = React.useState(false);
  const [showStartInterviewDialog, setShowStartInterviewDialog] = React.useState(false);
  const [interviewDate, setInterviewDate] = React.useState("");
  const [interviewTime, setInterviewTime] = React.useState("");
  const [interviewType, setInterviewType] = React.useState<"online" | "onsite" | "">("");

  // Onboarding State
  const [onboarding, setOnboarding] = React.useState<Onboarding | null>(null);
  const [isConverting, setIsConverting] = React.useState(false);
  const [jobPlacement, setJobPlacement] = React.useState("");
  const [joinDate, setJoinDate] = React.useState("");

  // Facility dialog state
  const [facilityDialog, setFacilityDialog] = React.useState<{
    open: boolean;
    mode: "add" | "edit";
    facility?: Facility;
  }>({ open: false, mode: "add" });
  const [facilityForm, setFacilityForm] = React.useState({
    inventoryNo: "",
    item: "" as string,
    qty: 1,
    unit: "Unit",
    condition: "New",
    status: "Assigned",
  });

  // Program dialog state
  const [programDialog, setProgramDialog] = React.useState<{
    open: boolean;
    mode: "add" | "edit";
    program?: OnboardingProgram;
  }>({ open: false, mode: "add" });
  const [programForm, setProgramForm] = React.useState({
    program: "",
    date: "",
    location: "",
    pic: "",
    status: "Scheduled",
  });

  // Delete confirmation state for onboarding
  const [onboardingDeleteConfirm, setOnboardingDeleteConfirm] = React.useState<{
    open: boolean;
    type: "facility" | "program";
    id: number;
    name: string;
  } | null>(null);

  // Convert to employee dialog
  const [showConvertDialog, setShowConvertDialog] = React.useState(false);

  // Onboarding constants
  const FACILITY_ITEMS = ["Laptop CTO", "Laptop NCTO", "Starter Kit"] as const;
  const FACILITY_CONDITIONS = ["New", "Used"] as const;
  const FACILITY_STATUSES = ["Assigned"] as const;
  const PROGRAM_STATUSES = ["Scheduled", "In Progress", "Completed", "Cancelled"] as const;

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

  // Populate form state from saved scoring data
  const populateScoringForm = React.useCallback((
    scoring: AssessmentScoringData,
    stage: "interview1" | "interview2"
  ) => {
    const formScoring: Record<HRScoringKey, number | null> = {
      relevanceOfExperience: scoring.relevance_of_experience,
      trainingUndertaken: scoring.training_undertaken,
      technicalSkills: scoring.technical_skills,
      nonTechnicalSkills: scoring.non_technical_skills,
      communicationSkills: scoring.communication_skills,
      emotionalMaturity: scoring.emotional_maturity,
      understandingOfPosition: scoring.understanding_of_position,
      teamworkAbility: scoring.teamwork_ability,
    };

    const conclusion = scoring.conclusion?.toLowerCase() as HRConclusion;

    if (stage === "interview1") {
      setHrScoring(formScoring);
      setHrConclusion(conclusion);
      if (scoring.key_competencies) setHrKeyCompetencies(scoring.key_competencies);
      if (scoring.interviewer_notes) setHrUserNotes(scoring.interviewer_notes);
    } else {
      setUserScoring(formScoring);
      setUserConclusion(conclusion);
      if (scoring.key_competencies) setUserKeyCompetencies(scoring.key_competencies);
      if (scoring.interviewer_notes) setUserUserNotes(scoring.interviewer_notes);
    }
  }, []);

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

        // Pre-fill notes from existing assessment
        if (candidateRes.data.assessment) {
          setAssessmentNotes({
            interview1: candidateRes.data.assessment.interview1Desc || "",
            interview2: candidateRes.data.assessment.interview2Desc || "",
            mcu: candidateRes.data.assessment.mcuDesc || "",
          });
        }

        // Pre-fill job placement from employee request (will be overridden by onboarding data if exists)
        if (candidateRes.data.employeeRequest?.jobPlacement) {
          setJobPlacement(candidateRes.data.employeeRequest.jobPlacement);
        }
      } else {
        setError(candidateRes.message || "Failed to load candidate");
        return;
      }

      if (progressRes.success && progressRes.data) {
        setProgress(progressRes.data);

        // Fetch scoring data if any interview stage is completed
        const { interview1, interview2 } = progressRes.data;
        if (!interview1.pending || !interview2.pending) {
          const scoringRes = await candidateService.getAssessmentScoring(id);
          if (scoringRes.success && scoringRes.data) {
            const scorings = Array.isArray(scoringRes.data) ? scoringRes.data : [scoringRes.data];
            for (const scoring of scorings) {
              if (scoring.stage === "INTERVIEW1") {
                populateScoringForm(scoring, "interview1");
              } else if (scoring.stage === "INTERVIEW2") {
                populateScoringForm(scoring, "interview2");
              }
            }
          }
        }

        // Fetch MCU document if MCU stage is unlocked
        if (!progressRes.data.mcu.locked) {
          const mcuDocRes = await candidateService.getMcuDocument(id);
          if (mcuDocRes.success && mcuDocRes.data) {
            setMcuDocument(mcuDocRes.data);
          }
        }

        // Fetch assigned assessors if Interview User is unlocked
        if (!progressRes.data.interview2.locked) {
          const assigneesRes = await candidateService.getAssessmentAssignees(id);
          if (assigneesRes.success && assigneesRes.data) {
            setAssignedAssessors(assigneesRes.data);
          }
        }

        // Fetch onboarding data if all assessments passed
        if (progressRes.data.allPassed) {
          const onboardingRes = await candidateService.getOnboarding(id);
          if (onboardingRes.success && onboardingRes.data) {
            setOnboarding(onboardingRes.data);
            // Use onboarding jobPlacement, fallback to employee request's jobPlacement
            setJobPlacement(onboardingRes.data.jobPlacement || candidateRes.data.employeeRequest?.jobPlacement || "");
          } else {
            // No onboarding yet, pre-fill from employee request
            setJobPlacement(candidateRes.data.employeeRequest?.jobPlacement || "");
          }
        }
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
  }, [id, populateScoringForm]);

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
          response = await candidateService.updateInterview1(id, { status: action, description: notes });
          break;
        case "interview2":
          response = await candidateService.updateInterview2(id, { status: action, description: notes });
          break;
        case "mcu":
          response = await candidateService.updateMcu(id, action, notes);
          break;
      }

      if (response?.success && response.data) {
        setProgress(response.data);
        showToast.success(`${stage === "mcu" ? "MCU" : stage === "interview1" ? "Interview HR" : "Interview User"} marked as ${action.toLowerCase()}`);

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

  // MCU Document Upload Handler
  const handleMcuFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      showToast.error("Invalid file type. Please upload PDF, JPEG, or PNG.");
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast.error("File too large. Maximum size is 10MB.");
      return;
    }

    setIsUploadingMcu(true);
    try {
      const response = await candidateService.uploadMcuDocument(id, file);
      if (response.success && response.data) {
        // Refresh MCU document data
        const docRes = await candidateService.getMcuDocument(id);
        if (docRes.success && docRes.data) {
          setMcuDocument(docRes.data);
        }
        showToast.success("MCU document uploaded successfully");
      } else {
        showToast.error(response.message || "Failed to upload document");
      }
    } catch (err) {
      showToast.error("Failed to upload MCU document");
    } finally {
      setIsUploadingMcu(false);
      // Reset file input
      if (mcuFileInputRef.current) {
        mcuFileInputRef.current.value = "";
      }
    }
  };

  // MCU Document Delete Handler
  const handleMcuDocumentDelete = async () => {
    setIsDeletingMcuDoc(true);
    try {
      const response = await candidateService.deleteMcuDocument(id);
      if (response.success) {
        setMcuDocument(null);
        showToast.success("MCU document deleted successfully");
      } else {
        showToast.error(response.message || "Failed to delete document");
      }
    } catch (err) {
      showToast.error("Failed to delete MCU document");
    } finally {
      setIsDeletingMcuDoc(false);
    }
  };

  // Fetch ALL employees for assessor assignment (paginate through all pages)
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
          // Check if there are more pages
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

  // Fetch assigned assessors for Interview User stage
  const fetchAssignedAssessors = React.useCallback(async () => {
    if (!params.id) return;
    setIsLoadingAssignees(true);
    try {
      const response = await candidateService.getAssessmentAssignees(params.id as string);
      if (response.success && response.data) {
        setAssignedAssessors(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch assigned assessors:", err);
    } finally {
      setIsLoadingAssignees(false);
    }
  }, [params.id]);

  // Open assessor assignment dialog (after HR preview confirmation)
  const handleOpenAssessorAssignment = React.useCallback(() => {
    setShowHRPreview(false);
    setShowAssessorAssignment(true);
    setSelectedAssessors([]);
    setAssessorSearchQuery("");
    fetchEmployeesForAssignment();
  }, [fetchEmployeesForAssignment]);

  // Toggle assessor selection
  const toggleAssessor = React.useCallback((employee: EmployeeWithRelations) => {
    setSelectedAssessors(prev => {
      const exists = prev.some(e => e.id === employee.id);
      if (exists) {
        return prev.filter(e => e.id !== employee.id);
      }
      return [...prev, employee];
    });
  }, []);

  // Remove assessor from selection
  const removeAssessor = React.useCallback((employeeId: string) => {
    setSelectedAssessors(prev => prev.filter(e => e.id !== employeeId));
  }, []);

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

    // Check if assessors are selected (for non-rejected conclusions)
    if (hrConclusion !== "rejected" && selectedAssessors.length === 0) {
      showToast.error("Please select at least one assessor for Interview User");
      return;
    }

    setIsSubmittingHR(true);

    try {
      // Map conclusion to action
      const action: "PASSED" | "FAILED" = hrConclusion === "rejected" ? "FAILED" : "PASSED";

      const response = await candidateService.updateInterview1(id, {
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
        assessor_ids: selectedAssessors.map(e => parseInt(e.id, 10)),
      });

      if (response?.success && response.data) {
        setProgress(response.data);
        showToast.success("HR Assessment submitted successfully");

        // Clear localStorage after successful submit
        clearHRFormStorage();

        // Close assignment dialog and reset
        setShowAssessorAssignment(false);
        setSelectedAssessors([]);

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

      const response = await candidateService.updateInterview2(id, {
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

  // Check if interview has started
  // Interview is considered "started" only when:
  // 1. Backend explicitly sets interviewStarted: true
  // 2. OR interview1.locked is explicitly false (not undefined)
  // 3. OR interview1 already has results (passed or failed)
  // 4. OR any subsequent stage has results
  const interviewStarted =
    progress?.interviewStarted === true ||
    progress?.interview1?.locked === false ||
    progress?.interview1?.passed === true ||
    progress?.interview1?.failed === true ||
    progress?.interview2?.passed === true ||
    progress?.interview2?.failed === true ||
    progress?.mcu?.passed === true ||
    progress?.mcu?.failed === true;

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

  // ==================== Onboarding Handlers ====================

  // Ensure onboarding exists — fetch first, create only if not found
  const ensureOnboarding = async (): Promise<boolean> => {
    if (onboarding) return true;

    try {
      // Try fetching existing onboarding first
      const fetchRes = await candidateService.getOnboarding(id);
      if (fetchRes.success && fetchRes.data) {
        setOnboarding(fetchRes.data);
        return true;
      }

      // No existing onboarding, create new one
      const response = await candidateService.createOnboarding(id, {
        job_placement: jobPlacement,
      });
      if (response.success && response.data) {
        setOnboarding(response.data);
        return true;
      } else {
        showToast.error(response.message || "Failed to create onboarding");
        return false;
      }
    } catch (err) {
      showToast.error("Failed to create onboarding");
      return false;
    }
  };


  // Facility handlers
  const handleOpenFacilityDialog = (mode: "add" | "edit", facility?: Facility) => {
    if (mode === "edit" && facility) {
      setFacilityForm({
        inventoryNo: facility.inventoryNo,
        item: facility.item,
        qty: facility.qty,
        unit: facility.unit,
        condition: facility.condition,
        status: facility.status,
      });
    } else {
      setFacilityForm({
        inventoryNo: "",
        item: "",
        qty: 1,
        unit: "Unit",
        condition: "New",
        status: "Assigned",
      });
    }
    setFacilityDialog({ open: true, mode, facility });
  };

  const handleSaveFacility = async () => {
    const hasOnboarding = await ensureOnboarding();
    if (!hasOnboarding) return;

    try {
      if (facilityDialog.mode === "add") {
        const response = await candidateService.addFacility(id, {
          inventory_no: facilityForm.inventoryNo,
          item: facilityForm.item,
          qty: facilityForm.qty,
          unit: facilityForm.unit,
          condition: facilityForm.condition,
          status: facilityForm.status,
        });

        if (response.success) {
          showToast.success("Facility added");
          const onboardingRes = await candidateService.getOnboarding(id);
          if (onboardingRes.success && onboardingRes.data) {
            setOnboarding(onboardingRes.data);
          }
        } else {
          showToast.error(response.message || "Failed to add facility");
        }
      } else if (facilityDialog.facility) {
        const response = await candidateService.updateFacility(
          id,
          facilityDialog.facility.id,
          {
            inventory_no: facilityForm.inventoryNo,
            item: facilityForm.item,
            qty: facilityForm.qty,
            unit: facilityForm.unit,
            condition: facilityForm.condition,
            status: facilityForm.status,
          }
        );

        if (response.success) {
          showToast.success("Facility updated");
          const onboardingRes = await candidateService.getOnboarding(id);
          if (onboardingRes.success && onboardingRes.data) {
            setOnboarding(onboardingRes.data);
          }
        } else {
          showToast.error(response.message || "Failed to update facility");
        }
      }
    } catch (err) {
      showToast.error("Failed to save facility");
    }

    setFacilityDialog({ open: false, mode: "add" });
  };

  const handleDeleteFacility = async (facilityId: number) => {
    try {
      const response = await candidateService.deleteFacility(id, facilityId);
      if (response.success) {
        showToast.deleted("Facility");
        const onboardingRes = await candidateService.getOnboarding(id);
        if (onboardingRes.success && onboardingRes.data) {
          setOnboarding(onboardingRes.data);
        }
      } else {
        showToast.error(response.message || "Failed to delete facility");
      }
    } catch (err) {
      showToast.error("Failed to delete facility");
    }
    setOnboardingDeleteConfirm(null);
  };

  // Program handlers
  const handleOpenProgramDialog = (mode: "add" | "edit", program?: OnboardingProgram) => {
    if (mode === "edit" && program) {
      setProgramForm({
        program: program.program,
        date: program.date,
        location: program.location,
        pic: program.pic,
        status: program.status,
      });
    } else {
      setProgramForm({
        program: "",
        date: "",
        location: "",
        pic: "",
        status: "Scheduled",
      });
    }
    setProgramDialog({ open: true, mode, program });
  };

  const handleSaveProgram = async () => {
    const hasOnboarding = await ensureOnboarding();
    if (!hasOnboarding) return;

    try {
      if (programDialog.mode === "add") {
        const response = await candidateService.addProgram(id, {
          program: programForm.program,
          date: programForm.date,
          location: programForm.location,
          pic: programForm.pic,
          status: programForm.status,
        });

        if (response.success) {
          showToast.success("Program added");
          const onboardingRes = await candidateService.getOnboarding(id);
          if (onboardingRes.success && onboardingRes.data) {
            setOnboarding(onboardingRes.data);
          }
        } else {
          showToast.error(response.message || "Failed to add program");
        }
      } else if (programDialog.program) {
        const response = await candidateService.updateProgram(
          id,
          programDialog.program.id,
          {
            program: programForm.program,
            date: programForm.date,
            location: programForm.location,
            pic: programForm.pic,
            status: programForm.status,
          }
        );

        if (response.success) {
          showToast.success("Program updated");
          const onboardingRes = await candidateService.getOnboarding(id);
          if (onboardingRes.success && onboardingRes.data) {
            setOnboarding(onboardingRes.data);
          }
        } else {
          showToast.error(response.message || "Failed to update program");
        }
      }
    } catch (err) {
      showToast.error("Failed to save program");
    }

    setProgramDialog({ open: false, mode: "add" });
  };

  const handleDeleteProgram = async (programId: number) => {
    try {
      const response = await candidateService.deleteProgram(id, programId);
      if (response.success) {
        showToast.deleted("Program");
        const onboardingRes = await candidateService.getOnboarding(id);
        if (onboardingRes.success && onboardingRes.data) {
          setOnboarding(onboardingRes.data);
        }
      } else {
        showToast.error(response.message || "Failed to delete program");
      }
    } catch (err) {
      showToast.error("Failed to delete program");
    }
    setOnboardingDeleteConfirm(null);
  };

  // Send onboarding to candidate
  const handleSendOnboarding = async () => {
    setIsConverting(true);

    try {
      // Ensure onboarding record exists
      const hasOnboarding = await ensureOnboarding();
      if (!hasOnboarding) {
        setIsConverting(false);
        return;
      }

      // Save job placement before sending
      await candidateService.updateOnboarding(id, { job_placement: jobPlacement });

      // Send onboarding email to candidate
      const portalBaseUrl = window.location.origin;
      const response = await candidateService.sendOnboardingEmail(id, portalBaseUrl);
      if (response.success) {
        showToast.success("Onboarding email sent to candidate!");
        setShowConvertDialog(false);
        // Refresh onboarding data
        const onboardingRes = await candidateService.getOnboarding(id);
        if (onboardingRes.success && onboardingRes.data) {
          setOnboarding(onboardingRes.data);
        }
      } else {
        showToast.error(response.message || "Failed to send onboarding");
      }
    } catch (err) {
      showToast.error("Failed to send onboarding");
    } finally {
      setIsConverting(false);
    }
  };

  // Check if ready to send onboarding
  const canSendOnboarding = onboarding &&
    joinDate &&
    onboarding.facilities.length > 0 &&
    onboarding.programs.length > 0;

  // Check if onboarding has been accepted by candidate
  const isOnboardingAccepted = onboarding?.onboardingAcceptedAt != null;

  // Get stage status
  const getStageStatus = (stage: AssessmentStageKey) => {
    // If no progress or interview not started, all stages are locked
    if (!progress || !interviewStarted) {
      return { status: "pending", locked: true };
    }

    const stageData = progress[stage];
    return {
      status: stageData.passed ? "passed" : stageData.failed ? "failed" : "pending",
      locked: "locked" in stageData ? stageData.locked : false,
    };
  };

  // Get current recruitment workflow step index
  // Steps: 0=Biodata, 1=Interview1, 2=Interview2, 3=MCU, 4=Completed
  const getCurrentStepIndex = () => {
    // If candidate hasn't submitted biodata, stay at biodata step
    if (candidate && !hasBiodataSubmitted(candidate)) return 0;

    // If interview hasn't started yet, stay at biodata (waiting for start)
    if (!interviewStarted) return 0;

    if (!progress) return 1; // Biodata done, waiting for interview 1
    if (progress.anyFailed) return -1;
    if (progress.allPassed) return 4;
    if (progress.interview2.passed) return 3;
    if (progress.interview1.passed) return 2;
    return 1;
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
                    <h2 className="text-xl font-semibold tracking-tight">{candidate.fullname}</h2>
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

          {/* Start Interview Banner - Show when biodata is submitted but interview not started */}
          {hasBiodataSubmitted(candidate) && !interviewStarted && !progress?.anyFailed && (
            <Card className="border-accent/30 bg-accent/5">
              <CardContent className="p-6">
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
                    <ClipboardCheck className="mr-2 h-4 w-4" />
                    Schedule Interview
                  </Button>
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

            {/* Profile Tab */}
            <TabsContent value="profile" className="mt-6 space-y-6">
              {/* Application Details */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                      <Briefcase className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Application Details</CardTitle>
                      <CardDescription>Candidate application and verification details</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {candidate.detail && (
                      <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Candidate Code</p>
                          <p className="text-sm font-medium">{candidate.detail.candidateCode}</p>
                        </div>
                      </div>
                    )}
                    {candidate.employeeRequest && (
                      <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                        <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Employee Request</p>
                          <p className="text-sm font-medium">{candidate.employeeRequest.code}</p>
                        </div>
                      </div>
                    )}
                    {candidate.jobTitle && (
                      <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                        <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Position Applied</p>
                          <p className="text-sm font-medium">{candidate.jobTitle.name}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Verification Status</p>
                        <Badge variant={candidate.verify === "VERIFIED" ? "default" : "secondary"} className="mt-1">
                          {candidate.verify}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Applied Date</p>
                        <p className="text-sm font-medium">{candidate.createdAt ? formatShortDate(candidate.createdAt) : "—"}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Personal Information */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950">
                      <User className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Personal Information</CardTitle>
                      <CardDescription>Basic personal and demographic information</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                      <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Gender</p>
                        <p className="text-sm font-medium">{candidate.gender === "M" ? "Male" : "Female"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Birth Date</p>
                        <p className="text-sm font-medium">{candidate.birthDate ? formatShortDate(candidate.birthDate) : "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Birth Place</p>
                        <p className="text-sm font-medium">{candidate.birthPlace || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                      <Heart className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Religion</p>
                        <p className="text-sm font-medium">{candidate.religion || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                      <Users className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Marital Status</p>
                        <p className="text-sm font-medium">{candidate.marritalStatus || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                      <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Citizenship</p>
                        <p className="text-sm font-medium">{candidate.citizenship || "—"}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950">
                      <MapPin className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Contact Information</CardTitle>
                      <CardDescription>Address, phone, and email details</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="text-sm font-medium">{candidate.address || "—"}</p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                      <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Resident Status</p>
                        <p className="text-sm font-medium">{candidate.residentStatus || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                      <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Mobile Phone</p>
                        <p className="text-sm font-medium">{candidate.mobilePhone || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3 sm:col-span-2">
                      <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm font-medium">{candidate.email}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Identity Documents */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950">
                      <IdCard className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Identity Documents</CardTitle>
                      <CardDescription>Government-issued identification numbers</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                      <IdCard className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">ID Number (KTP)</p>
                        <p className="text-sm font-medium">{candidate.idNo || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                      <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Tax ID (NPWP)</p>
                        <p className="text-sm font-medium">{candidate.taxId || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                      <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">BPJS ID</p>
                        <p className="text-sm font-medium">{candidate.bpjsId || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                      <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Driving License</p>
                        <p className="text-sm font-medium">{candidate.drivingLicense || "—"}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Educational Background */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                      <GraduationCap className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Educational Background</CardTitle>
                      <CardDescription>Academic qualifications and degrees</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {biodata?.education && biodata.education.length > 0 ? (
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50 border-b">
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">School / University</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">City</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Degree</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Major</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Year</th>
                          </tr>
                        </thead>
                        <tbody>
                          {biodata.education.map((edu, index) => (
                            <tr key={edu.id} className={cn("border-b last:border-b-0", index % 2 === 0 ? "bg-transparent" : "bg-muted/30")}>
                              <td className="py-3 px-4 font-medium">{edu.schoolUniversity}</td>
                              <td className="py-3 px-4 text-muted-foreground">{edu.city}</td>
                              <td className="py-3 px-4 text-muted-foreground">{edu.degree}</td>
                              <td className="py-3 px-4 text-muted-foreground">{edu.major}</td>
                              <td className="py-3 px-4 text-muted-foreground">{edu.yearGraduate}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <p className="text-sm">No educational background data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Work Experience */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950">
                      <Building2 className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Work Experience</CardTitle>
                      <CardDescription>Previous employment history</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {biodata?.workExperience && biodata.workExperience.length > 0 ? (
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50 border-b">
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Company</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">City</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Job Title</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Period</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Length</th>
                          </tr>
                        </thead>
                        <tbody>
                          {biodata.workExperience.map((exp, index) => (
                            <tr key={exp.id} className={cn("border-b last:border-b-0", index % 2 === 0 ? "bg-transparent" : "bg-muted/30")}>
                              <td className="py-3 px-4 font-medium">{exp.company}</td>
                              <td className="py-3 px-4 text-muted-foreground">{exp.city}</td>
                              <td className="py-3 px-4 text-muted-foreground">{exp.jobTitle}</td>
                              <td className="py-3 px-4 text-muted-foreground">{exp.period}</td>
                              <td className="py-3 px-4 text-muted-foreground">{exp.lengthOfWorking}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <p className="text-sm">No work experience data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Family Members */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Family Members</CardTitle>
                      <CardDescription>Family composition and details</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {biodata?.family && biodata.family.length > 0 ? (
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50 border-b">
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Name</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Relation</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Age</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Education</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Work</th>
                          </tr>
                        </thead>
                        <tbody>
                          {biodata.family.map((member, index) => (
                            <tr key={member.id} className={cn("border-b last:border-b-0", index % 2 === 0 ? "bg-transparent" : "bg-muted/30")}>
                              <td className="py-3 px-4 font-medium">{member.name}</td>
                              <td className="py-3 px-4 text-muted-foreground">{member.relation}</td>
                              <td className="py-3 px-4 text-muted-foreground">{member.age}</td>
                              <td className="py-3 px-4 text-muted-foreground">{member.education}</td>
                              <td className="py-3 px-4 text-muted-foreground">{member.work}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <p className="text-sm">No family member data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Course / Training Experience */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950">
                      <Award className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Course / Training Experience</CardTitle>
                      <CardDescription>Professional development and certifications</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {biodata?.training && biodata.training.length > 0 ? (
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50 border-b">
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Course Topic</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Provider</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Year</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">City</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Certificate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {biodata.training.map((course, index) => (
                            <tr key={course.id} className={cn("border-b last:border-b-0", index % 2 === 0 ? "bg-transparent" : "bg-muted/30")}>
                              <td className="py-3 px-4 font-medium">{course.courseTopic}</td>
                              <td className="py-3 px-4 text-muted-foreground">{course.provider}</td>
                              <td className="py-3 px-4 text-muted-foreground">{course.year}</td>
                              <td className="py-3 px-4 text-muted-foreground">{course.city}</td>
                              <td className="py-3 px-4 text-muted-foreground">{course.certificate}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <p className="text-sm">No course/training data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Self Assessment */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                      <ClipboardList className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Self Assessment</CardTitle>
                      <CardDescription>Candidate self-evaluation responses</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {biodata?.selfAssessment ? (
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-foreground">What caused you to leave your last job?</p>
                        <div className="bg-secondary/50 rounded-lg p-4 min-h-[80px]">
                          <p className="text-sm text-foreground/80 leading-relaxed">{biodata.selfAssessment.reasonLeavingLastJob || "—"}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-foreground">Describe your last job description!</p>
                        <div className="bg-secondary/50 rounded-lg p-4 min-h-[80px]">
                          <p className="text-sm text-foreground/80 leading-relaxed">{biodata.selfAssessment.lastJobDescription || "—"}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-foreground">What is your reason/purpose for applying to this company?</p>
                        <div className="bg-secondary/50 rounded-lg p-4 min-h-[80px]">
                          <p className="text-sm text-foreground/80 leading-relaxed">{biodata.selfAssessment.reasonApplying || "—"}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-foreground">What tasks/jobs are you good at, related to the position you are applying for?</p>
                        <div className="bg-secondary/50 rounded-lg p-4 min-h-[80px]">
                          <p className="text-sm text-foreground/80 leading-relaxed">{biodata.selfAssessment.relevantSkills || "—"}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-foreground">Last salary received?</p>
                        <div className="bg-secondary/50 rounded-lg p-4">
                          <p className="text-sm text-foreground/80">{biodata.selfAssessment.lastSalary || "—"}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-foreground">What salary do you expect?</p>
                        <div className="bg-secondary/50 rounded-lg p-4">
                          <p className="text-sm text-foreground/80">{biodata.selfAssessment.expectedSalary || "—"}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-foreground">Active language?</p>
                        <div className="bg-secondary/50 rounded-lg p-4">
                          <p className="text-sm text-foreground/80">{biodata.selfAssessment.activeLanguage || "—"}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-foreground">Are you willing to transfer/rotate at work?</p>
                        <div className="bg-secondary/50 rounded-lg p-4">
                          <p className="text-sm text-foreground/80">{biodata.selfAssessment.willingToTransfer || "—"}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-foreground">Are you willing to do double work for the company due to limited personnel?</p>
                        <div className="bg-secondary/50 rounded-lg p-4">
                          <p className="text-sm text-foreground/80">{biodata.selfAssessment.willingToDoubleWork || "—"}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-foreground">Who are the employees you know at this company?</p>
                        <div className="bg-secondary/50 rounded-lg p-4">
                          <p className="text-sm text-foreground/80">{biodata.selfAssessment.knownEmployees || "—"}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-foreground">When are you ready to work?</p>
                        <div className="bg-secondary/50 rounded-lg p-4">
                          <p className="text-sm text-foreground/80">{biodata.selfAssessment.readyToWork || "—"}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-foreground">What is your relationship with the employee?</p>
                        <div className="bg-secondary/50 rounded-lg p-4">
                          <p className="text-sm text-foreground/80">{biodata.selfAssessment.employeeRelationship || "—"}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-foreground">Your reference contact name</p>
                        <div className="bg-secondary/50 rounded-lg p-4">
                          <p className="text-sm text-foreground/80">{biodata.selfAssessment.referenceContactName || "—"}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-foreground">Your reference contact phone no</p>
                        <div className="bg-secondary/50 rounded-lg p-4">
                          <p className="text-sm text-foreground/80">{biodata.selfAssessment.referenceContactPhone || "—"}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <p className="text-sm">No self assessment data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Assessment HR Tab */}
            <TabsContent value="assessment-hr" className="space-y-5 mt-6">
              {(() => {
                const { status } = getStageStatus("interview1");
                const isCompleted = status === "passed" || status === "failed";

                // Score statistics
                const filledScores = Object.values(hrScoring).filter((s): s is number => s !== null);
                const totalFilled = filledScores.length;
                const totalCriteria = HR_SCORING_CRITERIA.length;
                const averageScore = totalFilled > 0 ? filledScores.reduce((a, b) => a + b, 0) / totalFilled : 0;
                const totalScore = filledScores.reduce((a, b) => a + b, 0);
                const maxTotal = totalCriteria * 5;
                const progressPercent = Math.round((totalFilled / totalCriteria) * 100);

                const scoreColor = (val: number) =>
                  val >= 4.5 ? "text-emerald-600" :
                  val >= 3.5 ? "text-blue-600" :
                  val >= 2.5 ? "text-amber-600" :
                  val >= 1 ? "text-red-500" : "text-muted-foreground";

                const pillColor = (val: number, selected: boolean) => {
                  if (!selected) return "bg-secondary/80 text-muted-foreground hover:bg-secondary";
                  if (val <= 1) return "bg-red-500 text-white shadow-sm shadow-red-500/25";
                  if (val <= 2) return "bg-orange-500 text-white shadow-sm shadow-orange-500/25";
                  if (val <= 3) return "bg-amber-500 text-white shadow-sm shadow-amber-500/25";
                  if (val <= 4) return "bg-blue-500 text-white shadow-sm shadow-blue-500/25";
                  return "bg-emerald-500 text-white shadow-sm shadow-emerald-500/25";
                };

                return (
                  <>
                    {/* Status Banner — Passed */}
                    {status === "passed" && (
                      <Card className="border-emerald-500/40 bg-gradient-to-r from-emerald-500/5 to-transparent overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                        <CardContent className="flex items-center justify-between p-5 pl-6">
                          <div className="flex items-center gap-4">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10 ring-4 ring-emerald-500/5">
                              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-emerald-700 text-sm">Assessment HR — Passed</h3>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Candidate cleared HR assessment. Proceed to the next stage.
                              </p>
                            </div>
                          </div>
                          <Button size="sm" onClick={() => handleTabChange("assessment-user")}>
                            Assessment User
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    {/* Status Banner — Failed */}
                    {status === "failed" && (
                      <Card className="border-destructive/40 bg-gradient-to-r from-destructive/5 to-transparent overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-1 h-full bg-destructive" />
                        <CardContent className="flex items-center gap-4 p-5 pl-6">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10 ring-4 ring-destructive/5">
                            <XCircle className="h-5 w-5 text-destructive" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-destructive text-sm">Assessment HR — Failed</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Candidate did not pass the HR assessment and cannot proceed further.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Score Overview Stats */}
                    <div className="grid grid-cols-3 gap-3">
                      <Card className="relative overflow-hidden">
                        <CardContent className="p-4">
                          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Progress</p>
                          <div className="flex items-end gap-2 mt-1.5">
                            <span className="text-2xl font-bold tabular-nums">{totalFilled}</span>
                            <span className="text-sm text-muted-foreground mb-0.5">/ {totalCriteria}</span>
                          </div>
                          <div className="mt-2.5 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="relative overflow-hidden">
                        <CardContent className="p-4">
                          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Average</p>
                          <div className="flex items-end gap-2 mt-1.5">
                            <span className={cn("text-2xl font-bold tabular-nums", scoreColor(averageScore))}>
                              {totalFilled > 0 ? averageScore.toFixed(1) : "—"}
                            </span>
                            <span className="text-sm text-muted-foreground mb-0.5">/ 5.0</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            {totalFilled === 0 ? "No scores yet" :
                             averageScore >= 4.5 ? "Excellent" :
                             averageScore >= 3.5 ? "Good" :
                             averageScore >= 2.5 ? "Fair" :
                             averageScore >= 1.5 ? "Poor" : "Very Poor"}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="relative overflow-hidden">
                        <CardContent className="p-4">
                          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Score</p>
                          <div className="flex items-end gap-2 mt-1.5">
                            <span className="text-2xl font-bold tabular-nums">{totalScore}</span>
                            <span className="text-sm text-muted-foreground mb-0.5">/ {maxTotal}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            {totalFilled > 0 ? `${Math.round((totalScore / maxTotal) * 100)}% of maximum` : "Start scoring below"}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Section 1 — Scoring */}
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-accent text-xs font-bold">1</div>
                          <div>
                            <CardTitle className="text-base">Interview Scoring</CardTitle>
                            <CardDescription className="text-xs">Rate each criterion from 1 (Very Poor) to 5 (Excellent)</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-2">
                        {/* Score legend */}
                        <div className="flex items-center justify-end gap-4 mb-3 pb-3 border-b">
                          {SCORE_OPTIONS.map((opt) => (
                            <div key={opt.value} className="flex items-center gap-1.5">
                              <div className={cn(
                                "h-2.5 w-2.5 rounded-full",
                                opt.value === 1 && "bg-red-500",
                                opt.value === 2 && "bg-orange-500",
                                opt.value === 3 && "bg-amber-500",
                                opt.value === 4 && "bg-blue-500",
                                opt.value === 5 && "bg-emerald-500",
                              )} />
                              <span className="text-[11px] text-muted-foreground">{opt.label}</span>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-1">
                          {HR_SCORING_CRITERIA.map((criteria, index) => {
                            const currentScore = hrScoring[criteria.key];
                            return (
                              <div
                                key={criteria.key}
                                className={cn(
                                  "group flex items-center justify-between py-3 px-3 -mx-3 rounded-lg transition-colors",
                                  currentScore === null && !isCompleted && "hover:bg-secondary/50"
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
                                        disabled={isCompleted}
                                        onClick={() => setHrScoring(prev => ({
                                          ...prev,
                                          [criteria.key]: option.value
                                        }))}
                                        title={option.label}
                                        className={cn(
                                          "relative h-8 w-8 rounded-md text-xs font-semibold transition-all duration-200",
                                          pillColor(option.value, isSelected),
                                          !isSelected && !isCompleted && "hover:scale-110 hover:bg-secondary",
                                          isCompleted && "cursor-not-allowed opacity-60"
                                        )}
                                      >
                                        {option.value}
                                      </button>
                                    );
                                  })}
                                  {/* Selected label */}
                                  <span className={cn(
                                    "ml-2 text-[11px] font-medium w-16 text-right transition-opacity",
                                    currentScore ? "opacity-100" : "opacity-0"
                                  )}>
                                    {currentScore ? SCORE_OPTIONS.find(o => o.value === currentScore)?.label : ""}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Section 2 — Additional Information */}
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-accent text-xs font-bold">2</div>
                          <div>
                            <CardTitle className="text-base">Additional Information</CardTitle>
                            <CardDescription className="text-xs">Provide qualitative notes and competency observations</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-5 pt-2">
                        <div className="space-y-2">
                          <Label className="text-sm">
                            Key Competencies Required by the Department / Company
                          </Label>
                          {isCompleted ? (
                            <div className="rounded-lg border border-input bg-muted/30 p-3 text-sm min-h-20 opacity-60">
                              {hrKeyCompetencies ? (
                                <LexicalRenderer value={hrKeyCompetencies} />
                              ) : (
                                <span className="text-muted-foreground">No content</span>
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
                          <Label className="text-sm">Interviewer Notes</Label>
                          {isCompleted ? (
                            <div className="rounded-lg border border-input bg-muted/30 p-3 text-sm min-h-20 opacity-60">
                              {hrUserNotes ? (
                                <LexicalRenderer value={hrUserNotes} />
                              ) : (
                                <span className="text-muted-foreground">No content</span>
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
                      </CardContent>
                    </Card>

                    {/* Section 3 — Conclusion */}
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-accent text-xs font-bold">3</div>
                          <div>
                            <CardTitle className="text-base">Interview Result Conclusion</CardTitle>
                            <CardDescription className="text-xs">Select the final recommendation for this candidate</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <div className="grid grid-cols-3 gap-3">
                          {[
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
                          ].map((option) => {
                            const Icon = option.icon;
                            const isSelected = hrConclusion === option.value;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                disabled={isCompleted}
                                onClick={() => setHrConclusion(option.value)}
                                className={cn(
                                  "relative flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition-all duration-200 text-center",
                                  isSelected
                                    ? option.colors.active
                                    : "border-border bg-background hover:border-muted-foreground/30 hover:bg-secondary/30",
                                  isCompleted && "opacity-60 cursor-not-allowed"
                                )}
                              >
                                {isSelected && (
                                  <div className={cn("absolute top-2.5 right-2.5 h-2.5 w-2.5 rounded-full", option.colors.dot)} />
                                )}
                                <div className={cn(
                                  "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                                  isSelected ? "bg-white/60" : "bg-secondary"
                                )}>
                                  <Icon className={cn("h-5 w-5", isSelected ? option.colors.icon : "text-muted-foreground")} />
                                </div>
                                <div>
                                  <p className={cn("text-sm font-semibold", isSelected ? option.colors.icon : "text-foreground")}>{option.label}</p>
                                  <p className="text-[11px] text-muted-foreground mt-0.5">{option.desc}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    {!isCompleted && (
                      <div className="flex items-center justify-between pt-2">
                        <p className="text-xs text-muted-foreground">
                          {totalFilled < totalCriteria
                            ? `${totalCriteria - totalFilled} scoring criteria remaining`
                            : hrConclusion
                            ? "Ready to submit"
                            : "Select a conclusion to submit"}
                        </p>
                        <Button
                          size="sm"
                          onClick={() => setShowHRPreview(true)}
                        >
                          <Send className="mr-2 h-3.5 w-3.5" />
                          Submit Assessment
                        </Button>
                      </div>
                    )}
                  </>
                );
              })()}
            </TabsContent>

            {/* Assessment User Tab */}
            <TabsContent value="assessment-user" className="space-y-5 mt-6">
              {(() => {
                const { status, locked } = getStageStatus("interview2");
                const isCompleted = status === "passed" || status === "failed";

                // Score statistics
                const filledScores = Object.values(userScoring).filter((s): s is number => s !== null);
                const totalFilled = filledScores.length;
                const totalCriteria = HR_SCORING_CRITERIA.length;
                const averageScore = totalFilled > 0 ? filledScores.reduce((a, b) => a + b, 0) / totalFilled : 0;
                const totalScore = filledScores.reduce((a, b) => a + b, 0);
                const maxTotal = totalCriteria * 5;
                const progressPercent = Math.round((totalFilled / totalCriteria) * 100);

                const scoreColor = (val: number) =>
                  val >= 4.5 ? "text-emerald-600" :
                  val >= 3.5 ? "text-blue-600" :
                  val >= 2.5 ? "text-amber-600" :
                  val >= 1 ? "text-red-500" : "text-muted-foreground";

                const pillColor = (val: number, selected: boolean) => {
                  if (!selected) return "bg-secondary/80 text-muted-foreground hover:bg-secondary";
                  if (val <= 1) return "bg-red-500 text-white shadow-sm shadow-red-500/25";
                  if (val <= 2) return "bg-orange-500 text-white shadow-sm shadow-orange-500/25";
                  if (val <= 3) return "bg-amber-500 text-white shadow-sm shadow-amber-500/25";
                  if (val <= 4) return "bg-blue-500 text-white shadow-sm shadow-blue-500/25";
                  return "bg-emerald-500 text-white shadow-sm shadow-emerald-500/25";
                };

                return (
                  <>
                    {/* Locked State */}
                    {locked && (
                      <Card className="opacity-60">
                        <CardContent className="flex flex-col items-center justify-center py-16">
                          <Lock className="h-16 w-16 text-muted-foreground/30" />
                          <h3 className="mt-4 text-lg font-medium">Assessment User Locked</h3>
                          <p className="text-muted-foreground text-center max-w-md mt-2">
                            Complete Interview HR (Assessment HR) first to unlock this stage.
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Status Banner — Passed */}
                    {!locked && status === "passed" && (
                      <Card className="border-emerald-500/40 bg-gradient-to-r from-emerald-500/5 to-transparent overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                        <CardContent className="flex items-center justify-between p-5 pl-6">
                          <div className="flex items-center gap-4">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10 ring-4 ring-emerald-500/5">
                              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-emerald-700 text-sm">Assessment User — Passed</h3>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Candidate cleared User assessment. Proceed to MCU for the next stage.
                              </p>
                            </div>
                          </div>
                          <Button size="sm" onClick={() => handleTabChange("mcu")}>
                            Proceed to MCU
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    {/* Status Banner — Failed */}
                    {!locked && status === "failed" && (
                      <Card className="border-destructive/40 bg-gradient-to-r from-destructive/5 to-transparent overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-1 h-full bg-destructive" />
                        <CardContent className="flex items-center gap-4 p-5 pl-6">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10 ring-4 ring-destructive/5">
                            <XCircle className="h-5 w-5 text-destructive" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-destructive text-sm">Assessment User — Failed</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Candidate did not pass the User assessment and cannot proceed further.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Form Content - Only show if not locked */}
                    {!locked && (
                      <>
                        {/* Assigned Assessors Card */}
                        {assignedAssessors.length > 0 && (
                          <Card className="border-blue-500/30 bg-gradient-to-r from-blue-500/5 via-blue-500/3 to-transparent overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-blue-400" />
                            <CardContent className="p-5 pl-6">
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
                                            {assessor.employeeName || "Unknown"}
                                          </p>
                                          {assessor.employeeEmail && (
                                            <p className="text-xs text-gray-500 truncate">
                                              {assessor.employeeEmail}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Score Overview Stats */}
                        <div className="grid grid-cols-3 gap-3">
                          <Card className="relative overflow-hidden">
                            <CardContent className="p-4">
                              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Progress</p>
                              <div className="flex items-end gap-2 mt-1.5">
                                <span className="text-2xl font-bold tabular-nums">{totalFilled}</span>
                                <span className="text-sm text-muted-foreground mb-0.5">/ {totalCriteria}</span>
                              </div>
                              <div className="mt-2.5 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="relative overflow-hidden">
                            <CardContent className="p-4">
                              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Average</p>
                              <div className="flex items-end gap-2 mt-1.5">
                                <span className={cn("text-2xl font-bold tabular-nums", scoreColor(averageScore))}>
                                  {totalFilled > 0 ? averageScore.toFixed(1) : "—"}
                                </span>
                                <span className="text-sm text-muted-foreground mb-0.5">/ 5.0</span>
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-1">
                                {totalFilled === 0 ? "No scores yet" :
                                 averageScore >= 4.5 ? "Excellent" :
                                 averageScore >= 3.5 ? "Good" :
                                 averageScore >= 2.5 ? "Fair" :
                                 averageScore >= 1.5 ? "Poor" : "Very Poor"}
                              </p>
                            </CardContent>
                          </Card>
                          <Card className="relative overflow-hidden">
                            <CardContent className="p-4">
                              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Score</p>
                              <div className="flex items-end gap-2 mt-1.5">
                                <span className="text-2xl font-bold tabular-nums">{totalScore}</span>
                                <span className="text-sm text-muted-foreground mb-0.5">/ {maxTotal}</span>
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-1">
                                {totalFilled > 0 ? `${Math.round((totalScore / maxTotal) * 100)}% of maximum` : "Start scoring below"}
                              </p>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Section 1 — Scoring */}
                        <Card>
                          <CardHeader className="pb-2">
                            <div className="flex items-center gap-3">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-accent text-xs font-bold">1</div>
                              <div>
                                <CardTitle className="text-base">Interview Scoring</CardTitle>
                                <CardDescription className="text-xs">Rate each criterion from 1 (Very Poor) to 5 (Excellent)</CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-2">
                            {/* Score legend */}
                            <div className="flex items-center justify-end gap-4 mb-3 pb-3 border-b">
                              {SCORE_OPTIONS.map((opt) => (
                                <div key={opt.value} className="flex items-center gap-1.5">
                                  <div className={cn(
                                    "h-2.5 w-2.5 rounded-full",
                                    opt.value === 1 && "bg-red-500",
                                    opt.value === 2 && "bg-orange-500",
                                    opt.value === 3 && "bg-amber-500",
                                    opt.value === 4 && "bg-blue-500",
                                    opt.value === 5 && "bg-emerald-500",
                                  )} />
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
                                      currentScore === null && !isCompleted && "hover:bg-secondary/50"
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
                                            disabled={isCompleted}
                                            onClick={() => setUserScoring(prev => ({
                                              ...prev,
                                              [criteria.key]: option.value
                                            }))}
                                            title={option.label}
                                            className={cn(
                                              "relative h-8 w-8 rounded-md text-xs font-semibold transition-all duration-200",
                                              pillColor(option.value, isSelected),
                                              !isSelected && !isCompleted && "hover:scale-110 hover:bg-secondary",
                                              isCompleted && "cursor-not-allowed opacity-60"
                                            )}
                                          >
                                            {option.value}
                                          </button>
                                        );
                                      })}
                                      {/* Selected label */}
                                      <span className={cn(
                                        "ml-2 text-[11px] font-medium w-16 text-right transition-opacity",
                                        currentScore ? "opacity-100" : "opacity-0"
                                      )}>
                                        {currentScore ? SCORE_OPTIONS.find(o => o.value === currentScore)?.label : ""}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Section 2 — Additional Information */}
                        <Card>
                          <CardHeader className="pb-2">
                            <div className="flex items-center gap-3">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-accent text-xs font-bold">2</div>
                              <div>
                                <CardTitle className="text-base">Additional Information</CardTitle>
                                <CardDescription className="text-xs">Provide qualitative notes and competency observations</CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-5 pt-2">
                            <div className="space-y-2">
                              <Label className="text-sm">
                                Key Competencies Required by the Department / Company
                              </Label>
                              {isCompleted ? (
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
                              {isCompleted ? (
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
                          </CardContent>
                        </Card>

                        {/* Section 3 — Conclusion */}
                        <Card>
                          <CardHeader className="pb-2">
                            <div className="flex items-center gap-3">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-accent text-xs font-bold">3</div>
                              <div>
                                <CardTitle className="text-base">Interview Result Conclusion</CardTitle>
                                <CardDescription className="text-xs">Select the final recommendation for this candidate</CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-2">
                            <div className="grid grid-cols-3 gap-3">
                              {[
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
                              ].map((option) => {
                                const Icon = option.icon;
                                const isSelected = userConclusion === option.value;
                                return (
                                  <button
                                    key={option.value}
                                    type="button"
                                    disabled={isCompleted}
                                    onClick={() => setUserConclusion(option.value)}
                                    className={cn(
                                      "relative flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition-all duration-200 text-center",
                                      isSelected
                                        ? option.colors.active
                                        : "border-border bg-background hover:border-muted-foreground/30 hover:bg-secondary/30",
                                      isCompleted && "opacity-60 cursor-not-allowed"
                                    )}
                                  >
                                    {isSelected && (
                                      <div className={cn("absolute top-2.5 right-2.5 h-2.5 w-2.5 rounded-full", option.colors.dot)} />
                                    )}
                                    <div className={cn(
                                      "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                                      isSelected ? "bg-white/60" : "bg-secondary"
                                    )}>
                                      <Icon className={cn("h-5 w-5", isSelected ? option.colors.icon : "text-muted-foreground")} />
                                    </div>
                                    <div>
                                      <p className={cn("text-sm font-semibold", isSelected ? option.colors.icon : "text-foreground")}>{option.label}</p>
                                      <p className="text-[11px] text-muted-foreground mt-0.5">{option.desc}</p>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Action Buttons */}
                        {!isCompleted && (
                          <div className="flex items-center justify-between pt-2">
                            <p className="text-xs text-muted-foreground">
                              {totalFilled < totalCriteria
                                ? `${totalCriteria - totalFilled} scoring criteria remaining`
                                : userConclusion
                                ? "Ready to submit"
                                : "Select a conclusion to submit"}
                            </p>
                            <Button
                              size="sm"
                              onClick={() => setShowUserPreview(true)}
                            >
                              <Send className="mr-2 h-3.5 w-3.5" />
                              Submit Assessment
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
              {(() => {
                const mcuStage = ASSESSMENT_STAGES.find(s => s.key === "mcu")!;
                const { status: mcuStatus, locked: mcuLocked } = getStageStatus("mcu");
                const mcuIsPending = !mcuLocked && mcuStatus === "pending";

                return (
                  <>
                    {/* Status Banner */}
                    {mcuStatus === "passed" && (
                      <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-emerald-700">Medical Check-Up Passed</p>
                          <p className="text-sm text-muted-foreground">Candidate has been cleared for medical examination.</p>
                        </div>
                      </div>
                    )}
                    {mcuStatus === "failed" && (
                      <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                          <XCircle className="h-5 w-5 text-destructive" />
                        </div>
                        <div>
                          <p className="font-semibold text-destructive">Medical Check-Up Failed</p>
                          <p className="text-sm text-muted-foreground">Candidate did not pass the medical examination.</p>
                        </div>
                      </div>
                    )}

                    {/* Locked State */}
                    {mcuLocked && (
                      <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                          <Lock className="h-16 w-16 text-muted-foreground/30" />
                          <h3 className="mt-4 text-lg font-medium">MCU Locked</h3>
                          <p className="text-muted-foreground text-center max-w-md mt-2">
                            Complete Interview User (Assessment User) first to unlock Medical Check-Up.
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Main MCU Content - show when not locked */}
                    {!mcuLocked && (
                      <>
                        {/* Section 1: Document Upload */}
                        <Card>
                          <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-sm font-bold text-blue-600">1</div>
                              <div>
                                <CardTitle className="text-base">MCU Document</CardTitle>
                                <CardDescription>Upload the medical check-up result document (PDF, JPEG, or PNG, max 10MB)</CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <Separator className="mb-4" />

                            {/* Hidden file input */}
                            <input
                              ref={mcuFileInputRef}
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={handleMcuFileUpload}
                              className="hidden"
                            />

                            {/* Document state */}
                            {mcuDocument?.url ? (
                              <div className="rounded-lg border bg-secondary/20 p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                                      <File className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-medium text-sm truncate">{mcuDocument.name || "MCU Document"}</p>
                                      <p className="text-xs text-muted-foreground">Uploaded successfully</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {mcuDocument.presignedUrl && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        asChild
                                      >
                                        <a href={mcuDocument.presignedUrl} target="_blank" rel="noopener noreferrer">
                                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                                          View
                                        </a>
                                      </Button>
                                    )}
                                    {mcuStatus === "pending" && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-destructive hover:text-destructive"
                                        onClick={handleMcuDocumentDelete}
                                        disabled={isDeletingMcuDoc}
                                      >
                                        {isDeletingMcuDoc ? (
                                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                        )}
                                        Delete
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => mcuFileInputRef.current?.click()}
                                disabled={isUploadingMcu || mcuStatus !== "pending"}
                                className={cn(
                                  "w-full rounded-lg border-2 border-dashed p-8 text-center transition-colors",
                                  mcuStatus === "pending"
                                    ? "border-muted-foreground/25 hover:border-blue-500/50 hover:bg-blue-500/5 cursor-pointer"
                                    : "border-muted-foreground/15 opacity-60 cursor-not-allowed"
                                )}
                              >
                                {isUploadingMcu ? (
                                  <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                                    <p className="text-sm font-medium">Uploading document...</p>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center gap-2">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                                      <Upload className="h-6 w-6 text-blue-500" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">Click to upload MCU document</p>
                                      <p className="text-xs text-muted-foreground mt-1">PDF, JPEG, or PNG up to 10MB</p>
                                    </div>
                                  </div>
                                )}
                              </button>
                            )}
                          </CardContent>
                        </Card>

                        {/* Section 2: Notes */}
                        <Card>
                          <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-sm font-bold text-blue-600">2</div>
                              <div>
                                <CardTitle className="text-base">Notes / Description</CardTitle>
                                <CardDescription>Add any additional notes about the medical check-up results</CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <Separator className="mb-4" />
                            <Textarea
                              id="mcu-notes"
                              placeholder="Add notes for Medical Check-Up..."
                              value={assessmentNotes.mcu}
                              onChange={(e) => setAssessmentNotes(prev => ({
                                ...prev,
                                mcu: e.target.value
                              }))}
                              disabled={mcuStatus !== "pending"}
                              className="min-h-32"
                            />
                          </CardContent>
                        </Card>

                        {/* Action Bar - Only show if pending */}
                        {mcuIsPending && (
                          <div className="sticky bottom-4 z-10">
                            <Card className="border-blue-500/20 shadow-lg">
                              <CardContent className="flex items-center justify-between p-4">
                                <p className="text-sm text-muted-foreground">
                                  Upload the MCU document and set the result to continue.
                                </p>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="default"
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                    disabled={isSubmitting === "mcu"}
                                    onClick={() => setConfirmDialog({
                                      open: true,
                                      stage: "mcu",
                                      action: "PASSED"
                                    })}
                                  >
                                    {isSubmitting === "mcu" ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="mr-2 h-4 w-4" />
                                    )}
                                    Pass
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    disabled={isSubmitting === "mcu"}
                                    onClick={() => setConfirmDialog({
                                      open: true,
                                      stage: "mcu",
                                      action: "FAILED"
                                    })}
                                  >
                                    {isSubmitting === "mcu" ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <XCircle className="mr-2 h-4 w-4" />
                                    )}
                                    Fail
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        )}
                      </>
                    )}

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
                  </>
                );
              })()}
            </TabsContent>

            {/* Onboarding Tab */}
            <TabsContent value="onboarding" className="space-y-6 mt-6">
              {canStartOnboarding ? (
                <div className="space-y-6">
                    {/* Facilities Section */}
                    <Card>
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                              <Package className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <CardTitle className="text-base">Facilities / Equipment</CardTitle>
                              <CardDescription>Equipment and items assigned to the new employee</CardDescription>
                            </div>
                          </div>
                          {!isOnboardingAccepted && (
                            <Button size="sm" onClick={() => handleOpenFacilityDialog("add")}>
                              <Plus className="mr-2 h-4 w-4" />
                              Add Facility
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {(!onboarding || onboarding.facilities.length === 0) ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
                              <Package className="h-7 w-7 text-muted-foreground" />
                            </div>
                            <h4 className="mt-4 font-semibold">No facilities assigned</h4>
                            <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                              Assign equipment and items for the new employee
                            </p>
                            {!isOnboardingAccepted && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-4"
                                onClick={() => handleOpenFacilityDialog("add")}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Facility
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="rounded-lg border overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-secondary/30">
                                  <TableHead className="font-semibold">Inventory No</TableHead>
                                  <TableHead className="font-semibold">Item</TableHead>
                                  <TableHead className="text-center font-semibold">Qty</TableHead>
                                  <TableHead className="font-semibold">Condition</TableHead>
                                  <TableHead className="font-semibold">Status</TableHead>
                                  {!isOnboardingAccepted && (
                                    <TableHead className="text-right font-semibold">Actions</TableHead>
                                  )}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {onboarding.facilities.map((facility) => (
                                  <TableRow key={facility.id}>
                                    <TableCell className="text-sm">
                                      {facility.inventoryNo || "—"}
                                    </TableCell>
                                    <TableCell className="font-medium">{facility.item}</TableCell>
                                    <TableCell className="text-center">{facility.qty} {facility.unit}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="font-normal">{facility.condition}</Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant={
                                          facility.status === "Assigned" ? "default" :
                                          facility.status === "Returned" ? "secondary" : "outline"
                                        }
                                      >
                                        {facility.status}
                                      </Badge>
                                    </TableCell>
                                    {!isOnboardingAccepted && (
                                      <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => handleOpenFacilityDialog("edit", facility)}
                                          >
                                            <Pencil className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                            onClick={() => setOnboardingDeleteConfirm({
                                              open: true,
                                              type: "facility",
                                              id: facility.id,
                                              name: facility.item,
                                            })}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    )}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Onboarding Programs Section */}
                    <Card>
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950">
                              <GraduationCap className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <CardTitle className="text-base">Onboarding Programs</CardTitle>
                              <CardDescription>Training and orientation schedule for the new employee</CardDescription>
                            </div>
                          </div>
                          {!isOnboardingAccepted && (
                            <Button size="sm" onClick={() => handleOpenProgramDialog("add")}>
                              <Plus className="mr-2 h-4 w-4" />
                              Add Program
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {(!onboarding || onboarding.programs.length === 0) ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
                              <GraduationCap className="h-7 w-7 text-muted-foreground" />
                            </div>
                            <h4 className="mt-4 font-semibold">No programs scheduled</h4>
                            <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                              Schedule training and orientation for the new employee
                            </p>
                            {!isOnboardingAccepted && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-4"
                                onClick={() => handleOpenProgramDialog("add")}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Program
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="rounded-lg border overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-secondary/30">
                                  <TableHead className="font-semibold">Program</TableHead>
                                  <TableHead className="font-semibold">Date</TableHead>
                                  <TableHead className="font-semibold">Location</TableHead>
                                  <TableHead className="font-semibold">PIC</TableHead>
                                  <TableHead className="font-semibold">Status</TableHead>
                                  {!isOnboardingAccepted && (
                                    <TableHead className="text-right font-semibold">Actions</TableHead>
                                  )}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {onboarding.programs.map((program) => (
                                  <TableRow key={program.id}>
                                    <TableCell className="font-medium">{program.program}</TableCell>
                                    <TableCell>
                                      {program.date ? formatShortDate(program.date) : "—"}
                                    </TableCell>
                                    <TableCell>{program.location || "—"}</TableCell>
                                    <TableCell>{program.pic || "—"}</TableCell>
                                    <TableCell>
                                      <Badge
                                        variant={
                                          program.status === "Completed" ? "default" :
                                          program.status === "In Progress" ? "secondary" :
                                          program.status === "Cancelled" ? "destructive" : "outline"
                                        }
                                      >
                                        {program.status}
                                      </Badge>
                                    </TableCell>
                                    {!isOnboardingAccepted && (
                                      <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => handleOpenProgramDialog("edit", program)}
                                          >
                                            <Pencil className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                            onClick={() => setOnboardingDeleteConfirm({
                                              open: true,
                                              type: "program",
                                              id: program.id,
                                              name: program.program,
                                            })}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    )}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Job Placement */}
                    <Card>
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950">
                            <MapPin className="h-5 w-5 text-emerald-600" />
                          </div>
                          <CardTitle className="text-base">Job Placement</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="jobPlacement">Work Location / Placement</Label>
                          <Input
                            id="jobPlacement"
                            value={formatJobPlacement(jobPlacement)}
                            disabled
                            className="bg-muted"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="joinDate">Join Date</Label>
                          <Input
                            id="joinDate"
                            type="date"
                            value={joinDate}
                            onChange={(e) => setJoinDate(e.target.value)}
                            disabled={isOnboardingAccepted}
                            className={isOnboardingAccepted ? "bg-muted" : ""}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Onboarding Checklist */}
                    <Card className="border-blue-200 dark:border-blue-900">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                            <Send className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base">Onboarding Checklist</CardTitle>
                            <CardDescription>Requirements before sending onboarding to candidate</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-3">
                          {joinDate ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                          )}
                          <span className={cn(
                            "text-sm",
                            joinDate ? "" : "text-muted-foreground"
                          )}>
                            Join date set
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {onboarding && onboarding.facilities.length > 0 ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                          )}
                          <span className={cn(
                            "text-sm",
                            onboarding && onboarding.facilities.length > 0 ? "" : "text-muted-foreground"
                          )}>
                            At least 1 facility assigned
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {onboarding && onboarding.programs.length > 0 ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                          )}
                          <span className={cn(
                            "text-sm",
                            onboarding && onboarding.programs.length > 0 ? "" : "text-muted-foreground"
                          )}>
                            At least 1 program scheduled
                          </span>
                        </div>

                        {/* Send Onboarding CTA */}
                        {isOnboardingAccepted ? (
                          <div className="mt-5 rounded-xl bg-gradient-to-b from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20 border border-emerald-100 dark:border-emerald-900/50 px-6 py-6 flex flex-col items-center text-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-emerald-700 dark:text-emerald-300">Onboarding Accepted</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Candidate has accepted the onboarding offer
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-5 rounded-xl bg-gradient-to-b from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20 border border-blue-100 dark:border-blue-900/50 px-6 py-6 flex flex-col items-center text-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
                              <Send className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">Ready to Send?</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {canSendOnboarding
                                  ? "All requirements met. Send onboarding details to the candidate."
                                  : "Complete all checklist items above before sending."}
                              </p>
                            </div>
                            <Button
                              className="bg-blue-600 hover:bg-blue-700 px-6 mt-1"
                              onClick={() => setShowConvertDialog(true)}
                              disabled={!canSendOnboarding}
                            >
                              <Send className="mr-2 h-4 w-4" />
                              Send Onboarding
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                      <Lock className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-medium">Onboarding Locked</h3>
                    <p className="text-muted-foreground text-center max-w-md mt-2">
                      The candidate must pass all assessment stages before the onboarding process can begin.
                    </p>
                    <div className="flex items-center gap-2 mt-4 text-sm text-amber-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Complete Interview HR, Interview User & MCU first</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </PageContainer>

      {/* HR Assessment Preview Dialog */}
      <Dialog open={showHRPreview} onOpenChange={setShowHRPreview}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0">
          {/* Header with gradient accent */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/8 via-accent/4 to-transparent" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <DialogHeader className="relative px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/20">
                  <ClipboardCheck className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold">Confirm Submission</DialogTitle>
                  <DialogDescription className="text-sm">
                    Review your HR Assessment before submitting
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
                  <AvatarFallback className="bg-accent text-accent-foreground font-semibold">
                    {getInitials(candidate.fullname)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{candidate.fullname}</p>
                  <p className="text-sm text-muted-foreground truncate">{candidate.jobTitle?.name}</p>
                </div>
                {hrConclusion && (
                  <div className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide",
                    hrConclusion === "proceed" && "bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/30",
                    hrConclusion === "recommended" && "bg-blue-500/15 text-blue-600 ring-1 ring-blue-500/30",
                    hrConclusion === "rejected" && "bg-red-500/15 text-red-600 ring-1 ring-red-500/30"
                  )}>
                    {hrConclusion === "proceed" ? "Proceed" : hrConclusion === "recommended" ? "Recommended" : "Rejected"}
                  </div>
                )}
              </div>
            )}

            {/* Score Summary Card */}
            {(() => {
              const filledScores = Object.values(hrScoring).filter((s): s is number => s !== null);
              const totalFilled = filledScores.length;
              const totalCriteria = HR_SCORING_CRITERIA.length;
              const averageScore = totalFilled > 0 ? filledScores.reduce((a, b) => a + b, 0) / totalFilled : 0;
              const totalScore = filledScores.reduce((a, b) => a + b, 0);
              const maxTotal = totalCriteria * 5;

              return (
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border bg-gradient-to-br from-background to-secondary/30 p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{totalFilled}/{totalCriteria}</p>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1">Criteria Filled</p>
                  </div>
                  <div className="rounded-xl border bg-gradient-to-br from-background to-secondary/30 p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{averageScore.toFixed(1)}</p>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1">Avg. Score</p>
                  </div>
                  <div className="rounded-xl border bg-gradient-to-br from-background to-secondary/30 p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{totalScore}/{maxTotal}</p>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1">Total Points</p>
                  </div>
                </div>
              );
            })()}

            {/* Scoring Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-accent" />
                <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Scoring Breakdown</h4>
              </div>
              <div className="rounded-xl border overflow-hidden">
                {HR_SCORING_CRITERIA.map((criteria, index) => {
                  const score = hrScoring[criteria.key];
                  const scoreLabel = score ? SCORE_OPTIONS.find(opt => opt.value === score)?.label : null;
                  const scoreColor = score && score >= 4 ? "text-emerald-600" : score && score >= 3 ? "text-blue-600" : score && score >= 2 ? "text-amber-600" : score ? "text-red-500" : "text-muted-foreground";
                  return (
                    <div key={criteria.key} className={cn(
                      "flex items-center justify-between px-4 py-2.5 transition-colors",
                      index % 2 === 0 ? "bg-secondary/20" : "bg-transparent"
                    )}>
                      <span className="text-sm text-foreground">{criteria.label}</span>
                      {scoreLabel ? (
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((dot) => (
                              <div
                                key={dot}
                                className={cn(
                                  "h-1.5 w-1.5 rounded-full transition-colors",
                                  score && dot <= score ? (
                                    score >= 4 ? "bg-emerald-500" : score >= 3 ? "bg-blue-500" : score >= 2 ? "bg-amber-500" : "bg-red-500"
                                  ) : "bg-secondary"
                                )}
                              />
                            ))}
                          </div>
                          <span className={cn("text-xs font-medium", scoreColor)}>{scoreLabel}</span>
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
            {(hrKeyCompetencies || hrUserNotes) && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-accent" />
                  <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Additional Notes</h4>
                </div>
                <div className="space-y-3">
                  {hrKeyCompetencies && (
                    <div className="rounded-xl border p-4 bg-secondary/10">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2">Key Competencies</p>
                      <div className="text-sm text-foreground">
                        <LexicalRenderer value={hrKeyCompetencies} />
                      </div>
                    </div>
                  )}
                  {hrUserNotes && (
                    <div className="rounded-xl border p-4 bg-secondary/10">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2">Interviewer Notes</p>
                      <div className="text-sm text-foreground">
                        <LexicalRenderer value={hrUserNotes} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Warning for incomplete */}
            {(() => {
              const filledScores = Object.values(hrScoring).filter((s): s is number => s !== null);
              const totalFilled = filledScores.length;
              const totalCriteria = HR_SCORING_CRITERIA.length;
              const isIncomplete = totalFilled < totalCriteria || !hrConclusion;

              if (isIncomplete) {
                return (
                  <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-amber-700">Incomplete Assessment</p>
                      <p className="text-xs text-amber-600/80 mt-0.5">
                        {totalFilled < totalCriteria && `${totalCriteria - totalFilled} scoring criteria not filled. `}
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
          <div className="border-t bg-secondary/30 px-6 py-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Next: Assign assessors for Interview User
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowHRPreview(false)} className="px-4">
                  Cancel
                </Button>
                <Button
                  onClick={handleOpenAssessorAssignment}
                  className="px-5 gap-2"
                >
                  <Users className="h-4 w-4" />
                  Continue
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assessor Assignment Dialog */}
      <Dialog open={showAssessorAssignment} onOpenChange={setShowAssessorAssignment}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-hidden p-0">
          {/* Header */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 via-blue-500/4 to-transparent" />
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
            <DialogHeader className="relative px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 ring-1 ring-blue-500/30">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold">Assign Assessors</DialogTitle>
                  <DialogDescription className="text-sm">
                    Select employees for Interview User stage
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="px-6 pb-2 space-y-4">
            {/* Selected Assessors */}
            {selectedAssessors.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
                  Selected ({selectedAssessors.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedAssessors.map((emp) => (
                    <div
                      key={emp.id}
                      className="group flex items-center gap-2 pl-1 pr-2 py-1 rounded-full bg-gradient-to-r from-blue-500/10 to-blue-600/10 ring-1 ring-blue-500/20 hover:ring-blue-500/40 transition-all"
                    >
                      <Avatar className="h-6 w-6 ring-1 ring-white/50">
                        <AvatarFallback className="bg-blue-500 text-white text-[10px] font-medium">
                          {getInitials(`${emp.firstName} ${emp.lastName}`)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium text-foreground">
                        {emp.firstName} {emp.lastName}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAssessor(emp.id)}
                        className="ml-0.5 h-4 w-4 rounded-full flex items-center justify-center bg-secondary/80 text-muted-foreground hover:bg-destructive hover:text-white transition-colors"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search & Select */}
            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
                Search Employees
              </p>
              <Popover open={assessorSearchOpen} onOpenChange={setAssessorSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={assessorSearchOpen}
                    className="w-full justify-between h-11 px-3 bg-secondary/30 hover:bg-secondary/50 border-secondary"
                  >
                    <span className="text-muted-foreground text-sm">
                      Click to search and select employees...
                    </span>
                    <ChevronRight className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform duration-200",
                      assessorSearchOpen && "rotate-90"
                    )} />
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
                          <div className="py-6 text-center text-sm text-muted-foreground">
                            No employees found
                          </div>
                        )}
                      </CommandEmpty>
                      <CommandGroup>
                        <ScrollArea className="h-[240px]">
                          {availableEmployees
                            .filter(emp => {
                              const name = `${emp.firstName} ${emp.lastName}`.toLowerCase();
                              const query = assessorSearchQuery.toLowerCase();
                              return name.includes(query) || emp.email?.toLowerCase().includes(query);
                            })
                            .map((emp) => {
                              const isSelected = selectedAssessors.some(s => s.id === emp.id);
                              return (
                                <CommandItem
                                  key={emp.id}
                                  value={`${emp.firstName} ${emp.lastName} ${emp.email}`}
                                  onSelect={() => toggleAssessor(emp)}
                                  className="cursor-pointer group data-[selected=true]:bg-blue-500"
                                >
                                  <div className="flex items-center gap-3 w-full py-1">
                                    <div className="relative">
                                      <Avatar className="h-9 w-9 ring-2 ring-transparent group-data-[selected=true]:ring-white/30">
                                        <AvatarFallback className={cn(
                                          "text-xs font-medium transition-colors",
                                          isSelected ? "bg-blue-600 text-white" : "bg-secondary text-foreground"
                                        )}>
                                          {getInitials(`${emp.firstName} ${emp.lastName}`)}
                                        </AvatarFallback>
                                      </Avatar>
                                      {isSelected && (
                                        <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center ring-2 ring-background">
                                          <Check className="h-2.5 w-2.5 text-white" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate text-foreground group-data-[selected=true]:text-white">
                                        {emp.firstName} {emp.lastName}
                                      </p>
                                      <p className="text-xs text-muted-foreground truncate group-data-[selected=true]:text-white/70">
                                        {emp.jobTitle?.name || emp.email}
                                      </p>
                                    </div>
                                    {isSelected && (
                                      <Badge className="bg-blue-500/20 text-blue-600 border-0 text-[10px] group-data-[selected=true]:bg-white/30 group-data-[selected=true]:text-white">
                                        Selected
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

          {/* Info Banner */}
          <div className="mx-6 mb-4 flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-700">Interview User Assignment</p>
              <p className="text-xs text-blue-600/80 mt-0.5">
                Selected employees will be assigned to conduct the Interview User stage for this candidate.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t bg-secondary/30 px-6 py-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {selectedAssessors.length === 0
                  ? "Select at least one assessor"
                  : `${selectedAssessors.length} assessor${selectedAssessors.length > 1 ? "s" : ""} selected`
                }
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAssessorAssignment(false);
                    setShowHRPreview(true);
                  }}
                  className="px-4"
                >
                  Back
                </Button>
                <Button
                  onClick={handleHRAssessmentSubmit}
                  disabled={isSubmittingHR || (hrConclusion !== "rejected" && selectedAssessors.length === 0)}
                  className="px-5 gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmittingHR ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Assessment
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Assessment Preview Dialog */}
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
                  <div className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide",
                    userConclusion === "proceed" && "bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/30",
                    userConclusion === "recommended" && "bg-blue-500/15 text-blue-600 ring-1 ring-blue-500/30",
                    userConclusion === "rejected" && "bg-red-500/15 text-red-600 ring-1 ring-red-500/30"
                  )}>
                    {userConclusion === "proceed" ? "Proceed" : userConclusion === "recommended" ? "Recommended" : "Rejected"}
                  </div>
                )}
              </div>
            )}

            {/* Score Summary Card */}
            {(() => {
              const filledScores = Object.values(userScoring).filter((s): s is number => s !== null);
              const totalFilled = filledScores.length;
              const totalCriteria = HR_SCORING_CRITERIA.length;
              const averageScore = totalFilled > 0 ? filledScores.reduce((a, b) => a + b, 0) / totalFilled : 0;
              const totalScore = filledScores.reduce((a, b) => a + b, 0);
              const maxTotal = totalCriteria * 5;

              return (
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border bg-gradient-to-br from-background to-secondary/30 p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{totalFilled}/{totalCriteria}</p>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1">Criteria Filled</p>
                  </div>
                  <div className="rounded-xl border bg-gradient-to-br from-background to-secondary/30 p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{averageScore.toFixed(1)}</p>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1">Avg. Score</p>
                  </div>
                  <div className="rounded-xl border bg-gradient-to-br from-background to-secondary/30 p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{totalScore}/{maxTotal}</p>
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
                  const scoreLabel = score ? SCORE_OPTIONS.find(opt => opt.value === score)?.label : null;
                  const scoreColor = score && score >= 4 ? "text-emerald-600" : score && score >= 3 ? "text-blue-600" : score && score >= 2 ? "text-amber-600" : score ? "text-red-500" : "text-muted-foreground";
                  return (
                    <div key={criteria.key} className={cn(
                      "flex items-center justify-between px-4 py-2.5 transition-colors",
                      index % 2 === 0 ? "bg-secondary/20" : "bg-transparent"
                    )}>
                      <span className="text-sm text-foreground">{criteria.label}</span>
                      {scoreLabel ? (
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((dot) => (
                              <div
                                key={dot}
                                className={cn(
                                  "h-1.5 w-1.5 rounded-full transition-colors",
                                  score && dot <= score ? (
                                    score >= 4 ? "bg-emerald-500" : score >= 3 ? "bg-blue-500" : score >= 2 ? "bg-amber-500" : "bg-red-500"
                                  ) : "bg-secondary"
                                )}
                              />
                            ))}
                          </div>
                          <span className={cn("text-xs font-medium", scoreColor)}>{scoreLabel}</span>
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
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2">Key Competencies</p>
                      <div className="text-sm text-foreground">
                        <LexicalRenderer value={userKeyCompetencies} />
                      </div>
                    </div>
                  )}
                  {userUserNotes && (
                    <div className="rounded-xl border p-4 bg-secondary/10">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2">Interviewer Notes</p>
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
              const filledScores = Object.values(userScoring).filter((s): s is number => s !== null);
              const totalFilled = filledScores.length;
              const totalCriteria = HR_SCORING_CRITERIA.length;
              const isIncomplete = totalFilled < totalCriteria || !userConclusion;

              if (isIncomplete) {
                return (
                  <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-amber-700">Incomplete Assessment</p>
                      <p className="text-xs text-amber-600/80 mt-0.5">
                        {totalFilled < totalCriteria && `${totalCriteria - totalFilled} scoring criteria not filled. `}
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
                  <strong>{confirmDialog?.stage === "mcu" ? "MCU" : confirmDialog?.stage === "interview1" ? "Interview HR" : "Interview User"}</strong>{" "}
                  as passed? This will unlock the next stage.
                </>
              ) : (
                <>
                  Are you sure you want to mark{" "}
                  <strong>{confirmDialog?.stage === "mcu" ? "MCU" : confirmDialog?.stage === "interview1" ? "Interview HR" : "Interview User"}</strong>{" "}
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

      {/* Facility Dialog */}
      <Dialog
        open={facilityDialog.open}
        onOpenChange={(open) => setFacilityDialog({ ...facilityDialog, open })}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {facilityDialog.mode === "add" ? "Add Facility" : "Edit Facility"}
            </DialogTitle>
            <DialogDescription>
              {facilityDialog.mode === "add"
                ? "Add a new facility/equipment for the employee"
                : "Update facility information"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Inventory No</Label>
              <Input
                placeholder="e.g., INV-001"
                value={facilityForm.inventoryNo}
                onChange={(e) => setFacilityForm({ ...facilityForm, inventoryNo: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Item *</Label>
              <Select
                value={facilityForm.item}
                onValueChange={(v) => setFacilityForm({ ...facilityForm, item: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  {FACILITY_ITEMS.map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min={1}
                  value={facilityForm.qty}
                  onChange={(e) => setFacilityForm({ ...facilityForm, qty: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Input
                  value={facilityForm.unit}
                  disabled
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Condition</Label>
                <Select
                  value={facilityForm.condition}
                  onValueChange={(v) => setFacilityForm({ ...facilityForm, condition: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FACILITY_CONDITIONS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Input
                  value={facilityForm.status}
                  disabled
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFacilityDialog({ open: false, mode: "add" })}>
              Cancel
            </Button>
            <Button onClick={handleSaveFacility} disabled={!facilityForm.item}>
              {facilityDialog.mode === "add" ? "Add" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Program Dialog */}
      <Dialog
        open={programDialog.open}
        onOpenChange={(open) => setProgramDialog({ ...programDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {programDialog.mode === "add" ? "Add Program" : "Edit Program"}
            </DialogTitle>
            <DialogDescription>
              {programDialog.mode === "add"
                ? "Schedule a new onboarding program"
                : "Update program information"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Program Name *</Label>
              <Input
                placeholder="e.g., Company Orientation"
                value={programForm.program}
                onChange={(e) => setProgramForm({ ...programForm, program: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={programForm.date}
                  onChange={(e) => setProgramForm({ ...programForm, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  placeholder="e.g., Meeting Room A"
                  value={programForm.location}
                  onChange={(e) => setProgramForm({ ...programForm, location: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>PIC (Person In Charge)</Label>
                <Input
                  placeholder="e.g., HR Team"
                  value={programForm.pic}
                  onChange={(e) => setProgramForm({ ...programForm, pic: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={programForm.status}
                  onValueChange={(v) => setProgramForm({ ...programForm, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROGRAM_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProgramDialog({ open: false, mode: "add" })}>
              Cancel
            </Button>
            <Button onClick={handleSaveProgram} disabled={!programForm.program}>
              {programDialog.mode === "add" ? "Add" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Onboarding Delete Confirmation */}
      <AlertDialog
        open={onboardingDeleteConfirm?.open || false}
        onOpenChange={(open) => !open && setOnboardingDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {onboardingDeleteConfirm?.type === "facility" ? "Facility" : "Program"}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{onboardingDeleteConfirm?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (onboardingDeleteConfirm?.type === "facility") {
                  handleDeleteFacility(onboardingDeleteConfirm.id);
                } else if (onboardingDeleteConfirm?.type === "program") {
                  handleDeleteProgram(onboardingDeleteConfirm.id);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send Onboarding Dialog */}
      <AlertDialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-600" />
              Send Onboarding
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to send onboarding details to {candidate?.fullname}.
              The candidate will receive an email to review and confirm the offer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Onboarding Summary</span>
              </div>
              <ul className="mt-2 text-sm text-blue-600 dark:text-blue-400 space-y-1">
                <li>Work Location: {formatJobPlacement(jobPlacement) || "—"}</li>
                <li>Join Date: {joinDate || "—"}</li>
                <li>{onboarding?.facilities.length || 0} facilities assigned</li>
                <li>{onboarding?.programs.length || 0} programs scheduled</li>
              </ul>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isConverting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSendOnboarding}
              disabled={isConverting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isConverting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="mr-2 h-4 w-4" />
              Send Onboarding
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Schedule Interview Dialog */}
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
              Set the interview date and type for this candidate. The candidate will be notified about the interview schedule.
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ClipboardCheck className="mr-2 h-4 w-4" />
              )}
              {isStartingInterview ? "Scheduling..." : "Start Interview"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
