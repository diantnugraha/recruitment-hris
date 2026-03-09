import { get, post, put, del } from "@/lib/axios";
import type { ApiResponse } from "@/types";

// --- Types ---

export interface Candidate {
  id: number;
  fullname: string;
  email: string;
  address: string;
  residentStatus: string;
  birthPlace: string;
  birthDate: string | null;
  religion: string;
  ethnicGroup: string;
  idNo: string;
  taxId: string;
  bpjsId: string;
  citizenship: string;
  marritalStatus: string;
  gender: "M" | "F";
  mobilePhone: string;
  drivingLicense: string;
  verify: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CandidateDetail {
  id: number;
  jobTitleId: number;
  employeeRequestId: string;
  candidateCode: string;
  candidateVerify: string;
}

export interface AssessmentProgress {
  interview1: { status: string; passed: boolean; failed: boolean; pending: boolean; locked?: boolean };
  interview2: { status: string; passed: boolean; failed: boolean; pending: boolean; locked: boolean };
  mcu: { status: string; passed: boolean; failed: boolean; pending: boolean; locked: boolean };
  allPassed: boolean;
  anyFailed: boolean;
  currentStage: "waiting" | "interview1" | "interview2" | "mcu" | "completed" | "failed";
  interviewStarted?: boolean;
}

export interface CandidateAssessment {
  id: number;
  interview1Status: string;
  interview1Desc: string;
  interview2Status: string;
  interview2Desc: string;
  mcuStatus: string;
  mcuDesc: string;
  expectedSalary: string;
  lastSalary: string;
  whenReadyWork: string;
}

export interface CandidateWithRelations extends Candidate {
  detail?: CandidateDetail | null;
  assessment?: CandidateAssessment | null;
  jobTitle?: { id: number; name: string } | null;
  employeeRequest?: { id: number; code: string } | null;
}

export interface Facility {
  id: number;
  inventoryNo: string;
  item: string;
  qty: number;
  unit: string;
  condition: string;
  status: string;
}

export interface OnboardingProgram {
  id: number;
  program: string;
  date: string;
  location: string;
  pic: string;
  status: string;
}

export interface Onboarding {
  id: number;
  candidateId: number;
  employeeRequestId: number;
  jobPlacement: string;
  document: string;
  documentCandidate: string;
  facilities: Facility[];
  programs: OnboardingProgram[];
}

// --- Biodata Types ---

export interface EducationalBackground {
  id: number;
  schoolUniversity: string;
  city: string;
  degree: string;
  major: string;
  yearGraduate: number;
}

export interface WorkExperience {
  id: number;
  company: string;
  city: string;
  jobTitle: string;
  period: string;
  lengthOfWorking: string;
}

export interface FamilyMember {
  id: number;
  name: string;
  relation: string;
  age: number;
  education: string;
  work: string;
}

export interface CourseTraining {
  id: number;
  courseTopic: string;
  provider: string;
  year: number;
  city: string;
  certificate: string;
}

export interface SelfAssessment {
  id: number;
  reasonLeavingLastJob: string;
  lastJobDescription: string;
  reasonApplying: string;
  relevantSkills: string;
  lastSalary: string;
  expectedSalary: string;
  activeLanguage: string;
  willingToTransfer: string;
  willingToDoubleWork: string;
  knownEmployees: string;
  readyToWork: string;
  employeeRelationship: string;
  referenceContactName: string;
  referenceContactPhone: string;
}

export interface CandidateBiodata {
  education: EducationalBackground[];
  workExperience: WorkExperience[];
  family: FamilyMember[];
  training: CourseTraining[];
  selfAssessment: SelfAssessment | null;
}

// --- DTOs ---

export interface CreateCandidateRequest {
  fullname: string;
  email: string;
  address?: string;
  resident_status?: string;
  birth_place?: string;
  birth_date?: string;
  religion?: string;
  ethnic_group?: string;
  id_no?: string;
  tax_id?: string;
  bpjs_id?: string;
  citizenship?: string;
  marrital_status?: string;
  gender?: "M" | "F";
  mobile_phone?: string;
  driving_license?: string;
  employee_request_id?: number;
  job_title_id?: number;
}

export interface UpdateCandidateRequest {
  fullname?: string;
  email?: string;
  address?: string;
  resident_status?: string;
  birth_place?: string;
  birth_date?: string;
  religion?: string;
  ethnic_group?: string;
  id_no?: string;
  tax_id?: string;
  bpjs_id?: string;
  citizenship?: string;
  marrital_status?: string;
  gender?: "M" | "F";
  mobile_phone?: string;
  driving_license?: string;
}

export interface CandidatePaginatedResponse {
  data: CandidateWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// --- API Response Types ---

interface ApiCandidate {
  id: number;
  fullname: string;
  email: string;
  address: string;
  resident_status: string;
  birth_place: string;
  birth_date: string | null;
  religion: string;
  ethnic_group: string;
  id_no: string;
  tax_id: string;
  bpjs_id: string;
  citizenship: string;
  marrital_status: string;
  gender: "M" | "F";
  mobile_phone: string;
  driving_license: string;
  verify: string;
  created_at: string | null;
  updated_at: string | null;
  detail?: {
    id: number;
    job_title_id: number;
    employee_request_id: string;
    candidate_code: string;
    candidate_verify: string;
  } | null;
  assessment?: {
    id: number;
    interview1_status: string;
    interview1_desc: string;
    interview2_status: string;
    interview2_desc: string;
    mcu_status: string;
    mcu_desc: string;
    expected_salary: string;
    last_salary: string;
    when_ready_work: string;
  } | null;
  job_title?: { id: number; name: string } | null;
  employee_request?: { id: number; code: string } | null;
}

// --- Mapping ---

function mapCandidate(api: ApiCandidate): CandidateWithRelations {
  return {
    id: api.id,
    fullname: api.fullname,
    email: api.email,
    address: api.address,
    residentStatus: api.resident_status,
    birthPlace: api.birth_place,
    birthDate: api.birth_date,
    religion: api.religion,
    ethnicGroup: api.ethnic_group,
    idNo: api.id_no,
    taxId: api.tax_id,
    bpjsId: api.bpjs_id,
    citizenship: api.citizenship,
    marritalStatus: api.marrital_status,
    gender: api.gender,
    mobilePhone: api.mobile_phone,
    drivingLicense: api.driving_license,
    verify: api.verify,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
    detail: api.detail ? {
      id: api.detail.id,
      jobTitleId: api.detail.job_title_id,
      employeeRequestId: api.detail.employee_request_id,
      candidateCode: api.detail.candidate_code,
      candidateVerify: api.detail.candidate_verify,
    } : null,
    assessment: api.assessment ? {
      id: api.assessment.id,
      interview1Status: api.assessment.interview1_status,
      interview1Desc: api.assessment.interview1_desc,
      interview2Status: api.assessment.interview2_status,
      interview2Desc: api.assessment.interview2_desc,
      mcuStatus: api.assessment.mcu_status,
      mcuDesc: api.assessment.mcu_desc,
      expectedSalary: api.assessment.expected_salary,
      lastSalary: api.assessment.last_salary,
      whenReadyWork: api.assessment.when_ready_work,
    } : null,
    jobTitle: api.job_title,
    employeeRequest: api.employee_request,
  };
}

// --- Service ---

export const candidateService = {
  // ==================== Candidate CRUD ====================

  async getAll(
    page: number = 1,
    limit: number = 20,
    filters?: {
      name?: string;
      email?: string;
      verified?: boolean;
      job_title_id?: number;
      employee_request_id?: number;
    }
  ): Promise<ApiResponse<CandidatePaginatedResponse>> {
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (filters?.name) params.set("name", filters.name);
      if (filters?.email) params.set("email", filters.email);
      if (filters?.verified !== undefined) params.set("verified", String(filters.verified));
      if (filters?.job_title_id) params.set("job_title_id", String(filters.job_title_id));
      if (filters?.employee_request_id) params.set("employee_request_id", String(filters.employee_request_id));

      const response = await get<unknown>(`/v1/candidate?${params.toString()}`);
      const res = response as {
        success?: boolean;
        data?: ApiCandidate[];
        pagination?: CandidatePaginatedResponse["pagination"];
      };

      if (res.success && res.data) {
        return {
          success: true,
          data: {
            data: res.data.map(mapCandidate),
            pagination: res.pagination || {
              page: 1,
              limit: res.data.length,
              total: res.data.length,
              totalPages: 1,
            },
          },
        };
      }

      return { success: false, message: "Unexpected response format" };
    } catch (error: unknown) {
      console.error("Candidate API Error:", error);
      return { success: false, message: "Failed to fetch candidates" };
    }
  },

