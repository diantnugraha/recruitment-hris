import { ROLES, RoleId } from './roles';

const ALL_ACTIVE_ROLES: RoleId[] = [
  ROLES.SUPER_ADMIN,
  ROLES.HR_MANAGER,
  ROLES.MANAGER,
  ROLES.HOD,
  ROLES.MANAGEMENT,
  ROLES.EMPLOYEE,
];

// Every authenticated user can access their own profile
const ALL_ROLES: RoleId[] = [
  ...ALL_ACTIVE_ROLES,
  ROLES.HUMAN_RESOURCES,
  ROLES.AUDITOR,
  ROLES.FINANCE,
  ROLES.CANDIDATES,
];

export const ROUTE_ACCESS: Record<string, RoleId[]> = {
  // Profile - accessible to all authenticated users
  '/profile': ALL_ROLES,

  // Master data - accessible to HUMAN_RESOURCES + all active roles
  '/dashboard':                [...ALL_ACTIVE_ROLES, ROLES.HUMAN_RESOURCES],
  '/organization/obs':         [...ALL_ACTIVE_ROLES, ROLES.HUMAN_RESOURCES],
  '/organization/divisions':   [...ALL_ACTIVE_ROLES, ROLES.HUMAN_RESOURCES],
  '/organization/departments': [...ALL_ACTIVE_ROLES, ROLES.HUMAN_RESOURCES],
  '/organization/job-levels':  [...ALL_ACTIVE_ROLES, ROLES.HUMAN_RESOURCES],
  '/organization/job-titles':  [...ALL_ACTIVE_ROLES, ROLES.HUMAN_RESOURCES],
  '/employees':                [...ALL_ACTIVE_ROLES, ROLES.HUMAN_RESOURCES],

  // Approval & recruitment - HR_MANAGER only (exclude HUMAN_RESOURCES)
  '/employee-budget':  [ROLES.SUPER_ADMIN, ROLES.HR_MANAGER, ROLES.MANAGER, ROLES.HOD, ROLES.MANAGEMENT],
  '/employee-request': [ROLES.SUPER_ADMIN, ROLES.HR_MANAGER, ROLES.MANAGER, ROLES.HOD, ROLES.MANAGEMENT],
  '/recruitment':      [ROLES.SUPER_ADMIN, ROLES.HR_MANAGER, ROLES.MANAGER, ROLES.HOD, ROLES.MANAGEMENT],
  '/onboarding':       [ROLES.SUPER_ADMIN, ROLES.HR_MANAGER, ROLES.MANAGER, ROLES.HOD, ROLES.MANAGEMENT],

  // Admin + HR roles + Director
  '/users':        [ROLES.SUPER_ADMIN, ROLES.HR_MANAGER, ROLES.HUMAN_RESOURCES, ROLES.MANAGEMENT],
  '/roles-access': [ROLES.SUPER_ADMIN, ROLES.HR_MANAGER, ROLES.HUMAN_RESOURCES, ROLES.MANAGEMENT],
};

/**
 * Check if a user with the given roleId can access the given pathname.
 * Supports exact match and longest-prefix match for dynamic routes.
 */
export function hasRouteAccess(pathname: string, roleId: number): boolean {
  // Exact match first
  if (ROUTE_ACCESS[pathname]) {
    return ROUTE_ACCESS[pathname].includes(roleId as RoleId);
  }

  // Longest prefix match for dynamic routes (e.g. /recruitment/123)
  const matchingRoute = Object.keys(ROUTE_ACCESS)
    .filter(route => pathname.startsWith(route + '/'))
    .sort((a, b) => b.length - a.length)[0];

  if (matchingRoute) {
    return ROUTE_ACCESS[matchingRoute].includes(roleId as RoleId);
  }

  // No config = deny access
  return false;
}
