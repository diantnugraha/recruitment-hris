// Role Types
// Based on backend schema: role_access table

export interface Role {
  roleId: number;
  roleName: string | null;
}

export interface CreateRoleRequest {
  roleName: string;
}

export interface UpdateRoleRequest {
  roleName: string;
}

export interface RolePaginatedResponse {
  roles: Role[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RoleFilters {
  name?: string;
}
