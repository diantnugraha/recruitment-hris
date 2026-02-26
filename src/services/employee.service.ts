import { get, post, put, del } from "@/lib/axios";
import {
  EmployeeWithRelations,
  EmployeeStatus,
  EmployeeGender,
  MaritalStatus,
  ApiResponse,
  Department,
  Division,
  JobLevel,
  JobTitle,
} from "@/types";

// --- Request / Response DTOs (snake_case for API) ---

export interface CreateEmployeeRequest {
  employee_id: string;
  first_name: string;
  last_name: string;
  nickname?: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: EmployeeGender;
  address: string;
  hire_date: string;
  status?: EmployeeStatus;
  department_id: string;
  division_id: string;
  job_title_id: string;
  job_level_id: string;
  manager_id?: string;
  superior_id?: string;
  photo?: string;
  // Employment details
  employee_type?: string;
  employee_bu?: string;
  employee_ext?: string;
  employee_location?: string;
  fte?: number;
  // Contract & probation
  employee_permanentdate?: string;
  employee_contractdate?: string;
  employee_contractenddate?: string;
  employee_probationdate?: string;
  employee_probationenddate?: string;
  // Family
  employee_mother?: string;
  employee_father?: string;
  employee_spouse?: string;
  employee_maritalstatus?: string;
  // Emergency
  employee_emg_name?: string;
  employee_emg_rel?: string;
  employee_emg_phone?: string;
  // Additional
  employee_religion?: string;
  employee_ethnic?: string;
  certificate?: string;
}

export interface UpdateEmployeeRequest {
  employee_id?: string;
  first_name?: string;
  last_name?: string;
  nickname?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: EmployeeGender;
  address?: string;
  hire_date?: string;
  status?: EmployeeStatus;
  department_id?: string;
  division_id?: string;
  job_title_id?: string;
  job_level_id?: string;
  manager_id?: string;
  superior_id?: string;
  photo?: string;
  employee_type?: string;
  employee_bu?: string;
  employee_ext?: string;
  employee_location?: string;
  fte?: number;
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
  employee_religion?: string;
  employee_ethnic?: string;
  certificate?: string;
  employee_reason?: string;
  employee_exitdate?: string;
}

// Frontend form data interface (camelCase)
export interface EmployeeFormData {
  employeeId: string;
  firstName: string;
  lastName: string;
  nickname: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: EmployeeGender;
  address: string;
  hireDate: string;
  status: EmployeeStatus;
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
  maritalStatus: MaritalStatus | "";
  // Emergency contact
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactPhone: string;
  // Additional
  religion: string;
  ethnicity: string;
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
  first_name?: string;
  last_name?: string;
  nickname?: string;
  email?: string;
  phone?: string;
  employee_contact?: string;
  date_of_birth?: string;
  gender?: EmployeeGender;
  address?: string;
  hire_date?: string;
  status?: EmployeeStatus;
  department_id?: string;
  division_id?: string;
  job_title_id?: string;
  job_level_id?: string;
  manager_id?: string;
  superior_id?: string;
  photo?: string;
  created_at?: string;
  updated_at?: string;
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
    employeeId: emp.employee_nik || emp.employeeId || String(emp.employee_id ?? emp.id),
    employeeNik: emp.employee_nik ?? null,
    firstName: emp.first_name || emp.firstName || "",
    lastName: emp.last_name || emp.lastName || "",
    nickname: emp.nickname,
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
  const req: CreateEmployeeRequest = {
    employee_id: form.employeeId,
    first_name: form.firstName,
    last_name: form.lastName,
    email: form.email,
    phone: form.phone,
    date_of_birth: form.dateOfBirth,
    gender: form.gender,
    address: form.address,
    hire_date: form.hireDate,
    status: form.status || undefined,
    department_id: form.departmentId,
    division_id: form.divisionId,
    job_title_id: form.jobTitleId,
    job_level_id: form.jobLevelId,
    manager_id: form.managerId || undefined,
  };

