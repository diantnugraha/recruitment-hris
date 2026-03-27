'use client';

import { AlertTriangle, Info } from 'lucide-react';
import { format } from 'date-fns';

import { SLA_STATUS, type SlaInfo } from '@/lib/constants/sla';

interface SlaBannerProps {
  sla: SlaInfo;
  showOnTrack?: boolean;
}

const BANNER_CONFIG = {
  [SLA_STATUS.ON_TRACK]: {
    icon: Info,
    className: 'bg-green-50 border-green-200 text-green-800',
    iconClassName: 'text-green-600',
  },
  [SLA_STATUS.APPROACHING]: {
    icon: AlertTriangle,
    className: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    iconClassName: 'text-yellow-600',
  },
  [SLA_STATUS.OVERDUE]: {
    icon: AlertTriangle,
    className: 'bg-red-50 border-red-200 text-red-800',
    iconClassName: 'text-red-600',
  },
} as const;

function getMessage(sla: SlaInfo): string {
  const dueDate = format(new Date(sla.dueDate), 'MMMM d, yyyy');

  switch (sla.status) {
    case SLA_STATUS.ON_TRACK:
      return `SLA: ${sla.remainingDays} working days remaining (due: ${dueDate})`;
    case SLA_STATUS.APPROACHING:
      return `SLA deadline approaching: ${sla.remainingDays} working days remaining (due: ${dueDate})`;
    case SLA_STATUS.OVERDUE:
      return `SLA overdue by ${Math.abs(sla.remainingDays)} working days (due: ${dueDate}). Recruitment can still proceed.`;
    default:
      return '';
  }
}

export function SlaBanner({ sla, showOnTrack = true }: SlaBannerProps) {
  if (!showOnTrack && sla.status === SLA_STATUS.ON_TRACK) {
    return null;
  }

  const config = BANNER_CONFIG[sla.status];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-3 rounded-lg border p-3 ${config.className}`}>
      <Icon className={`h-5 w-5 shrink-0 ${config.iconClassName}`} />
      <p className="text-sm font-medium">{getMessage(sla)}</p>
    </div>
  );
}
