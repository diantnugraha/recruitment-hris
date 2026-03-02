// Assessment Type - Types of assessments in recruitment pipeline
export const ASSESSMENT_TYPE = {
  INTERVIEW_1: 'interview_1',
  INTERVIEW_2: 'interview_2',
  MCU: 'mcu',
} as const;

export type AssessmentType = typeof ASSESSMENT_TYPE[keyof typeof ASSESSMENT_TYPE];

export const ASSESSMENT_TYPE_LABELS: Record<AssessmentType, string> = {
  interview_1: 'Interview 1',
  interview_2: 'Interview 2',
  mcu: 'MCU (Medical Check-Up)',
};

export const ASSESSMENT_TYPE_OPTIONS = [
  { value: ASSESSMENT_TYPE.INTERVIEW_1, label: 'Interview 1' },
  { value: ASSESSMENT_TYPE.INTERVIEW_2, label: 'Interview 2' },
  { value: ASSESSMENT_TYPE.MCU, label: 'MCU (Medical Check-Up)' },
] as const;

// Assessment Status - Current state of an assessment
export const ASSESSMENT_STATUS = {
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  RESCHEDULED: 'rescheduled',
} as const;

export type AssessmentStatus = typeof ASSESSMENT_STATUS[keyof typeof ASSESSMENT_STATUS];

export const ASSESSMENT_STATUS_LABELS: Record<AssessmentStatus, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rescheduled: 'Rescheduled',
};

export const ASSESSMENT_STATUS_CONFIG: Record<AssessmentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' }> = {
  scheduled: { label: 'Scheduled', variant: 'default' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
  rescheduled: { label: 'Rescheduled', variant: 'outline' },
};

// Assessment Result - Outcome of an assessment
export const ASSESSMENT_RESULT = {
  PASS: 'pass',
  FAIL: 'fail',
  PENDING: 'pending',
} as const;

export type AssessmentResult = typeof ASSESSMENT_RESULT[keyof typeof ASSESSMENT_RESULT];

export const ASSESSMENT_RESULT_LABELS: Record<AssessmentResult, string> = {
  pass: 'Pass',
  fail: 'Fail',
  pending: 'Pending',
};

export const ASSESSMENT_RESULT_CONFIG: Record<AssessmentResult, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' }> = {
  pass: { label: 'Pass', variant: 'success' },
  fail: { label: 'Fail', variant: 'destructive' },
  pending: { label: 'Pending', variant: 'secondary' },
};

export const ASSESSMENT_RESULT_OPTIONS = [
  { value: ASSESSMENT_RESULT.PASS, label: 'Pass' },
  { value: ASSESSMENT_RESULT.FAIL, label: 'Fail' },
  { value: ASSESSMENT_RESULT.PENDING, label: 'Pending' },
] as const;

// Rating options (1-5)
export const RATING_OPTIONS = [
  { value: 1, label: '1 - Poor' },
  { value: 2, label: '2 - Below Average' },
  { value: 3, label: '3 - Average' },
  { value: 4, label: '4 - Good' },
  { value: 5, label: '5 - Excellent' },
] as const;
