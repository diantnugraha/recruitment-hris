// User Role Constants
export const USER_ROLE = {
  ADMIN: 1,
  HR: 2,
  MANAGER: 3,
  EMPLOYEE: 4,
} as const;

export type UserRoleId = (typeof USER_ROLE)[keyof typeof USER_ROLE];

export const USER_ROLE_LABELS: Record<number, string> = {
  [USER_ROLE.ADMIN]: "Administrator",
  [USER_ROLE.HR]: "HR Personnel",
  [USER_ROLE.MANAGER]: "Manager",
  [USER_ROLE.EMPLOYEE]: "Employee",
};

export const USER_ROLE_OPTIONS = [
  { value: USER_ROLE.ADMIN, label: "Administrator" },
  { value: USER_ROLE.HR, label: "HR Personnel" },
  { value: USER_ROLE.MANAGER, label: "Manager" },
  { value: USER_ROLE.EMPLOYEE, label: "Employee" },
] as const;

export const USER_ROLE_CONFIG: Record<
  number,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    description: string;
  }
> = {
  [USER_ROLE.ADMIN]: {
    label: "Administrator",
    variant: "destructive",
    description: "Full system access",
  },
  [USER_ROLE.HR]: {
    label: "HR Personnel",
    variant: "default",
    description: "HR department access",
  },
  [USER_ROLE.MANAGER]: {
    label: "Manager",
    variant: "secondary",
    description: "Manager level access",
  },
  [USER_ROLE.EMPLOYEE]: {
    label: "Employee",
    variant: "outline",
    description: "Basic employee access",
  },
};
