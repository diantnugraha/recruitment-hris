"use client";

import { OnboardingContent } from "@/components/onboarding/OnboardingContent";
import type { TabMode } from "@/hooks/useAssessmentPermission";

interface OnboardingTabProps {
  candidateId: string;
  mode: TabMode;
  onRefresh?: () => void;
}

export function OnboardingTab({ candidateId, mode, onRefresh }: OnboardingTabProps) {
  return <OnboardingContent candidateId={candidateId} mode={mode} onRefresh={onRefresh} />;
}
