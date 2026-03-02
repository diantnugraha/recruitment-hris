/**
 * Recruitment Pipeline Helpers
 * Utility functions for calculating and displaying recruitment pipeline statistics
 */

import type {
  CandidateWithRelations,
  CandidateAssessment,
} from "@/services/candidate.service";

/**
 * Pipeline stage keys for candidate-centric view
 */
export type CandidatePipelineStage =
  | "interview1"
  | "interview2"
  | "mcu"
  | "passed"
  | "failed";

/**
 * Determine the current pipeline stage for a single candidate
 * @param assessment - Candidate's assessment data
 * @returns The current stage key
 */
export function getCandidateCurrentStage(
  assessment: CandidateAssessment | null | undefined
): CandidatePipelineStage {
  if (!assessment) return "interview1";

  // Check for any failures first
  if (
    assessment.interview1Status === "FAILED" ||
    assessment.interview2Status === "FAILED" ||
    assessment.mcuStatus === "FAILED"
  ) {
    return "failed";
  }

  // Check if all stages passed
  if (assessment.mcuStatus === "PASSED") {
    return "passed";
  }

  // Determine current stage based on passed stages
  if (assessment.interview2Status === "PASSED") {
    return "mcu";
  }

  if (assessment.interview1Status === "PASSED") {
    return "interview2";
  }

  return "interview1";
}

/**
 * Pipeline statistics for a single employee request
 */
export interface PipelineStats {
  interview1: number; // Candidates currently at Interview 1 stage
  interview2: number; // Candidates currently at Interview 2 stage
  mcu: number; // Candidates currently at MCU stage
  passed: number; // Candidates who passed all stages
  failed: number; // Candidates who failed any stage
  total: number; // Total number of candidates
}

/**
 * Calculate pipeline statistics from a list of candidates
 * @param candidates - Array of candidates with their assessment data
 * @returns PipelineStats object with counts per stage
 */
export function calculatePipelineStats(
  candidates: CandidateWithRelations[]
): PipelineStats {
  const stats: PipelineStats = {
    interview1: 0,
    interview2: 0,
    mcu: 0,
    passed: 0,
    failed: 0,
    total: candidates.length,
  };

  candidates.forEach((candidate) => {
    const assessment = candidate.assessment;

    // No assessment yet = at Interview 1 stage
    if (!assessment) {
      stats.interview1++;
      return;
    }

    // Check for any failures first
    if (
      assessment.interview1Status === "FAILED" ||
      assessment.interview2Status === "FAILED" ||
      assessment.mcuStatus === "FAILED"
    ) {
      stats.failed++;
      return;
    }

    // Check if all stages passed
    if (assessment.mcuStatus === "PASSED") {
      stats.passed++;
      return;
    }

    // Determine current stage based on passed stages
    if (assessment.interview2Status === "PASSED") {
      // Interview 2 passed, waiting for MCU
      stats.mcu++;
    } else if (assessment.interview1Status === "PASSED") {
      // Interview 1 passed, waiting for Interview 2
      stats.interview2++;
    } else {
      // Still at Interview 1
      stats.interview1++;
    }
  });

  return stats;
}

/**
 * Calculate the percentage of positions filled
 * @param stats - Pipeline statistics
 * @param positionsNeeded - Total positions to fill
 * @returns Percentage (0-100)
 */
export function getProgressPercentage(
  stats: PipelineStats,
  positionsNeeded: number
): number {
  if (positionsNeeded === 0) return 0;
  return Math.min(100, Math.round((stats.passed / positionsNeeded) * 100));
}

/**
 * Get a summary of active candidates (not failed)
 * @param stats - Pipeline statistics
 * @returns Number of active candidates
 */
export function getActiveCandidates(stats: PipelineStats): number {
  return stats.interview1 + stats.interview2 + stats.mcu + stats.passed;
}

/**
 * Get segments for pipeline visualization bar
 * @param stats - Pipeline statistics
 * @returns Array of segments with key, count, and percentage
 */
export function getPipelineSegments(stats: PipelineStats) {
  if (stats.total === 0) return [];

  const segments: Array<{
    key: "interview1" | "interview2" | "mcu" | "passed" | "failed";
    count: number;
    percentage: number;
  }> = [];

  const addSegment = (
    key: "interview1" | "interview2" | "mcu" | "passed" | "failed",
    count: number
  ) => {
    if (count > 0) {
      segments.push({
        key,
        count,
        percentage: (count / stats.total) * 100,
      });
    }
  };

  // Add segments in order (interview1 → interview2 → mcu → passed → failed)
  addSegment("interview1", stats.interview1);
  addSegment("interview2", stats.interview2);
  addSegment("mcu", stats.mcu);
  addSegment("passed", stats.passed);
  addSegment("failed", stats.failed);

  return segments;
}
