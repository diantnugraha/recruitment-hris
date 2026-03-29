import { get, post, put, del } from "@/lib/axios";
import type { ApiResponse } from "@/types";
import type { SlaInfo } from "@/lib/constants/sla";
import type {
  EmployeeRequest,
  EmployeeRequestWithRelations,
  EmployeeRequestComment,
  EmployeeRequestStats,
  CreateEmployeeRequestDTO,
  UpdateEmployeeRequestDTO,
  UpdateEmployeeRequestStatusDTO,
  EmployeeRequestFilters,
} from "@/types/employee-request";
import type { EmployeeRequestStatus } from "@/lib/constants/employeeRequest";

// --- API Response Types ---
// Note: API field names match database columns

interface ApiEmployeeRequest {
  id: number;
  code: string;
  job_title_id: number;
  department_id?: number;
  division_id?: number;
  // In DB: purpose = type (new/replacement), reason = description (HTML)
  purpose: string; // "new" | "replacement" - maps to frontend "reason"
  reason: string; // HTML description - maps to frontend "purpose"
  general_job_purpose?: string;
  quantity?: number;
  employment_type?: string;
  education?: string;
  experience?: string;
  gender_preference?: string;
  age_min?: number;
  age_max?: number;
  job_placement?: string;
  headcount?: number;
  expected_onboard_date?: string;
  job_description?: string;
  job_requirement?: string;
  // In DB: status_employee_request and status_recruitment
  status_employee_request: number;
  status_recruitment?: number;
  status?: string; // For backward compatibility if API transforms it
  recruitment_code?: string;
  requested_by_id?: string;
  requested_by_name?: string;
  hod_reviewed_by?: number | null;
  hod_reviewed_at?: string | null;
  hr_reviewed_by?: number | null;
  hr_reviewed_at?: string | null;
  approved_by?: number | null;
  approved_at?: string | null;
  revised_by?: number | null;
  revised_at?: string | null;
  rejected_by?: number | null;
  rejected_at?: string | null;
  recruitment_started_at?: string | null;
  sla?: SlaInfo | null;
  created_at: string;
  updated_at: string;
  job_title?: { id: number; name: string } | null;
  department?: { id: number; name: string; code: string } | null;
  division?: { id: number; name: string } | null;
  requested_by?: {
    id: string;
    name: string;
    email: string;
  } | null;
  comments?: Array<{
    id: number;
    employee_request_id: number;
    user_id: string;
    user_name?: string;
    user_role?: string;
    action: string;
    comment: string;
    previous_status?: string;
    new_status?: string;
    created_at: string;
  }>;
  candidate_count?: number;
}

// --- Status Mapping ---
// Map numeric status_employee_request to string status

const STATUS_MAP: Record<number, EmployeeRequestStatus> = {
  0: "draft",
  1: "created",           // Waiting for HOD Review
  8: "hod_reviewed",      // HOD Reviewed, waiting for HR Review
  2: "reviewed",          // HR Reviewed, waiting for Management Approval
  3: "approved",
  4: "rejected",
  5: "revise",
  6: "in_recruitment",
  7: "completed",
};

function mapStatusFromNumber(statusNum: number): EmployeeRequestStatus {
  return STATUS_MAP[statusNum] || "draft";
}

// --- Mapping ---

