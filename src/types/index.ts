// Auth Types
export interface User {
  id: string;
  email: string;
  name: string;
  roleId: number;       // numeric for access control (matches database role_access.role_id)
  roleName: string;     // human-readable role name for display
  avatar?: string;
  employeeId?: number | null;
  managedDepartments?: { id: number; name: string }[];
  headOfDivisions?: { id: number; name: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data?: {
    user: User;
    token: string;
    refreshToken?: string;
    expiresIn: number;
  };
  message?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Employee Types
export type EmployeeStatus =
  | "active"
  | "inactive"
  | "on_leave"
  | "terminated"
  | "permanent"
  | "contract"
  | "probation"
  | "outsource"
  | "exit";

export type EmployeeGender = "Any" | "Male" | "Female";

export type MaritalStatus = "single" | "married" | "divorced" | "widowed";

export interface Employee {
  id: string;
  employeeId: string;
  employeeNik?: string | null;
  firstName: string;
  lastName: string;
  nickname?: string;
  email: string;
  phone: string;
  employeeContact?: string | null;
  dateOfBirth: string;
  gender: EmployeeGender;
  address: string;
  hireDate: string;
  status: EmployeeStatus;
  departmentId: string;
  divisionId: string;
  jobTitleId: string;
  jobLevelId: string;
  managerId?: string;
  superiorId?: string;
  photo?: string;
  // Employment details
  employeeType?: string;
  businessUnit?: string;
  extension?: string;
  location?: string;
  fte?: number;
  // Contract & probation dates
  permanentDate?: string;
  contractDate?: string;
  contractEndDate?: string;
  probationDate?: string;
  probationEndDate?: string;
  // Family info
  motherName?: string;
  fatherName?: string;
  spouseName?: string;
  maritalStatus?: MaritalStatus;
  // Emergency contact
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
  // Exit info
  exitReason?: string;
  exitDate?: string;
  // Additional
  religion?: string;
  ethnicity?: string;
  nationality?: string;
  certificate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeWithRelations extends Employee {
  department?: Department;
  division?: Division;
  jobTitle?: JobTitle;
  jobLevel?: JobLevel;
  manager?: Employee;
}

// Organization Types
export interface Organization {
  id: string;
  name: string;
  cluster?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Division {
  id: string;
  name: string;
  code: string;
  description?: string;
  headId?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  category: "Profit Center" | "Non Profit Center";
  description?: string;
  obsId: string;
  divisionId?: string;
  headId?: string;
  obs?: Organization;
  division?: Division;
  createdAt: string;
  updatedAt: string;
}

export interface JobLevel {
  id: string;
  name: string;
  code?: string | null; // Structural code: HEAD_OF_DIVISION, MANAGER, etc.
  category: string;
  description?: string;
  order?: number;
  canCreateJobTitle: boolean;
  canCreateKpi: boolean;
  createdAt: string;
  updatedAt: string;
}

// Job Level structural codes for auto-filling Division/Department heads
export const JOB_LEVEL_CODES = {
  // Division head positions (fills Division.head_of_division_id)
  PRESIDENT_DIRECTOR: 'PRESIDENT_DIRECTOR',
  HEAD_OF_DIVISION: 'HEAD_OF_DIVISION',
  // Department manager positions (fills Department.manager_id)
  MANAGER: 'MANAGER',
} as const;

export type JobLevelCode = typeof JOB_LEVEL_CODES[keyof typeof JOB_LEVEL_CODES];

// Codes that represent division head positions
export const DIVISION_HEAD_CODES: string[] = [
  JOB_LEVEL_CODES.PRESIDENT_DIRECTOR,
  JOB_LEVEL_CODES.HEAD_OF_DIVISION,
];

// Codes that represent department manager positions
export const DEPARTMENT_MANAGER_CODES: string[] = [
  JOB_LEVEL_CODES.MANAGER,
];

export interface DepartmentJobTitle {
  department: {
    id: number;
    name: string;
    code: string;
    obs?: {
      id: number;
      name: string;
      cluster: string | null;
    };
    division?: {
      id: number;
      name: string;
      code: string | null;
    };
  };
}

export interface JobTitle {
  id: string;
  name: string;
  code?: string;
  description?: string;
  purpose?: string;
  requirement?: string;
  jobLevelId: string;
  divisionId?: number;
  directReportId?: string;
  type?: "Administration" | "Technical";
  // Relations (populated by API)
  jobLevel?: JobLevel;
  division?: { id: number; name: string; code: string | null };
  directReport?: { id: string; name: string; jobLevel: JobLevel } | null;
  departments?: DepartmentJobTitle[];
  // Legacy fields (kept for backward compatibility)
  departmentId?: string;
  department?: Department;
  // Can be string[] or rich text format (Slate.js nodes)
  responsibilities?: unknown;
  requirements?: unknown;
  createdAt: string;
  updatedAt: string;
}

// Recruitment Types
export interface JobPosting {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  departmentId: string;
  jobTitleId: string;
  jobLevelId: string;
  employmentType: "full_time" | "part_time" | "contract" | "internship";
  locationType: "onsite" | "remote" | "hybrid";
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  status: "draft" | "open" | "closed" | "on_hold";
  openDate?: string;
  closeDate?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  resumeUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  currentCompany?: string;
  currentPosition?: string;
  expectedSalary?: number;
  noticePeriod?: string;
  source: "linkedin" | "job_portal" | "referral" | "website" | "other";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: string;
  candidateId: string;
  jobPostingId: string;
  status: "applied" | "screening" | "interview" | "assessment" | "offer" | "hired" | "rejected";
  appliedDate: string;
  stage: number;
  rating?: number;
  notes?: string;
  interviews?: Interview[];
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationWithRelations extends Application {
  candidate?: Candidate;
  jobPosting?: JobPosting;
}

export interface Interview {
  id: string;
  applicationId: string;
  interviewerId: string;
  scheduledDate: string;
  duration: number;
  type: "phone" | "video" | "onsite" | "technical";
  status: "scheduled" | "completed" | "cancelled" | "rescheduled";
  feedback?: string;
  rating?: number;
  notes?: string;
}

// Dashboard Types
export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  newHires: number;
  openPositions: number;
  pendingApplications: number;
  departmentCount: number;
  avgTenure: number;
  turnoverRate: number;
}

export interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

// Common Types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface FilterState {
  search: string;
  status?: string;
  department?: string;
  division?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Employee Budget Types
export interface EmployeeBudget {
  id: string;
  departmentId: string;
  department?: Department;
  year: number;
  technical: number;
  admin: number;
  document?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeBudgetSummary {
  departmentId: string;
  departmentName: string;
  year: number;
  // Previous year data
  previousYear: {
    technical: number;
    admin: number;
    total: number;
  };
  // Current employee count
  currentEmployees: {
    technical: {
      male: number;
      female: number;
      total: number;
    };
    admin: {
      male: number;
      female: number;
      total: number;
    };
    total: number;
  };
  // Approved budget (current year)
  approvedBudget: {
    technical: number;
    admin: number;
    total: number;
  };
  // Rest budget (approved - current)
  restBudget: {
    technical: number;
    admin: number;
    total: number;
  };
  // Growth percentage
  growth: {
    technical: number;
    admin: number;
    total: number;
  };
}

export interface BudgetCalculation {
  rows: {
    type: "admin" | "technical";
    label: string;
    male: number;
    female: number;
    total: number;
  }[];
  totalCurrent: number;
  totalBudget: number;
  restBudget: number;
}

export interface RestBudgetData {
  departmentId: number;
  year: number;
  budget: { technical: number; admin: number; total: number };
  activeEmployees: { technical: number; admin: number; total: number };
  pendingRequests: { technical: number; admin: number; total: number };
  rest: { technical: number; admin: number; total: number };
}
