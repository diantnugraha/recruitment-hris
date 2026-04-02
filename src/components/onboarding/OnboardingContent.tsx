"use client";

import * as React from "react";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,

  Pencil,
  Trash2,
  Package,
  GraduationCap,
  MapPin,
  Send,
  Lock,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { TuvBadge } from "@/components/shared/tuv-badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  type CandidateWithRelations,
  type Onboarding,
  type Facility,
  type OnboardingProgram,
} from "@/services/candidate.service";
import { EmployeeMultiSelect } from "@/components/shared/employee-multi-select";
import { formatShortDate, cn } from "@/lib/utils";
import { showToast } from "@/lib/utils/toast-messages";
import {
  WORK_LOCATION_LABELS,
  type WorkLocation,
} from "@/lib/constants/employeeRequest";
import type { TabMode } from "@/hooks/useAssessmentPermission";

// ==================== TUV Button Style Helpers ====================

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
  backgroundColor: "rgba(250, 55, 70, 1)",
  borderColor: "rgba(250, 55, 70, 1)",
  color: "#fff",
  borderRadius: "4px",
  height: "38px",
  padding: "0 16px",
  fontSize: "0.875rem",
  fontWeight: 500,
} as const;

// ==================== TUV Reusable Sub-Components ====================

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
  children,
  headerRight,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
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
        <div className="flex items-center gap-3">
          {headerRight}
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

// ==================== TUV Table Styles ====================

const tableStyles = {
  wrapper: {
    borderRadius: "8px",
    border: "1px solid rgba(120, 134, 127, 0.2)",
    overflow: "hidden",
  } as React.CSSProperties,
  th: {
    textAlign: "left" as const,
    padding: "12px 16px",
    fontSize: "0.6875rem",
    fontWeight: 500,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    color: "var(--hsd-ui-color-gray-500)",
    backgroundColor: "var(--hsd-ui-color-gray-50)",
    borderBottom: "1px solid rgba(120, 134, 127, 0.15)",
  } as React.CSSProperties,
  thCenter: {
    textAlign: "center" as const,
    padding: "12px 16px",
    fontSize: "0.6875rem",
    fontWeight: 500,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    color: "var(--hsd-ui-color-gray-500)",
    backgroundColor: "var(--hsd-ui-color-gray-50)",
    borderBottom: "1px solid rgba(120, 134, 127, 0.15)",
  } as React.CSSProperties,
  thRight: {
    textAlign: "right" as const,
    padding: "12px 16px",
    fontSize: "0.6875rem",
    fontWeight: 500,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    color: "var(--hsd-ui-color-gray-500)",
    backgroundColor: "var(--hsd-ui-color-gray-50)",
    borderBottom: "1px solid rgba(120, 134, 127, 0.15)",
  } as React.CSSProperties,
  td: {
    padding: "12px 16px",
    fontSize: "0.875rem",
    color: "var(--hsd-ui-color-gray-600)",
    borderBottom: "1px solid rgba(120, 134, 127, 0.1)",
  } as React.CSSProperties,
  tdBold: {
    padding: "12px 16px",
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "var(--hsd-ui-color-gray-900)",
    borderBottom: "1px solid rgba(120, 134, 127, 0.1)",
  } as React.CSSProperties,
  tdCenter: {
    padding: "12px 16px",
    fontSize: "0.875rem",
    color: "var(--hsd-ui-color-gray-600)",
    borderBottom: "1px solid rgba(120, 134, 127, 0.1)",
    textAlign: "center" as const,
  } as React.CSSProperties,
  tdRight: {
    padding: "12px 16px",
    fontSize: "0.875rem",
    color: "var(--hsd-ui-color-gray-600)",
    borderBottom: "1px solid rgba(120, 134, 127, 0.1)",
    textAlign: "right" as const,
  } as React.CSSProperties,
};

const emptyText: React.CSSProperties = {
  fontSize: "0.875rem",
  color: "var(--hsd-ui-color-gray-400)",
  margin: 0,
  fontStyle: "italic",
};

// ==================== TUV Badge Variant Mapping ====================

const FACILITY_STATUS_BADGE: Record<string, "success" | "dark" | "info" | "warning"> = {
  Assigned: "info",
  Returned: "dark",
};

const PROGRAM_STATUS_BADGE: Record<string, "success" | "dark" | "info" | "warning" | "danger" | "brand"> = {
  Scheduled: "info",
  "In Progress": "brand",
  Completed: "success",
  Cancelled: "danger",
};

