"use client";

import * as React from "react";
import {
  CheckCircle2,
  XCircle,
  Lock,
  Loader2,
  Stethoscope,
  Calendar,
  Clock,
  MapPin,
  Upload,
  Trash2,
  File,
  Eye,
  Pencil,
  PartyPopper,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  candidateService,
  type AssessmentProgress,
  type CandidateWithRelations,
} from "@/services/candidate.service";
import { cn } from "@/lib/utils";
import { showToast } from "@/lib/utils/toast-messages";
import type { TabMode } from "@/hooks/useAssessmentPermission";

interface McuTabProps {
  candidate: CandidateWithRelations;
  candidateId: string;
  mode: TabMode;
  progress: AssessmentProgress | null;
  onRefresh: () => void;
}

export function McuTab({
  candidate,
  candidateId,
  mode,
  progress,
  onRefresh,
}: McuTabProps) {
  // Locked mode — early return before hooks
  if (mode === "locked") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold text-foreground">MCU Locked</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Complete Interview User (Assessment User) first to unlock Medical Check-Up.
        </p>
      </div>
    );
  }

  return (
    <McuTabInner
      candidate={candidate}
      candidateId={candidateId}
      mode={mode}
      progress={progress}
      onRefresh={onRefresh}
    />
  );
}

/**
 * Inner component so hooks are never called conditionally.
 */
