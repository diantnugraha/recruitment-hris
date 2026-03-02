import { get, post, put, del } from "@/lib/axios";
import type { ApiResponse } from "@/types";
import type {
  OnboardingData,
  OnboardingWithCandidate,
  CreateOnboardingRequest,
  UpdateOnboardingChecklistRequest,
  UpdateJobPlacementRequest,
  ChecklistItem,
  OnboardingDocument,
  JobPlacement,
} from "@/types/onboarding";
import type { OnboardingStatus } from "@/lib/constants/onboarding";

// --- API Response Types ---

interface ApiOnboarding {
  id: number;
  candidate_id: number;
  status: string;
  checklist: Array<{
    id: string;
    label: string;
    category: string;
    required: boolean;
    completed: boolean;
    completed_at?: string;
    completed_by?: string;
    notes?: string;
  }>;
  documents: Array<{
    id: number;
    candidate_id: number;
    type: string;
    file_name: string;
    file_url: string;
    file_size?: number;
    uploaded_at: string;
    uploaded_by?: string;
    status: string;
    notes?: string;
  }>;
  job_placement?: {
    job_title_id: number;
    department_id: number;
    division_id?: number;
    supervisor_id?: number;
    contract_type: string;
    start_date: string;
    contract_end_date?: string;
    work_location?: string;
    salary?: number;
    allowances?: number;
  };
  notes?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  candidate?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    status: string;
    job_title?: { id: number; name: string } | null;
    department?: { id: number; name: string; code: string } | null;
  };
}

// --- Mapping ---

