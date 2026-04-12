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
  FileText,
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
import { showToast } from "@/lib/utils/toast-messages";
import type { TabMode } from "@/hooks/useAssessmentPermission";

// --- TUV button style helpers ---

const btnPrimary = {
  backgroundColor: "var(--hsd-ui-background-color-primary)",
  borderColor: "var(--hsd-ui-border-color-primary)",
  color: "var(--hsd-ui-text-color-primary)",
  borderRadius: "4px",
  height: "38px",
  padding: "0 16px",
  fontSize: "0.875rem",
  fontWeight: 500,
} as const;

const btnSecondary = {
  borderRadius: "4px",
  height: "38px",
  padding: "0 16px",
  fontSize: "0.875rem",
  fontWeight: 500,
  borderColor: "rgba(120,134,127,0.2)",
} as const;

const btnDanger = {
  backgroundColor: "rgb(250, 55, 70)",
  borderColor: "rgb(250, 55, 70)",
  color: "var(--hsd-ui-color-gray-50, #fff)",
  borderRadius: "4px",
  height: "38px",
  padding: "0 16px",
  fontSize: "0.875rem",
  fontWeight: 500,
} as const;

const btnSuccess = {
  backgroundColor: "rgb(140, 240, 0)",
  borderColor: "rgb(140, 240, 0)",
  color: "var(--hsd-ui-color-gray-900, #232933)",
  borderRadius: "4px",
  height: "38px",
  padding: "0 16px",
  fontSize: "0.875rem",
  fontWeight: 500,
} as const;

// --- TUV reusable sub-components ---

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        style={{
          fontSize: "0.6875rem",
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "var(--hsd-ui-color-gray-500)",
          margin: 0,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: "0.875rem",
          fontWeight: 500,
          color: value ? "var(--hsd-ui-color-gray-900)" : "var(--hsd-ui-color-gray-400)",
          margin: "2px 0 0",
        }}
      >
        {value || "No Data"}
      </p>
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  headerExtra,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      className="border"
      style={{
        borderRadius: "8px",
        backgroundColor: "#fff",
        borderColor: "rgba(120, 134, 127, 0.2)",
      }}
    >
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid rgba(120, 134, 127, 0.15)" }}
      >
        <h2
          style={{
            fontSize: "0.9375rem",
            fontWeight: 600,
            color: "var(--hsd-ui-color-gray-900)",
            margin: 0,
          }}
        >
          {title}
        </h2>
        <div className="flex items-center gap-2">
          {headerExtra}
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: "var(--hsd-ui-color-gray-100)" }}
          >
            <Icon
              style={{ width: "16px", height: "16px", color: "var(--hsd-ui-color-gray-500)" }}
            />
          </div>
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