  async getById(id: string | number): Promise<ApiResponse<CandidateWithRelations>> {
    try {
      const response = await get<unknown>(`/v1/candidate/${id}`);
      const res = response as { success?: boolean; data?: ApiCandidate };

      if (res.success && res.data) {
        return { success: true, data: mapCandidate(res.data) };
      }

      return { success: false, message: "Unexpected response format" };
    } catch (error: unknown) {
      return { success: false, message: "Failed to fetch candidate" };
    }
  },

  async getBiodata(id: string | number): Promise<ApiResponse<CandidateBiodata>> {
    try {
      const response = await get<unknown>(`/v1/candidate/${id}/biodata`);
      const res = response as {
        success?: boolean;
        data?: {
          education: Array<{
            id: number;
            school_university: string;
            city: string;
            degree: string;
            major: string;
            year_graduate: number;
          }>;
          work_experience: Array<{
            id: number;
            company: string;
            city: string;
            job_title: string;
            period: string;
            length_of_working: string;
          }>;
          family: Array<{
            id: number;
            name: string;
            relation: string;
            age: number;
            education: string;
            work: string;
          }>;
          training: Array<{
            id: number;
            course_topic: string;
            provider: string;
            year: number;
            city: string;
            certificate: string;
          }>;
          self_assessment: {
            id: number;
            reason_leaving_last_job: string;
            last_job_description: string;
            reason_applying: string;
            relevant_skills: string;
            last_salary: string;
            expected_salary: string;
            active_language: string;
            willing_to_transfer: string;
            willing_to_double_work: string;
            known_employees: string;
            ready_to_work: string;
            employee_relationship: string;
            reference_contact_name: string;
            reference_contact_phone: string;
          } | null;
        };
      };

      if (res.success && res.data) {
        return {
          success: true,
          data: {
            education: res.data.education.map((item) => ({
              id: item.id,
              schoolUniversity: item.school_university,
              city: item.city,
              degree: item.degree,
              major: item.major,
              yearGraduate: item.year_graduate,
            })),
            workExperience: res.data.work_experience.map((item) => ({
              id: item.id,
              company: item.company,
              city: item.city,
              jobTitle: item.job_title,
              period: item.period,
              lengthOfWorking: item.length_of_working,
            })),
            family: res.data.family.map((item) => ({
              id: item.id,
              name: item.name,
              relation: item.relation,
              age: item.age,
              education: item.education,
              work: item.work,
            })),
            training: res.data.training.map((item) => ({
              id: item.id,
              courseTopic: item.course_topic,
              provider: item.provider,
              year: item.year,
              city: item.city,
              certificate: item.certificate,
            })),
            selfAssessment: res.data.self_assessment
              ? {
                  id: res.data.self_assessment.id,
                  reasonLeavingLastJob: res.data.self_assessment.reason_leaving_last_job,
                  lastJobDescription: res.data.self_assessment.last_job_description,
                  reasonApplying: res.data.self_assessment.reason_applying,
                  relevantSkills: res.data.self_assessment.relevant_skills,
                  lastSalary: res.data.self_assessment.last_salary,
                  expectedSalary: res.data.self_assessment.expected_salary,
                  activeLanguage: res.data.self_assessment.active_language,
                  willingToTransfer: res.data.self_assessment.willing_to_transfer,
                  willingToDoubleWork: res.data.self_assessment.willing_to_double_work,
                  knownEmployees: res.data.self_assessment.known_employees,
                  readyToWork: res.data.self_assessment.ready_to_work,
                  employeeRelationship: res.data.self_assessment.employee_relationship,
                  referenceContactName: res.data.self_assessment.reference_contact_name,
                  referenceContactPhone: res.data.self_assessment.reference_contact_phone,
                }
              : null,
          },
        };
      }

      return { success: false, message: "Unexpected response format" };
    } catch (error: unknown) {
      return { success: false, message: "Failed to fetch candidate biodata" };
    }
  },

