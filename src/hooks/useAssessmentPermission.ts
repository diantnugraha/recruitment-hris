import { useState, useEffect, useCallback } from 'react';

import { useAuthStore } from '@/stores/auth-store';
import { ROLES } from '@/lib/constants/roles';
import { candidateService } from '@/services/candidate.service';

export type TabMode = 'edit' | 'view' | 'locked';

export interface AssessmentPermission {
  canEditInterviewHR: boolean;
  canEditInterviewUser: boolean;
  canEditMCU: boolean;
  canEditOnboarding: boolean;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

const HR_ROLES = [ROLES.HR_MANAGER, ROLES.SUPER_ADMIN] as const;

export function isHROrAdmin(roleId: number): boolean {
  return HR_ROLES.includes(roleId as typeof HR_ROLES[number]);
}

export function useAssessmentPermission(candidateId: string): AssessmentPermission {
  const user = useAuthStore((state) => state.user);
  const [isAssignedAssessor, setIsAssignedAssessor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  // Extract stable primitives to avoid stale closure (per CLAUDE.md useCallback rules)
  const roleId = user?.roleId ?? null;
  const employeeId = user?.employeeId ?? null;
  const userIsHR = roleId !== null && isHROrAdmin(roleId);

  const fetchAssignees = useCallback(async () => {
    if (!roleId || userIsHR) return;

    // If user has no employeeId, they can't be an assignee
    if (!employeeId) {
      setIsAssignedAssessor(false);
      return;
    }

    setIsLoading(true);
    setIsError(false);

    const res = await candidateService.getAssessmentAssignees(candidateId);

    if (res.success && res.data) {
      const assigned = res.data.some(
        (assignee) => assignee.employeeId === employeeId
      );
      setIsAssignedAssessor(assigned);
    } else {
      // Deny-by-default on error
      setIsAssignedAssessor(false);
      setIsError(true);
    }

    setIsLoading(false);
  }, [candidateId, roleId, employeeId, userIsHR]);

  useEffect(() => {
    fetchAssignees();
  }, [fetchAssignees]);

  if (userIsHR) {
    return {
      canEditInterviewHR: true,
      canEditInterviewUser: true,
      canEditMCU: true,
      canEditOnboarding: true,
      isLoading: false,
      isError: false,
      refetch: fetchAssignees,
    };
  }

  return {
    canEditInterviewHR: false,
    canEditInterviewUser: isAssignedAssessor,
    canEditMCU: false,
    canEditOnboarding: false,
    isLoading,
    isError,
    refetch: fetchAssignees,
  };
}