function McuTabInner({
  candidate,
  candidateId,
  mode,
  progress,
  onRefresh,
}: McuTabProps) {
  // Derive MCU status from progress
  const mcuStatus = React.useMemo(() => {
    if (!progress) return "pending";
    const stage = progress.mcu;
    if (stage.passed) return "passed";
    if (stage.failed) return "failed";
    return "pending";
  }, [progress]);

  const mcuIsPending = mcuStatus === "pending";

  // MCU Document state
  const [mcuDocument, setMcuDocument] = React.useState<{
    url: string | null;
    name: string | null;
    presignedUrl: string | null;
  } | null>(null);
  const [isUploadingMcu, setIsUploadingMcu] = React.useState(false);
  const [isDeletingMcuDoc, setIsDeletingMcuDoc] = React.useState(false);
  const mcuFileInputRef = React.useRef<HTMLInputElement>(null);

  // Schedule MCU dialog state
  const [showScheduleMcuDialog, setShowScheduleMcuDialog] = React.useState(false);
  const [isSchedulingMcu, setIsSchedulingMcu] = React.useState(false);
  const [mcuDate, setMcuDate] = React.useState("");
  const [mcuTime, setMcuTime] = React.useState("");
  const [mcuLocation, setMcuLocation] = React.useState("");

  // Notes state
  const [mcuNotes, setMcuNotes] = React.useState("");

  // Submit / confirm state
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [confirmDialog, setConfirmDialog] = React.useState<{
    open: boolean;
    action: "PASSED" | "FAILED";
  } | null>(null);

  // Fetch MCU document on mount (for view and edit modes)
  React.useEffect(() => {
    let cancelled = false;

    const fetchMcuDocument = async () => {
      try {
        const docRes = await candidateService.getMcuDocument(candidateId);
        if (!cancelled && docRes.success && docRes.data) {
          setMcuDocument(docRes.data);
        }
      } catch {
        // silently fail
      }
    };

    fetchMcuDocument();
    return () => {
      cancelled = true;
    };
  }, [candidateId]);

  // Schedule MCU handler
  const handleScheduleMcu = async () => {
    if (!mcuDate || !mcuTime || !mcuLocation.trim()) {
      showToast.error("Please fill in MCU date, time, and location");
      return;
    }

    setIsSchedulingMcu(true);
    try {
      const response = await candidateService.scheduleMcu(candidateId, {
        mcu_date: new Date(`${mcuDate}T${mcuTime}`).toISOString(),
        mcu_location: mcuLocation.trim(),
      });
      if (response.success && response.data) {
        setShowScheduleMcuDialog(false);
        setMcuDate("");
        setMcuTime("");
        setMcuLocation("");
        showToast.success("MCU scheduled! The candidate will be notified.");
        onRefresh();
      } else {
        showToast.error(response.message || "Failed to schedule MCU");
      }
    } catch {
      showToast.error("Failed to schedule MCU");
    } finally {
      setIsSchedulingMcu(false);
    }
  };

  // MCU Document Upload Handler
  const handleMcuFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      showToast.error("Invalid file type. Please upload PDF, JPEG, or PNG.");
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast.error("File too large. Maximum size is 10MB.");
      return;
    }

    setIsUploadingMcu(true);
    try {
      const response = await candidateService.uploadMcuDocument(candidateId, file);
      if (response.success && response.data) {
        // Refresh MCU document data
        const docRes = await candidateService.getMcuDocument(candidateId);
        if (docRes.success && docRes.data) {
          setMcuDocument(docRes.data);
        }
        showToast.success("MCU document uploaded successfully");
      } else {
        showToast.error(response.message || "Failed to upload document");
      }
    } catch {
      showToast.error("Failed to upload MCU document");
    } finally {
      setIsUploadingMcu(false);
      // Reset file input
      if (mcuFileInputRef.current) {
        mcuFileInputRef.current.value = "";
      }
    }
  };

  // MCU Document Delete Handler
  const handleMcuDocumentDelete = async () => {
    setIsDeletingMcuDoc(true);
    try {
      const response = await candidateService.deleteMcuDocument(candidateId);
      if (response.success) {
        setMcuDocument(null);
        showToast.success("MCU document deleted successfully");
      } else {
        showToast.error(response.message || "Failed to delete document");
      }
    } catch {
      showToast.error("Failed to delete MCU document");
    } finally {
      setIsDeletingMcuDoc(false);
    }
  };

  // Assessment action handler (Pass / Fail)
  const handleAssessmentAction = async (action: "PASSED" | "FAILED") => {
    setIsSubmitting(true);
    try {
      const response = await candidateService.updateMcu(candidateId, action, mcuNotes);
      if (response?.success && response.data) {
        showToast.success(`MCU marked as ${action.toLowerCase()}`);
        onRefresh();
      } else {
        showToast.error(response?.message || "Failed to update assessment");
      }
    } catch {
      showToast.error("Failed to update assessment");
    } finally {
      setIsSubmitting(false);
      setConfirmDialog(null);
    }
  };

  return (
    <>
      {/* Status Banner */}
      {mcuStatus === "passed" && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold text-emerald-700">Medical Check-Up Passed</p>
            <p className="text-sm text-muted-foreground">Candidate has been cleared for medical examination.</p>
          </div>
        </div>
      )}
      {mcuStatus === "failed" && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="font-semibold text-destructive">Medical Check-Up Failed</p>
            <p className="text-sm text-muted-foreground">Candidate did not pass the medical examination.</p>
          </div>
        </div>
      )}

      {/* MCU Schedule Section */}
      {progress?.mcuDate ? (
        <div className="rounded-2xl border bg-card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-sm font-bold text-blue-600">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">MCU Schedule</h2>
                <p className="text-xs text-muted-foreground">Medical Check-Up has been scheduled</p>
              </div>
            </div>
            {mcuIsPending && mode === "edit" && (
              <Button
                variant="outline"
                onClick={() => setShowScheduleMcuDialog(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
                Reschedule
              </Button>
            )}
          </div>
          <div className="px-6 py-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  Date & Time
                </p>
                <p className="text-sm font-medium">
                  {new Date(progress.mcuDate).toLocaleDateString("id-ID", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Asia/Jakarta",
                  })} WIB
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3 w-3" />
                  Location
                </p>
                <p className="text-sm font-medium">{progress.mcuLocation}</p>
              </div>
            </div>
          </div>
        </div>
      ) : mcuIsPending && mode === "edit" ? (
        <div className="rounded-2xl border border-dashed border-blue-500/30 bg-blue-500/5">
          <div className="flex flex-col items-center justify-center py-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 mb-3">
              <Stethoscope className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="text-base font-semibold">Schedule Medical Check-Up</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mt-1 mb-4">
              Set the MCU date and location for this candidate. The candidate will be notified via email.
            </p>
            <Button onClick={() => setShowScheduleMcuDialog(true)}>
              <Calendar className="h-4 w-4" />
              Schedule MCU
            </Button>
          </div>
        </div>
      ) : null}

      {/* Section 1: Document Upload */}
      <div className="rounded-2xl border bg-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-sm font-bold text-blue-600">1</div>
            <div>
              <h2 className="text-base font-semibold text-foreground">MCU Document</h2>
              <p className="text-xs text-muted-foreground">Upload the medical check-up result document (PDF, JPEG, or PNG, max 10MB)</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-5">
          {/* Hidden file input */}
          <input
            ref={mcuFileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleMcuFileUpload}
            className="hidden"
          />

          {/* Document state */}
          {mcuDocument?.url ? (
            <div className="rounded-lg border bg-secondary/20 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                    <File className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{mcuDocument.name || "MCU Document"}</p>
                    <p className="text-xs text-muted-foreground">Uploaded successfully</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {mcuDocument.presignedUrl && (
                    <Button
                      variant="outline"
                      asChild
                    >
                      <a href={mcuDocument.presignedUrl} target="_blank" rel="noopener noreferrer">
                        <Eye />
                        View
                      </a>
                    </Button>
                  )}
                  {mcuStatus === "pending" && mode === "edit" && (
                    <Button
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={handleMcuDocumentDelete}
                      disabled={isDeletingMcuDoc}
                    >
                      {isDeletingMcuDoc ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Trash2 />
                      )}
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : mode === "edit" ? (
            <button
              type="button"
              onClick={() => mcuFileInputRef.current?.click()}
              disabled={isUploadingMcu || mcuStatus !== "pending"}
              className={cn(
                "w-full rounded-lg border-2 border-dashed p-8 text-center transition-colors",
                mcuStatus === "pending"
                  ? "border-muted-foreground/25 hover:border-blue-500/50 hover:bg-blue-500/5 cursor-pointer"
                  : "border-muted-foreground/15 opacity-60 cursor-not-allowed"
              )}
            >
              {isUploadingMcu ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                  <p className="text-sm font-medium">Uploading document...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                    <Upload className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Click to upload MCU document</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, JPEG, or PNG up to 10MB</p>
                  </div>
                </div>
              )}
            </button>
          ) : (
            <div className="rounded-lg border bg-secondary/20 p-4 text-center">
              <p className="text-sm text-muted-foreground">No document uploaded yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Notes */}
      <div className="rounded-2xl border bg-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-sm font-bold text-blue-600">2</div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Notes / Description</h2>
              <p className="text-xs text-muted-foreground">Add any additional notes about the medical check-up results</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-5">
          <Textarea
            id="mcu-notes"
            placeholder="Add notes for Medical Check-Up..."
            value={mcuNotes}
            onChange={(e) => setMcuNotes(e.target.value)}
            disabled={mcuStatus !== "pending" || mode === "view"}
            className="min-h-32"
          />
        </div>
      </div>

      {/* Action Bar - Only show if pending and edit mode */}
      {mcuIsPending && mode === "edit" && (
        <div className="sticky bottom-4 z-10">
          <div className="rounded-2xl border-blue-500/20 shadow-lg">
            <div className="flex items-center justify-between p-4">
              <p className="text-sm text-muted-foreground">
                Upload the MCU document and set the result to continue.
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={isSubmitting}
                  onClick={() => setConfirmDialog({
                    open: true,
                    action: "PASSED",
                  })}
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <CheckCircle2 />
                  )}
                  Pass
                </Button>
                <Button
                  variant="destructive"
                  disabled={isSubmitting}
                  onClick={() => setConfirmDialog({
                    open: true,
                    action: "FAILED",
                  })}
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <XCircle />
                  )}
                  Fail
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assessment Failed Notice */}
      {progress?.anyFailed && (
        <div className="rounded-2xl border-destructive bg-destructive/5">
          <div className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h3 className="font-semibold text-destructive">Assessment Failed</h3>
              <p className="text-sm text-muted-foreground">
                This candidate has failed one of the assessment stages and cannot proceed further.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* All Passed Notice */}
      {progress?.allPassed && (
        <div className="rounded-2xl border-emerald-500 bg-emerald-500/5">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                <PartyPopper className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-emerald-600">All Assessments Passed!</h3>
                <p className="text-sm text-muted-foreground">
                  This candidate has passed all assessment stages and is ready for onboarding.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmDialog?.open || false}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog?.action === "PASSED" ? "Mark as Passed" : "Mark as Failed"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.action === "PASSED" ? (
                <>
                  Are you sure you want to mark <strong>MCU</strong> as passed? This will unlock the next stage.
                </>
              ) : (
                <>
                  Are you sure you want to mark <strong>MCU</strong> as failed? The candidate will not be able to proceed further.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDialog) {
                  handleAssessmentAction(confirmDialog.action);
                }
              }}
              disabled={isSubmitting}
              className={cn(
                confirmDialog?.action === "PASSED"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-destructive hover:bg-destructive/90"
              )}
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" />
              ) : confirmDialog?.action === "PASSED" ? (
                <CheckCircle2 />
              ) : (
                <XCircle />
              )}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Schedule MCU Dialog */}
      <Dialog open={showScheduleMcuDialog} onOpenChange={(open) => {
        setShowScheduleMcuDialog(open);
        if (!open) {
          setMcuDate("");
          setMcuTime("");
          setMcuLocation("");
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Stethoscope className="h-4 w-4 text-blue-600" />
              </div>
              Schedule Medical Check-Up
            </DialogTitle>
            <DialogDescription>
              Set the MCU date, time, and location for this candidate. The candidate will be notified via email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-3">
              <Label className="text-sm font-medium">MCU Date & Time</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="mcu-date" className="text-xs text-muted-foreground font-normal flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    Date
                  </Label>
                  <Input
                    id="mcu-date"
                    type="date"
                    value={mcuDate}
                    onChange={(e) => setMcuDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                    className="h-11 text-sm font-medium tabular-nums"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mcu-time" className="text-xs text-muted-foreground font-normal flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    Time
                  </Label>
                  <Input
                    id="mcu-time"
                    type="time"
                    value={mcuTime}
                    onChange={(e) => setMcuTime(e.target.value)}
                    className="h-11 text-sm font-medium tabular-nums"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mcu-location" className="text-sm font-medium flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                Location
              </Label>
              <Input
                id="mcu-location"
                type="text"
                placeholder="e.g. RS Pondok Indah, Jakarta Selatan"
                value={mcuLocation}
                onChange={(e) => setMcuLocation(e.target.value)}
                className="h-11 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowScheduleMcuDialog(false)}
              disabled={isSchedulingMcu}
            >
              Cancel
            </Button>
            <Button
              onClick={handleScheduleMcu}
              disabled={isSchedulingMcu || !mcuDate || !mcuTime || !mcuLocation.trim()}
            >
              {isSchedulingMcu ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Stethoscope />
              )}
              {isSchedulingMcu ? "Scheduling..." : "Schedule MCU"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
