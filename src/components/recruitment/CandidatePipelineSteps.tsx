"use client";

import * as React from "react";
import { Check, X, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CandidateAssessment } from "@/services/candidate.service";

interface CandidatePipelineStepsProps {
  assessment: CandidateAssessment | null | undefined;
  compact?: boolean;
  className?: string;
}

const STEPS = [
  { key: "interview1Status", label: "Int 1", fullLabel: "Interview 1" },
  { key: "interview2Status", label: "Int 2", fullLabel: "Interview 2" },
  { key: "mcuStatus", label: "MCU", fullLabel: "Medical Check-Up" },
] as const;

type StepStatus = "passed" | "failed" | "pending" | "current";

function getStepStatus(
  assessment: CandidateAssessment | null | undefined,
  stepKey: string,
  previousPassed: boolean
): StepStatus {
  if (!assessment) {
    return stepKey === "interview1Status" ? "current" : "pending";
  }

  const status = assessment[stepKey as keyof CandidateAssessment] as string;

  if (status === "PASSED") return "passed";
  if (status === "FAILED") return "failed";

  // Pending - check if this is the current step
  if (previousPassed && !status) return "current";
  return "pending";
}

export function CandidatePipelineSteps({
  assessment,
  compact = false,
  className,
}: CandidatePipelineStepsProps) {
  // Calculate statuses for all steps
  const stepStatuses: StepStatus[] = [];
  let previousPassed = true;
  let anyFailed = false;

  STEPS.forEach((step) => {
    if (anyFailed) {
      stepStatuses.push("pending");
      return;
    }

    const status = getStepStatus(assessment, step.key, previousPassed);
    stepStatuses.push(status);

    if (status === "failed") {
      anyFailed = true;
      previousPassed = false;
    } else if (status === "passed") {
      previousPassed = true;
    } else {
      previousPassed = false;
    }
  });

  // Check if all passed
  const allPassed = stepStatuses.every((s) => s === "passed");

  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-1", className)}>
        {STEPS.map((step, index) => {
          const status = stepStatuses[index];

          return (
            <React.Fragment key={step.key}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "flex items-center justify-center rounded-full transition-all",
                      compact ? "h-6 w-6" : "h-7 w-7",
                      status === "passed" && "bg-emerald-500 text-white",
                      status === "failed" && "bg-destructive text-white",
                      status === "current" &&
                        "bg-accent text-accent-foreground ring-2 ring-accent/30",
                      status === "pending" && "bg-secondary text-muted-foreground"
                    )}
                  >
                    {status === "passed" ? (
                      <Check
                        className={cn(compact ? "h-3 w-3" : "h-3.5 w-3.5")}
                      />
                    ) : status === "failed" ? (
                      <X className={cn(compact ? "h-3 w-3" : "h-3.5 w-3.5")} />
                    ) : (
                      <span
                        className={cn(
                          "text-[10px] font-medium",
                          status === "current" && "text-accent-foreground"
                        )}
                      >
                        {index + 1}
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="font-medium">{step.fullLabel}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {status}
                  </p>
                </TooltipContent>
              </Tooltip>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-4 transition-all",
                    stepStatuses[index] === "passed"
                      ? "bg-emerald-500"
                      : "bg-secondary"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}

        {/* Final checkmark for all passed */}
        {allPassed && (
          <>
            <div className="h-0.5 w-4 bg-emerald-500" />
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "flex items-center justify-center rounded-full bg-emerald-500 text-white",
                    compact ? "h-6 w-6" : "h-7 w-7"
                  )}
                >
                  <Check className={cn(compact ? "h-3 w-3" : "h-4 w-4")} />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="font-medium">All Passed</p>
                <p className="text-xs text-muted-foreground">
                  Ready for onboarding
                </p>
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}

export default CandidatePipelineSteps;
