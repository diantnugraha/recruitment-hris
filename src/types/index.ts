// Auth Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "hr" | "manager" | "employee";
  avatar?: string;
  employeeId?: string;
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
export interface Employee {
  id: string;
  employeeId: string;
  employeeNik?: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  employeeContact?: string | null;
  dateOfBirth: string;
  gender: "male" | "female";
  address: string;
  hireDate: string;
  status: "active" | "inactive" | "on_leave" | "terminated";
  departmentId: string;
  divisionId: string;
  jobTitleId: string;
  jobLevelId: string;
  managerId?: string;
  photo?: string;
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
  cluster: string;
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
  description?: string;
  divisionId: string;
  headId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobLevel {
  id: string;
  name: string;
  category: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobTitle {
  id: string;
  name: string;
  code: string;
  description?: string;
  jobLevelId: string;
  departmentId?: string;
  // Relations (populated by API)
  jobLevel?: JobLevel;
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