function mapOnboarding(api: ApiOnboarding): OnboardingData {
  return {
    id: String(api.id),
    candidateId: String(api.candidate_id),
    status: api.status as OnboardingStatus,
    checklist: api.checklist.map((item) => ({
      id: item.id,
      label: item.label,
      category: item.category as ChecklistItem["category"],
      required: item.required,
      completed: item.completed,
      completedAt: item.completed_at,
      completedBy: item.completed_by,
      notes: item.notes,
    })),
    documents: api.documents.map((doc) => ({
      id: String(doc.id),
      candidateId: String(doc.candidate_id),
      type: doc.type as OnboardingDocument["type"],
      fileName: doc.file_name,
      fileUrl: doc.file_url,
      fileSize: doc.file_size,
      uploadedAt: doc.uploaded_at,
      uploadedBy: doc.uploaded_by,
      status: doc.status as OnboardingDocument["status"],
      notes: doc.notes,
    })),
    jobPlacement: api.job_placement
      ? {
          jobTitleId: String(api.job_placement.job_title_id),
          departmentId: String(api.job_placement.department_id),
          divisionId: api.job_placement.division_id
            ? String(api.job_placement.division_id)
            : undefined,
          supervisorId: api.job_placement.supervisor_id
            ? String(api.job_placement.supervisor_id)
            : undefined,
          contractType: api.job_placement.contract_type as JobPlacement["contractType"],
          startDate: api.job_placement.start_date,
          contractEndDate: api.job_placement.contract_end_date,
          workLocation: api.job_placement.work_location,
          salary: api.job_placement.salary,
          allowances: api.job_placement.allowances,
        }
      : undefined,
    notes: api.notes,
    startedAt: api.started_at,
    completedAt: api.completed_at,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

function mapOnboardingWithCandidate(api: ApiOnboarding): OnboardingWithCandidate {
  const base = mapOnboarding(api);
  return {
    ...base,
    candidate: api.candidate
      ? {
          id: String(api.candidate.id),
          firstName: api.candidate.first_name,
          lastName: api.candidate.last_name,
          email: api.candidate.email,
          phone: api.candidate.phone,
          status: api.candidate.status,
          jobTitle: api.candidate.job_title,
          department: api.candidate.department,
        }
      : {
          id: base.candidateId,
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          status: "",
        },
  };
}

// --- Service ---

export const onboardingService = {
  /**
   * Get all onboarding records with optional filters
   * NOTE: Backend endpoint needs to be implemented
   */
  async getAll(
    page: number = 1,
    limit: number = 20,
    filters?: {
      status?: string;
      candidate_name?: string;
    }
  ): Promise<
    ApiResponse<{
      data: OnboardingWithCandidate[];
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
      if (filters?.candidate_name) params.set("candidate_name", filters.candidate_name);

      const response = await get<unknown>(`/v1/onboarding?${params.toString()}`);
      const res = response as {
        success?: boolean;
        data?: ApiOnboarding[];
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
            data: res.data.map(mapOnboardingWithCandidate),
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
      console.error("Onboarding API Error:", error);
      return { success: false, message: "Failed to fetch onboarding data" };
    }
  },

  /**
   * Get onboarding by candidate ID
   * NOTE: Backend endpoint needs to be implemented
   */
  async getByCandidate(
    candidateId: string | number
  ): Promise<ApiResponse<OnboardingWithCandidate>> {
    try {
      const response = await get<unknown>(`/v1/onboarding/candidate/${candidateId}`);
      const res = response as { success?: boolean; data?: ApiOnboarding };

      if (res.success && res.data) {
        return { success: true, data: mapOnboardingWithCandidate(res.data) };
      }

      return { success: false, message: "Unexpected response format" };
    } catch (error: unknown) {
      return { success: false, message: "Failed to fetch onboarding data" };
    }
  },

  /**
   * Create onboarding record for a candidate
   * NOTE: Backend endpoint needs to be implemented
   */
  async create(
    data: CreateOnboardingRequest
  ): Promise<ApiResponse<OnboardingData>> {
    try {
      const response = await post<unknown, CreateOnboardingRequest>(
        "/v1/onboarding",
        data
      );
      const res = response as {
        success?: boolean;
        data?: ApiOnboarding;
        message?: string;
      };

      if (res.success && res.data) {
        return { success: true, data: mapOnboarding(res.data) };
      }

      return {
        success: false,
        message: res.message || "Unexpected response format",
      };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        message: err.response?.data?.message || "Failed to create onboarding",
      };
    }
  },

  /**
   * Update checklist items
   * NOTE: Backend endpoint needs to be implemented
   */
  async updateChecklist(
    candidateId: string | number,
    data: UpdateOnboardingChecklistRequest
  ): Promise<ApiResponse<OnboardingData>> {
    try {
      const response = await put<unknown, UpdateOnboardingChecklistRequest>(
        `/v1/onboarding/candidate/${candidateId}/checklist`,
        data
      );
      const res = response as {
        success?: boolean;
        data?: ApiOnboarding;
        message?: string;
      };

      if (res.success && res.data) {
        return { success: true, data: mapOnboarding(res.data) };
      }

      return {
        success: false,
        message: res.message || "Unexpected response format",
      };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        message: err.response?.data?.message || "Failed to update checklist",
      };
    }
  },

  /**
   * Update job placement
   * NOTE: Backend endpoint needs to be implemented
   */
  async updateJobPlacement(
    candidateId: string | number,
    data: UpdateJobPlacementRequest
  ): Promise<ApiResponse<OnboardingData>> {
    try {
      const response = await put<unknown, UpdateJobPlacementRequest>(
        `/v1/onboarding/candidate/${candidateId}/placement`,
        data
      );
      const res = response as {
        success?: boolean;
        data?: ApiOnboarding;
        message?: string;
      };

      if (res.success && res.data) {
        return { success: true, data: mapOnboarding(res.data) };
      }

      return {
        success: false,
        message: res.message || "Unexpected response format",
      };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        message: err.response?.data?.message || "Failed to update job placement",
      };
    }
  },

  /**
   * Upload document
   * NOTE: Backend endpoint needs to be implemented
   */
  async uploadDocument(
    candidateId: string | number,
    type: string,
    file: File,
    notes?: string
  ): Promise<ApiResponse<OnboardingDocument>> {
    try {
      const formData = new FormData();
      formData.append("type", type);
      formData.append("file", file);
      if (notes) formData.append("notes", notes);

      const response = await post<unknown, FormData>(
        `/v1/onboarding/candidate/${candidateId}/documents`,
        formData
      );
      const res = response as {
        success?: boolean;
        data?: ApiOnboarding["documents"][0];
        message?: string;
      };

      if (res.success && res.data) {
        return {
          success: true,
          data: {
            id: String(res.data.id),
            candidateId: String(res.data.candidate_id),
            type: res.data.type as OnboardingDocument["type"],
            fileName: res.data.file_name,
            fileUrl: res.data.file_url,
            fileSize: res.data.file_size,
            uploadedAt: res.data.uploaded_at,
            uploadedBy: res.data.uploaded_by,
            status: res.data.status as OnboardingDocument["status"],
            notes: res.data.notes,
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
        message: err.response?.data?.message || "Failed to upload document",
      };
    }
  },

  /**
   * Delete document
   * NOTE: Backend endpoint needs to be implemented
   */
  async deleteDocument(
    candidateId: string | number,
    documentId: string | number
  ): Promise<ApiResponse<void>> {
    try {
      await del<unknown>(
        `/v1/onboarding/candidate/${candidateId}/documents/${documentId}`
      );
      return { success: true };
    } catch (error: unknown) {
      return { success: false, message: "Failed to delete document" };
    }
  },

  /**
   * Mark onboarding as complete and convert candidate to employee
   * NOTE: Backend endpoint needs to be implemented
   */
  async complete(
    candidateId: string | number
  ): Promise<ApiResponse<{ employeeId: string }>> {
    try {
      const response = await post<unknown, Record<string, never>>(
        `/v1/onboarding/candidate/${candidateId}/complete`,
        {}
      );
      const res = response as {
        success?: boolean;
        data?: { employee_id: number };
        message?: string;
      };

      if (res.success && res.data) {
        return {
          success: true,
          data: { employeeId: String(res.data.employee_id) },
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
        message: err.response?.data?.message || "Failed to complete onboarding",
      };
    }
  },
};

export default onboardingService;
