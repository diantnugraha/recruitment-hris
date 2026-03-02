import { get, post, put, del } from "@/lib/axios";
import { JobTitle, ApiResponse } from "@/types";

// Request body matches backend schema (snake_case)
export interface CreateJobTitleRequest {
  name: string;
  job_level_id: number;
  division_id?: number;
  direct_report_id?: number;
  type?: "Administration" | "Technical";
  description?: string;
  purpose?: string;
  requirement?: string;
  department_sync?: number[];
}

export interface UpdateJobTitleRequest {
  name?: string;
  job_level_id?: number;
  division_id?: number;
  direct_report_id?: number;
  type?: "Administration" | "Technical";
  description?: string;
  purpose?: string;
  requirement?: string;
  department_sync?: number[];
}

export interface JobTitlePaginatedResponse {
  data: JobTitle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const jobTitleService = {
  // Get all job titles with pagination
  async getAll(page: number = 1, limit: number = 100): Promise<ApiResponse<JobTitlePaginatedResponse>> {
    try {
      // Ensure page and limit are valid numbers (API max limit is 100)
      const validPage = Math.max(1, Math.floor(page));
      const validLimit = Math.max(1, Math.min(100, Math.floor(limit)));

      const response = await get<unknown>(`/v1/job-title?page=${validPage}&limit=${validLimit}`);

      const res = response as { success?: boolean; data?: JobTitle[]; pagination?: JobTitlePaginatedResponse["pagination"] };

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
            data: response as JobTitle[],
            pagination: { page: 1, limit: response.length, total: response.length, totalPages: 1 },
          },
        };
      }

      return { success: false, message: "Unexpected response format" };
    } catch (error: unknown) {
      console.error("Job Title API Error:", error);
      return {
        success: false,
        message: "Failed to fetch job titles",
      };
    }
  },

  // Fetch all job titles by auto-paginating (API max limit is 100)
  async fetchAll(): Promise<ApiResponse<JobTitle[]>> {
    try {
      const allData: JobTitle[] = [];
      let page = 1;
      let totalPages = 1;

      do {
        const res = await this.getAll(page, 100);
        if (res.success && res.data) {
          allData.push(...res.data.data);
          totalPages = res.data.pagination.totalPages;
        } else {
          return { success: false, message: res.message || "Failed to fetch job titles" };
        }
        page++;
      } while (page <= totalPages);

      return { success: true, data: allData };
    } catch (error: unknown) {
      console.error("Job Title fetchAll Error:", error);
      return { success: false, message: "Failed to fetch job titles" };
    }
  },

  // Get single job title by ID
  async getById(id: string): Promise<ApiResponse<JobTitle>> {
    try {
      const response = await get<ApiResponse<JobTitle>>(`/v1/job-title/${id}`);
      return response;
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<JobTitle> } };
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: "Failed to fetch job title",
      };
    }
  },

  // Get job titles by job level ID
  async getByJobLevelId(jobLevelId: number): Promise<ApiResponse<JobTitle[]>> {
    try {
      const response = await get<ApiResponse<JobTitle[]>>(
        `/v1/job-title?job_level_id=${jobLevelId}`
      );
      return response;
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<JobTitle[]> } };
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: "Failed to fetch job titles",
      };
    }
  },

  // Get job titles by department ID
  async getByDepartmentId(departmentId: number): Promise<ApiResponse<JobTitle[]>> {
    try {
      const response = await get<ApiResponse<JobTitle[]>>(
        `/v1/job-title?department_id=${departmentId}`
      );
      return response;
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<JobTitle[]> } };
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: "Failed to fetch job titles",
      };
    }
  },

  // Create new job title
  async create(data: CreateJobTitleRequest): Promise<ApiResponse<JobTitle>> {
    try {
      const response = await post<ApiResponse<JobTitle>, CreateJobTitleRequest>(
        "/v1/job-title",
        data
      );
      return response;
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<JobTitle> } };
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: "Failed to create job title",
      };
    }
  },

  // Update job title
  async update(
    id: string,
    data: UpdateJobTitleRequest
  ): Promise<ApiResponse<JobTitle>> {
    try {
      const response = await put<ApiResponse<JobTitle>, UpdateJobTitleRequest>(
        `/v1/job-title/${id}`,
        data
      );
      return response;
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<JobTitle> } };
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: "Failed to update job title",
      };
    }
  },

  // Delete job title
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await del<ApiResponse<void>>(`/v1/job-title/${id}`);
      return response;
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<void> } };
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: "Failed to delete job title",
      };
    }
  },
};

export default jobTitleService;
