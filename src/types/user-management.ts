// User Management Types
// Based on backend schema: users table

export interface UserRole {
  roleId: number;
  roleName: string | null;
}

export interface UserEmployee {
  employeeId: number;
  employeeName: string | null;
  employeeEmail: string | null;
}

export interface UserFile {
  id: number;
  name: string;
  type: string;
  location: string;
}

export interface UserManagement {
  id: number;
  name: string | null;
  email: string;
  displayName: string;
  roleId: number;
  employeeId: number | null;
  superiorId: number | null;
  emailVerifiedAt: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  role?: UserRole;
  employee?: UserEmployee | null;
  superior?: UserEmployee | null;
  files?: UserFile[];
}

export interface CreateUserRequest {
  displayName: string;
  email: string;
  name?: string;
  password?: string;
  roleId?: number;
  employeeId?: number;
  superiorId?: number;
}

export interface UpdateUserRequest {
  displayName: string;
  email: string;
  name?: string;
  newPassword?: string;
  roleId?: number;
  employeeId?: number;
  superiorId?: number;
}

export interface UserPaginatedResponse {
  users: UserManagement[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserFilters {
  display_name?: string;
  email?: string;
  id?: number;
}
