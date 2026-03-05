import { get, post, put, del } from "@/lib/axios";
import { ApiResponse } from "@/types";
import {
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
  RolePaginatedResponse,
} from "@/types/role";

export const roleService = {
  // Get all roles with pagination
  async getAll(
    page: number = 1,
    limit: number = 100,
    filters?: { name?: string }
  ): Promise<ApiResponse<RolePaginatedResponse>> {
    try {
      const validPage = Math.max(1, Math.floor(page));
      const validLimit = Math.max(1, Math.min(100, Math.floor(limit)));

      let url = `/v1/role?page=${validPage}&limit=${validLimit}`;

      if (filters?.name) {
        url += `&name=${encodeURIComponent(filters.name)}`;
      }

      const response = await get<unknown>(url);

      const res = response as {
        success?: boolean;
        data?: Role[];
        pagination?: RolePaginatedResponse["pagination"];
      };

      if (res.success && res.data) {
        return {
          success: true,
          data: {
            roles: res.data,
            pagination: res.pagination || {
              page: 1,
              limit: res.data.length,
              total: res.data.length,
              totalPages: 1,
            },
          },
        };
      }

      if (Array.isArray(response)) {
        return {
          success: true,
          data: {
            roles: response as Role[],
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
      console.error("Role API Error:", error);
      return {
        success: false,
        message: "Failed to fetch roles",
      };
    }
  },

  // Fetch all roles by auto-paginating
  async fetchAll(): Promise<ApiResponse<Role[]>> {
    try {
      const allData: Role[] = [];
      let page = 1;
      let totalPages = 1;

      do {
        const res = await this.getAll(page, 100);
        if (res.success && res.data) {
          allData.push(...res.data.roles);
          totalPages = res.data.pagination.totalPages;
        } else {
          return { success: false, message: res.message || "Failed to fetch roles" };
        }
        page++;
      } while (page <= totalPages);

      return { success: true, data: allData };
    } catch (error: unknown) {
      console.error("Role fetchAll Error:", error);
      return { success: false, message: "Failed to fetch roles" };
    }
  },

  // Get single role by ID
  async getById(id: number): Promise<ApiResponse<Role>> {
    try {
      const response = await get<ApiResponse<Role>>(`/v1/role/${id}`);
      return response;
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<Role> } };
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: "Failed to fetch role",
      };
    }
  },

  // Create new role
  async create(data: CreateRoleRequest): Promise<ApiResponse<Role>> {
    try {
      const response = await post<ApiResponse<Role>, CreateRoleRequest>(
        "/v1/role",
        data
      );
      return response;
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<Role> } };
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: "Failed to create role",
      };
    }
  },

  // Update role
  async update(
    id: number,
    data: UpdateRoleRequest
  ): Promise<ApiResponse<Role>> {
    try {
      const response = await put<ApiResponse<Role>, UpdateRoleRequest>(
        `/v1/role/${id}`,
        data
      );
      return response;
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<Role> } };
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: "Failed to update role",
      };
    }
  },

  // Delete role
  async delete(id: number): Promise<ApiResponse<void>> {
    try {
      const response = await del<ApiResponse<void>>(`/v1/role/${id}`);
      return response;
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<void> } };
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: "Failed to delete role",
      };
    }
  },
};

export default roleService;
