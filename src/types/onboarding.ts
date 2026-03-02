import type {
  OnboardingStatus,
  DocumentType,
  ContractType,
  ChecklistCategory,
} from "@/lib/constants/onboarding";

// Checklist Item
export interface ChecklistItem {
  id: string;
  label: string;
  category: ChecklistCategory;
  required: boolean;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
}

// Onboarding Document
export interface OnboardingDocument {
  id: string;
  candidateId: string;
  type: DocumentType;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  uploadedAt: string;
  uploadedBy?: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
}

// Job Placement
export interface JobPlacement {
  jobTitleId: string;
  departmentId: string;
  divisionId?: string;
  supervisorId?: string;
  contractType: ContractType;
  startDate: string;
  contractEndDate?: string;
  workLocation?: string;
  salary?: number;
  allowances?: number;
}

// Main Onboarding Data
export interface OnboardingData {
  id: string;
  candidateId: string;
  status: OnboardingStatus;
  checklist: ChecklistItem[];
  documents: OnboardingDocument[];
  jobPlacement?: JobPlacement;
  notes?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Onboarding with Candidate Info
export interface OnboardingWithCandidate extends OnboardingData {
  candidate: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    status: string;
    jobTitle?: { id: number; name: string } | null;
    department?: { id: number; name: string; code: string } | null;
  };
}

// DTOs
export interface CreateOnboardingRequest {
  candidate_id: string;
  checklist?: Array<{
    id: string;
    label: string;
    category: string;
    required: boolean;
  }>;
}

export interface UpdateOnboardingChecklistRequest {
  checklist: Array<{
    id: string;
    completed: boolean;
    completed_at?: string;
    completed_by?: string;
    notes?: string;
  }>;
}

export interface UpdateJobPlacementRequest {
  job_title_id: string;
  department_id: string;
  division_id?: string;
  supervisor_id?: string;
  contract_type: string;
  start_date: string;
  contract_end_date?: string;
  work_location?: string;
  salary?: number;
  allowances?: number;
}

export interface UploadDocumentRequest {
  type: string;
  file: File;
  notes?: string;
}
