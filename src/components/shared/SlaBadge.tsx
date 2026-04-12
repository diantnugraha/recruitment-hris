'use client';

import { SLA_STATUS, type SlaInfo, type SlaStatus } from '@/lib/constants/sla';
import { TuvBadge } from '@/components/shared/tuv-badge';

const SLA_BADGE_VARIANT: Record<SlaStatus, "success" | "warning" | "danger"> = {
  on_track: "success",
  approaching: "warning",
  overdue: "danger",
};

interface SlaBadgeProps {
  sla: SlaInfo | null | undefined;
}

export function SlaBadge({ sla }: SlaBadgeProps) {
  if (!sla) {
    return <span style={{ color: "var(--hsd-ui-color-gray-400)" }}>-</span>;
  }

  const label = sla.status === SLA_STATUS.OVERDUE
    ? `${Math.abs(sla.remainingDays)}d overdue`
    : `${sla.remainingDays}d remaining`;

  return (
    <TuvBadge
      text={label}
      variant={SLA_BADGE_VARIANT[sla.status]}
      size="sm"
      border
    />
  );
}
