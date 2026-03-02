"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Calendar } from "lucide-react";

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

import { candidateService } from "@/services/candidate.service";
import { showToast } from "@/lib/utils/toast-messages";
import {
  ASSESSMENT_TYPE_OPTIONS,
  type AssessmentType,
} from "@/lib/constants/assessmentTypes";

// --- Schema ---

const scheduleAssessmentSchema = z.object({
  type: z.string().min(1, "Assessment type is required"),
  scheduledDate: z.string().min(1, "Scheduled date is required"),
  location: z.string().optional(),
  notes: z.string().optional(),
});

type ScheduleAssessmentFormData = z.infer<typeof scheduleAssessmentSchema>;

// --- Props ---

interface ScheduleAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateId: string;
  candidateName: string;
  onSuccess: () => void;
}

// --- Component ---

export function ScheduleAssessmentDialog({
  open,
  onOpenChange,
  candidateId,
  candidateName,
  onSuccess,
}: ScheduleAssessmentDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ScheduleAssessmentFormData>({
    resolver: zodResolver(scheduleAssessmentSchema),
    defaultValues: {
      type: "",
      scheduledDate: "",
      location: "",
      notes: "",
    },
  });

  const selectedType = watch("type");

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      reset({
        type: "",
        scheduledDate: "",
        location: "",
        notes: "",
      });
    }
  }, [open, reset]);

  const onSubmit = async (data: ScheduleAssessmentFormData) => {
    try {
      const response = await candidateService.createAssessment(candidateId, {
        type: data.type,
        scheduled_date: new Date(data.scheduledDate).toISOString(),
        location: data.location || undefined,
        notes: data.notes || undefined,
      });

      if (response.success) {
        showToast.success("Assessment scheduled successfully");
        onOpenChange(false);
        onSuccess();
      } else {
        showToast.error(response.message || "Failed to schedule assessment");
      }
    } catch (error) {
      showToast.error("Failed to schedule assessment");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Assessment
          </DialogTitle>
          <DialogDescription>
            Schedule a new assessment for {candidateName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Assessment Type */}
          <div className="space-y-2">
            <Label htmlFor="type">
              Assessment Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedType}
              onValueChange={(value) => setValue("type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select assessment type" />
              </SelectTrigger>
              <SelectContent>
                {ASSESSMENT_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-destructive">{errors.type.message}</p>
            )}
          </div>

          {/* Scheduled Date */}
          <div className="space-y-2">
            <Label htmlFor="scheduledDate">
              Scheduled Date & Time <span className="text-destructive">*</span>
            </Label>
            <Input
              id="scheduledDate"
              type="datetime-local"
              {...register("scheduledDate")}
            />
            {errors.scheduledDate && (
              <p className="text-sm text-destructive">
                {errors.scheduledDate.message}
              </p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g., Meeting Room A, Zoom, etc."
              {...register("location")}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes for this assessment..."
              rows={3}
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
              Schedule Assessment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ScheduleAssessmentDialog;
