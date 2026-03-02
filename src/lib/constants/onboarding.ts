// Onboarding Status
export const ONBOARDING_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

export type OnboardingStatus = typeof ONBOARDING_STATUS[keyof typeof ONBOARDING_STATUS];

export const ONBOARDING_STATUS_LABELS: Record<OnboardingStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export const ONBOARDING_STATUS_CONFIG: Record<OnboardingStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' }> = {
  not_started: { label: 'Not Started', variant: 'secondary' },
  in_progress: { label: 'In Progress', variant: 'default' },
  completed: { label: 'Completed', variant: 'success' },
};

// Document Types
export const DOCUMENT_TYPE = {
  ID_CARD: 'id_card',
  NPWP: 'npwp',
  BPJS_KESEHATAN: 'bpjs_kesehatan',
  BPJS_KETENAGAKERJAAN: 'bpjs_ketenagakerjaan',
  IJAZAH: 'ijazah',
  CERTIFICATE: 'certificate',
  PHOTO: 'photo',
  CONTRACT: 'contract',
  OTHER: 'other',
} as const;

export type DocumentType = typeof DOCUMENT_TYPE[keyof typeof DOCUMENT_TYPE];

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  id_card: 'KTP / ID Card',
  npwp: 'NPWP',
  bpjs_kesehatan: 'BPJS Kesehatan',
  bpjs_ketenagakerjaan: 'BPJS Ketenagakerjaan',
  ijazah: 'Ijazah',
  certificate: 'Certificate',
  photo: 'Photo',
  contract: 'Employment Contract',
  other: 'Other',
};

// Contract Types
export const CONTRACT_TYPE = {
  PERMANENT: 'permanent',
  CONTRACT: 'contract',
  PROBATION: 'probation',
  INTERNSHIP: 'internship',
} as const;

export type ContractType = typeof CONTRACT_TYPE[keyof typeof CONTRACT_TYPE];

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  permanent: 'Permanent',
  contract: 'Contract',
  probation: 'Probation',
  internship: 'Internship',
};

export const CONTRACT_TYPE_OPTIONS = [
  { value: CONTRACT_TYPE.PERMANENT, label: 'Permanent' },
  { value: CONTRACT_TYPE.CONTRACT, label: 'Contract' },
  { value: CONTRACT_TYPE.PROBATION, label: 'Probation' },
  { value: CONTRACT_TYPE.INTERNSHIP, label: 'Internship' },
] as const;

// Default Checklist Items
export const DEFAULT_CHECKLIST_ITEMS = [
  { id: '1', label: 'Submit KTP copy', category: 'documents', required: true },
  { id: '2', label: 'Submit NPWP copy', category: 'documents', required: true },
  { id: '3', label: 'Submit education certificates (Ijazah)', category: 'documents', required: true },
  { id: '4', label: 'Submit recent photo (3x4)', category: 'documents', required: true },
  { id: '5', label: 'Submit BPJS Kesehatan card', category: 'documents', required: false },
  { id: '6', label: 'Submit BPJS Ketenagakerjaan card', category: 'documents', required: false },
  { id: '7', label: 'Sign employment contract', category: 'contract', required: true },
  { id: '8', label: 'Complete bank account form', category: 'finance', required: true },
  { id: '9', label: 'Setup company email', category: 'it', required: true },
  { id: '10', label: 'Request laptop/equipment', category: 'it', required: false },
  { id: '11', label: 'Complete orientation program', category: 'training', required: true },
  { id: '12', label: 'Meet with department head', category: 'introduction', required: true },
] as const;

export const CHECKLIST_CATEGORIES = {
  documents: 'Documents',
  contract: 'Contract',
  finance: 'Finance',
  it: 'IT Setup',
  training: 'Training',
  introduction: 'Introduction',
} as const;

export type ChecklistCategory = keyof typeof CHECKLIST_CATEGORIES;