  if (form.nickname) req.nickname = form.nickname;
  if (form.employeeType) req.employee_type = form.employeeType;
  if (form.businessUnit) req.employee_bu = form.businessUnit;
  if (form.extension) req.employee_ext = form.extension;
  if (form.location) req.employee_location = form.location;
  if (form.fte) req.fte = Number(form.fte);
  if (form.permanentDate) req.employee_permanentdate = form.permanentDate;
  if (form.contractDate) req.employee_contractdate = form.contractDate;
  if (form.contractEndDate) req.employee_contractenddate = form.contractEndDate;
  if (form.probationDate) req.employee_probationdate = form.probationDate;
  if (form.probationEndDate) req.employee_probationenddate = form.probationEndDate;
  if (form.motherName) req.employee_mother = form.motherName;
  if (form.fatherName) req.employee_father = form.fatherName;
  if (form.spouseName) req.employee_spouse = form.spouseName;
  if (form.maritalStatus) req.employee_maritalstatus = form.maritalStatus;
  if (form.emergencyContactName) req.employee_emg_name = form.emergencyContactName;
  if (form.emergencyContactRelation) req.employee_emg_rel = form.emergencyContactRelation;
  if (form.emergencyContactPhone) req.employee_emg_phone = form.emergencyContactPhone;
  if (form.religion) req.employee_religion = form.religion;
  if (form.ethnicity) req.employee_ethnic = form.ethnicity;
  if (form.certificate) req.certificate = form.certificate;

  return req;
}

export function mapFormToUpdateRequest(form: Partial<EmployeeFormData>): UpdateEmployeeRequest {
  const req: UpdateEmployeeRequest = {};

  if (form.employeeId !== undefined) req.employee_id = form.employeeId;
  if (form.firstName !== undefined) req.first_name = form.firstName;
  if (form.lastName !== undefined) req.last_name = form.lastName;
  if (form.nickname !== undefined) req.nickname = form.nickname;
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
  if (form.employeeType !== undefined) req.employee_type = form.employeeType || undefined;
  if (form.businessUnit !== undefined) req.employee_bu = form.businessUnit || undefined;
  if (form.extension !== undefined) req.employee_ext = form.extension || undefined;
  if (form.location !== undefined) req.employee_location = form.location || undefined;
  if (form.fte !== undefined) req.fte = form.fte ? Number(form.fte) : undefined;
  if (form.permanentDate !== undefined) req.employee_permanentdate = form.permanentDate || undefined;
  if (form.contractDate !== undefined) req.employee_contractdate = form.contractDate || undefined;
  if (form.contractEndDate !== undefined) req.employee_contractenddate = form.contractEndDate || undefined;
  if (form.probationDate !== undefined) req.employee_probationdate = form.probationDate || undefined;
  if (form.probationEndDate !== undefined) req.employee_probationenddate = form.probationEndDate || undefined;
  if (form.motherName !== undefined) req.employee_mother = form.motherName || undefined;
  if (form.fatherName !== undefined) req.employee_father = form.fatherName || undefined;
  if (form.spouseName !== undefined) req.employee_spouse = form.spouseName || undefined;
  if (form.maritalStatus !== undefined) req.employee_maritalstatus = form.maritalStatus || undefined;
  if (form.emergencyContactName !== undefined) req.employee_emg_name = form.emergencyContactName || undefined;
  if (form.emergencyContactRelation !== undefined) req.employee_emg_rel = form.emergencyContactRelation || undefined;
  if (form.emergencyContactPhone !== undefined) req.employee_emg_phone = form.emergencyContactPhone || undefined;
  if (form.religion !== undefined) req.employee_religion = form.religion || undefined;
  if (form.ethnicity !== undefined) req.employee_ethnic = form.ethnicity || undefined;
  if (form.certificate !== undefined) req.certificate = form.certificate || undefined;

  return req;
}

// --- Service ---

export const employeeService = {
  async getAll(
    page: number = 1,
    limit: number = 100
  ): Promise<ApiResponse<EmployeePaginatedResponse>> {
    try {
      const response = await get<unknown>(
        `/v1/employee?page=${page}&limit=${limit}&include=department,division,jobTitle,jobLevel,manager`
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
      const response = await get<unknown>(`/v1/employee/${numericId}`);
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
};

export default employeeService;
