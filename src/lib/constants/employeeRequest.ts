import { ROLES } from './roles';

// Employee Request Status - Workflow states
export const EMPLOYEE_REQUEST_STATUS = {
  DRAFT: 'draft',
  CREATED: 'created',           // Waiting for HOD Review
  HOD_REVIEWED: 'hod_reviewed', // HOD Reviewed, waiting for HR Review
  REVIEWED: 'reviewed',         // HR Reviewed, waiting for Management Approval
  APPROVED: 'approved',
  REJECTED: 'rejected',
  REVISE: 'revise',
  IN_RECRUITMENT: 'in_recruitment',
  COMPLETED: 'completed',
} as const;

export type EmployeeRequestStatus = typeof EMPLOYEE_REQUEST_STATUS[keyof typeof EMPLOYEE_REQUEST_STATUS];

export const EMPLOYEE_REQUEST_STATUS_LABELS: Record<EmployeeRequestStatus, string> = {
  draft: 'Draft',
  created: 'Submitted',
  hod_reviewed: 'HOD Reviewed',
  reviewed: 'HR Reviewed',
  approved: 'Approved',
  rejected: 'Rejected',
  revise: 'Need Revision',
  in_recruitment: 'Recruiting',
  completed: 'Completed',
};

export const EMPLOYEE_REQUEST_STATUS_CONFIG: Record<EmployeeRequestStatus, {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success';
  description: string;
}> = {
  draft: {
    label: 'Draft',
    variant: 'secondary',
    description: 'Request saved as draft, not yet submitted'
  },
  created: {
    label: 'Submitted',
    variant: 'default',
    description: 'Request submitted, waiting for HOD review'
  },
  hod_reviewed: {
    label: 'HOD Reviewed',
    variant: 'default',
    description: 'Reviewed by HOD, waiting for HR review'
  },
  reviewed: {
    label: 'HR Reviewed',
    variant: 'default',
    description: 'Reviewed by HR, waiting for Management approval'
  },
  approved: {
    label: 'Approved',
    variant: 'success',
    description: 'Approved by Management, ready for recruitment'
  },
  rejected: {
    label: 'Rejected',
    variant: 'destructive',
    description: 'Request rejected by Management'
  },
  revise: {
    label: 'Need Revision',
    variant: 'outline',
    description: 'Revision requested on this request'
  },
  in_recruitment: {
    label: 'Recruiting',
    variant: 'default',
    description: 'Recruitment process is ongoing'
  },
  completed: {
    label: 'Completed',
    variant: 'success',
    description: 'Position has been filled'
  },
};

export const EMPLOYEE_REQUEST_STATUS_OPTIONS = [
  { value: EMPLOYEE_REQUEST_STATUS.DRAFT, label: 'Draft' },
  { value: EMPLOYEE_REQUEST_STATUS.CREATED, label: 'Submitted' },
  { value: EMPLOYEE_REQUEST_STATUS.HOD_REVIEWED, label: 'HOD Reviewed' },
  { value: EMPLOYEE_REQUEST_STATUS.REVIEWED, label: 'HR Reviewed' },
  { value: EMPLOYEE_REQUEST_STATUS.APPROVED, label: 'Approved' },
  { value: EMPLOYEE_REQUEST_STATUS.REJECTED, label: 'Rejected' },
  { value: EMPLOYEE_REQUEST_STATUS.REVISE, label: 'Need Revision' },
  { value: EMPLOYEE_REQUEST_STATUS.IN_RECRUITMENT, label: 'Recruiting' },
  { value: EMPLOYEE_REQUEST_STATUS.COMPLETED, label: 'Completed' },
] as const;

// Employment Type
export const EMPLOYMENT_TYPE = {
  PERMANENT: 'permanent',
  CONTRACT: 'contract',
  INTERNSHIP: 'internship',
  OUTSOURCE: 'outsource',
} as const;

export type EmploymentType = typeof EMPLOYMENT_TYPE[keyof typeof EMPLOYMENT_TYPE];

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  permanent: 'Permanent',
  contract: 'Contract',
  internship: 'Internship',
  outsource: 'Outsource',
};

export const EMPLOYMENT_TYPE_OPTIONS = [
  { value: EMPLOYMENT_TYPE.PERMANENT, label: 'Permanent' },
  { value: EMPLOYMENT_TYPE.CONTRACT, label: 'Contract' },
  { value: EMPLOYMENT_TYPE.INTERNSHIP, label: 'Internship' },
  { value: EMPLOYMENT_TYPE.OUTSOURCE, label: 'Outsource' },
] as const;

// Request Reason
// Note: Database uses "new" and "replacement", frontend may use "new_position"
export const REQUEST_REASON = {
  NEW: 'new',
  NEW_POSITION: 'new_position',
  REPLACEMENT: 'replacement',
  EXPANSION: 'expansion',
  PROJECT: 'project',
} as const;

export type RequestReason = typeof REQUEST_REASON[keyof typeof REQUEST_REASON];

