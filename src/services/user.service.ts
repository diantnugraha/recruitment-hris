import { get, post, put, del } from "@/lib/axios";
import { ApiResponse } from "@/types";
import {
  UserManagement,
  CreateUserRequest,
  UpdateUserRequest,
  UserPaginatedResponse,
} from "@/types/user-management";

export const userService = {
  // Get all users with pagination
  async getAll(
    page: number = 1,
    limit: number = 100,
    filters?: { display_name?: string; email?: string }
  ): Promise<ApiResponse<UserPaginatedResponse>> {
    try {
      const validPage = Math.max(1, Math.floor(page));
      const validLimit = Math.max(1, Math.min(100, Math.floor(limit)));

      let url = `/v1/user-rest?page=${validPage}&limit=${validLimit}`;

      if (filters?.display_name) {
        url += `&display_name=${encodeURIComponent(filters.display_name)}`;
      }
      if (filters?.email) {
        url += `&email=${encodeURIComponent(filters.email)}`;
      }

      const response = await get<unknown>(url);

      const res = response as {
        success?: boolean;
        data?: UserManagement[];
        pagination?: UserPaginatedResponse["pagination"];
      };

      if (res.success && res.data) {
        return {
          success: true,
          data: {
            users: res.data,
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
            users: response as UserManagement[],
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
      console.error("User API Error:", error);
      return {
        success: false,
        message: "Failed to fetch users",
      };
    }
  },

  // Fetch all users by auto-paginating
  async fetchAll(): Promise<ApiResponse<UserManagement[]>> {
    try {
      const allData: UserManagement[] = [];
      let page = 1;
      let totalPages = 1;

      do {
        const res = await this.getAll(page, 100);
        if (res.success && res.data) {
          allData.push(...res.data.users);
          totalPages = res.data.pagination.totalPages;
        } else {
          return { success: false, message: res.message || "Failed to fetch users" };
        }
        page++;
      } while (page <= totalPages);

      return { success: true, data: allData };
    } catch (error: unknown) {
      console.error("User fetchAll Error:", error);
      return { success: false, message: "Failed to fetch users" };
    }
  },

  // Get user linked to a specific employee ID
  async getByEmployeeId(employeeId: string): Promise<ApiResponse<UserManagement | null>> {
    try {
      const allRes = await this.fetchAll();
      if (!allRes.success || !allRes.data) {
        return { success: false, message: allRes.message || "Failed to fetch users" };
      }
      const user = allRes.data.find(
        (u) => String(u.employeeId) === String(employeeId)
      ) || null;
      return { success: true, data: user };
    } catch (error: unknown) {
      console.error("User getByEmployeeId Error:", error);
      return { success: false, message: "Failed to fetch user by employee ID" };
    }
  },

  // Get single user by ID
  async getById(id: number): Promise<ApiResponse<UserManagement>> {
    try {
      const response = await get<ApiResponse<UserManagement>>(`/v1/user-rest/${id}`);
      return response;
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<UserManagement> } };
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: "Failed to fetch user",
      };
    }
  },

  // Create new user
  async create(data: CreateUserRequest): Promise<ApiResponse<UserManagement>> {
    try {
      const response = await post<ApiResponse<UserManagement>, CreateUserRequest>(
        "/v1/user-rest",
        data
      );
      return response;
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<UserManagement> } };
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: "Failed to create user",
      };
    }
  },

  // Update user
  async update(
    id: number,
    data: UpdateUserRequest
  ): Promise<ApiResponse<UserManagement>> {
    try {
      const response = await put<ApiResponse<UserManagement>, UpdateUserRequest>(
        `/v1/user-rest/${id}`,
        data
      );
      return response;
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<UserManagement> } };
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: "Failed to update user",
      };
    }
  },

  // Delete user
  async delete(id: number): Promise<ApiResponse<void>> {
    try {
      const response = await del<ApiResponse<void>>(`/v1/user-rest/${id}`);
      return response;
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<void> } };
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: "Failed to delete user",
      };
    }
  },
};

export default userService;
