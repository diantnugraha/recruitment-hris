export const NOTIFICATION_TYPES = {
  // SLA
  SLA_APPROACHING: 'sla_approaching',
  SLA_OVERDUE: 'sla_overdue',
  // Employee Request workflow
  ER_SUBMITTED: 'employee_request_submitted',
  ER_HOD_APPROVED: 'employee_request_hod_approved',
  ER_HR_APPROVED: 'employee_request_hr_approved',
  ER_APPROVED: 'employee_request_approved',
  ER_REVISED: 'employee_request_revised',
  ER_REJECTED: 'employee_request_rejected',
  // Recruitment workflow
  RECRUITMENT_BIODATA_SUBMITTED: 'recruitment_biodata_submitted',
  RECRUITMENT_ASSESSOR_ASSIGNED: 'recruitment_assessor_assigned',
  RECRUITMENT_INTERVIEW_USER_COMPLETED: 'recruitment_interview_user_completed',
  RECRUITMENT_ONBOARDING_ACCEPTED: 'recruitment_onboarding_accepted',
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];