const CONDITION_BADGE: Record<string, "success" | "dark" | "warning"> = {
  New: "success",
  Used: "warning",
};

// ==================== Constants ====================

const FACILITY_ITEMS = ["Laptop CTO", "Laptop NCTO", "Starter Kit"] as const;
const FACILITY_CONDITIONS = ["New", "Used"] as const;
const FACILITY_STATUSES = ["Assigned"] as const;
const PROGRAM_STATUSES = ["Scheduled", "In Progress", "Completed", "Cancelled"] as const;

// Format snake_case to Title Case (e.g., head_office_jakarta -> Head Office Jakarta)
const formatJobPlacement = (value: string): string => {
  if (!value) return "";
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

// ==================== Props ====================

interface OnboardingContentProps {
  candidateId: string;
  mode: TabMode;
  onRefresh?: () => void;
}

// ==================== Component ====================

export function OnboardingContent({ candidateId, mode, onRefresh }: OnboardingContentProps) {
  // Data state
  const [candidate, setCandidate] = React.useState<CandidateWithRelations | null>(null);
  const [onboarding, setOnboarding] = React.useState<Onboarding | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isConverting, setIsConverting] = React.useState(false);

  // Job placement form
  const [jobPlacement, setJobPlacement] = React.useState("");
  const [joinDate, setJoinDate] = React.useState("");

  // Facility dialog state
  const [facilityDialog, setFacilityDialog] = React.useState<{
    open: boolean;
    mode: "add" | "edit";
    facility?: Facility;
  }>({ open: false, mode: "add" });
  const [facilityForm, setFacilityForm] = React.useState({
    item: "" as string,
    qty: 1,
    condition: "New",
    pics: [] as Array<{ id: string; name: string; email: string }>,
  });

  // Program dialog state
  const [programDialog, setProgramDialog] = React.useState<{
    open: boolean;
    mode: "add" | "edit";
    program?: OnboardingProgram;
  }>({ open: false, mode: "add" });
  const [programForm, setProgramForm] = React.useState({
    program: "",
    date: "",
    location: "",
    pics: [] as Array<{ id: string; name: string; email: string }>,
    status: "Scheduled",
  });

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = React.useState<{
    open: boolean;
    type: "facility" | "program";
    id: number;
    name: string;
  } | null>(null);

  // Send onboarding dialog
  const [showSendDialog, setShowSendDialog] = React.useState(false);

  // ==================== Derived State ====================

  const isOnboardingAccepted = onboarding?.onboardingAcceptedAt != null;
  const isReadOnly = mode === "view" || isOnboardingAccepted;

  const canSendOnboarding = onboarding &&
    joinDate &&
    onboarding.facilities.length > 0 &&
    onboarding.programs.length > 0;

  // ==================== Data Fetching ====================

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [candidateRes, onboardingRes] = await Promise.all([
        candidateService.getById(candidateId),
        candidateService.getOnboarding(candidateId),
      ]);

      if (candidateRes.success && candidateRes.data) {
        setCandidate(candidateRes.data);
      } else {
        setError(candidateRes.message || "Failed to load candidate");
        return;
      }

      if (onboardingRes.success) {
        setOnboarding(onboardingRes.data || null);
        if (onboardingRes.data) {
          setJobPlacement(onboardingRes.data.jobPlacement || "");
          setJoinDate(onboardingRes.data.joinDate || "");
        } else if (candidateRes.data?.employeeRequest?.jobPlacement) {
          setJobPlacement(candidateRes.data.employeeRequest.jobPlacement);
        }
      }
    } catch (err) {
      console.error("Failed to fetch onboarding data:", err);
      setError("Failed to load onboarding data");
    } finally {
      setIsLoading(false);
    }
  }, [candidateId]);

  React.useEffect(() => {
    if (mode !== "locked") {
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, [fetchData, mode]);

  // ==================== Ensure Onboarding ====================

  const ensureOnboarding = async (): Promise<boolean> => {
    if (onboarding) return true;

    try {
      const fetchRes = await candidateService.getOnboarding(candidateId);
      if (fetchRes.success && fetchRes.data) {
        setOnboarding(fetchRes.data);
        return true;
      }

      const response = await candidateService.createOnboarding(candidateId, {
        job_placement: jobPlacement,
      });
      if (response.success && response.data) {
        setOnboarding(response.data);
        return true;
      } else {
        showToast.error(response.message || "Failed to create onboarding");
        return false;
      }
    } catch (err) {
      showToast.error("Failed to create onboarding");
      return false;
    }
  };

  // ==================== Facility Handlers ====================

  const handleOpenFacilityDialog = (dialogMode: "add" | "edit", facility?: Facility) => {
    if (dialogMode === "edit" && facility) {
      setFacilityForm({
        item: facility.item,
        qty: facility.qty,
        condition: facility.condition,
        pics: (facility.pics || []).map((p) => ({
          id: String(p.id),
          name: p.name,
          email: p.email,
        })),
      });
    } else {
      setFacilityForm({
        item: "",
        qty: 1,
        condition: "New",
        pics: [],
      });
    }
    setFacilityDialog({ open: true, mode: dialogMode, facility });
  };

  const handleSaveFacility = async () => {
    const hasOnboarding = await ensureOnboarding();
    if (!hasOnboarding) return;

    try {
      const facilityPayload = {
        item: facilityForm.item,
        qty: facilityForm.qty,
        condition: facilityForm.condition,
        pic_employee_ids: facilityForm.pics.map((p) => Number(p.id)),
      };

      if (facilityDialog.mode === "add") {
        const response = await candidateService.addFacility(candidateId, facilityPayload);

        if (response.success) {
          showToast.success("Facility added");
          const onboardingRes = await candidateService.getOnboarding(candidateId);
          if (onboardingRes.success && onboardingRes.data) {
            setOnboarding(onboardingRes.data);
          }
        } else {
          showToast.error(response.message || "Failed to add facility");
        }
      } else if (facilityDialog.facility) {
        const response = await candidateService.updateFacility(
          candidateId,
          facilityDialog.facility.id,
          facilityPayload
        );

        if (response.success) {
          showToast.success("Facility updated");
          const onboardingRes = await candidateService.getOnboarding(candidateId);
          if (onboardingRes.success && onboardingRes.data) {
            setOnboarding(onboardingRes.data);
          }
        } else {
          showToast.error(response.message || "Failed to update facility");
        }
      }
    } catch (err) {
      showToast.error("Failed to save facility");
    }

    setFacilityDialog({ open: false, mode: "add" });
  };

  const handleDeleteFacility = async (facilityId: number) => {
    try {
      const response = await candidateService.deleteFacility(candidateId, facilityId);
      if (response.success) {
        showToast.deleted("Facility");
        const onboardingRes = await candidateService.getOnboarding(candidateId);
        if (onboardingRes.success && onboardingRes.data) {
          setOnboarding(onboardingRes.data);
        }
      } else {
        showToast.error(response.message || "Failed to delete facility");
      }
    } catch (err) {
      showToast.error("Failed to delete facility");
    }
    setDeleteConfirm(null);
  };

  // ==================== Program Handlers ====================

  const handleOpenProgramDialog = (dialogMode: "add" | "edit", program?: OnboardingProgram) => {
    if (dialogMode === "edit" && program) {
      setProgramForm({
        program: program.program,
        date: program.date,
        location: program.location,
        pics: (program.pics || []).map((p) => ({
          id: String(p.id),
          name: p.name,
          email: p.email,
        })),
        status: program.status,
      });
    } else {
      setProgramForm({
        program: "",
        date: "",
        location: "",
        pics: [],
        status: "Scheduled",
      });
    }
    setProgramDialog({ open: true, mode: dialogMode, program });
  };

  const handleSaveProgram = async () => {
    const hasOnboarding = await ensureOnboarding();
    if (!hasOnboarding) return;

    try {
      const programPayload = {
        program: programForm.program,
        date: programForm.date,
        location: programForm.location,
        pic_employee_ids: programForm.pics.map((p) => Number(p.id)),
        status: programForm.status,
      };

      if (programDialog.mode === "add") {
        const response = await candidateService.addProgram(candidateId, programPayload);

        if (response.success) {
          showToast.success("Program added");
          const onboardingRes = await candidateService.getOnboarding(candidateId);
          if (onboardingRes.success && onboardingRes.data) {
            setOnboarding(onboardingRes.data);
          }
        } else {
          showToast.error(response.message || "Failed to add program");
        }
      } else if (programDialog.program) {
        const response = await candidateService.updateProgram(
          candidateId,
          programDialog.program.id,
          programPayload
        );

        if (response.success) {
          showToast.success("Program updated");
          const onboardingRes = await candidateService.getOnboarding(candidateId);
          if (onboardingRes.success && onboardingRes.data) {
            setOnboarding(onboardingRes.data);
          }
        } else {
          showToast.error(response.message || "Failed to update program");
        }
      }
    } catch (err) {
      showToast.error("Failed to save program");
    }

    setProgramDialog({ open: false, mode: "add" });
  };

  const handleDeleteProgram = async (programId: number) => {
    try {
      const response = await candidateService.deleteProgram(candidateId, programId);
      if (response.success) {
        showToast.deleted("Program");
        const onboardingRes = await candidateService.getOnboarding(candidateId);
        if (onboardingRes.success && onboardingRes.data) {
          setOnboarding(onboardingRes.data);
        }
      } else {
        showToast.error(response.message || "Failed to delete program");
      }
    } catch (err) {
      showToast.error("Failed to delete program");
    }
    setDeleteConfirm(null);
  };

  // ==================== Send Onboarding ====================

  const handleSendOnboarding = async () => {
    setIsConverting(true);

    try {
      const hasOnboarding = await ensureOnboarding();
      if (!hasOnboarding) {
        setIsConverting(false);
        return;
      }

      const portalBaseUrl = window.location.origin;
      const response = await candidateService.sendOnboardingEmail(
        candidateId,
        portalBaseUrl,
        joinDate,
        jobPlacement
      );
      if (response.success) {
        showToast.success("Onboarding sent successfully!");
        setShowSendDialog(false);
        const onboardingRes = await candidateService.getOnboarding(candidateId);
        if (onboardingRes.success && onboardingRes.data) {
          setOnboarding(onboardingRes.data);
        }
        onRefresh?.();
      } else {
        showToast.error(response.message || "Failed to send onboarding");
      }
    } catch (err) {
      showToast.error("Failed to send onboarding");
    } finally {
      setIsConverting(false);
    }
  };

  // ==================== Locked Mode ====================

  if (mode === "locked") {
    return (
      <div
        className="border"
        style={{
          borderRadius: "8px",
          backgroundColor: "#fff",
          borderColor: "rgba(120, 134, 127, 0.2)",
        }}
      >
        <div className="flex flex-col items-center justify-center py-16">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: "var(--hsd-ui-color-gray-100)" }}
          >
            <Lock style={{ width: "32px", height: "32px", color: "var(--hsd-ui-color-gray-400)" }} />
          </div>
          <h3
            style={{
              fontSize: "1.125rem",
              fontWeight: 600,
              color: "var(--hsd-ui-color-gray-900)",
              margin: "16px 0 0",
            }}
          >
            Onboarding Locked
          </h3>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--hsd-ui-color-gray-500)",
              margin: "8px 0 0",
              textAlign: "center",
              maxWidth: "28rem",
            }}
          >
            The candidate must pass all assessment stages before the onboarding process can begin.
          </p>
          <div
            className="flex items-center gap-2"
            style={{
              marginTop: "16px",
              fontSize: "0.875rem",
              color: "rgba(217, 119, 6, 1)",
            }}
          >
            <AlertTriangle style={{ width: "16px", height: "16px" }} />
            <span>Complete previous stage first</span>
          </div>
        </div>
      </div>
    );
  }

  // ==================== Loading State ====================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2
          className="animate-spin"
          style={{ width: "32px", height: "32px", color: "var(--hsd-ui-color-gray-400)" }}
        />
      </div>
    );
  }

  // ==================== Error State ====================

  if (error) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 gap-4"
        style={{ minHeight: "300px" }}
      >
        <AlertCircle style={{ width: "48px", height: "48px", color: "rgba(250, 55, 70, 1)" }} />
        <p style={{ fontSize: "0.875rem", color: "var(--hsd-ui-color-gray-500)", margin: 0 }}>
          {error}
        </p>
        <Button variant="outline" onClick={fetchData} style={btnSecondary}>
          Try Again
        </Button>
      </div>
    );
  }

  // ==================== Render ====================

  return (
    <div className="space-y-5">
      {/* Facilities Section */}
      <SectionCard
        title="Facilities / Equipment"
        icon={Package}
        headerRight={
          !isReadOnly && mode === "edit" ? (
            <Button
              size="default"
              onClick={() => handleOpenFacilityDialog("add")}
              style={btnPrimary}
            >
              Add Facility
            </Button>
          ) : undefined
        }
      >
        {(!onboarding || onboarding.facilities.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-xl"
              style={{ backgroundColor: "var(--hsd-ui-color-gray-100)" }}
            >
              <Package style={{ width: "28px", height: "28px", color: "var(--hsd-ui-color-gray-400)" }} />
            </div>
            <h4
              style={{
                fontSize: "0.9375rem",
                fontWeight: 600,
                color: "var(--hsd-ui-color-gray-900)",
                margin: "16px 0 0",
              }}
            >
              No facilities assigned
            </h4>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--hsd-ui-color-gray-500)",
                margin: "4px 0 0",
                maxWidth: "20rem",
              }}
            >
              Assign equipment and items for the new employee
            </p>
            {!isReadOnly && mode === "edit" && (
              <Button
                variant="outline"
                onClick={() => handleOpenFacilityDialog("add")}
                style={{ ...btnSecondary, marginTop: "16px" }}
              >
                Add Facility
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto" style={tableStyles.wrapper}>
            <table style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th style={tableStyles.th}>Item</th>
                  <th style={tableStyles.thCenter}>Qty</th>
                  <th style={tableStyles.th}>Condition</th>
                  <th style={tableStyles.th}>PIC</th>
                  <th style={tableStyles.th}>Status</th>
                  {!isReadOnly && mode === "edit" && (
                    <th style={tableStyles.thRight}>Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {onboarding.facilities.map((facility, index) => (
                  <tr
                    key={facility.id}
                    style={
                      index === onboarding.facilities.length - 1
                        ? { borderBottom: "none" }
                        : undefined
                    }
                  >
                    <td style={tableStyles.tdBold}>{facility.item}</td>
                    <td style={tableStyles.tdCenter}>{facility.qty}</td>
                    <td style={tableStyles.td}>
                      <TuvBadge
                        text={facility.condition}
                        variant={CONDITION_BADGE[facility.condition] || "dark"}
                        size="sm"
                        border
                      />
                    </td>
                    <td style={tableStyles.td}>
                      {facility.pics && facility.pics.length > 0
                        ? facility.pics.map((p) => p.name).join(", ")
                        : "\u2014"}
                    </td>
                    <td style={tableStyles.td}>
                      <TuvBadge
                        text={facility.status}
                        variant={FACILITY_STATUS_BADGE[facility.status] || "dark"}
                        size="sm"
                        border
                      />
                    </td>
                    {!isReadOnly && mode === "edit" && (
                      <td style={tableStyles.tdRight}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleOpenFacilityDialog("edit", facility)}
                          >
                            <Pencil style={{ width: "16px", height: "16px", color: "var(--hsd-ui-color-gray-500)" }} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setDeleteConfirm({
                              open: true,
                              type: "facility",
                              id: facility.id,
                              name: facility.item,
                            })}
                          >
                            <Trash2 style={{ width: "16px", height: "16px", color: "rgba(250, 55, 70, 1)" }} />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Onboarding Programs Section */}
      <SectionCard
        title="Onboarding Programs"
        icon={GraduationCap}
        headerRight={
          !isReadOnly && mode === "edit" ? (
            <Button
              size="default"
              onClick={() => handleOpenProgramDialog("add")}
              style={btnPrimary}
            >
              Add Program
            </Button>
          ) : undefined
        }
      >
        {(!onboarding || onboarding.programs.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-xl"
              style={{ backgroundColor: "var(--hsd-ui-color-gray-100)" }}
            >
              <GraduationCap style={{ width: "28px", height: "28px", color: "var(--hsd-ui-color-gray-400)" }} />
            </div>
            <h4
              style={{
                fontSize: "0.9375rem",
                fontWeight: 600,
                color: "var(--hsd-ui-color-gray-900)",
                margin: "16px 0 0",
              }}
            >
              No programs scheduled
            </h4>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--hsd-ui-color-gray-500)",
                margin: "4px 0 0",
                maxWidth: "20rem",
              }}
            >
              Schedule training and orientation for the new employee
            </p>
            {!isReadOnly && mode === "edit" && (
              <Button
                variant="outline"
                onClick={() => handleOpenProgramDialog("add")}
                style={{ ...btnSecondary, marginTop: "16px" }}
              >
                Add Program
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto" style={tableStyles.wrapper}>
            <table style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th style={tableStyles.th}>Program</th>
                  <th style={tableStyles.th}>Date</th>
                  <th style={tableStyles.th}>Location</th>
                  <th style={tableStyles.th}>PIC</th>
                  <th style={tableStyles.th}>Status</th>
                  {!isReadOnly && mode === "edit" && (
                    <th style={tableStyles.thRight}>Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {onboarding.programs.map((program, index) => (
                  <tr
                    key={program.id}
                    style={
                      index === onboarding.programs.length - 1
                        ? { borderBottom: "none" }
                        : undefined
                    }
                  >
                    <td style={tableStyles.tdBold}>{program.program}</td>
                    <td style={tableStyles.td}>
                      {program.date ? formatShortDate(program.date) : "No Data"}
                    </td>
                    <td style={tableStyles.td}>{program.location || "No Data"}</td>
                    <td style={tableStyles.td}>
                      {program.pics && program.pics.length > 0
                        ? program.pics.map((p) => p.name).join(", ")
                        : program.pic || "No Data"}
                    </td>
                    <td style={tableStyles.td}>
                      <TuvBadge
                        text={program.status}
                        variant={PROGRAM_STATUS_BADGE[program.status] || "dark"}
                        size="sm"
                        border
                      />
                    </td>
                    {!isReadOnly && mode === "edit" && (
                      <td style={tableStyles.tdRight}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleOpenProgramDialog("edit", program)}
                          >
                            <Pencil style={{ width: "16px", height: "16px", color: "var(--hsd-ui-color-gray-500)" }} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setDeleteConfirm({
                              open: true,
                              type: "program",
                              id: program.id,
                              name: program.program,
                            })}
                          >
                            <Trash2 style={{ width: "16px", height: "16px", color: "rgba(250, 55, 70, 1)" }} />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Job Placement */}
      <SectionCard title="Job Placement" icon={MapPin}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="jobPlacement"
              style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--hsd-ui-color-gray-700)" }}
            >
              Work Location / Placement
            </Label>
            {mode === "view" || isOnboardingAccepted ? (
              <Input
                id="jobPlacement"
                value={formatJobPlacement(jobPlacement)}
                disabled
                style={{ backgroundColor: "var(--hsd-ui-color-gray-50)" }}
              />
            ) : (
              <Input
                id="jobPlacement"
                placeholder="e.g., Jakarta Head Office"
                value={jobPlacement}
                onChange={(e) => setJobPlacement(e.target.value)}
              />
            )}
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="joinDate"
              style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--hsd-ui-color-gray-700)" }}
            >
              Join Date
            </Label>
            <Input
              id="joinDate"
              type="date"
              value={joinDate}
              onChange={(e) => setJoinDate(e.target.value)}
              disabled={mode === "view" || isOnboardingAccepted}
              style={
                mode === "view" || isOnboardingAccepted
                  ? { backgroundColor: "var(--hsd-ui-color-gray-50)" }
                  : undefined
              }
            />
          </div>
        </div>
      </SectionCard>

      {/* Onboarding Checklist */}
      <SectionCard title="Onboarding Checklist" icon={Send}>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {joinDate ? (
              <CheckCircle2 style={{ width: "20px", height: "20px", color: "rgba(0, 168, 120, 1)", flexShrink: 0 }} />
            ) : (
              <XCircle style={{ width: "20px", height: "20px", color: "var(--hsd-ui-color-gray-400)", flexShrink: 0 }} />
            )}
            <span
              style={{
                fontSize: "0.875rem",
                color: joinDate ? "var(--hsd-ui-color-gray-900)" : "var(--hsd-ui-color-gray-400)",
              }}
            >
              Join date set
            </span>
          </div>
          <div className="flex items-center gap-3">
            {onboarding && onboarding.facilities.length > 0 ? (
              <CheckCircle2 style={{ width: "20px", height: "20px", color: "rgba(0, 168, 120, 1)", flexShrink: 0 }} />
            ) : (
              <XCircle style={{ width: "20px", height: "20px", color: "var(--hsd-ui-color-gray-400)", flexShrink: 0 }} />
            )}
            <span
              style={{
                fontSize: "0.875rem",
                color: onboarding && onboarding.facilities.length > 0 ? "var(--hsd-ui-color-gray-900)" : "var(--hsd-ui-color-gray-400)",
              }}
            >
              At least 1 facility assigned
            </span>
          </div>
          <div className="flex items-center gap-3">
            {onboarding && onboarding.programs.length > 0 ? (
              <CheckCircle2 style={{ width: "20px", height: "20px", color: "rgba(0, 168, 120, 1)", flexShrink: 0 }} />
            ) : (
              <XCircle style={{ width: "20px", height: "20px", color: "var(--hsd-ui-color-gray-400)", flexShrink: 0 }} />
            )}
            <span
              style={{
                fontSize: "0.875rem",
                color: onboarding && onboarding.programs.length > 0 ? "var(--hsd-ui-color-gray-900)" : "var(--hsd-ui-color-gray-400)",
              }}
            >
              At least 1 program scheduled
            </span>
          </div>

          {/* Send Onboarding CTA */}
          {isOnboardingAccepted ? (
            <div
              className="flex flex-col items-center text-center gap-3"
              style={{
                marginTop: "20px",
                borderRadius: "8px",
                backgroundColor: "rgba(0, 168, 120, 0.04)",
                border: "1px solid rgba(0, 168, 120, 0.2)",
                padding: "24px",
              }}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: "rgba(0, 168, 120, 0.1)" }}
              >
                <CheckCircle2 style={{ width: "20px", height: "20px", color: "rgba(0, 168, 120, 1)" }} />
              </div>
              <div>
                <p
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "rgba(0, 168, 120, 1)",
                    margin: 0,
                  }}
                >
                  Onboarding Accepted
                </p>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--hsd-ui-color-gray-500)",
                    margin: "4px 0 0",
                  }}
                >
                  Candidate has accepted the onboarding offer
                </p>
              </div>
            </div>
          ) : mode === "edit" ? (
            <div
              className="flex flex-col items-center text-center gap-3"
              style={{
                marginTop: "20px",
                borderRadius: "8px",
                backgroundColor: "rgba(59, 130, 246, 0.04)",
                border: "1px solid rgba(59, 130, 246, 0.2)",
                padding: "24px",
              }}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: "rgba(59, 130, 246, 0.1)" }}
              >
                <Send style={{ width: "20px", height: "20px", color: "rgba(59, 130, 246, 1)" }} />
              </div>
              <div>
                <p
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "var(--hsd-ui-color-gray-900)",
                    margin: 0,
                  }}
                >
                  Ready to Send?
                </p>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--hsd-ui-color-gray-500)",
                    margin: "4px 0 0",
                  }}
                >
                  {canSendOnboarding
                    ? "All requirements met. Send onboarding details to the candidate."
                    : "Complete all checklist items above before sending."}
                </p>
              </div>
              <Button
                onClick={() => setShowSendDialog(true)}
                disabled={!canSendOnboarding}
                style={{
                  ...btnPrimary,
                  marginTop: "4px",
                  backgroundColor: canSendOnboarding
                    ? "var(--hsd-ui-background-color-primary)"
                    : undefined,
                }}
              >
                <Send style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                Send Onboarding
              </Button>
            </div>
          ) : null}
        </div>
      </SectionCard>

      {/* ==================== Dialogs ==================== */}

      {/* Facility Dialog */}
      {mode === "edit" && (
        <Dialog
          open={facilityDialog.open}
          onOpenChange={(open) => setFacilityDialog({ ...facilityDialog, open })}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {facilityDialog.mode === "add" ? "Add Facility" : "Edit Facility"}
              </DialogTitle>
              <DialogDescription>
                {facilityDialog.mode === "add"
                  ? "Add a new facility/equipment for the employee"
                  : "Update facility information"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--hsd-ui-color-gray-700)" }}>
                  Item *
                </Label>
                <Select
                  value={facilityForm.item}
                  onValueChange={(v) => setFacilityForm({ ...facilityForm, item: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select item" />
                  </SelectTrigger>
                  <SelectContent>
                    {FACILITY_ITEMS.map((item) => (
                      <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--hsd-ui-color-gray-700)" }}>
                    Quantity
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    value={facilityForm.qty}
                    onChange={(e) => setFacilityForm({ ...facilityForm, qty: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--hsd-ui-color-gray-700)" }}>
                    Condition
                  </Label>
                  <Select
                    value={facilityForm.condition}
                    onValueChange={(v) => setFacilityForm({ ...facilityForm, condition: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FACILITY_CONDITIONS.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--hsd-ui-color-gray-700)" }}>
                  PIC (Person In Charge) *
                </Label>
                <EmployeeMultiSelect
                  value={facilityForm.pics}
                  onChange={(pics) => setFacilityForm({ ...facilityForm, pics })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setFacilityDialog({ open: false, mode: "add" })}
                style={btnSecondary}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveFacility}
                disabled={!facilityForm.item || facilityForm.pics.length === 0}
                style={btnPrimary}
              >
                {facilityDialog.mode === "add" ? "Add" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Program Dialog */}
      {mode === "edit" && (
        <Dialog
          open={programDialog.open}
          onOpenChange={(open) => setProgramDialog({ ...programDialog, open })}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {programDialog.mode === "add" ? "Add Program" : "Edit Program"}
              </DialogTitle>
              <DialogDescription>
                {programDialog.mode === "add"
                  ? "Schedule a new onboarding program"
                  : "Update program information"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--hsd-ui-color-gray-700)" }}>
                  Program Name *
                </Label>
                <Input
                  placeholder="e.g., Company Orientation"
                  value={programForm.program}
                  onChange={(e) => setProgramForm({ ...programForm, program: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--hsd-ui-color-gray-700)" }}>
                    Date
                  </Label>
                  <Input
                    type="date"
                    value={programForm.date}
                    onChange={(e) => setProgramForm({ ...programForm, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--hsd-ui-color-gray-700)" }}>
                    Location
                  </Label>
                  <Input
                    placeholder="e.g., Meeting Room A"
                    value={programForm.location}
                    onChange={(e) => setProgramForm({ ...programForm, location: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--hsd-ui-color-gray-700)" }}>
                  PIC (Person In Charge) *
                </Label>
                <EmployeeMultiSelect
                  value={programForm.pics}
                  onChange={(pics) => setProgramForm({ ...programForm, pics })}
                />
              </div>
              <div className="space-y-2">
                <Label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--hsd-ui-color-gray-700)" }}>
                  Status
                </Label>
                <Select
                  value={programForm.status}
                  onValueChange={(v) => setProgramForm({ ...programForm, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROGRAM_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setProgramDialog({ open: false, mode: "add" })}
                style={btnSecondary}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveProgram}
                disabled={!programForm.program || programForm.pics.length === 0}
                style={btnPrimary}
              >
                {programDialog.mode === "add" ? "Add" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteConfirm?.open || false}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteConfirm?.type === "facility" ? "Facility" : "Program"}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteConfirm?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={btnSecondary}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              style={btnDanger}
              onClick={() => {
                if (deleteConfirm?.type === "facility") {
                  handleDeleteFacility(deleteConfirm.id);
                } else if (deleteConfirm?.type === "program") {
                  handleDeleteProgram(deleteConfirm.id);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send Onboarding Dialog */}
      <AlertDialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Send style={{ width: "20px", height: "20px", color: "var(--hsd-ui-background-color-primary)" }} />
              Send Onboarding
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to send onboarding details to {candidate?.fullname}.
              The candidate will receive an email to review and confirm the offer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div
              style={{
                padding: "16px",
                borderRadius: "8px",
                backgroundColor: "rgba(0, 168, 120, 0.04)",
                border: "1px solid rgba(0, 168, 120, 0.2)",
              }}
            >
              <div className="flex items-center gap-2" style={{ color: "var(--hsd-ui-background-color-primary)" }}>
                <CheckCircle2 style={{ width: "20px", height: "20px" }} />
                <span style={{ fontWeight: 500, fontSize: "0.875rem" }}>Onboarding Summary</span>
              </div>
              <ul
                style={{
                  marginTop: "8px",
                  fontSize: "0.875rem",
                  color: "var(--hsd-ui-color-gray-600)",
                  paddingLeft: "20px",
                }}
                className="space-y-1"
              >
                <li>Work Location: {formatJobPlacement(jobPlacement) || "No Data"}</li>
                <li>Join Date: {joinDate || "No Data"}</li>
                <li>{onboarding?.facilities.length || 0} facilities assigned</li>
                <li>{onboarding?.programs.length || 0} programs scheduled</li>
              </ul>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isConverting} style={btnSecondary}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSendOnboarding}
              disabled={isConverting}
              style={btnPrimary}
            >
              {isConverting && <Loader2 className="animate-spin" style={{ width: "16px", height: "16px", marginRight: "6px" }} />}
              <Send style={{ width: "16px", height: "16px", marginRight: "6px" }} />
              Send Onboarding
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default OnboardingContent;
