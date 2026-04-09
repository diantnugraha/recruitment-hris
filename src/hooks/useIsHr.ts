import { useAuthStore } from '@/stores/auth-store';
import { isHrRole } from '@/lib/constants/roles';

/**
 * Returns true if the current user belongs to one of the HR roles
 * allowed to CRUD master data and employee list.
 */
export function useIsHr(): boolean {
  const user = useAuthStore((s) => s.user);
  return isHrRole(user?.roleId);
}