function mapEmployeeRequest(api: ApiEmployeeRequest): EmployeeRequestWithRelations {
  // Determine status - could be number (status_employee_request) or string (status)
  let status: EmployeeRequestStatus = "draft";
  if (api.status_employee_request !== undefined) {
    status = mapStatusFromNumber(api.status_employee_request);
  } else if (api.status) {
    status = api.status as EmployeeRequestStatus;
  }

  return {
    id: String(api.id),
    code: api.code,
    jobTitleId: String(api.job_title_id),
    departmentId: api.department_id ? String(api.department_id) : "",
    divisionId: api.division_id ? String(api.division_id) : undefined,
    // DB purpose (new/replacement) → frontend reason
    // DB reason (HTML description) → frontend purpose
    reason: api.purpose as EmployeeRequest["reason"],
    purpose: api.reason || api.general_job_purpose || "",
    quantity: api.quantity || 1,
    employmentType: (api.employment_type || "permanent") as EmployeeRequest["employmentType"],
    education: (api.education || "s1") as EmployeeRequest["education"],
    experience: api.experience || "",
    genderPreference: (api.gender_preference || "any") as EmployeeRequest["genderPreference"],
    ageMin: api.age_min,
    ageMax: api.age_max,
    jobPlacement: api.job_placement,
    headcount: api.headcount || 1,
    expectedOnboardDate: api.expected_onboard_date,
    generalJobPurpose: api.general_job_purpose,
    jobDescription: api.job_description,
    jobRequirement: api.job_requirement,
    status, // Use the computed status variable
    recruitmentCode: api.recruitment_code,
    hodReviewedBy: api.hod_reviewed_by ?? null,
    hodReviewedAt: api.hod_reviewed_at ?? null,
    hrReviewedBy: api.hr_reviewed_by ?? null,
    hrReviewedAt: api.hr_reviewed_at ?? null,
    approvedBy: api.approved_by ?? null,
    approvedAt: api.approved_at ?? null,
    revisedBy: api.revised_by ?? null,
    revisedAt: api.revised_at ?? null,
    rejectedBy: api.rejected_by ?? null,
    rejectedAt: api.rejected_at ?? null,
    recruitmentStartedAt: api.recruitment_started_at || null,
    sla: api.sla || null,
    requestedById: Number(api.requested_by_id) || 0,
    requestedByName: api.requested_by_name,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
    jobTitle: api.job_title,
    department: api.department,
    division: api.division,
    requestedBy: api.requested_by,
    comments: api.comments?.map((c) => ({
      id: String(c.id),
      employeeRequestId: String(c.employee_request_id),
      userId: c.user_id,
      userName: c.user_name,
      userRole: c.user_role,
      action: c.action as EmployeeRequestComment["action"],
      comment: c.comment,
      previousStatus: c.previous_status as EmployeeRequestStatus | undefined,
      newStatus: c.new_status as EmployeeRequestStatus | undefined,
      createdAt: c.created_at,
    })),
    candidateCount: api.candidate_count,
  };
}

// --- Service ---

