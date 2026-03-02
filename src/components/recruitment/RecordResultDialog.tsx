"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ClipboardCheck } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { candidateService, type Assessment } from "@/services/candidate.service";
import { showToast } from "@/lib/utils/toast-messages";
import {
  ASSESSMENT_RESULT_OPTIONS,
  ASSESSMENT_TYPE_LABELS,
  RATING_OPTIONS,
  type AssessmentType,
  type AssessmentResult,
} from "@/lib/constants/assessmentTypes";

// --- Schema ---

const recordResultSchema = z.object({
  result: z.string().min(1, "Result is required"),
  conductedDate: z.string().min(1, "Conducted date is required"),
  feedback: z.string().optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
  notes: z.string().optional(),
});

type RecordResultFormData = z.infer<typeof recordResultSchema>;

// --- Props ---

interface RecordResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateId: string;
  assessment: Assessment | null;
  onSuccess: () => void;
}

// --- Component ---

export function RecordResultDialog({
  open,
  onOpenChange,
  candidateId,
  assessment,
  onSuccess,
}: RecordResultDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RecordResultFormData>({
    resolver: zodResolver(recordResultSchema),
    defaultValues: {
      result: "",
      conductedDate: "",
      feedback: "",
      rating: undefined,
      notes: "",
    },
  });

  const selectedResult = watch("result");
  const selectedRating = watch("rating");

  // Reset form when dialog opens with assessment data
  React.useEffect(() => {
    if (open && assessment) {
      // Format date for datetime-local input
      const conductedDate = assessment.conductedDate
        ? new Date(assessment.conductedDate).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16);

      reset({
        result: assessment.result || "",
        conductedDate,
        feedback: assessment.feedback || "",
        rating: assessment.rating || undefined,
        notes: assessment.notes || "",
      });
    }
  }, [open, assessment, reset]);

  const onSubmit = async (data: RecordResultFormData) => {
    if (!assessment) return;

    try {
      const response = await candidateService.updateAssessment(
        candidateId,
        assessment.id,
        {
          result: data.result,
          conducted_date: new Date(data.conductedDate).toISOString(),
          status: "completed",
          feedback: data.feedback || undefined,
          rating: data.rating,
          notes: data.notes || undefined,
        }
      );

      if (response.success) {
        showToast.success("Assessment result recorded successfully");
        onOpenChange(false);
        onSuccess();
      } else {
        showToast.error(response.message || "Failed to record result");
      }
    } catch (error) {
      showToast.error("Failed to record result");
    }
  };

  if (!assessment) return null;

  const assessmentTypeLabel =
    ASSESSMENT_TYPE_LABELS[assessment.type as AssessmentType] || assessment.type;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Record Assessment Result
          </DialogTitle>
          <DialogDescription>
            Record the result for {assessmentTypeLabel}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Result */}
          <div className="space-y-2">
            <Label htmlFor="result">
              Result <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedResult}
              onValueChange={(value) => setValue("result", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select result" />
              </SelectTrigger>
              <SelectContent>
                {ASSESSMENT_RESULT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.result && (
              <p className="text-sm text-destructive">{errors.result.message}</p>
            )}
          </div>

          {/* Conducted Date */}
          <div className="space-y-2">
            <Label htmlFor="conductedDate">
              Conducted Date & Time <span className="text-destructive">*</span>
            </Label>
            <Input
              id="conductedDate"
              type="datetime-local"
              {...register("conductedDate")}
            />
            {errors.conductedDate && (
              <p className="text-sm text-destructive">
                {errors.conductedDate.message}
              </p>
            )}
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label htmlFor="rating">Rating (1-5)</Label>
            <Select
              value={selectedRating?.toString() || ""}
              onValueChange={(value) => setValue("rating", parseInt(value, 10))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select rating" />
              </SelectTrigger>
              <SelectContent>
                {RATING_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Feedback */}
          <div className="space-y-2">
            <Label htmlFor="feedback">Feedback</Label>
            <Textarea
              id="feedback"
              placeholder="Provide feedback about the assessment..."
              rows={3}
              {...register("feedback")}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Internal Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes (internal use only)..."
              rows={2}
              {...register("notes")}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Result
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default RecordResultDialog;
