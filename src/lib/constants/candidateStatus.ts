export const CANDIDATE_STATUS = {
  APPLIED: 'applied',
  WAITING_BIODATA: 'waiting_biodata',
  SCREENING: 'screening',
  INTERVIEW_1: 'interview_1',
  INTERVIEW_2: 'interview_2',
  MCU: 'mcu',
  OFFER: 'offer',
  HIRED: 'hired',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
} as const;

export type CandidateStatus = typeof CANDIDATE_STATUS[keyof typeof CANDIDATE_STATUS];

export const CANDIDATE_STATUS_LABELS: Record<CandidateStatus, string> = {
  applied: 'Applied',
  waiting_biodata: 'Waiting Biodata',
  screening: 'Screening',
  interview_1: 'Interview 1',
  interview_2: 'Interview 2',
  mcu: 'MCU',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export const CANDIDATE_STATUS_CONFIG: Record<CandidateStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' }> = {
  applied: { label: 'Applied', variant: 'secondary' },
  waiting_biodata: { label: 'Waiting Biodata', variant: 'outline' },
  screening: { label: 'Screening', variant: 'default' },
  interview_1: { label: 'Interview 1', variant: 'default' },
  interview_2: { label: 'Interview 2', variant: 'default' },
  mcu: { label: 'MCU', variant: 'default' },
  offer: { label: 'Offer', variant: 'outline' },
  hired: { label: 'Hired', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  withdrawn: { label: 'Withdrawn', variant: 'outline' },
};

export const CANDIDATE_SOURCE = {
  LINKEDIN: 'linkedin',
  JOB_PORTAL: 'job_portal',
  REFERRAL: 'referral',
  WEBSITE: 'website',
  OTHER: 'other',
} as const;

export type CandidateSource = typeof CANDIDATE_SOURCE[keyof typeof CANDIDATE_SOURCE];

export const CANDIDATE_SOURCE_LABELS: Record<CandidateSource, string> = {
  linkedin: 'LinkedIn',
  job_portal: 'Job Portal',
  referral: 'Referral',
  website: 'Website',
  other: 'Other',
};

export const CANDIDATE_SOURCE_OPTIONS = [
  { value: CANDIDATE_SOURCE.LINKEDIN, label: 'LinkedIn' },
  { value: CANDIDATE_SOURCE.JOB_PORTAL, label: 'Job Portal' },
  { value: CANDIDATE_SOURCE.REFERRAL, label: 'Referral' },
  { value: CANDIDATE_SOURCE.WEBSITE, label: 'Website' },
  { value: CANDIDATE_SOURCE.OTHER, label: 'Other' },
] as const;

export const CANDIDATE_STATUS_OPTIONS = [
  { value: CANDIDATE_STATUS.APPLIED, label: 'Applied' },
  { value: CANDIDATE_STATUS.WAITING_BIODATA, label: 'Waiting Biodata' },
  { value: CANDIDATE_STATUS.SCREENING, label: 'Screening' },
  { value: CANDIDATE_STATUS.INTERVIEW_1, label: 'Interview 1' },
  { value: CANDIDATE_STATUS.INTERVIEW_2, label: 'Interview 2' },
  { value: CANDIDATE_STATUS.MCU, label: 'MCU' },
  { value: CANDIDATE_STATUS.OFFER, label: 'Offer' },
  { value: CANDIDATE_STATUS.HIRED, label: 'Hired' },
  { value: CANDIDATE_STATUS.REJECTED, label: 'Rejected' },
  { value: CANDIDATE_STATUS.WITHDRAWN, label: 'Withdrawn' },
] as const;

// Pipeline stages for visualization (in order)
export const PIPELINE_STAGES = [
  { key: CANDIDATE_STATUS.APPLIED, label: 'Applied', color: 'bg-accent' },
  { key: CANDIDATE_STATUS.WAITING_BIODATA, label: 'Waiting Biodata', color: 'bg-foreground/90' },
  { key: CANDIDATE_STATUS.SCREENING, label: 'Screening', color: 'bg-foreground/80' },
  { key: CANDIDATE_STATUS.INTERVIEW_1, label: 'Interview 1', color: 'bg-foreground/60' },
  { key: CANDIDATE_STATUS.INTERVIEW_2, label: 'Interview 2', color: 'bg-foreground/50' },
  { key: CANDIDATE_STATUS.MCU, label: 'MCU', color: 'bg-foreground/40' },
  { key: CANDIDATE_STATUS.OFFER, label: 'Offer', color: 'bg-foreground/30' },
  { key: CANDIDATE_STATUS.HIRED, label: 'Hired', color: 'bg-accent' },
] as const;
