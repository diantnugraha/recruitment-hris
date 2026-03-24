import { get, post, put, del } from "@/lib/axios";
import {
  EmployeeWithRelations,
  MaritalStatus,
  ApiResponse,
  Department,
  Division,
  JobLevel,
  JobTitle,
} from "@/types";

// --- Request / Response DTOs (matching backend API schema) ---

export interface CreateEmployeeRequest {
  name: string;
  nickname?: string;
  email?: string;
  contact?: string;
  gender?: string;
  status?: string;
  title?: string;
  location?: string;
  business_unit?: string;
  extension?: string;
  join_date?: string;
  birth_date?: string;
  permanent_date?: string;
  superior_id?: number;
  marital_status?: string;
  nik?: string;
  address?: string;
  religion?: string;
  ethnic?: string;
  nationality?: string;
  mother_name?: string;
  father_name?: string;
  spouse_name?: string;
  emergency_name?: string;
  emergency_relation?: string;
  emergency_phone?: string;
}

export interface UpdateEmployeeRequest {
  name?: string;
  nickname?: string;
  email?: string;
  contact?: string;
  gender?: string;
  status?: string;
  title?: string;
  department_id?: number; // Required for non-structural positions with multiple departments
  location?: string;
  business_unit?: string;
  extension?: string;
  join_date?: string;
  birth_date?: string;
  permanent_date?: string;
  superior_id?: number;
  marital_status?: string;
  nik?: string;
  address?: string;
  religion?: string;
  ethnic?: string;
  nationality?: string;
  mother_name?: string;
  father_name?: string;
  spouse_name?: string;
  emergency_name?: string;
  emergency_relation?: string;
  emergency_phone?: string;
}

