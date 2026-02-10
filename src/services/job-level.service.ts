import { get, post, put, del } from "@/lib/axios";
import { JobLevel, ApiResponse } from "@/types";

export interface CreateJobLevelRequest {
  name: string;
  code: string;
  level: number;
  description?: string;
  minSalary?: number;
  maxSalary?: number;
}

export interface UpdateJobLevelRequest {
  name?: string;
  code?: string;
  level?: number;
  description?: string;
  minSalary?: number;
  maxSalary?: number;
}

export interface JobLevelPaginatedResponse {
  data: JobLevel[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const jobLevelService = {
  // Get all job levels with pagination
  async getAll(page: number = 1, limit: number = 100): Promise<ApiResponse<JobLevelPaginatedResponse>> {
    try {
      const response = await get<unknown>(`/v1/job-level?page=${page}&limit=${limit}`);
      console.log("Raw Job Level API Response:", response);

      const res = response as { success?: boolean; data?: JobLevel[]; pagination?: JobLevelPaginatedResponse["pagination"] };

      // API returns: { success: true, data: [...], pagination: {...} }
      if (res.success && res.data) {
        return {
          success: true,
          data: {
            data: res.data,
            pagination: res.pagination || {
              page: 1,
              limit: res.data.length,
              total: res.data.length,
              totalPages: 1,
            },
          },
        };
      }

      // Handle direct array response
      if (Array.isArray(response)) {
        return {
          success: true,
          data: {
            data: response as JobLevel[],
            pagination: { page: 1, limit: response.length, total: response.length, totalPages: 1 },
          },
        };
      }

      return { success: false, message: "Unexpected response format" };
    } catch (error: unknown) {
      console.error("Job Level API Error:", error);
      return {
        success: false,
        message: "Failed to fetch job levels",
      };
    }
  },

  // Get single job level by ID
  async getById(id: string): Promise<ApiResponse<JobLevel>> {
    try {
      const response = await get<ApiResponse<JobLevel>>(`/v1/job-level/${id}`);
      return response;
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<JobLevel> } };
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: "Failed to fetch job level",
      };
    }
  },

  // Create new job level
  async create(data: CreateJobLevelRequest): Promise<ApiResponse<JobLevel>> {
    try {
      const response = await post<ApiResponse<JobLevel>, CreateJobLevelRequest>(
        "/v1/joblevel",
        data
      );
      return response;
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<JobLevel> } };
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: "Failed to create job level",
      };
    }
  },

  // Update job level
  async update(
    id: string,
    data: UpdateJobLevelRequest
  ): Promise<ApiResponse<JobLevel>> {
    try {
      const response = await put<ApiResponse<JobLevel>, UpdateJobLevelRequest>(
        `/v1/job-level/${id}`,
        data
      );
      return response;
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<JobLevel> } };
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: "Failed to update job level",
      };
    }
  },

  // Delete job level
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await del<ApiResponse<void>>(`/v1/job-level/${id}`);
      return response;
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<void> } };
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: "Failed to delete job level",
      };
    }
  },
};

export default jobLevelService;
