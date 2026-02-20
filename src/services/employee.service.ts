import { get, post, put, del } from "@/lib/axios";
import { EmployeeWithRelations, ApiResponse, Department, Division, JobLevel, JobTitle } from "@/types";

export interface CreateEmployeeRequest {
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: "male" | "female";
  address: string;
  hire_date: string;
  status?: "active" | "inactive" | "on_leave" | "terminated";
  department_id: string;
  division_id: string;
  job_title_id: string;
  job_level_id: string;
  manager_id?: string;
  photo?: string;
}

export interface UpdateEmployeeRequest {
  employee_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: "male" | "female";
  address?: string;
  hire_date?: string;
  status?: "active" | "inactive" | "on_leave" | "terminated";
  department_id?: string;
  division_id?: string;
  job_title_id?: string;
  job_level_id?: string;
  manager_id?: string;
  photo?: string;
}

// Frontend form data interface (camelCase)
export interface EmployeeFormData {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: "male" | "female";
  address: string;
  hireDate: string;
  status?: "active" | "inactive" | "on_leave" | "terminated";
  departmentId: string;
  divisionId: string;
  jobTitleId: string;
  jobLevelId: string;
  managerId?: string;
  photo?: string;
}

export interface EmployeePaginatedResponse {
  data: EmployeeWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Raw API response interface (snake_case from backend)
interface ApiEmployee {
  id: string | number;
  employee_id?: string;
  employee_nik?: string | null;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  employee_contact?: string; // employee_list.employee_contact
  date_of_birth?: string;
  gender?: "male" | "female";
  address?: string;
  hire_date?: string;
  status?: "active" | "inactive" | "on_leave" | "terminated";
  department_id?: string;
  division_id?: string;
  job_title_id?: string;
  job_level_id?: string;
  manager_id?: string;
  photo?: string;
  created_at?: string;
  updated_at?: string;
  // Relations (might be nested objects or just IDs)
  department?: Department | { id: string; name: string; code?: string };
  division?: Division | { id: string; name: string; code?: string };
  job_title?: JobTitle | { id: string; name: string; code?: string };
  job_level?: JobLevel | { id: string; name: string; category?: string };
  manager?: ApiEmployee;
  // Alternative camelCase (in case API returns mixed)
  employeeId?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  hireDate?: string;
  departmentId?: string;
  divisionId?: string;
  jobTitleId?: string;
  jobLevelId?: string;
  managerId?: string;
  createdAt?: string;
  updatedAt?: string;
  jobTitle?: JobTitle;
  jobLevel?: JobLevel;
}

// Map API response to frontend format
function mapEmployee(emp: ApiEmployee): EmployeeWithRelations {
  return {
    id: String(emp.employee_id ?? emp.id),
    employeeId: emp.employee_nik || emp.employeeId || String(emp.employee_id ?? emp.id),
    employeeNik: emp.employee_nik ?? null,
    firstName: emp.first_name || emp.firstName || "",
    lastName: emp.last_name || emp.lastName || "",
    email: emp.email || "",
    phone: emp.phone || "",
    employeeContact: emp.employee_contact ?? null,
    dateOfBirth: emp.date_of_birth || emp.dateOfBirth || "",
    gender: emp.gender || "male",
    address: emp.address || "",
    hireDate: emp.hire_date || emp.hireDate || "",
    status: emp.status || "inactive",
    departmentId: emp.department_id || emp.departmentId || "",
    divisionId: emp.division_id || emp.divisionId || "",
    jobTitleId: emp.job_title_id || emp.jobTitleId || "",
    jobLevelId: emp.job_level_id || emp.jobLevelId || "",
    managerId: emp.manager_id || emp.managerId,
    photo: emp.photo,
    createdAt: emp.created_at || emp.createdAt || "",
    updatedAt: emp.updated_at || emp.updatedAt || "",
    // Relations
    department: emp.department as Department | undefined,
    division: emp.division as Division | undefined,
    jobTitle: (emp.job_title || emp.jobTitle) as JobTitle | undefined,
    jobLevel: (emp.job_level || emp.jobLevel) as JobLevel | undefined,
    manager: emp.manager ? mapEmployee(emp.manager) : undefined,
  };
}

// Map frontend form data to API request format (camelCase to snake_case)
export function mapFormToRequest(form: EmployeeFormData): CreateEmployeeRequest {
  return {
    employee_id: form.employeeId,
    first_name: form.firstName,
    last_name: form.lastName,
    email: form.email,
    phone: form.phone,
    date_of_birth: form.dateOfBirth,
    gender: form.gender,
    address: form.address,
    hire_date: form.hireDate,
    status: form.status,
    department_id: form.departmentId,
    division_id: form.divisionId,
    job_title_id: form.jobTitleId,
    job_level_id: form.jobLevelId,
    manager_id: form.managerId || undefined,
    photo: form.photo,
  };
}

export function mapFormToUpdateRequest(form: Partial<EmployeeFormData>): UpdateEmployeeRequest {
  const req: UpdateEmployeeRequest = {};
  if (form.employeeId !== undefined) req.employee_id = form.employeeId;
  if (form.firstName !== undefined) req.first_name = form.firstName;
  if (form.lastName !== undefined) req.last_name = form.lastName;
  if (form.email !== undefined) req.email = form.email;
  if (form.phone !== undefined) req.phone = form.phone;
  if (form.dateOfBirth !== undefined) req.date_of_birth = form.dateOfBirth;
  if (form.gender !== undefined) req.gender = form.gender;
  if (form.address !== undefined) req.address = form.address;
  if (form.hireDate !== undefined) req.hire_date = form.hireDate;
  if (form.status !== undefined) req.status = form.status;
  if (form.departmentId !== undefined) req.department_id = form.departmentId;
  if (form.divisionId !== undefined) req.division_id = form.divisionId;
  if (form.jobTitleId !== undefined) req.job_title_id = form.jobTitleId;
  if (form.jobLevelId !== undefined) req.job_level_id = form.jobLevelId;
  if (form.managerId !== undefined) req.manager_id = form.managerId || undefined;
  if (form.photo !== undefined) req.photo = form.photo;
  return req;
}

export const employeeService = {
  // Get all employees with pagination
  async getAll(
    page: number = 1,
    limit: number = 100
  ): Promise<ApiResponse<EmployeePaginatedResponse>> {
    try {
      // Add include parameter to load relations
      const response = await get<unknown>(
        `/v1/employee?page=${page}&limit=${limit}&include=department,division,jobTitle,jobLevel,manager`
      );

      const res = response as {
        success?: boolean;
        data?: ApiEmployee[];
        pagination?: EmployeePaginatedResponse["pagination"];
      };

      // API returns: { success: true, data: [...], pagination: {...} }
      if (res.success && res.data && Array.isArray(res.data)) {
        const mappedData = res.data.map(mapEmployee);
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

      // Handle direct data array without success wrapper (e.g., { data: [...], pagination: {...} })
      if (res.data && Array.isArray(res.data)) {
        const mappedData = res.data.map(mapEmployee);
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

      // Handle direct array response (no wrapper at all)
      if (Array.isArray(response)) {
        const mappedData = (response as ApiEmployee[]).map(mapEmployee);
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
      console.error("Employee API Error:", error);
      return {
        success: false,
        message: "Failed to fetch employees",
      };
    }
  },

  // Get single employee by ID
  async getById(id: string | number): Promise<ApiResponse<EmployeeWithRelations>> {
    try {
      const numericId = Number(id);
      if (!Number.isInteger(numericId) || numericId <= 0) {
        return { success: false, message: "Invalid employee ID" };
      }
      const response = await get<unknown>(`/v1/employee/${numericId}`);
      const res = response as {
        success?: boolean;
        data?: ApiEmployee;
      };

      if (res.success && res.data) {
        return { success: true, data: mapEmployee(res.data) };
      }

      // Handle direct object response
      if (response && typeof response === "object" && "id" in response) {
        return { success: true, data: mapEmployee(response as ApiEmployee) };
      }

      return { success: false, message: "Unexpected response format" };
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: ApiResponse<EmployeeWithRelations> };
      };
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: "Failed to fetch employee",
      };
    }
  },

  // Get employees by department ID
  async getByDepartmentId(
    departmentId: string
  ): Promise<ApiResponse<EmployeeWithRelations[]>> {
    try {
      const response = await get<unknown>(
        `/v1/employee?department_id=${departmentId}`
      );
      const res = response as {
        success?: boolean;
        data?: ApiEmployee[];
      };

      if (res.success && res.data) {
        return { success: true, data: res.data.map(mapEmployee) };
      }

      if (Array.isArray(response)) {
        return { success: true, data: (response as ApiEmployee[]).map(mapEmployee) };
      }

      return { success: false, message: "Unexpected response format" };
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: ApiResponse<EmployeeWithRelations[]> };
      };
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: "Failed to fetch employees",
      };
    }
  },

  // Get employees by division ID
  async getByDivisionId(
    divisionId: string
  ): Promise<ApiResponse<EmployeeWithRelations[]>> {
    try {
      const response = await get<unknown>(
        `/v1/employee?division_id=${divisionId}`
      );
      const res = response as {
        success?: boolean;
        data?: ApiEmployee[];
      };

      if (res.success && res.data) {
        return { success: true, data: res.data.map(mapEmployee) };
      }

      if (Array.isArray(response)) {
        return { success: true, data: (response as ApiEmployee[]).map(mapEmployee) };
      }

      return { success: false, message: "Unexpected response format" };
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: ApiResponse<EmployeeWithRelations[]> };
      };
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: "Failed to fetch employees",
      };
    }
  },

  // Create new employee
  async create(
    data: CreateEmployeeRequest
  ): Promise<ApiResponse<EmployeeWithRelations>> {
    try {
      const response = await post<unknown, CreateEmployeeRequest>(
        "/v1/employee",
        data
      );
      const res = response as {
        success?: boolean;
        data?: ApiEmployee;
      };

      if (res.success && res.data) {
        return { success: true, data: mapEmployee(res.data) };
      }

      // Handle direct object response
      if (response && typeof response === "object" && "id" in response) {
        return { success: true, data: mapEmployee(response as ApiEmployee) };
      }

      return { success: false, message: "Unexpected response format" };
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: ApiResponse<EmployeeWithRelations> };
      };
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: "Failed to create employee",
      };
    }
  },

  // Update employee
  async update(
    id: string | number,
    data: UpdateEmployeeRequest
  ): Promise<ApiResponse<EmployeeWithRelations>> {
    try {
      const numericId = Number(id);
      if (!Number.isInteger(numericId) || numericId <= 0) {
        return { success: false, message: "Invalid employee ID" };
      }
      const response = await put<unknown, UpdateEmployeeRequest>(
        `/v1/employee/${numericId}`,
        data
      );
      const res = response as {
        success?: boolean;
        data?: ApiEmployee;
      };

      if (res.success && res.data) {
        return { success: true, data: mapEmployee(res.data) };
      }

      // Handle direct object response
      if (response && typeof response === "object" && "id" in response) {
        return { success: true, data: mapEmployee(response as ApiEmployee) };
      }

      return { success: false, message: "Unexpected response format" };
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: ApiResponse<EmployeeWithRelations> };
      };
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: "Failed to update employee",
      };
    }
  },

  // Delete employee (soft delete)
  async delete(id: string | number): Promise<ApiResponse<void>> {
    try {
      const numericId = Number(id);
      if (!Number.isInteger(numericId) || numericId <= 0) {
        return { success: false, message: "Invalid employee ID" };
      }
      const response = await del<unknown>(`/v1/employee/${numericId}`);
      const res = response as { success?: boolean };

      if (res.success !== undefined) {
        return { success: res.success };
      }

      return { success: true };
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<void> } };
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: "Failed to delete employee",
      };
    }
  },
};

export default employeeService;