  async getByEmployeeRequest(
    employeeRequestId: number,
    page: number = 1,
    limit: number = 50
  ): Promise<ApiResponse<CandidatePaginatedResponse>> {
    return this.getAll(page, limit, { employee_request_id: employeeRequestId });
  },

  async create(data: CreateCandidateRequest): Promise<ApiResponse<CandidateWithRelations>> {
    try {
      const response = await post<unknown, CreateCandidateRequest>(
        "/v1/candidate",
        data
      );
      const res = response as { success?: boolean; data?: ApiCandidate; message?: string };

      if (res.success && res.data) {
        return { success: true, data: mapCandidate(res.data) };
      }

      return { success: false, message: res.message || "Unexpected response format" };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { success: false, message: err.response?.data?.message || "Failed to create candidate" };
    }
  },

  async update(
    id: string | number,
    data: UpdateCandidateRequest
  ): Promise<ApiResponse<CandidateWithRelations>> {
    try {
      const response = await put<unknown, UpdateCandidateRequest>(
        `/v1/candidate/${id}`,
        data
      );
      const res = response as { success?: boolean; data?: ApiCandidate; message?: string };

      if (res.success && res.data) {
        return { success: true, data: mapCandidate(res.data) };
      }

      return { success: false, message: res.message || "Unexpected response format" };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { success: false, message: err.response?.data?.message || "Failed to update candidate" };
    }
  },

