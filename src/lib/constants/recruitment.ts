/**
 * Recruitment Pipeline Constants
 * Defines stages for candidate assessment visualization
 */

export const RECRUITMENT_PIPELINE_STAGES = [
  {
    key: "waiting_biodata",
    label: "Waiting Biodata",
    shortLabel: "Biodata",
    color: "bg-amber-500",
    textColor: "text-amber-600",
    bgLight: "bg-amber-500/10",
  },
  {
    key: "interview1",
    label: "Interview 1",
    shortLabel: "Int 1",
    color: "bg-blue-500",
    textColor: "text-blue-600",
    bgLight: "bg-blue-500/10",
  },
  {
    key: "interview2",
    label: "Interview 2",
    shortLabel: "Int 2",
    color: "bg-indigo-500",
    textColor: "text-indigo-600",
    bgLight: "bg-indigo-500/10",
  },
  {
    key: "mcu",
    label: "MCU",
    shortLabel: "MCU",
    color: "bg-purple-500",
    textColor: "text-purple-600",
    bgLight: "bg-purple-500/10",
  },
  {
    key: "passed",
    label: "All Passed",
    shortLabel: "Passed",
    color: "bg-emerald-500",
    textColor: "text-emerald-600",
    bgLight: "bg-emerald-500/10",
  },
  {
    key: "failed",
    label: "Failed",
    shortLabel: "Failed",
    color: "bg-destructive",
    textColor: "text-destructive",
    bgLight: "bg-destructive/10",
  },
] as const;

export type RecruitmentPipelineStageKey =
  (typeof RECRUITMENT_PIPELINE_STAGES)[number]["key"];

export const RECRUITMENT_PIPELINE_STAGE_MAP = RECRUITMENT_PIPELINE_STAGES.reduce(
  (acc, stage) => {
    acc[stage.key] = stage;
    return acc;
  },
  {} as Record<RecruitmentPipelineStageKey, (typeof RECRUITMENT_PIPELINE_STAGES)[number]>
);
