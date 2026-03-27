'use client';

import { SLA_STATUS, SLA_STATUS_CONFIG, type SlaInfo } from '@/lib/constants/sla';

interface SlaBadgeProps {
  sla: SlaInfo | null | undefined;
}

export function SlaBadge({ sla }: SlaBadgeProps) {
  if (!sla) {
    return <span className="text-muted-foreground">-</span>;
  }

  const config = SLA_STATUS_CONFIG[sla.status];

  const label = sla.status === SLA_STATUS.OVERDUE
    ? `${Math.abs(sla.remainingDays)}d overdue`
    : `${sla.remainingDays}d remaining`;

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.className}`}>
      {label}
    </span>
  );
}