  async delete(id: string | number): Promise<ApiResponse<void>> {
    try {
      await del<unknown>(`/v1/candidate/${id}`);
      return { success: true };
    } catch (error: unknown) {
      return { success: false, message: "Failed to delete candidate" };
    }
  },

  async generateToken(id: string | number): Promise<ApiResponse<{ token: string }>> {
    try {
      const response = await post<unknown, Record<string, never>>(
        `/v1/candidate/${id}/generate-token`,
        {}
      );
      const res = response as { success?: boolean; data?: { token: string }; message?: string };

      if (res.success && res.data) {
        return { success: true, data: res.data };
      }

      return { success: false, message: res.message || "Unexpected response format" };
    } catch (error: unknown) {
      return { success: false, message: "Failed to generate token" };
    }
  },

  async sendInvitation(id: string | number): Promise<ApiResponse<{ success: boolean; message: string }>> {
    try {
      // Use candidate portal URL (not current HRIS URL)
      const portalBaseUrl = process.env.NEXT_PUBLIC_CANDIDATE_PORTAL_URL || "http://localhost:3002";
      const response = await post<unknown, { portal_base_url: string }>(
        `/v1/candidate/${id}/send-invitation`,
        { portal_base_url: portalBaseUrl }
      );
      const res = response as { success?: boolean; data?: { success: boolean; message: string }; message?: string };

      if (res.success && res.data) {
        return { success: true, data: res.data };
      }

      return { success: false, message: res.message || "Failed to send invitation" };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { success: false, message: err.response?.data?.message || "Failed to send invitation email" };
    }
  },

  async linkToEmployeeRequest(
    candidateId: string | number,
    employeeRequestId: number,
    jobTitleId: number
  ): Promise<ApiResponse<CandidateWithRelations>> {
    try {
      const response = await post<unknown, { employee_request_id: number; job_title_id: number }>(
        `/v1/candidate/${candidateId}/link-request`,
        { employee_request_id: employeeRequestId, job_title_id: jobTitleId }
      );
      const res = response as { success?: boolean; data?: ApiCandidate; message?: string };

      if (res.success && res.data) {
        return { success: true, data: mapCandidate(res.data) };
      }

      return { success: false, message: res.message || "Unexpected response format" };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { success: false, message: err.response?.data?.message || "Failed to link candidate" };
    }
  },

  // ==================== Assessment Pipeline ====================

  async startInterview(candidateId: string | number): Promise<ApiResponse<AssessmentProgress>> {
    try {
      const response = await post<unknown, Record<string, never>>(
        `/v1/candidate/${candidateId}/assessment/start`,
        {}
      );
      const res = response as { success?: boolean; data?: AssessmentProgress; message?: string };

      if (res.success && res.data) {
        return { success: true, data: res.data };
      }

      return { success: false, message: res.message || "Unexpected response format" };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { success: false, message: err.response?.data?.message || "Failed to start interview" };
    }
  },

  async getAssessmentProgress(candidateId: string | number): Promise<ApiResponse<AssessmentProgress>> {
    try {
      const response = await get<unknown>(`/v1/candidate/${candidateId}/assessment`);
      const res = response as { success?: boolean; data?: AssessmentProgress };

      if (res.success && res.data) {
        return { success: true, data: res.data };
      }

      return { success: false, message: "Unexpected response format" };
    } catch (error: unknown) {
      return { success: false, message: "Failed to fetch assessment progress" };
    }
  },

