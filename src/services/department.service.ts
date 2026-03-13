import { get, post, put, del } from "@/lib/axios";
import { Department, ApiResponse, PaginatedResponse } from "@/types";

export interface CreateDepartmentRequest {
  name: string;
  code: string;
  category: "Profit Center" | "Non Profit Center";
  description?: string;
  obsId: string;
  divisionId?: string;
  headId?: string;
}

export interface UpdateDepartmentRequest {
  name?: string;
  code?: string;
  category?: "Profit Center" | "Non Profit Center";
  description?: string;
  obsId?: string;
  divisionId?: string;
  headId?: string;
}

export interface DepartmentPaginatedResponse {
  data: Department[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DepartmentStats {
  totalDepartments: number;
  totalEmployees: number;
}

export const departmentService = {
  // Get all departments with pagination
  async getAll(page: number = 1, limit: number = 100): Promise<ApiResponse<DepartmentPaginatedResponse>> {
    try {
      const response = await get<unknown>(`/v1/department?page=${page}&limit=${limit}`);

      const res = response as { success?: boolean; data?: Department[]; pagination?: DepartmentPaginatedResponse["pagination"] };

      // API returns: { success: true, data: [...], pagination: {...} }
      if (res.data && Array.isArray(res.data)) {
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
            data: response as Department[],
            pagination: { page: 1, limit: response.length, total: response.length, totalPages: 1 },
          },
        };
      }

      return { success: false, message: "Unexpected response format" };
    } catch (error: unknown) {
      return {
        success: false,
        message: "Failed to fetch departments",
      };
    }
  },

  // Fetch all departments by auto-paginating (API max limit is 100)
  async fetchAll(): Promise<ApiResponse<Department[]>> {
    try {
      const allData: Department[] = [];
      let page = 1;
      let totalPages = 1;

      do {
        const res = await this.getAll(page, 100);
        if (res.success && res.data) {
          allData.push(...res.data.data);
          totalPages = res.data.pagination.totalPages;
        } else {
          return { success: false, message: res.message || "Failed to fetch departments" };
        }
        page++;
      } while (page <= totalPages);

      return { success: true, data: allData };
    } catch (error: unknown) {
      return { success: false, message: "Failed to fetch departments" };
    }
  },

  // Get departments with pagination
  async getPaginated(
    page: number = 1,
    pageSize: number = 10
  ): Promise<ApiResponse<PaginatedResponse<Department>>> {
    try {
      const response = await get<ApiResponse<PaginatedResponse<Department>>>(
        `/v1/department?page=${page}&pageSize=${pageSize}`
      );
      return response;
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: ApiResponse<PaginatedResponse<Department>> };
      };
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: "Failed to fetch departments",
      };
    }
  },

  // Get single department by ID
  async getById(id: string): Promise<ApiResponse<Department>> {
    try {
      const response = await get<ApiResponse<Department>>(`/v1/department/${id}`);
      return response;
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<Department> } };
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: "Failed to fetch department",
      };
    }
  },

  // Get departments by division ID
  async getByDivisionId(divisionId: string): Promise<ApiResponse<Department[]>> {
    try {
      const response = await get<unknown>(
        `/v1/department?division_id=${divisionId}`
      );

      const res = response as { success?: boolean; data?: Department[] };
      if (res.data && Array.isArray(res.data)) {
        return { success: true, data: res.data };
      }
      if (Array.isArray(response)) {
        return { success: true, data: response as Department[] };
      }
      return { success: false, message: "Unexpected response format" };
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<Department[]> } };
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: "Failed to fetch departments",
      };
    }
  },

  // Get department statistics (calculated from getAll response)
  async getStats(): Promise<ApiResponse<DepartmentStats>> {
    try {
      const response = await this.getAll(1, 1);
      if (response.success && response.data) {
        return {
          success: true,
          data: {
            totalDepartments: response.data.pagination.total,
            totalEmployees: 0, // Not available from department API
          },
        };
      }
      return {
        success: false,
        message: "Failed to fetch department stats",
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: "Failed to fetch department stats",
      };
    }
  },

  // Create new department
  async create(data: CreateDepartmentRequest): Promise<ApiResponse<Department>> {
    try {
      const response = await post<ApiResponse<Department>, CreateDepartmentRequest>(
        "/v1/department",
        data
      );
      return response;
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<Department> } };
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: "Failed to create department",
      };
    }
  },

  // Update department
  async update(
    id: string,
    data: UpdateDepartmentRequest
  ): Promise<ApiResponse<Department>> {
    try {
      const response = await put<ApiResponse<Department>, UpdateDepartmentRequest>(
        `/v1/department/${id}`,
        data
      );
      return response;
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<Department> } };
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: "Failed to update department",
      };
    }
  },

  // Delete department
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await del<ApiResponse<void>>(`/v1/department/${id}`);
      return response;
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<void> } };
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: "Failed to delete department",
      };
    }
  },
};

export default departmentService;
