"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  RECRUITMENT_PIPELINE_STAGE_MAP,
  type RecruitmentPipelineStageKey,
} from "@/lib/constants/recruitment";
import {
  type PipelineStats,
  getPipelineSegments,
} from "@/lib/utils/recruitmentHelpers";
import { ClipboardCheck, Stethoscope, CheckCircle2, XCircle, FileText } from "lucide-react";

// Icons for each stage
const STAGE_ICONS: Record<RecruitmentPipelineStageKey, React.ComponentType<{ className?: string }>> = {
  waiting_biodata: FileText,
  interview1: ClipboardCheck,
  interview2: ClipboardCheck,
  mcu: Stethoscope,
  passed: CheckCircle2,
  failed: XCircle,
};

interface RecruitmentPipelineIndicatorProps {
  stats: PipelineStats;
  showBar?: boolean;
  showBadges?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * Recruitment Pipeline Indicator Component
 * Displays a visual representation of candidate distribution across pipeline stages
 */
export function RecruitmentPipelineIndicator({
  stats,
  showBar = true,
  showBadges = true,
  compact = false,
  className,
}: RecruitmentPipelineIndicatorProps) {
  const segments = getPipelineSegments(stats);

  if (stats.total === 0) {
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        No candidates
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Segmented Progress Bar */}
      {showBar && (
        <TooltipProvider>
          <div className="h-2 w-full rounded-full bg-secondary flex overflow-hidden">
            {segments.map((segment) => {
              const stageConfig = RECRUITMENT_PIPELINE_STAGE_MAP[segment.key];
              return (
                <Tooltip key={segment.key}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "h-full transition-all cursor-default",
                        stageConfig.color
                      )}
                      style={{ width: `${segment.percentage}%` }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">
                      {stageConfig.label}: {segment.count}
                    </p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      )}

      {/* Badge Indicators */}
      {showBadges && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {segments.map((segment) => {
            const stageConfig = RECRUITMENT_PIPELINE_STAGE_MAP[segment.key];
            const Icon = STAGE_ICONS[segment.key];

            return (
              <div
                key={segment.key}
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium",
                  stageConfig.bgLight,
                  stageConfig.textColor
                )}
              >
                <Icon className="h-3 w-3" />
                {!compact && <span>{stageConfig.shortLabel}:</span>}
                <span>{segment.count}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface PipelineProgressCellProps {
  stats: PipelineStats;
  positionsNeeded: number;
}

/**
 * Compact pipeline progress for table cells
 * Shows "filled/needed" with mini progress bar
 */
export function PipelineProgressCell({
  stats,
  positionsNeeded,
}: PipelineProgressCellProps) {
  const segments = getPipelineSegments(stats);
  const filledPercentage =
    positionsNeeded > 0
      ? Math.min(100, (stats.passed / positionsNeeded) * 100)
      : 0;

  return (
    <div className="space-y-1.5 min-w-[140px]">
      {/* Filled / Needed indicator */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          <span className="font-semibold text-foreground">{stats.passed}</span>
          <span className="mx-0.5">/</span>
          <span>{positionsNeeded}</span>
          <span className="ml-1 text-xs">filled</span>
        </span>
        {stats.total > 0 && (
          <span className="text-xs text-muted-foreground">
            {stats.total} candidate{stats.total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <TooltipProvider>
        <div className="h-1.5 w-full rounded-full bg-secondary flex overflow-hidden">
          {segments.length > 0 ? (
            segments.map((segment) => {
              const stageConfig = RECRUITMENT_PIPELINE_STAGE_MAP[segment.key];
              return (
                <Tooltip key={segment.key}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "h-full transition-all cursor-default",
                        stageConfig.color
                      )}
                      style={{ width: `${segment.percentage}%` }}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">
                      {stageConfig.label}: {segment.count}
                    </p>
                  </TooltipContent>
                </Tooltip>
              );
            })
          ) : (
            <div className="h-full w-full bg-secondary" />
          )}
        </div>
      </TooltipProvider>

      {/* Mini badges for non-zero stages */}
      {stats.total > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {segments
            .filter((s) => s.key !== "failed") // Don't show failed in mini view
            .slice(0, 3) // Show max 3 badges
            .map((segment) => {
              const stageConfig = RECRUITMENT_PIPELINE_STAGE_MAP[segment.key];
              return (
                <span
                  key={segment.key}
                  className={cn(
                    "text-[10px] px-1 py-0.5 rounded font-medium",
                    stageConfig.bgLight,
                    stageConfig.textColor
                  )}
                >
                  {stageConfig.shortLabel}: {segment.count}
                </span>
              );
            })}
          {stats.failed > 0 && (
            <span className="text-[10px] px-1 py-0.5 rounded font-medium bg-destructive/10 text-destructive">
              Failed: {stats.failed}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