  async updateInterview1(
    candidateId: string | number,
    status: "PASSED" | "FAILED",
    description: string
  ): Promise<ApiResponse<AssessmentProgress>> {
    try {
      const response = await put<unknown, { status: string; description: string }>(
        `/v1/candidate/${candidateId}/assessment/interview1`,
        { status, description }
      );
      const res = response as { success?: boolean; data?: AssessmentProgress; message?: string };

      if (res.success && res.data) {
        return { success: true, data: res.data };
      }

      return { success: false, message: res.message || "Unexpected response format" };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { success: false, message: err.response?.data?.message || "Failed to update interview 1" };
    }
  },

  async updateInterview2(
    candidateId: string | number,
    status: "PASSED" | "FAILED",
    description: string
  ): Promise<ApiResponse<AssessmentProgress>> {
    try {
      const response = await put<unknown, { status: string; description: string }>(
        `/v1/candidate/${candidateId}/assessment/interview2`,
        { status, description }
      );
      const res = response as { success?: boolean; data?: AssessmentProgress; message?: string };

      if (res.success && res.data) {
        return { success: true, data: res.data };
      }

      return { success: false, message: res.message || "Unexpected response format" };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { success: false, message: err.response?.data?.message || "Failed to update interview 2" };
    }
  },

  async updateMcu(
    candidateId: string | number,
    status: "PASSED" | "FAILED",
    description: string
  ): Promise<ApiResponse<AssessmentProgress>> {
    try {
      const response = await put<unknown, { status: string; description: string }>(
        `/v1/candidate/${candidateId}/assessment/mcu`,
        { status, description }
      );
      const res = response as { success?: boolean; data?: AssessmentProgress; message?: string };

      if (res.success && res.data) {
        return { success: true, data: res.data };
      }

      return { success: false, message: res.message || "Unexpected response format" };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { success: false, message: err.response?.data?.message || "Failed to update MCU" };
    }
  },

  // ==================== Onboarding ====================

  async getOnboarding(candidateId: string | number): Promise<ApiResponse<Onboarding | null>> {
    try {
      const response = await get<unknown>(`/v1/candidate/${candidateId}/onboarding`);
      const res = response as {
        success?: boolean;
        data?: {
          id: number;
          candidate_id: number;
          employee_request_id: number;
          job_placement: string;
          document: string;
          document_candidate: string;
          facilities: Array<{
            id: number;
            inventory_no: string;
            item: string;
            qty: number;
            unit: string;
            condition: string;
            status: string;
          }>;
          programs: Array<{
            id: number;
            program: string;
            date: string;
            location: string;
            pic: string;
            status: string;
          }>;
        } | null
      };

      if (res.success) {
        if (!res.data) {
          return { success: true, data: null };
        }
        return {
          success: true,
          data: {
            id: res.data.id,
            candidateId: res.data.candidate_id,
            employeeRequestId: res.data.employee_request_id,
            jobPlacement: res.data.job_placement,
            document: res.data.document,
            documentCandidate: res.data.document_candidate,
            facilities: res.data.facilities.map(f => ({
              id: f.id,
              inventoryNo: f.inventory_no,
              item: f.item,
              qty: f.qty,
              unit: f.unit,
              condition: f.condition,
              status: f.status,
            })),
            programs: res.data.programs.map(p => ({
              id: p.id,
              program: p.program,
              date: p.date,
              location: p.location,
              pic: p.pic,
              status: p.status,
            })),
          },
        };
      }

      return { success: false, message: "Unexpected response format" };
    } catch (error: unknown) {
      return { success: false, message: "Failed to fetch onboarding" };
    }
  },

  async createOnboarding(
    candidateId: string | number,
    data: { job_placement?: string }
  ): Promise<ApiResponse<Onboarding>> {
    try {
      const response = await post<unknown, typeof data>(
        `/v1/candidate/${candidateId}/onboarding`,
        data
      );
      const res = response as { success?: boolean; data?: Onboarding; message?: string };

      if (res.success && res.data) {
        return { success: true, data: res.data };
      }

      return { success: false, message: res.message || "Unexpected response format" };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { success: false, message: err.response?.data?.message || "Failed to create onboarding" };
    }
  },

  async updateOnboarding(
    candidateId: string | number,
    data: { job_placement?: string; document?: string; document_candidate?: string }
  ): Promise<ApiResponse<Onboarding>> {
    try {
      const response = await put<unknown, typeof data>(
        `/v1/candidate/${candidateId}/onboarding`,
        data
      );
      const res = response as { success?: boolean; data?: Onboarding; message?: string };

      if (res.success && res.data) {
        return { success: true, data: res.data };
      }

      return { success: false, message: res.message || "Unexpected response format" };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { success: false, message: err.response?.data?.message || "Failed to update onboarding" };
    }
  },

