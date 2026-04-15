import { post, get, put } from "@/lib/axios";
import type { ApiResponse } from "@/types";

// --- Types ---

export interface CandidatePortalProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  source: string | null;
  currentCompany: string | null;
  currentPosition: string | null;
  expectedSalary: number | null;
  noticePeriod: string | null;
  resumeUrl: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  notes: string | null;
  appliedDate: string;
  jobTitleId: string | null;
  departmentId: string | null;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  jobTitle?: { id: number; name: string } | null;
  department?: { id: number; name: string; code: string } | null;
}

export interface CandidateAuthResponse {
  candidate: CandidatePortalProfile;
  token: string;
}

export interface CandidateLoginRequest {
  email: string;
  token: string;
}

export interface CandidateProfileUpdateRequest {
  phone?: string;
  currentCompany?: string;
  currentPosition?: string;
  expectedSalary?: number;
  noticePeriod?: string;
  resumeUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  notes?: string;
}

// --- API Response Types ---

interface ApiCandidate {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  status: string;
  source: string | null;
  current_company: string | null;
  current_position: string | null;
  expected_salary: number | null;
  notice_period: string | null;
  resume_url: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  notes: string | null;
  applied_date: string;
  job_title_id: number | null;
  department_id: number | null;
  verified: boolean;
  created_at: string;
  updated_at: string;
  job_title?: { id: number; name: string } | null;
  department?: { id: number; name: string; code: string } | null;
}

// --- Mapping ---

function mapCandidate(api: ApiCandidate): CandidatePortalProfile {
  return {
    id: String(api.id),
    firstName: api.first_name,
    lastName: api.last_name,
    email: api.email,
    phone: api.phone || "",
    status: api.status,
    source: api.source,
    currentCompany: api.current_company,
    currentPosition: api.current_position,
    expectedSalary: api.expected_salary,
    noticePeriod: api.notice_period,
    resumeUrl: api.resume_url,
    linkedinUrl: api.linkedin_url,
    portfolioUrl: api.portfolio_url,
    notes: api.notes,
    appliedDate: api.applied_date,
    jobTitleId: api.job_title_id ? String(api.job_title_id) : null,
    departmentId: api.department_id ? String(api.department_id) : null,
    verified: api.verified,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
    jobTitle: api.job_title,
    department: api.department,
  };
}

// --- Service ---

export const candidateAuthService = {
  async login(data: CandidateLoginRequest): Promise<ApiResponse<CandidateAuthResponse>> {
    try {
      const response = await post<unknown, CandidateLoginRequest>(
        "/v1/candidate-auth/login",
        data
      );
      const res = response as {
        success?: boolean;
        data?: { candidate: ApiCandidate; token: string };
        message?: string;
      };

      if (res.success && res.data) {
        return {
          success: true,
          data: {
            candidate: mapCandidate(res.data.candidate),
            token: res.data.token,
          },
        };
      }

      return { success: false, message: res.message || "Login failed" };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        message: err.response?.data?.message || "Login failed",
      };
    }
  },

  async verifyToken(email: string, token: string): Promise<ApiResponse<{ valid: boolean }>> {
    try {
      const response = await post<unknown, { email: string; token: string }>(
        "/v1/candidate-auth/verify",
        { email, token }
      );
      const res = response as { success?: boolean; data?: { valid: boolean } };

      if (res.success && res.data) {
        return { success: true, data: res.data };
      }

      return { success: false, message: "Verification failed" };
    } catch (error: unknown) {
      return { success: false, message: "Verification failed" };
    }
  },

  async getProfile(): Promise<ApiResponse<CandidatePortalProfile>> {
    try {
      const response = await get<unknown>("/v1/candidate-auth/profile");
      const res = response as { success?: boolean; data?: ApiCandidate };

      if (res.success && res.data) {
        return { success: true, data: mapCandidate(res.data) };
      }

      return { success: false, message: "Failed to get profile" };
    } catch (error: unknown) {
      return { success: false, message: "Failed to get profile" };
    }
  },

  async updateProfile(
    data: CandidateProfileUpdateRequest
  ): Promise<ApiResponse<CandidatePortalProfile>> {
    try {
      // Convert camelCase to snake_case for API
      const apiData: Record<string, unknown> = {};
      if (data.phone !== undefined) apiData.phone = data.phone;
      if (data.currentCompany !== undefined) apiData.currentCompany = data.currentCompany;
      if (data.currentPosition !== undefined) apiData.currentPosition = data.currentPosition;
      if (data.expectedSalary !== undefined) apiData.expectedSalary = data.expectedSalary;
      if (data.noticePeriod !== undefined) apiData.noticePeriod = data.noticePeriod;
      if (data.resumeUrl !== undefined) apiData.resumeUrl = data.resumeUrl;
      if (data.linkedinUrl !== undefined) apiData.linkedinUrl = data.linkedinUrl;
      if (data.portfolioUrl !== undefined) apiData.portfolioUrl = data.portfolioUrl;
      if (data.notes !== undefined) apiData.notes = data.notes;

      const response = await put<unknown, typeof apiData>(
        "/v1/candidate-auth/profile",
        apiData
      );
      const res = response as { success?: boolean; data?: ApiCandidate; message?: string };

      if (res.success && res.data) {
        return { success: true, data: mapCandidate(res.data) };
      }

      return { success: false, message: res.message || "Failed to update profile" };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        message: err.response?.data?.message || "Failed to update profile",
      };
    }
  },

  // Store/clear candidate token in localStorage
  setToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("candidate_auth_token", token);
    }
  },

  getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("candidate_auth_token");
    }
    return null;
  },

  clearToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("candidate_auth_token");
    }
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};

export default candidateAuthService;
