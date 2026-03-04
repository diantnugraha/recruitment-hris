import type {
  EmployeeRequestStatus,
  EmploymentType,
  RequestReason,
  EducationLevel,
  GenderPreference,
} from "@/lib/constants/employeeRequest";

// Employee Request - Main entity
export interface EmployeeRequest {
  id: string;
  code: string;
  jobTitleId: string;
  departmentId: string;
  divisionId?: string;

  // Request Details
  reason: RequestReason;
  purpose: string;
  quantity: number;
  employmentType: EmploymentType;

  // Requirements
  education: EducationLevel;
  experience: string; // e.g., "2-3 years"

  // Preferences
  genderPreference: GenderPreference;
  ageMin?: number;
  ageMax?: number;
  jobPlacement?: string; // Work location

  // Headcount & Timeline
  headcount: number;
  expectedOnboardDate?: string;

  // Job Description
  generalJobPurpose?: string;
  jobDescription?: string;
  jobRequirement?: string;

  // Status
  status: EmployeeRequestStatus;
  recruitmentCode?: string; // Generated when approved

  // Metadata
  requestedById: string;
  requestedByName?: string;
  createdAt: string;
  updatedAt: string;
}

// Employee Request with relations
export interface EmployeeRequestWithRelations extends EmployeeRequest {
  jobTitle?: { id: number; name: string } | null;
  department?: { id: number; name: string; code: string } | null;
  division?: { id: number; name: string } | null;
  requestedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
  comments?: EmployeeRequestComment[];
  candidateCount?: number;
}

// Comment/History
export interface EmployeeRequestComment {
  id: string;
  employeeRequestId: string;
  userId: string;
  userName?: string;
  userRole?: string;
  action: 'created' | 'reviewed' | 'approved' | 'rejected' | 'revised' | 'comment';
  comment: string;
  previousStatus?: EmployeeRequestStatus;
  newStatus?: EmployeeRequestStatus;
  createdAt: string;
}

// DTOs for API
export interface CreateEmployeeRequestDTO {
  job_title_id: number;
  department_id: number;
  division_id?: number;
  reason: string;
  purpose: string;
  quantity: number;
  employment_type: string;
  education: string;
  experience: string;
  gender_preference: string;
  age_min?: number;
  age_max?: number;
  job_placement?: string;
  headcount: number;
  expected_onboard_date?: string;
  general_job_purpose?: string;
  job_description?: string;
  job_requirement?: string;
  status?: string;
}

export interface UpdateEmployeeRequestDTO extends Partial<CreateEmployeeRequestDTO> {
  status?: string;
}

export interface UpdateEmployeeRequestStatusDTO {
  status: string;
  comment?: string;
}

export interface EmployeeRequestFilters {
  status?: string;
  department_id?: number;
  job_title_id?: number;
  requested_by_id?: string;
  search?: string;
}

// Summary/Stats
export interface EmployeeRequestStats {
  total: number;
  draft: number;
  created: number;
  reviewed: number;
  approved: number;
  rejected: number;
  revise: number;
  in_recruitment: number;
  completed: number;
}