export const REQUEST_REASON_LABELS: Record<RequestReason, string> = {
  new: 'New Position',
  new_position: 'New Position',
  replacement: 'Replacement',
  expansion: 'Team Expansion',
  project: 'Project Based',
};

export const REQUEST_REASON_OPTIONS = [
  { value: REQUEST_REASON.NEW, label: 'New Position' },
  { value: REQUEST_REASON.REPLACEMENT, label: 'Replacement' },
  { value: REQUEST_REASON.EXPANSION, label: 'Team Expansion' },
  { value: REQUEST_REASON.PROJECT, label: 'Project Based' },
] as const;

// Education Level
export const EDUCATION_LEVEL = {
  SMA: 'sma',
  D3: 'd3',
  S1: 's1',
  S2: 's2',
  S3: 's3',
} as const;

export type EducationLevel = typeof EDUCATION_LEVEL[keyof typeof EDUCATION_LEVEL];

export const EDUCATION_LEVEL_LABELS: Record<EducationLevel, string> = {
  sma: 'SMA/SMK',
  d3: 'D3',
  s1: 'S1',
  s2: 'S2',
  s3: 'S3',
};

export const EDUCATION_LEVEL_OPTIONS = [
  { value: EDUCATION_LEVEL.SMA, label: 'SMA/SMK' },
  { value: EDUCATION_LEVEL.D3, label: 'D3' },
  { value: EDUCATION_LEVEL.S1, label: 'S1' },
  { value: EDUCATION_LEVEL.S2, label: 'S2' },
  { value: EDUCATION_LEVEL.S3, label: 'S3' },
] as const;

// Gender Preference
export const GENDER_PREFERENCE = {
  MALE: 'male',
  FEMALE: 'female',
  ANY: 'any',
} as const;

export type GenderPreference = typeof GENDER_PREFERENCE[keyof typeof GENDER_PREFERENCE];

export const GENDER_PREFERENCE_LABELS: Record<GenderPreference, string> = {
  male: 'Male',
  female: 'Female',
  any: 'Any',
};

export const GENDER_PREFERENCE_OPTIONS = [
  { value: GENDER_PREFERENCE.ANY, label: 'Any' },
  { value: GENDER_PREFERENCE.MALE, label: 'Male' },
  { value: GENDER_PREFERENCE.FEMALE, label: 'Female' },
] as const;

// Work Location / Placement
export const WORK_LOCATION = {
  HEAD_OFFICE_JAKARTA: 'head_office_jakarta',
  CIKARANG: 'cikarang',
  SURABAYA: 'surabaya',
  MEDAN: 'medan',
} as const;

export type WorkLocation = typeof WORK_LOCATION[keyof typeof WORK_LOCATION];

export const WORK_LOCATION_LABELS: Record<WorkLocation, string> = {
  head_office_jakarta: 'Head Office Jakarta',
  cikarang: 'Cikarang',
  surabaya: 'Surabaya',
  medan: 'Medan',
};

export const WORK_LOCATION_OPTIONS = [
  { value: WORK_LOCATION.HEAD_OFFICE_JAKARTA, label: 'Head Office Jakarta' },
  { value: WORK_LOCATION.CIKARANG, label: 'Cikarang' },
  { value: WORK_LOCATION.SURABAYA, label: 'Surabaya' },
  { value: WORK_LOCATION.MEDAN, label: 'Medan' },
] as const;

// Workflow transitions - who can do what
export const WORKFLOW_TRANSITIONS: Record<EmployeeRequestStatus, {
  nextStatuses: EmployeeRequestStatus[];
  allowedRoles: number[];
}> = {
  draft:          { nextStatuses: ['created'],                         allowedRoles: [ROLES.MANAGER, ROLES.SUPER_ADMIN] },
  created:        { nextStatuses: ['hod_reviewed', 'revise'],          allowedRoles: [ROLES.HOD, ROLES.SUPER_ADMIN] },
  hod_reviewed:   { nextStatuses: ['reviewed', 'revise'],              allowedRoles: [ROLES.HR_MANAGER, ROLES.SUPER_ADMIN] },
  reviewed:       { nextStatuses: ['approved', 'rejected', 'revise'],  allowedRoles: [ROLES.MANAGEMENT, ROLES.SUPER_ADMIN] },
  approved:       { nextStatuses: ['in_recruitment'],                  allowedRoles: [ROLES.HR_MANAGER, ROLES.SUPER_ADMIN] },
  rejected:       { nextStatuses: [],                                  allowedRoles: [] },
  revise:         { nextStatuses: ['created'],                         allowedRoles: [ROLES.MANAGER, ROLES.SUPER_ADMIN] },
  in_recruitment: { nextStatuses: ['completed'],                       allowedRoles: [ROLES.HR_MANAGER, ROLES.SUPER_ADMIN] },
  completed:      { nextStatuses: [],                                  allowedRoles: [] },
};
