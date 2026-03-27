export const SLA_STATUS = {
  ON_TRACK: 'on_track',
  APPROACHING: 'approaching',
  OVERDUE: 'overdue',
} as const;

export type SlaStatus = typeof SLA_STATUS[keyof typeof SLA_STATUS];

export interface SlaInfo {
  startedAt: string;
  dueDate: string;
  remainingDays: number;
  totalDays: number;
  status: SlaStatus;
}

export const SLA_STATUS_CONFIG: Record<SlaStatus, { label: string; variant: string; className: string }> = {
  on_track: {
    label: 'On Track',
    variant: 'default',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  approaching: {
    label: 'Approaching',
    variant: 'outline',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  overdue: {
    label: 'Overdue',
    variant: 'destructive',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
};