  // ==================== Facilities ====================

  async addFacility(
    candidateId: string | number,
    data: {
      inventory_no: string;
      item: string;
      qty: number;
      unit: string;
      condition: string;
      status: string;
    }
  ): Promise<ApiResponse<Facility>> {
    try {
      const response = await post<unknown, typeof data>(
        `/v1/candidate/${candidateId}/onboarding/facilities`,
        data
      );
      const res = response as { success?: boolean; data?: Facility; message?: string };

      if (res.success && res.data) {
        return { success: true, data: res.data };
      }

      return { success: false, message: res.message || "Unexpected response format" };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { success: false, message: err.response?.data?.message || "Failed to add facility" };
    }
  },

  async updateFacility(
    candidateId: string | number,
    facilityId: number,
    data: Partial<{
      inventory_no: string;
      item: string;
      qty: number;
      unit: string;
      condition: string;
      status: string;
    }>
  ): Promise<ApiResponse<Facility>> {
    try {
      const response = await put<unknown, typeof data>(
        `/v1/candidate/${candidateId}/onboarding/facilities/${facilityId}`,
        data
      );
      const res = response as { success?: boolean; data?: Facility; message?: string };

      if (res.success && res.data) {
        return { success: true, data: res.data };
      }

      return { success: false, message: res.message || "Unexpected response format" };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { success: false, message: err.response?.data?.message || "Failed to update facility" };
    }
  },

  async deleteFacility(candidateId: string | number, facilityId: number): Promise<ApiResponse<void>> {
    try {
      await del<unknown>(`/v1/candidate/${candidateId}/onboarding/facilities/${facilityId}`);
      return { success: true };
    } catch (error: unknown) {
      return { success: false, message: "Failed to delete facility" };
    }
  },

  // ==================== Programs ====================

  async addProgram(
    candidateId: string | number,
    data: {
      program: string;
      date: string;
      location: string;
      pic: string;
      status: string;
    }
  ): Promise<ApiResponse<OnboardingProgram>> {
    try {
      const response = await post<unknown, typeof data>(
        `/v1/candidate/${candidateId}/onboarding/programs`,
        data
      );
      const res = response as { success?: boolean; data?: OnboardingProgram; message?: string };

      if (res.success && res.data) {
        return { success: true, data: res.data };
      }

      return { success: false, message: res.message || "Unexpected response format" };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { success: false, message: err.response?.data?.message || "Failed to add program" };
    }
  },

  async updateProgram(
    candidateId: string | number,
    programId: number,
    data: Partial<{
      program: string;
      date: string;
      location: string;
      pic: string;
      status: string;
    }>
  ): Promise<ApiResponse<OnboardingProgram>> {
    try {
      const response = await put<unknown, typeof data>(
        `/v1/candidate/${candidateId}/onboarding/programs/${programId}`,
        data
      );
      const res = response as { success?: boolean; data?: OnboardingProgram; message?: string };

      if (res.success && res.data) {
        return { success: true, data: res.data };
      }

      return { success: false, message: res.message || "Unexpected response format" };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { success: false, message: err.response?.data?.message || "Failed to update program" };
    }
  },

  async deleteProgram(candidateId: string | number, programId: number): Promise<ApiResponse<void>> {
    try {
      await del<unknown>(`/v1/candidate/${candidateId}/onboarding/programs/${programId}`);
      return { success: true };
    } catch (error: unknown) {
      return { success: false, message: "Failed to delete program" };
    }
  },

  // ==================== Convert to Employee ====================

  async convertToEmployee(candidateId: string | number): Promise<ApiResponse<{ success: boolean; message: string }>> {
    try {
      const response = await post<unknown, Record<string, never>>(
        `/v1/candidate/${candidateId}/convert-to-employee`,
        {}
      );
      const res = response as { success?: boolean; data?: { success: boolean; message: string }; message?: string };

      if (res.success && res.data) {
        return { success: true, data: res.data };
      }

      return { success: false, message: res.message || "Unexpected response format" };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { success: false, message: err.response?.data?.message || "Failed to convert to employee" };
    }
  },
};

export default candidateService;
