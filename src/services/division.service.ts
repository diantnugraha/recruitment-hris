import { get, post, put, del } from "@/lib/axios";
import { Division, ApiResponse, PaginatedResponse } from "@/types";

export interface CreateDivisionRequest {
  name: string;
  code: string;
  description?: string;
  organizationId: string;
  headId?: string;
}

export interface UpdateDivisionRequest {
  name?: string;
  code?: string;
  description?: string;
  organizationId?: string;
  headId?: string;
}

export interface DivisionStats {
  totalDivisions: number;
  totalDepartments: number;
  totalEmployees: number;
}

export interface DivisionPaginatedResponse {
  data: Division[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const divisionService = {
  // Get all divisions with pagination
  async getAll(page: number = 1, limit: number = 100): Promise<ApiResponse<DivisionPaginatedResponse>> {
    try {
      const response = await get<unknown>(`/v1/division?page=${page}&limit=${limit}`);
      console.log("Raw Division API Response:", response);

      const res = response as { success?: boolean; data?: Division[]; pagination?: DivisionPaginatedResponse["pagination"] };

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
            data: response as Division[],
            pagination: { page: 1, limit: response.length, total: response.length, totalPages: 1 },
          },
        };
      }

      return { success: false, message: "Unexpected response format" };
    } catch (error: unknown) {
      console.error("Division API Error:", error);
      return {
        success: false,
        message: "Failed to fetch divisions",
      };
    }
  },

  // Get divisions with pagination
  async getPaginated(
    page: number = 1,
    pageSize: number = 10
  ): Promise<ApiResponse<PaginatedResponse<Division>>> {
    try {
      const response = await get<ApiResponse<PaginatedResponse<Division>>>(
        `/v1/division?page=${page}&pageSize=${pageSize}`
      );
      return response;
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: ApiResponse<PaginatedResponse<Division>> };
      };
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: "Failed to fetch divisions",
      };
    }
  },

  // Get single division by ID
  async getById(id: string): Promise<ApiResponse<Division>> {
    try {
      const response = await get<ApiResponse<Division>>(`/v1/division/${id}`);
      return response;
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<Division> } };
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: "Failed to fetch division",
      };
    }
  },

  // Get divisions by organization ID
  async getByOrganizationId(organizationId: string): Promise<ApiResponse<Division[]>> {
    try {
      const response = await get<ApiResponse<Division[]>>(
        `/v1/division?organizationId=${organizationId}`
      );
      return response;
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<Division[]> } };
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: "Failed to fetch divisions",
      };
    }
  },

  // Create new division
  async create(data: CreateDivisionRequest): Promise<ApiResponse<Division>> {
    try {
      const response = await post<ApiResponse<Division>, CreateDivisionRequest>(
        "/v1/division",
        data
      );
      return response;
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<Division> } };
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: "Failed to create division",
      };
    }
  },

  // Update division
  async update(
    id: string,
    data: UpdateDivisionRequest
  ): Promise<ApiResponse<Division>> {
    try {
      const response = await put<ApiResponse<Division>, UpdateDivisionRequest>(
        `/v1/division/${id}`,
        data
      );
      return response;
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<Division> } };
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: "Failed to update division",
      };
    }
  },

  // Delete division
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await del<ApiResponse<void>>(`/v1/division/${id}`);
      return response;
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<void> } };
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: "Failed to delete division",
      };
    }
  },
};

export default divisionService;
