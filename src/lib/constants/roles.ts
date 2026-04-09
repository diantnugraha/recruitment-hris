// Role IDs matching database role_access table exactly
export const ROLES = {
  HUMAN_RESOURCES: 1,
  EMPLOYEE: 2,
  SUPER_ADMIN: 3,
  AUDITOR: 4,
  FINANCE: 5,
  MANAGER: 6,        // PC Head/Manager
  MANAGEMENT: 7,
  HR_MANAGER: 8,
  CANDIDATES: 9,
  HOD: 10,           // Head Of Division
} as const;

export type RoleId = typeof ROLES[keyof typeof ROLES];

export const ROLE_LABELS: Record<RoleId, string> = {
  [ROLES.HUMAN_RESOURCES]: 'Human Resources',
  [ROLES.EMPLOYEE]: 'Employee',
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.AUDITOR]: 'Auditor',
  [ROLES.FINANCE]: 'Finance',
  [ROLES.MANAGER]: 'PC Head/Manager',
  [ROLES.MANAGEMENT]: 'Management',
  [ROLES.HR_MANAGER]: 'HR Manager',
  [ROLES.CANDIDATES]: 'Candidates',
  [ROLES.HOD]: 'Head Of Division',
};

export const ROLE_CONFIG: Record<
  RoleId,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    description: string;
  }
> = {
  [ROLES.SUPER_ADMIN]: {
    label: 'Super Admin',
    variant: 'destructive',
    description: 'Full system access',
  },
  [ROLES.HUMAN_RESOURCES]: {
    label: 'Human Resources',
    variant: 'default',
    description: 'HR department access',
  },
  [ROLES.MANAGER]: {
    label: 'PC Head/Manager',
    variant: 'secondary',
    description: 'Manager level access',
  },
  [ROLES.EMPLOYEE]: {
    label: 'Employee',
    variant: 'outline',
    description: 'Basic employee access',
  },
  [ROLES.HOD]: {
    label: 'Head Of Division',
    variant: 'secondary',
    description: 'Division head access',
  },
  [ROLES.MANAGEMENT]: {
    label: 'Management',
    variant: 'secondary',
    description: 'Management level access',
  },
  [ROLES.AUDITOR]: {
    label: 'Auditor',
    variant: 'outline',
    description: 'Audit access',
  },
  [ROLES.FINANCE]: {
    label: 'Finance',
    variant: 'outline',
    description: 'Finance access',
  },
  [ROLES.HR_MANAGER]: {
    label: 'HR Manager',
    variant: 'default',
    description: 'HR Manager access',
  },
  [ROLES.CANDIDATES]: {
    label: 'Candidates',
    variant: 'outline',
    description: 'Candidate access',
  },
};

/**
 * Roles allowed to CRUD master data and employee list.
 * Must match backend HR_ROLE_IDS in recruitment-hris-api/src/middlewares/roleMiddleware.ts.
 */
export const HR_ROLES: RoleId[] = [
  ROLES.HUMAN_RESOURCES,
  ROLES.HR_MANAGER,
  ROLES.SUPER_ADMIN,
];

/**
 * Type guard for HR role membership.
 * Accepts unknown numeric values from user store.
 */
export function isHrRole(roleId: number | undefined | null): boolean {
  return roleId != null && (HR_ROLES as number[]).includes(roleId);
}