// --- Main component ---

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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "64px 0",
          textAlign: "center",
        }}
      >
        <div
          className="flex items-center justify-center"
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            backgroundColor: "var(--hsd-ui-color-gray-100)",
            marginBottom: "16px",
          }}
        >
          <Lock style={{ width: "24px", height: "24px", color: "var(--hsd-ui-color-gray-400)" }} />
        </div>
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            color: "var(--hsd-ui-color-gray-900)",
            margin: 0,
          }}
        >
          MCU Locked
        </h3>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--hsd-ui-color-gray-500)",
            margin: "4px 0 0",
            maxWidth: "24rem",
          }}
        >
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
    <div className="space-y-5">
      {/* Status Banner -- Passed */}
      {mcuStatus === "passed" && (
        <SectionCard title="MCU Result" icon={CheckCircle2}>
          <div
            className="flex items-center gap-3"
            style={{
              borderRadius: "8px",
              backgroundColor: "rgba(0, 168, 120, 0.06)",
              border: "1px solid rgba(0, 168, 120, 0.25)",
              padding: "12px 16px",
            }}
          >
            <CheckCircle2 style={{ width: "20px", height: "20px", color: "rgba(0, 168, 120, 1)", flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "rgba(0, 168, 120, 1)", margin: 0 }}>
                Medical Check-Up Passed
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--hsd-ui-color-gray-500)", margin: "2px 0 0" }}>
                Candidate has been cleared for medical examination.
              </p>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Status Banner -- Failed */}
      {mcuStatus === "failed" && (
        <SectionCard title="MCU Result" icon={XCircle}>
          <div
            className="flex items-center gap-3"
            style={{
              borderRadius: "8px",
              backgroundColor: "rgba(250, 55, 70, 0.04)",
              border: "1px solid rgba(250, 55, 70, 0.25)",
              padding: "12px 16px",
            }}
          >
            <XCircle style={{ width: "20px", height: "20px", color: "rgba(250, 55, 70, 1)", flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "rgba(250, 55, 70, 1)", margin: 0 }}>
                Medical Check-Up Failed
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--hsd-ui-color-gray-500)", margin: "2px 0 0" }}>
                Candidate did not pass the medical examination.
              </p>
            </div>
          </div>
        </SectionCard>
      )}

      {/* MCU Schedule Section */}
      {progress?.mcuDate ? (
        <SectionCard
          title="MCU Schedule"
          icon={Calendar}
          headerExtra={
            mcuIsPending && mode === "edit" ? (
              <Button
                variant="outline"
                size="default"
                onClick={() => setShowScheduleMcuDialog(true)}
                style={btnSecondary}
              >
                <Pencil style={{ width: "14px", height: "14px", marginRight: "4px" }} />
                Reschedule
              </Button>
            ) : undefined
          }
        >
          <div className="grid grid-cols-2 gap-x-8 gap-y-5">
            <DetailItem
              label="Date & Time"
              value={
                new Date(progress.mcuDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                  timeZone: "Asia/Jakarta",
                }) + " WIB"
              }
            />
            <DetailItem label="Location" value={progress.mcuLocation || ""} />
          </div>
        </SectionCard>
      ) : mcuIsPending && mode === "edit" ? (
        <SectionCard title="MCU Schedule" icon={Calendar}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px 0",
              textAlign: "center",
            }}
          >
            <div
              className="flex items-center justify-center"
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: "var(--hsd-ui-color-gray-100)",
                marginBottom: "12px",
              }}
            >
              <Stethoscope style={{ width: "24px", height: "24px", color: "var(--hsd-ui-color-gray-400)" }} />
            </div>
            <h3
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--hsd-ui-color-gray-900)",
                margin: 0,
              }}
            >
              Schedule Medical Check-Up
            </h3>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--hsd-ui-color-gray-500)",
                maxWidth: "28rem",
                margin: "4px 0 16px",
              }}
            >
              Set the MCU date and location for this candidate. The candidate will be notified via email.
            </p>
            <Button onClick={() => setShowScheduleMcuDialog(true)} style={btnPrimary}>
              <Calendar style={{ width: "16px", height: "16px", marginRight: "6px" }} />
              Schedule MCU
            </Button>
          </div>
        </SectionCard>
      ) : null}

      {/* MCU Document */}
      <SectionCard title="MCU Document" icon={File}>
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
          <div
            style={{
              borderRadius: "8px",
              border: "1px solid rgba(120, 134, 127, 0.2)",
              backgroundColor: "var(--hsd-ui-color-gray-50)",
              padding: "16px",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(37, 99, 235, 0.1)",
                  }}
                >
                  <File style={{ width: "20px", height: "20px", color: "rgba(37, 99, 235, 1)" }} />
                </div>
                <div className="min-w-0">
                  <p
                    className="truncate"
                    style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--hsd-ui-color-gray-900)", margin: 0 }}
                  >
                    {mcuDocument.name || "MCU Document"}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--hsd-ui-color-gray-500)", margin: "2px 0 0" }}>
                    Uploaded successfully
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {mcuDocument.presignedUrl && (
                  <Button variant="outline" asChild style={btnSecondary}>
                    <a href={mcuDocument.presignedUrl} target="_blank" rel="noopener noreferrer">
                      <Eye style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                      View
                    </a>
                  </Button>
                )}
                {mcuStatus === "pending" && mode === "edit" && (
                  <Button
                    variant="outline"
                    onClick={handleMcuDocumentDelete}
                    disabled={isDeletingMcuDoc}
                    style={btnDanger}
                  >
                    {isDeletingMcuDoc ? (
                      <Loader2 className="animate-spin" style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                    ) : (
                      <Trash2 style={{ width: "16px", height: "16px", marginRight: "6px" }} />
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
            style={{
              width: "100%",
              borderRadius: "8px",
              border: "2px dashed rgba(120, 134, 127, 0.25)",
              padding: "32px",
              textAlign: "center",
              backgroundColor: "transparent",
              cursor: mcuStatus === "pending" ? "pointer" : "not-allowed",
              opacity: mcuStatus === "pending" ? 1 : 0.6,
              transition: "border-color 0.2s",
            }}
          >
            {isUploadingMcu ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2
                  className="animate-spin"
                  style={{ width: "32px", height: "32px", color: "var(--hsd-ui-background-color-primary)" }}
                />
                <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--hsd-ui-color-gray-700)", margin: 0 }}>
                  Uploading document...
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(37, 99, 235, 0.1)",
                  }}
                >
                  <Upload style={{ width: "24px", height: "24px", color: "rgba(37, 99, 235, 1)" }} />
                </div>
                <div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--hsd-ui-color-gray-700)", margin: 0 }}>
                    Click to upload MCU document
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--hsd-ui-color-gray-500)", margin: "4px 0 0" }}>
                    PDF, JPEG, or PNG up to 10MB
                  </p>
                </div>
              </div>
            )}
          </button>
        ) : (
          <div
            style={{
              borderRadius: "8px",
              border: "1px solid rgba(120, 134, 127, 0.2)",
              backgroundColor: "var(--hsd-ui-color-gray-50)",
              padding: "16px",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "0.875rem", color: "var(--hsd-ui-color-gray-500)", margin: 0 }}>
              No document uploaded yet.
            </p>
          </div>
        )}
      </SectionCard>

      {/* Notes / Description */}
      <SectionCard title="Notes / Description" icon={FileText}>
        <Textarea
          id="mcu-notes"
          placeholder="Add notes for Medical Check-Up..."
          value={mcuNotes}
          onChange={(e) => setMcuNotes(e.target.value)}
          disabled={mcuStatus !== "pending" || mode === "view"}
          className="min-h-32"
        />
      </SectionCard>

      {/* Action Bar - Only show if pending and edit mode */}
      {mcuIsPending && mode === "edit" && (
        <div className="flex items-center justify-between pt-2">
          <p style={{ fontSize: "0.75rem", color: "var(--hsd-ui-color-gray-500)", margin: 0 }}>
            Upload the MCU document and set the result to continue.
          </p>
          <div className="flex items-center gap-2">
            <Button
              disabled={isSubmitting}
              onClick={() => setConfirmDialog({ open: true, action: "PASSED" })}
              style={btnSuccess}
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" style={{ width: "16px", height: "16px", marginRight: "6px" }} />
              ) : (
                <CheckCircle2 style={{ width: "16px", height: "16px", marginRight: "6px" }} />
              )}
              Pass
            </Button>
            <Button
              disabled={isSubmitting}
              onClick={() => setConfirmDialog({ open: true, action: "FAILED" })}
              style={btnDanger}
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" style={{ width: "16px", height: "16px", marginRight: "6px" }} />
              ) : (
                <XCircle style={{ width: "16px", height: "16px", marginRight: "6px" }} />
              )}
              Fail
            </Button>
          </div>
        </div>
      )}

      {/* Assessment Failed Notice */}
      {progress?.anyFailed && (
        <SectionCard title="Assessment Status" icon={XCircle}>
          <div
            className="flex items-center gap-3"
            style={{
              borderRadius: "8px",
              backgroundColor: "rgba(250, 55, 70, 0.04)",
              border: "1px solid rgba(250, 55, 70, 0.25)",
              padding: "12px 16px",
            }}
          >
            <XCircle style={{ width: "20px", height: "20px", color: "rgba(250, 55, 70, 1)", flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "rgba(250, 55, 70, 1)", margin: 0 }}>
                Assessment Failed
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--hsd-ui-color-gray-500)", margin: "2px 0 0" }}>
                This candidate has failed one of the assessment stages and cannot proceed further.
              </p>
            </div>
          </div>
        </SectionCard>
      )}

      {/* All Passed Notice */}
      {progress?.allPassed && (
        <SectionCard title="Assessment Status" icon={PartyPopper}>
          <div
            className="flex items-center gap-3"
            style={{
              borderRadius: "8px",
              backgroundColor: "rgba(0, 168, 120, 0.06)",
              border: "1px solid rgba(0, 168, 120, 0.25)",
              padding: "12px 16px",
            }}
          >
            <PartyPopper style={{ width: "20px", height: "20px", color: "rgba(0, 168, 120, 1)", flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "rgba(0, 168, 120, 1)", margin: 0 }}>
                All Assessments Passed!
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--hsd-ui-color-gray-500)", margin: "2px 0 0" }}>
                This candidate has passed all assessment stages and is ready for onboarding.
              </p>
            </div>
          </div>
        </SectionCard>
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
            <AlertDialogCancel disabled={isSubmitting} style={btnSecondary}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDialog) {
                  handleAssessmentAction(confirmDialog.action);
                }
              }}
              disabled={isSubmitting}
              style={confirmDialog?.action === "PASSED" ? btnSuccess : btnDanger}
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" style={{ width: "16px", height: "16px", marginRight: "6px" }} />
              ) : confirmDialog?.action === "PASSED" ? (
                <CheckCircle2 style={{ width: "16px", height: "16px", marginRight: "6px" }} />
              ) : (
                <XCircle style={{ width: "16px", height: "16px", marginRight: "6px" }} />
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
              <div
                className="flex items-center justify-center"
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(37, 99, 235, 0.1)",
                }}
              >
                <Stethoscope style={{ width: "16px", height: "16px", color: "rgba(37, 99, 235, 1)" }} />
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
                    style={{
                      height: "38px",
                      borderRadius: "4px",
                      border: "1px solid rgba(120, 134, 127, 0.2)",
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: 400,
                      color: "#232933",
                      padding: "0 12px",
                    }}
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
                    style={{
                      height: "38px",
                      borderRadius: "4px",
                      border: "1px solid rgba(120, 134, 127, 0.2)",
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: 400,
                      color: "#232933",
                      padding: "0 12px",
                    }}
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
              style={btnSecondary}
            >
              Cancel
            </Button>
            <Button
              onClick={handleScheduleMcu}
              disabled={isSchedulingMcu || !mcuDate || !mcuTime || !mcuLocation.trim()}
              style={btnPrimary}
            >
              {isSchedulingMcu ? (
                <Loader2 className="animate-spin" style={{ width: "16px", height: "16px", marginRight: "6px" }} />
              ) : (
                <Stethoscope style={{ width: "16px", height: "16px", marginRight: "6px" }} />
              )}
              {isSchedulingMcu ? "Scheduling..." : "Schedule MCU"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
