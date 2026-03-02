import { get, post, put, del } from "@/lib/axios";
import { Division, ApiResponse } from "@/types";

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

      const res = response as {
        success?: boolean;
        data?: Division[];
        pagination?: DivisionPaginatedResponse["pagination"];
      };

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

  // Fetch all divisions by auto-paginating
  async fetchAll(): Promise<ApiResponse<Division[]>> {
    try {
      const allData: Division[] = [];
      let page = 1;
      let totalPages = 1;

      do {
        const res = await this.getAll(page, 100);
        if (res.success && res.data) {
          allData.push(...res.data.data);
          totalPages = res.data.pagination.totalPages;
        } else {
          return { success: false, message: res.message || "Failed to fetch divisions" };
        }
        page++;
      } while (page <= totalPages);

      return { success: true, data: allData };
    } catch (error: unknown) {
      console.error("Division fetchAll Error:", error);
      return { success: false, message: "Failed to fetch divisions" };
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

  // Get division statistics (calculated from getAll response)
  async getStats(): Promise<ApiResponse<DivisionStats>> {
    try {
      const response = await this.getAll(1, 1);
      if (response.success && response.data) {
        return {
          success: true,
          data: {
            totalDivisions: response.data.pagination.total,
            totalDepartments: 0, // Not available from division API
            totalEmployees: 0, // Not available from division API
          },
        };
      }
      return {
        success: false,
        message: "Failed to fetch division stats",
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: "Failed to fetch division stats",
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