// Frontend form data interface (camelCase)
export interface EmployeeFormData {
  employeeId: string;
  employeeNik?: string;
  firstName: string;
  lastName: string;
  nickname: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  hireDate: string;
  status: string;
  departmentId: string;
  divisionId: string;
  jobTitleId: string;
  jobLevelId: string;
  managerId: string;
  // Employment details
  employeeType: string;
  businessUnit: string;
  extension: string;
  location: string;
  fte: string;
  // Contract & probation
  permanentDate: string;
  contractDate: string;
  contractEndDate: string;
  probationDate: string;
  probationEndDate: string;
  // Family
  motherName: string;
  fatherName: string;
  spouseName: string;
  maritalStatus: string;
  // Emergency contact
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactPhone: string;
  // Additional
  religion: string;
  ethnicity: string;
  nationality: string;
  certificate: string;
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
  nik?: string | null;
  first_name?: string;
  last_name?: string;
  nickname?: string;
  email?: string;
  phone?: string;
  employee_contact?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  hire_date?: string;
  status?: string;
  department_id?: string | number;
  division_id?: string | number;
  job_title_id?: string | number;
  job_level_id?: string | number;
  manager_id?: string | number;
  superior_id?: string | number;
  photo?: string;
  created_at?: string;
  updated_at?: string;
  // Job title name (sent as 'title' when creating, might be returned as 'title' or 'employee_title')
  title?: string;
  employee_title?: string;
  // hris-tuv specific fields
  employee_type?: string;
  employee_bu?: string;
  employee_ext?: string;
  employee_location?: string;
  fte?: number | string;
  employee_permanentdate?: string;
  employee_contractdate?: string;
  employee_contractenddate?: string;
  employee_probationdate?: string;
  employee_probationenddate?: string;
  employee_mother?: string;
  employee_father?: string;
  employee_spouse?: string;
  employee_maritalstatus?: string;
  employee_emg_name?: string;
  employee_emg_rel?: string;
  employee_emg_phone?: string;
  employee_reason?: string;
  employee_exitdate?: string;
  employee_religion?: string;
  employee_ethnic?: string;
  employee_nationality?: string;
  certificate?: string;
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

// --- Mapping Functions ---

function mapEmployee(emp: ApiEmployee): EmployeeWithRelations {
  return {
    id: String(emp.employee_id ?? emp.id),
    employeeId: emp.employee_nik || emp.nik || emp.employeeId || String(emp.employee_id ?? emp.id),
    employeeNik: emp.employee_nik || emp.nik || null,
    firstName: emp.first_name || emp.firstName || "",
    lastName: emp.last_name || emp.lastName || "",
    nickname: emp.nickname,
    email: emp.email || "",
    phone: emp.phone || "",
    employeeContact: emp.employee_contact ?? null,
    dateOfBirth: emp.date_of_birth || emp.dateOfBirth || "",
    gender: (emp.gender || "male") as EmployeeWithRelations["gender"],
    address: emp.address || "",
    hireDate: emp.hire_date || emp.hireDate || "",
    status: (emp.status || "inactive") as EmployeeWithRelations["status"],
    departmentId: emp.department_id || emp.departmentId || "",
    divisionId: emp.division_id || emp.divisionId || "",
    jobTitleId: emp.job_title_id ? String(emp.job_title_id) : (emp.jobTitleId || ""),
    jobLevelId: emp.job_level_id ? String(emp.job_level_id) : (emp.jobLevelId || ""),
    managerId: emp.manager_id || emp.managerId,
    superiorId: emp.superior_id,
    photo: emp.photo,
    // Employment details
    employeeType: emp.employee_type,
    businessUnit: emp.employee_bu,
    extension: emp.employee_ext,
    location: emp.employee_location,
    fte: emp.fte != null ? Number(emp.fte) : undefined,
    // Contract & probation
    permanentDate: emp.employee_permanentdate,
    contractDate: emp.employee_contractdate,
    contractEndDate: emp.employee_contractenddate,
    probationDate: emp.employee_probationdate,
    probationEndDate: emp.employee_probationenddate,
    // Family
    motherName: emp.employee_mother,
    fatherName: emp.employee_father,
    spouseName: emp.employee_spouse,
    maritalStatus: emp.employee_maritalstatus as MaritalStatus | undefined,
    // Emergency contact
    emergencyContactName: emp.employee_emg_name,
    emergencyContactRelation: emp.employee_emg_rel,
    emergencyContactPhone: emp.employee_emg_phone,
    // Exit
    exitReason: emp.employee_reason,
    exitDate: emp.employee_exitdate,
    // Additional
    religion: emp.employee_religion,
    ethnicity: emp.employee_ethnic,
    nationality: emp.employee_nationality,
    certificate: emp.certificate,
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

export function mapFormToRequest(form: EmployeeFormData): CreateEmployeeRequest {
  const name = `${form.firstName} ${form.lastName}`.trim();
  const req: CreateEmployeeRequest = { name };

  req.gender = "Any";
  if (form.employeeNik) req.nik = form.employeeNik;
  if (form.nickname) req.nickname = form.nickname;
  if (form.email) req.email = form.email;
  if (form.phone) req.contact = form.phone;
  if (form.status) req.status = form.status;
  if (form.jobTitleId) req.title = form.jobTitleId;
  if (form.location) req.location = form.location;
  if (form.businessUnit) req.business_unit = form.businessUnit;
  if (form.extension) req.extension = form.extension;
  if (form.hireDate) req.join_date = form.hireDate;
  if (form.dateOfBirth) req.birth_date = form.dateOfBirth;
  if (form.permanentDate) req.permanent_date = form.permanentDate;
  // Always set superior_id, default to 0 (No Superior)
  // Check explicitly for "0" or empty string
  req.superior_id = (form.managerId && form.managerId !== "0") ? Number(form.managerId) : 0;
  if (form.maritalStatus) req.marital_status = form.maritalStatus;
  if (form.address) req.address = form.address;
  if (form.religion) req.religion = form.religion;
  if (form.ethnicity) req.ethnic = form.ethnicity;
  if (form.nationality) req.nationality = form.nationality;
  if (form.motherName) req.mother_name = form.motherName;
  if (form.fatherName) req.father_name = form.fatherName;
  if (form.spouseName) req.spouse_name = form.spouseName;
  if (form.emergencyContactName) req.emergency_name = form.emergencyContactName;
  if (form.emergencyContactRelation) req.emergency_relation = form.emergencyContactRelation;
  if (form.emergencyContactPhone) req.emergency_phone = form.emergencyContactPhone;

  return req;
}

export function mapFormToUpdateRequest(form: Partial<EmployeeFormData>): UpdateEmployeeRequest {
  const req: UpdateEmployeeRequest = {};

  if (form.firstName !== undefined || form.lastName !== undefined) {
    req.name = `${form.firstName || ""} ${form.lastName || ""}`.trim();
  }
  if (form.employeeNik !== undefined) req.nik = form.employeeNik;
  if (form.nickname !== undefined) req.nickname = form.nickname;
  if (form.email !== undefined) req.email = form.email;
  if (form.phone !== undefined) req.contact = form.phone;
  if (form.status !== undefined) req.status = form.status;
  if (form.jobTitleId !== undefined) req.title = form.jobTitleId;
  if (form.departmentId !== undefined && form.departmentId) {
    req.department_id = Number(form.departmentId);
  }
  if (form.location !== undefined) req.location = form.location || undefined;
  if (form.businessUnit !== undefined) req.business_unit = form.businessUnit || undefined;
  if (form.extension !== undefined) req.extension = form.extension || undefined;
  if (form.hireDate !== undefined) req.join_date = form.hireDate;
  if (form.dateOfBirth !== undefined) req.birth_date = form.dateOfBirth;
  if (form.permanentDate !== undefined) req.permanent_date = form.permanentDate || undefined;
  if (form.managerId !== undefined) {
    // Always set superior_id as number, default to 0 (No Superior)
    // Check explicitly for "0" or empty string
    req.superior_id = (form.managerId && form.managerId !== "0") ? Number(form.managerId) : 0;
  }
  if (form.maritalStatus !== undefined) req.marital_status = form.maritalStatus || undefined;
  if (form.address !== undefined) req.address = form.address || undefined;
  if (form.religion !== undefined) req.religion = form.religion || undefined;
  if (form.ethnicity !== undefined) req.ethnic = form.ethnicity || undefined;
  if (form.nationality !== undefined) req.nationality = form.nationality || undefined;
  if (form.motherName !== undefined) req.mother_name = form.motherName || undefined;
  if (form.fatherName !== undefined) req.father_name = form.fatherName || undefined;
  if (form.spouseName !== undefined) req.spouse_name = form.spouseName || undefined;
  if (form.emergencyContactName !== undefined) req.emergency_name = form.emergencyContactName || undefined;
  if (form.emergencyContactRelation !== undefined) req.emergency_relation = form.emergencyContactRelation || undefined;
  if (form.emergencyContactPhone !== undefined) req.emergency_phone = form.emergencyContactPhone || undefined;

  return req;
}

// --- NIK Generation (format: YYYYMM### based on join date) ---

/**
 * Get all employees for NIK generation (with pagination, max 100 per page)
 */
async function getAllEmployeesForNik(): Promise<ApiEmployee[]> {
  try {
    const allEmployees: ApiEmployee[] = [];
    let page = 1;
    let hasMore = true;

    // Paginate through all employees (API limit is 100 per page)
    while (hasMore) {
      const response = await get<unknown>(`/v1/employee?page=${page}&limit=100`);

      const res = response as {
        success?: boolean;
        data?: ApiEmployee[];
        pagination?: { totalPages: number; page: number };
      };

      if (res.success && res.data && Array.isArray(res.data)) {
        allEmployees.push(...res.data);
        // Check if there are more pages
        if (res.pagination) {
          hasMore = page < res.pagination.totalPages;
        } else {
          // If no pagination info, assume single page
          hasMore = false;
        }
      } else if (res.data && Array.isArray(res.data)) {
        allEmployees.push(...res.data);
        hasMore = false;
      } else if (Array.isArray(response)) {
        allEmployees.push(...(response as ApiEmployee[]));
        hasMore = false;
      } else {
        hasMore = false;
      }

      page++;

      // Safety limit to prevent infinite loops
      if (page > 50) break;
    }

    return allEmployees;
  } catch (error) {
    // Silently fail - NIK generation will use fallback
    console.warn("Could not fetch employees for NIK generation, using fallback");
    return [];
  }
}

/**
 * Get the maximum sequence number for a given YYYYMM prefix
 */
async function getMaxSequenceForPrefix(prefix: string): Promise<number> {
  try {
    const employees = await getAllEmployeesForNik();
    let maxSeq = 0;

    for (const emp of employees) {
      // Check multiple possible NIK fields from raw API response
      const nik = emp.employee_nik || emp.nik || emp.employeeId || "";
      if (nik && nik.startsWith(prefix) && nik.length === 9) {
        const seq = parseInt(nik.substring(6, 9), 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }

    return maxSeq;
  } catch (error) {
    console.error("Error getting max sequence for prefix:", error);
    return 0;
  }
}

/**
 * Check if a NIK already exists in the system
 */
export async function checkNikExists(nik: string): Promise<boolean> {
  try {
    const employees = await getAllEmployeesForNik();
    return employees.some(
      (emp) => emp.employee_nik === nik || emp.nik === nik || emp.employeeId === nik
    );
  } catch {
    return false;
  }
}

/**
 * Generate a unique NIK for a given join date
 * Format: YYYYMM### where ### is a sequential number starting from 001
 */
export async function generateNik(joinDate: string): Promise<string> {
  const date = new Date(joinDate);
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const prefix = `${year}${month}`;

  try {
    const maxSeq = await getMaxSequenceForPrefix(prefix);
    const nextSeq = (maxSeq + 1).toString().padStart(3, "0");
    return `${prefix}${nextSeq}`;
  } catch {
    // Fallback to 001 if API call fails
    return `${prefix}001`;
  }
}

/**
 * Generate and validate a unique NIK before submission
 * This re-checks the database to ensure no race condition occurred
 */
export async function generateUniqueNik(joinDate: string): Promise<string> {
  const date = new Date(joinDate);
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const prefix = `${year}${month}`;

  try {
    // Get fresh data to avoid race conditions
    const maxSeq = await getMaxSequenceForPrefix(prefix);
    const nextSeq = (maxSeq + 1).toString().padStart(3, "0");
    const nik = `${prefix}${nextSeq}`;

    // Double-check if this NIK already exists
    const exists = await checkNikExists(nik);
    if (exists) {
      // If exists (race condition), try the next number
      const newSeq = (maxSeq + 2).toString().padStart(3, "0");
      return `${prefix}${newSeq}`;
    }

    return nik;
  } catch {
    // Fallback to 001 if API call fails
    return `${prefix}001`;
  }
}

// --- Service ---

export const employeeService = {
  async getAll(
    page: number = 1,
    limit: number = 100
  ): Promise<ApiResponse<EmployeePaginatedResponse>> {
    try {
      const validPage = Math.max(1, Math.floor(page));
      const validLimit = Math.max(1, Math.floor(limit));

      const response = await get<unknown>(
        `/v1/employee?page=${validPage}&limit=${validLimit}`
      );

      const res = response as {
        success?: boolean;
        data?: ApiEmployee[];
        pagination?: EmployeePaginatedResponse["pagination"];
      };

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
      return { success: false, message: "Failed to fetch employees" };
    }
  },

  async getById(id: string | number): Promise<ApiResponse<EmployeeWithRelations>> {
    try {
      const numericId = Number(id);
      if (!Number.isInteger(numericId) || numericId <= 0) {
        return { success: false, message: "Invalid employee ID" };
      }
      const response = await get<unknown>(
        `/v1/employee/${numericId}`
      );
      const res = response as { success?: boolean; data?: ApiEmployee };

      if (res.success && res.data) {
        return { success: true, data: mapEmployee(res.data) };
      }

      if (response && typeof response === "object" && "id" in response) {
        return { success: true, data: mapEmployee(response as ApiEmployee) };
      }

      return { success: false, message: "Unexpected response format" };
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<EmployeeWithRelations> } };
      if (err.response?.data) return err.response.data;
      return { success: false, message: "Failed to fetch employee" };
    }
  },

  async getByDepartmentId(
    departmentId: string
  ): Promise<ApiResponse<EmployeeWithRelations[]>> {
    try {
      const response = await get<unknown>(
        `/v1/employee?department_id=${departmentId}`
      );
      const res = response as { success?: boolean; data?: ApiEmployee[] };

      if (res.success && res.data) {
        return { success: true, data: res.data.map(mapEmployee) };
      }

      if (Array.isArray(response)) {
        return { success: true, data: (response as ApiEmployee[]).map(mapEmployee) };
      }

      return { success: false, message: "Unexpected response format" };
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<EmployeeWithRelations[]> } };
      if (err.response?.data) return err.response.data;
      return { success: false, message: "Failed to fetch employees" };
    }
  },

  async getByDivisionId(
    divisionId: string
  ): Promise<ApiResponse<EmployeeWithRelations[]>> {
    try {
      const response = await get<unknown>(
        `/v1/employee?division_id=${divisionId}`
      );
      const res = response as { success?: boolean; data?: ApiEmployee[] };

      if (res.success && res.data) {
        return { success: true, data: res.data.map(mapEmployee) };
      }

      if (Array.isArray(response)) {
        return { success: true, data: (response as ApiEmployee[]).map(mapEmployee) };
      }

      return { success: false, message: "Unexpected response format" };
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<EmployeeWithRelations[]> } };
      if (err.response?.data) return err.response.data;
      return { success: false, message: "Failed to fetch employees" };
    }
  },

  async create(
    data: CreateEmployeeRequest
  ): Promise<ApiResponse<EmployeeWithRelations>> {
    try {
      const response = await post<unknown, CreateEmployeeRequest>(
        "/v1/employee",
        data
      );
      const res = response as { success?: boolean; data?: ApiEmployee };

      if (res.success && res.data) {
        return { success: true, data: mapEmployee(res.data) };
      }

      if (response && typeof response === "object" && "id" in response) {
        return { success: true, data: mapEmployee(response as ApiEmployee) };
      }

      return { success: false, message: "Unexpected response format" };
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<EmployeeWithRelations> } };
      if (err.response?.data) return err.response.data;
      return { success: false, message: "Failed to create employee" };
    }
  },

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
      const res = response as { success?: boolean; data?: ApiEmployee };

      if (res.success && res.data) {
        return { success: true, data: mapEmployee(res.data) };
      }

      if (response && typeof response === "object" && "id" in response) {
        return { success: true, data: mapEmployee(response as ApiEmployee) };
      }

      return { success: false, message: "Unexpected response format" };
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<EmployeeWithRelations> } };
      if (err.response?.data) return err.response.data;
      return { success: false, message: "Failed to update employee" };
    }
  },

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
      if (err.response?.data) return err.response.data;
      return { success: false, message: "Failed to delete employee" };
    }
  },

  /**
   * Check if a structural position is currently occupied
   * Used for showing confirmation before replacing
   */
  async checkStructuralPosition(
    jobTitle: string,
    departmentId?: number
  ): Promise<ApiResponse<StructuralPositionCheck>> {
    try {
      const params = new URLSearchParams({ job_title: jobTitle });
      if (departmentId) {
        params.append("department_id", String(departmentId));
      }
      const response = await get<unknown>(
        `/v1/employee/check-structural-position?${params.toString()}`
      );
      const res = response as { success?: boolean; data?: StructuralPositionCheck };

      if (res.success && res.data) {
        return { success: true, data: res.data };
      }

      return { success: false, message: "Unexpected response format" };
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<StructuralPositionCheck> } };
      if (err.response?.data) return err.response.data;
      return { success: false, message: "Failed to check structural position" };
    }
  },
};

// Type for structural position check response
export interface StructuralPositionCheck {
  isOccupied: boolean;
  positionType: "HEAD_OF_DIVISION" | "MANAGER" | null;
  currentHolder: {
    employeeId: number;
    employeeName: string | null;
  } | null;
  targetName: string | null;
}

export default employeeService;
