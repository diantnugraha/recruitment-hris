import { ROLES, RoleId } from './roles';

const ALL_ACTIVE_ROLES: RoleId[] = [
  ROLES.SUPER_ADMIN,
  ROLES.HUMAN_RESOURCES,
  ROLES.MANAGER,
  ROLES.HOD,
  ROLES.MANAGEMENT,
  ROLES.EMPLOYEE,
];

export const ROUTE_ACCESS: Record<string, RoleId[]> = {
  // All active roles
  '/dashboard':                ALL_ACTIVE_ROLES,
  '/organization/obs':         ALL_ACTIVE_ROLES,
  '/organization/divisions':   ALL_ACTIVE_ROLES,
  '/organization/departments': ALL_ACTIVE_ROLES,
  '/organization/job-levels':  ALL_ACTIVE_ROLES,
  '/organization/job-titles':  ALL_ACTIVE_ROLES,
  '/employees':                ALL_ACTIVE_ROLES,

  // Not Employee
  '/employee-budget':  [ROLES.SUPER_ADMIN, ROLES.HUMAN_RESOURCES, ROLES.MANAGER, ROLES.HOD, ROLES.MANAGEMENT],
  '/employee-request': [ROLES.SUPER_ADMIN, ROLES.HUMAN_RESOURCES, ROLES.MANAGER, ROLES.HOD, ROLES.MANAGEMENT],
  '/recruitment':      [ROLES.SUPER_ADMIN, ROLES.HUMAN_RESOURCES, ROLES.MANAGER, ROLES.HOD, ROLES.MANAGEMENT],
  '/onboarding':       [ROLES.SUPER_ADMIN, ROLES.HUMAN_RESOURCES, ROLES.MANAGER, ROLES.HOD, ROLES.MANAGEMENT],

  // Admin + HR only
  '/users':        [ROLES.SUPER_ADMIN, ROLES.HUMAN_RESOURCES],
  '/roles-access': [ROLES.SUPER_ADMIN, ROLES.HUMAN_RESOURCES],
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
