import { get, post, put, del } from "@/lib/axios";
import { Organization, ApiResponse } from "@/types";

export interface CreateOrganizationRequest {
  name: string;
  cluster: string;
  description?: string;
}

export interface UpdateOrganizationRequest {
  name?: string;
  cluster?: string;
  description?: string;
}

export interface OrganizationStats {
  totalUnits: number;
  totalDivisions: number;
  totalDepartments: number;
}

export interface OrganizationPaginatedResponse {
  data: Organization[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const obsService = {
  // Get all organizations with pagination
  async getAll(page: number = 1, limit: number = 100): Promise<ApiResponse<OrganizationPaginatedResponse>> {
    try {
      const response = await get<unknown>(`/v1/obs?page=${page}&limit=${limit}`);

      const res = response as {
        success?: boolean;
        data?: Organization[];
        pagination?: OrganizationPaginatedResponse["pagination"];
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
            data: response as Organization[],
            pagination: {
              page: 1,
              limit: response.length,
              total: response.length,
              totalPages: 1,
            },
          },
        };
      }

      return { success: false, message: "Unexpected response format" };
    } catch (error: unknown) {
      console.error("OBS API Error:", error);
      return {
        success: false,
        message: "Failed to fetch organizations",
      };
    }
  },

  // Fetch all organizations by auto-paginating
  async fetchAll(): Promise<ApiResponse<Organization[]>> {
    try {
      const allData: Organization[] = [];
      let page = 1;
      let totalPages = 1;

      do {
        const res = await this.getAll(page, 100);
        if (res.success && res.data) {
          allData.push(...res.data.data);
          totalPages = res.data.pagination.totalPages;
        } else {
          return { success: false, message: res.message || "Failed to fetch organizations" };
        }
        page++;
      } while (page <= totalPages);

      return { success: true, data: allData };
    } catch (error: unknown) {
      console.error("OBS fetchAll Error:", error);
      return { success: false, message: "Failed to fetch organizations" };
    }
  },

  // Get single organization by ID
  async getById(id: string): Promise<ApiResponse<Organization>> {
    try {
      const response = await get<ApiResponse<Organization>>(`/v1/obs/${id}`);
      return response;
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<Organization> } };
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: "Failed to fetch organization",
      };
    }
  },

  // Get organization statistics (calculated from getAll response)
  async getStats(): Promise<ApiResponse<OrganizationStats>> {
    try {
      const response = await this.getAll(1, 1);
      if (response.success && response.data) {
        return {
          success: true,
          data: {
            totalUnits: response.data.pagination.total,
            totalDivisions: 0, // Not available from OBS API
            totalDepartments: 0, // Not available from OBS API
          },
        };
      }
      return {
        success: false,
        message: "Failed to fetch organization stats",
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: "Failed to fetch organization stats",
      };
    }
  },

  // Create new organization
  async create(
    data: CreateOrganizationRequest
  ): Promise<ApiResponse<Organization>> {
    try {
      const response = await post<
        ApiResponse<Organization>,
        CreateOrganizationRequest
      >("/v1/obs", data);
      return response;
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<Organization> } };
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: "Failed to create organization",
      };
    }
  },

  // Update organization
  async update(
    id: string,
    data: UpdateOrganizationRequest
  ): Promise<ApiResponse<Organization>> {
    try {
      const response = await put<
        ApiResponse<Organization>,
        UpdateOrganizationRequest
      >(`/v1/obs/${id}`, data);
      return response;
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<Organization> } };
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: "Failed to update organization",
      };
    }
  },

  // Delete organization
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await del<ApiResponse<void>>(`/v1/obs/${id}`);
      return response;
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<void> } };
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: "Failed to delete organization",
      };
    }
  },
};

export default obsService;