export const employeeRequestService = {
  /**
   * Get all employee requests with pagination and filters
   */
  async getAll(
    page: number = 1,
    limit: number = 20,
    filters?: EmployeeRequestFilters
  ): Promise<
    ApiResponse<{
      data: EmployeeRequestWithRelations[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>
  > {
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (filters?.status) params.set("status", filters.status);
      if (filters?.department_id) params.set("department_id", String(filters.department_id));
      if (filters?.job_title_id) params.set("job_title_id", String(filters.job_title_id));
      if (filters?.requested_by_id) params.set("requested_by_id", filters.requested_by_id);
      if (filters?.search) params.set("search", filters.search);

      const response = await get<unknown>(`/v1/employee-request?${params.toString()}`);
      const res = response as {
        success?: boolean;
        data?: ApiEmployeeRequest[];
        pagination?: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      };

      if (res.success && res.data) {
        return {
          success: true,
          data: {
            data: res.data.map(mapEmployeeRequest),
            pagination: res.pagination || {
              page: 1,
              limit: res.data.length,
              total: res.data.length,
              totalPages: 1,
            },
          },
        };
      }

      return { success: false, message: "Unexpected response format" };
    } catch (error: unknown) {
      console.error("Employee Request API Error:", error);
      return { success: false, message: "Failed to fetch employee requests" };
    }
  },

  /**
   * Get employee request by ID
   */
  async getById(id: string | number): Promise<ApiResponse<EmployeeRequestWithRelations>> {
    try {
      const response = await get<unknown>(`/v1/employee-request/${id}`);
      const res = response as { success?: boolean; data?: ApiEmployeeRequest };

      if (res.success && res.data) {
        return { success: true, data: mapEmployeeRequest(res.data) };
      }

      return { success: false, message: "Unexpected response format" };
    } catch (error: unknown) {
      return { success: false, message: "Failed to fetch employee request" };
    }
  },

  /**
   * Create new employee request
   */
  async create(data: CreateEmployeeRequestDTO): Promise<ApiResponse<EmployeeRequestWithRelations>> {
    try {
      const response = await post<unknown, CreateEmployeeRequestDTO>(
        "/v1/employee-request",
        data
      );
      const res = response as {
        success?: boolean;
        data?: ApiEmployeeRequest;
        message?: string;
      };

      if (res.success && res.data) {
        return { success: true, data: mapEmployeeRequest(res.data) };
      }

      return {
        success: false,
        message: res.message || "Unexpected response format",
      };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        message: err.response?.data?.message || "Failed to create employee request",
      };
    }
  },

  /**
   * Update employee request
   */
  async update(
    id: string | number,
    data: UpdateEmployeeRequestDTO
  ): Promise<ApiResponse<EmployeeRequestWithRelations>> {
    try {
      const response = await put<unknown, UpdateEmployeeRequestDTO>(
        `/v1/employee-request/${id}`,
        data
      );
      const res = response as {
        success?: boolean;
        data?: ApiEmployeeRequest;
        message?: string;
      };

      if (res.success && res.data) {
        return { success: true, data: mapEmployeeRequest(res.data) };
      }

      return {
        success: false,
        message: res.message || "Unexpected response format",
      };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        message: err.response?.data?.message || "Failed to update employee request",
      };
    }
  },

  /**
   * Update employee request status (workflow action)
   */
  async updateStatus(
    id: string | number,
    data: UpdateEmployeeRequestStatusDTO
  ): Promise<ApiResponse<EmployeeRequestWithRelations>> {
    try {
      const response = await put<unknown, UpdateEmployeeRequestStatusDTO>(
        `/v1/employee-request/${id}/status`,
        data
      );
      const res = response as {
        success?: boolean;
        data?: ApiEmployeeRequest;
        message?: string;
      };

      if (res.success && res.data) {
        return { success: true, data: mapEmployeeRequest(res.data) };
      }

      return {
        success: false,
        message: res.message || "Unexpected response format",
      };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        message: err.response?.data?.message || "Failed to update status",
      };
    }
  },

  /**
   * Add comment to employee request
   */
  async addComment(
    id: string | number,
    comment: string
  ): Promise<ApiResponse<EmployeeRequestComment>> {
    try {
      const response = await post<unknown, { comment: string }>(
        `/v1/employee-request/${id}/comments`,
        { comment }
      );
      const res = response as {
        success?: boolean;
        data?: {
          id: number;
          employee_request_id: number;
          user_id: string;
          user_name?: string;
          user_role?: string;
          action: string;
          comment: string;
          previous_status?: string;
          new_status?: string;
          created_at: string;
        };
        message?: string;
      };

      if (res.success && res.data) {
        return {
          success: true,
          data: {
            id: String(res.data.id),
            employeeRequestId: String(res.data.employee_request_id),
            userId: res.data.user_id,
            userName: res.data.user_name,
            userRole: res.data.user_role,
            action: res.data.action as EmployeeRequestComment["action"],
            comment: res.data.comment,
            previousStatus: res.data.previous_status as EmployeeRequestStatus | undefined,
            newStatus: res.data.new_status as EmployeeRequestStatus | undefined,
            createdAt: res.data.created_at,
          },
        };
      }

      return {
        success: false,
        message: res.message || "Unexpected response format",
      };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        message: err.response?.data?.message || "Failed to add comment",
      };
    }
  },

  /**
   * Delete employee request
   */
  async delete(id: string | number): Promise<ApiResponse<void>> {
    try {
      await del<unknown>(`/v1/employee-request/${id}`);
      return { success: true };
    } catch (error: unknown) {
      return { success: false, message: "Failed to delete employee request" };
    }
  },

  /**
   * Get stats/summary
   */
  async getStats(): Promise<ApiResponse<EmployeeRequestStats>> {
    try {
      const response = await get<unknown>("/v1/employee-request/stats");
      const res = response as { success?: boolean; data?: EmployeeRequestStats };

      if (res.success && res.data) {
        return { success: true, data: res.data };
      }

      return { success: false, message: "Unexpected response format" };
    } catch (error: unknown) {
      return { success: false, message: "Failed to fetch stats" };
    }
  },

  /**
   * Start recruitment from approved request
   */
  /**
   * Download PDF for employee request
   */
  async downloadPdf(id: string | number): Promise<void> {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

    const response = await fetch(`${baseURL}/v1/employee-request/${id}/pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      throw new Error("Failed to generate PDF");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Employee-Request-${id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  async startRecruitment(id: string | number): Promise<ApiResponse<EmployeeRequestWithRelations>> {
    try {
      const response = await post<unknown, Record<string, never>>(
        `/v1/employee-request/${id}/start-recruitment`,
        {}
      );
      const res = response as {
        success?: boolean;
        data?: ApiEmployeeRequest;
        message?: string;
      };

      if (res.success && res.data) {
        return { success: true, data: mapEmployeeRequest(res.data) };
      }

      return {
        success: false,
        message: res.message || "Unexpected response format",
      };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        message: err.response?.data?.message || "Failed to start recruitment",
      };
    }
  },
};

export default employeeRequestService;
