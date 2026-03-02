import { get, post, put, del } from "@/lib/axios";
import {
  EmployeeBudget,
  EmployeeBudgetSummary,
  BudgetCalculation,
  ApiResponse,
  Department,
} from "@/types";

// --- Request / Response DTOs ---

export interface CreateEmployeeBudgetRequest {
  departmentId: number;
  year: number;
  technical: number;
  admin: number;
  document?: string;
}

export interface UpdateEmployeeBudgetRequest {
  departmentId?: number;
  year?: number;
  technical?: number;
  admin?: number;
  document?: string;
}

export interface EmployeeBudgetPaginatedResponse {
  data: EmployeeBudget[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Raw API response interface (snake_case from backend)
interface ApiEmployeeBudget {
  id: string | number;
  department_id: string | number;
  department?: Department | { id: number; name: string; code?: string };
  year: number;
  technical: number;
  admin: number;
  document?: string;
  created_at?: string;
  updated_at?: string;
  // Alternative camelCase
  departmentId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// --- Mapping Functions ---

function mapEmployeeBudget(budget: ApiEmployeeBudget): EmployeeBudget {
  return {
    id: String(budget.id),
    departmentId: String(budget.department_id || budget.departmentId),
    department: budget.department as Department | undefined,
    year: budget.year,
    technical: budget.technical,
    admin: budget.admin,
    document: budget.document,
    createdAt: budget.created_at || budget.createdAt || "",
    updatedAt: budget.updated_at || budget.updatedAt || "",
  };
}

// --- Service ---

export const employeeBudgetService = {
  // Get all employee budgets with pagination
  async getAll(
    page: number = 1,
    limit: number = 10,
    departmentId?: string
  ): Promise<ApiResponse<EmployeeBudgetPaginatedResponse>> {
    try {
      let url = `/v1/employee-budget?page=${page}&limit=${limit}`;
      if (departmentId) {
        url += `&department_id=${departmentId}`;
      }

      const response = await get<unknown>(url);

      const res = response as {
        success?: boolean;
        data?: ApiEmployeeBudget[];
        pagination?: EmployeeBudgetPaginatedResponse["pagination"];
      };

      if (res.data && Array.isArray(res.data)) {
        const mappedData = res.data.map(mapEmployeeBudget);
        return {
          success: true,
          data: {
            data: mappedData,
            pagination: res.pagination || {
              page: 1,
              limit: mappedData.length,
              total: mappedData.length,
              totalPages: 1,
            },
          },
        };
      }

      if (Array.isArray(response)) {
        const mappedData = (response as ApiEmployeeBudget[]).map(mapEmployeeBudget);
        return {
          success: true,
          data: {
            data: mappedData,
            pagination: {
              page: 1,
              limit: mappedData.length,
              total: mappedData.length,
              totalPages: 1,
            },
          },
        };
      }

      return { success: false, message: "Unexpected response format" };
    } catch (error: unknown) {
      console.error("Employee Budget API Error:", error);
      return { success: false, message: "Failed to fetch employee budgets" };
    }
  },

  // Fetch all employee budgets (auto-paginate)
  async fetchAll(): Promise<ApiResponse<EmployeeBudget[]>> {
    try {
      const allData: EmployeeBudget[] = [];
      let page = 1;
      let totalPages = 1;

      do {
        const res = await this.getAll(page, 100);
        if (res.success && res.data) {
          allData.push(...res.data.data);
          totalPages = res.data.pagination.totalPages;
        } else {
          return { success: false, message: res.message || "Failed to fetch budgets" };
        }
        page++;
      } while (page <= totalPages);

      return { success: true, data: allData };
    } catch (error: unknown) {
      return { success: false, message: "Failed to fetch employee budgets" };
    }
  },

  // Get single employee budget by ID
  async getById(id: string): Promise<ApiResponse<EmployeeBudget>> {
    try {
      const response = await get<unknown>(`/v1/employee-budget/${id}`);
      const res = response as { success?: boolean; data?: ApiEmployeeBudget };

      if (res.success && res.data) {
        return { success: true, data: mapEmployeeBudget(res.data) };
      }

      if (response && typeof response === "object" && "id" in response) {
        return { success: true, data: mapEmployeeBudget(response as ApiEmployeeBudget) };
      }

      return { success: false, message: "Unexpected response format" };
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<EmployeeBudget> } };
      if (err.response?.data) return err.response.data;
      return { success: false, message: "Failed to fetch employee budget" };
    }
  },

  // Get budget calculation by department
  async getBudgetByDepartment(
    departmentId?: string
  ): Promise<ApiResponse<BudgetCalculation>> {
    try {
      const url = departmentId
        ? `/v1/employee-budget/calculate?department_id=${departmentId}`
        : `/v1/employee-budget/calculate`;

      const response = await get<unknown>(url);
      const res = response as { success?: boolean; data?: BudgetCalculation };

      if (res.success && res.data) {
        return { success: true, data: res.data };
      }

      if (response && typeof response === "object") {
        return { success: true, data: response as BudgetCalculation };
      }

      return { success: false, message: "Unexpected response format" };
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<BudgetCalculation> } };
      if (err.response?.data) return err.response.data;
      return { success: false, message: "Failed to fetch budget calculation" };
    }
  },

  // Get budget summary for all departments
  async getBudgetSummary(year?: number): Promise<ApiResponse<EmployeeBudgetSummary[]>> {
    try {
      const url = year
        ? `/v1/employee-budget/summary?year=${year}`
        : `/v1/employee-budget/summary`;

      const response = await get<unknown>(url);
      const res = response as { success?: boolean; data?: EmployeeBudgetSummary[] };

      if (res.success && res.data) {
        return { success: true, data: res.data };
      }

      if (Array.isArray(response)) {
        return { success: true, data: response as EmployeeBudgetSummary[] };
      }

      return { success: false, message: "Unexpected response format" };
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<EmployeeBudgetSummary[]> } };
      if (err.response?.data) return err.response.data;
      return { success: false, message: "Failed to fetch budget summary" };
    }
  },

  // Create new employee budget
  async create(
    data: CreateEmployeeBudgetRequest
  ): Promise<ApiResponse<EmployeeBudget>> {
    try {
      const response = await post<unknown, CreateEmployeeBudgetRequest>(
        "/v1/employee-budget",
        data
      );
      const res = response as { success?: boolean; data?: ApiEmployeeBudget };

      if (res.success && res.data) {
        return { success: true, data: mapEmployeeBudget(res.data) };
      }

      if (response && typeof response === "object" && "id" in response) {
        return { success: true, data: mapEmployeeBudget(response as ApiEmployeeBudget) };
      }

      return { success: false, message: "Unexpected response format" };
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<EmployeeBudget> } };
      if (err.response?.data) return err.response.data;
      return { success: false, message: "Failed to create employee budget" };
    }
  },

  // Update employee budget
  async update(
    id: string,
    data: UpdateEmployeeBudgetRequest
  ): Promise<ApiResponse<EmployeeBudget>> {
    try {
      const response = await put<unknown, UpdateEmployeeBudgetRequest>(
        `/v1/employee-budget/${id}`,
        data
      );
      const res = response as { success?: boolean; data?: ApiEmployeeBudget };

      if (res.success && res.data) {
        return { success: true, data: mapEmployeeBudget(res.data) };
      }

      if (response && typeof response === "object" && "id" in response) {
        return { success: true, data: mapEmployeeBudget(response as ApiEmployeeBudget) };
      }

      return { success: false, message: "Unexpected response format" };
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<EmployeeBudget> } };
      if (err.response?.data) return err.response.data;
      return { success: false, message: "Failed to update employee budget" };
    }
  },

  // Delete employee budget
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await del<unknown>(`/v1/employee-budget/${id}`);
      const res = response as { success?: boolean };

      if (res.success !== undefined) {
        return { success: res.success };
      }

      return { success: true };
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<void> } };
      if (err.response?.data) return err.response.data;
      return { success: false, message: "Failed to delete employee budget" };
    }
  },

  // Upload document
  async uploadDocument(file: File): Promise<ApiResponse<{ path: string }>> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await post<unknown, FormData>(
        "/v1/employee-budget/upload",
        formData
      );
      const res = response as { success?: boolean; data?: { path: string } };

      if (res.success && res.data) {
        return { success: true, data: res.data };
      }

      if (response && typeof response === "object" && "path" in response) {
        return { success: true, data: response as { path: string } };
      }

      return { success: false, message: "Failed to upload document" };
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<{ path: string }> } };
      if (err.response?.data) return err.response.data;
      return { success: false, message: "Failed to upload document" };
    }
  },
};

export default employeeBudgetService;
