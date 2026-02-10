import { get, post, put, del } from "@/lib/axios";
import { Organization, ApiResponse, PaginatedResponse } from "@/types";

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

export const obsService = {
  // Get all organizations (tree structure)
  async getAll(): Promise<ApiResponse<Organization[]>> {
    try {
      const response = await get<unknown>("/v1/obs");
      console.log("Raw OBS API Response:", response);

      const res = response as { success?: boolean; data?: Organization[]; pagination?: unknown };

      // API returns: { success: true, data: [...], pagination: {...} }
      if (res.success && res.data && Array.isArray(res.data)) {
        return { success: true, data: res.data };
      }

      // Handle direct array response
      if (Array.isArray(response)) {
        return { success: true, data: response as Organization[] };
      }

      // Handle { data: [...] } without success field
      if (res.data && Array.isArray(res.data)) {
        return { success: true, data: res.data };
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

  // Get organizations with pagination
  async getPaginated(
    page: number = 1,
    pageSize: number = 10
  ): Promise<ApiResponse<PaginatedResponse<Organization>>> {
    try {
      const response = await get<ApiResponse<PaginatedResponse<Organization>>>(
        `/v1/obs?page=${page}&pageSize=${pageSize}`
      );
      return response;
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: ApiResponse<PaginatedResponse<Organization>> };
      };
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: "Failed to fetch organizations",
      };
    }
  },

  // Get single organization by ID
  async getById(id: string): Promise<ApiResponse<Organization>> {
    try {
      const response = await get<ApiResponse<Organization>>(
        `/v1/obs/${id}`
      );
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

  // Get organization statistics
  async getStats(): Promise<ApiResponse<OrganizationStats>> {
    try {
      const response = await get<ApiResponse<OrganizationStats>>(
        "/v1/obs/stats"
      );
      return response;
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: ApiResponse<OrganizationStats> };
      };
      if (err.response?.data) {
        return err.response.data;
      }
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
