"use client";

import * as React from "react";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Plus,
  Pencil,
  Trash2,
  Package,
  GraduationCap,
  MapPin,
  Send,
  Lock,
  AlertTriangle,
  Save,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { formatShortDate, cn } from "@/lib/utils";
import { showToast } from "@/lib/utils/toast-messages";
import {
  WORK_LOCATION_LABELS,
  type WorkLocation,
} from "@/lib/constants/employeeRequest";
import type { TabMode } from "@/hooks/useAssessmentPermission";

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
  const [isSaving, setIsSaving] = React.useState(false);
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
    inventoryNo: "",
    item: "" as string,
    qty: 1,
    unit: "Unit",
    condition: "New",
    status: "Assigned",
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
    pic: "",
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

  // ==================== Job Placement Handlers ====================

  const handleSaveJobPlacement = async () => {
    setIsSaving(true);

    try {
      if (!onboarding) {
        const created = await ensureOnboarding();
        if (!created) {
          setIsSaving(false);
          return;
        }
      }

      const response = await candidateService.updateOnboarding(candidateId, {
        job_placement: jobPlacement,
      });

      if (response.success) {
        showToast.success("Job placement saved");
        if (response.data) {
          setOnboarding(response.data);
        }
      } else {
        showToast.error(response.message || "Failed to save");
      }
    } catch (err) {
      showToast.error("Failed to save job placement");
    } finally {
      setIsSaving(false);
    }
  };

  // ==================== Facility Handlers ====================

  const handleOpenFacilityDialog = (dialogMode: "add" | "edit", facility?: Facility) => {
    if (dialogMode === "edit" && facility) {
      setFacilityForm({
        inventoryNo: facility.inventoryNo,
        item: facility.item,
        qty: facility.qty,
        unit: facility.unit,
        condition: facility.condition,
        status: facility.status,
      });
    } else {
      setFacilityForm({
        inventoryNo: "",
        item: "",
        qty: 1,
        unit: "Unit",
        condition: "New",
        status: "Assigned",
      });
    }
    setFacilityDialog({ open: true, mode: dialogMode, facility });
  };

  const handleSaveFacility = async () => {
    const hasOnboarding = await ensureOnboarding();
    if (!hasOnboarding) return;

    try {
      if (facilityDialog.mode === "add") {
        const response = await candidateService.addFacility(candidateId, {
          inventory_no: facilityForm.inventoryNo,
          item: facilityForm.item,
          qty: facilityForm.qty,
          unit: facilityForm.unit,
          condition: facilityForm.condition,
          status: facilityForm.status,
        });

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
          {
            inventory_no: facilityForm.inventoryNo,
            item: facilityForm.item,
            qty: facilityForm.qty,
            unit: facilityForm.unit,
            condition: facilityForm.condition,
            status: facilityForm.status,
          }
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
        pic: program.pic,
        status: program.status,
      });
    } else {
      setProgramForm({
        program: "",
        date: "",
        location: "",
        pic: "",
        status: "Scheduled",
      });
    }
    setProgramDialog({ open: true, mode: dialogMode, program });
  };

  const handleSaveProgram = async () => {
    const hasOnboarding = await ensureOnboarding();
    if (!hasOnboarding) return;

    try {
      if (programDialog.mode === "add") {
        const response = await candidateService.addProgram(candidateId, {
          program: programForm.program,
          date: programForm.date,
          location: programForm.location,
          pic: programForm.pic,
          status: programForm.status,
        });

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
          {
            program: programForm.program,
            date: programForm.date,
            location: programForm.location,
            pic: programForm.pic,
            status: programForm.status,
          }
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

      // Save job placement before sending
      await candidateService.updateOnboarding(candidateId, { job_placement: jobPlacement });

      // Send onboarding email to candidate
      const portalBaseUrl = window.location.origin;
      const response = await candidateService.sendOnboardingEmail(candidateId, portalBaseUrl);
      if (response.success) {
        showToast.success("Onboarding email sent to candidate!");
        setShowSendDialog(false);
        // Refresh onboarding data
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
      <div className="rounded-2xl border bg-card">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-medium">Onboarding Locked</h3>
          <p className="text-muted-foreground text-center max-w-md mt-2">
            The candidate must pass all assessment stages before the onboarding process can begin.
          </p>
          <div className="flex items-center gap-2 mt-4 text-sm text-amber-600">
            <AlertTriangle className="h-4 w-4" />
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
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ==================== Error State ====================

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={fetchData}>
          Try Again
        </Button>
      </div>
    );
  }

  // ==================== Render ====================

  return (
    <>
      <div className="space-y-6">
        {/* Facilities Section */}
        <div className="rounded-2xl border bg-card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>
              <h2 className="text-base font-semibold text-foreground">Facilities / Equipment</h2>
            </div>
            {!isReadOnly && mode === "edit" && (
              <Button onClick={() => handleOpenFacilityDialog("add")}>
                <Plus />
                Add Facility
              </Button>
            )}
          </div>
          <div className="px-6 py-5">
            {(!onboarding || onboarding.facilities.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
                  <Package className="h-7 w-7 text-muted-foreground" />
                </div>
                <h4 className="mt-4 font-semibold">No facilities assigned</h4>
                <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                  Assign equipment and items for the new employee
                </p>
                {!isReadOnly && mode === "edit" && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => handleOpenFacilityDialog("add")}
                  >
                    <Plus />
                    Add Facility
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/30">
                      <TableHead className="font-semibold">Inventory No</TableHead>
                      <TableHead className="font-semibold">Item</TableHead>
                      <TableHead className="text-center font-semibold">Qty</TableHead>
                      <TableHead className="font-semibold">Condition</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      {!isReadOnly && mode === "edit" && (
                        <TableHead className="text-right font-semibold">Actions</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {onboarding.facilities.map((facility) => (
                      <TableRow key={facility.id}>
                        <TableCell className="text-sm">
                          {facility.inventoryNo || "No Data"}
                        </TableCell>
                        <TableCell className="font-medium">{facility.item}</TableCell>
                        <TableCell className="text-center">{facility.qty} {facility.unit}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">{facility.condition}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              facility.status === "Assigned" ? "default" :
                              facility.status === "Returned" ? "secondary" : "outline"
                            }
                          >
                            {facility.status}
                          </Badge>
                        </TableCell>
                        {!isReadOnly && mode === "edit" && (
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleOpenFacilityDialog("edit", facility)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => setDeleteConfirm({
                                  open: true,
                                  type: "facility",
                                  id: facility.id,
                                  name: facility.item,
                                })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        {/* Onboarding Programs Section */}
        <div className="rounded-2xl border bg-card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </div>
              <h2 className="text-base font-semibold text-foreground">Onboarding Programs</h2>
            </div>
            {!isReadOnly && mode === "edit" && (
              <Button onClick={() => handleOpenProgramDialog("add")}>
                <Plus />
                Add Program
              </Button>
            )}
          </div>
          <div className="px-6 py-5">
            {(!onboarding || onboarding.programs.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
                  <GraduationCap className="h-7 w-7 text-muted-foreground" />
                </div>
                <h4 className="mt-4 font-semibold">No programs scheduled</h4>
                <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                  Schedule training and orientation for the new employee
                </p>
                {!isReadOnly && mode === "edit" && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => handleOpenProgramDialog("add")}
                  >
                    <Plus />
                    Add Program
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/30">
                      <TableHead className="font-semibold">Program</TableHead>
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Location</TableHead>
                      <TableHead className="font-semibold">PIC</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      {!isReadOnly && mode === "edit" && (
                        <TableHead className="text-right font-semibold">Actions</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {onboarding.programs.map((program) => (
                      <TableRow key={program.id}>
                        <TableCell className="font-medium">{program.program}</TableCell>
                        <TableCell>
                          {program.date ? formatShortDate(program.date) : "No Data"}
                        </TableCell>
                        <TableCell>{program.location || "No Data"}</TableCell>
                        <TableCell>{program.pic || "No Data"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              program.status === "Completed" ? "default" :
                              program.status === "In Progress" ? "secondary" :
                              program.status === "Cancelled" ? "destructive" : "outline"
                            }
                          >
                            {program.status}
                          </Badge>
                        </TableCell>
                        {!isReadOnly && mode === "edit" && (
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleOpenProgramDialog("edit", program)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => setDeleteConfirm({
                                  open: true,
                                  type: "program",
                                  id: program.id,
                                  name: program.program,
                                })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        {/* Job Placement */}
        <div className="rounded-2xl border bg-card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </div>
              <h2 className="text-base font-semibold text-foreground">Job Placement</h2>
            </div>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jobPlacement">Work Location / Placement</Label>
              {mode === "view" || isOnboardingAccepted ? (
                <Input
                  id="jobPlacement"
                  value={formatJobPlacement(jobPlacement)}
                  disabled
                  className="bg-muted"
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
              <Label htmlFor="joinDate">Join Date</Label>
              <Input
                id="joinDate"
                type="date"
                value={joinDate}
                onChange={(e) => setJoinDate(e.target.value)}
                disabled={mode === "view" || isOnboardingAccepted}
                className={mode === "view" || isOnboardingAccepted ? "bg-muted" : ""}
              />
            </div>
            {mode === "edit" && !isOnboardingAccepted && (
              <Button
                className="w-full"
                onClick={handleSaveJobPlacement}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Save />
                )}
                Save
              </Button>
            )}
          </div>
        </div>

        {/* Onboarding Checklist */}
        <div className="rounded-2xl border border-blue-200 bg-card dark:border-blue-900">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <Send className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Onboarding Checklist</h2>
                <p className="text-xs text-muted-foreground">Requirements before sending onboarding to candidate</p>
              </div>
            </div>
          </div>
          <div className="px-6 py-5 space-y-3">
            <div className="flex items-center gap-3">
              {joinDate ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground shrink-0" />
              )}
              <span className={cn(
                "text-sm",
                joinDate ? "" : "text-muted-foreground"
              )}>
                Join date set
              </span>
            </div>
            <div className="flex items-center gap-3">
              {onboarding && onboarding.facilities.length > 0 ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground shrink-0" />
              )}
              <span className={cn(
                "text-sm",
                onboarding && onboarding.facilities.length > 0 ? "" : "text-muted-foreground"
              )}>
                At least 1 facility assigned
              </span>
            </div>
            <div className="flex items-center gap-3">
              {onboarding && onboarding.programs.length > 0 ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground shrink-0" />
              )}
              <span className={cn(
                "text-sm",
                onboarding && onboarding.programs.length > 0 ? "" : "text-muted-foreground"
              )}>
                At least 1 program scheduled
              </span>
            </div>

            {/* Send Onboarding CTA */}
            {isOnboardingAccepted ? (
              <div className="mt-5 rounded-xl bg-gradient-to-b from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20 border border-emerald-100 dark:border-emerald-900/50 px-6 py-6 flex flex-col items-center text-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-emerald-700 dark:text-emerald-300">Onboarding Accepted</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Candidate has accepted the onboarding offer
                  </p>
                </div>
              </div>
            ) : mode === "edit" ? (
              <div className="mt-5 rounded-xl bg-gradient-to-b from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20 border border-blue-100 dark:border-blue-900/50 px-6 py-6 flex flex-col items-center text-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
                  <Send className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Ready to Send?</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {canSendOnboarding
                      ? "All requirements met. Send onboarding details to the candidate."
                      : "Complete all checklist items above before sending."}
                  </p>
                </div>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 px-6 mt-1"
                  onClick={() => setShowSendDialog(true)}
                  disabled={!canSendOnboarding}
                >
                  <Send />
                  Send Onboarding
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

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
                <Label>Inventory No</Label>
                <Input
                  placeholder="e.g., INV-001"
                  value={facilityForm.inventoryNo}
                  onChange={(e) => setFacilityForm({ ...facilityForm, inventoryNo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Item *</Label>
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
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min={1}
                    value={facilityForm.qty}
                    onChange={(e) => setFacilityForm({ ...facilityForm, qty: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Input
                    value={facilityForm.unit}
                    disabled
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Condition</Label>
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
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Input
                    value={facilityForm.status}
                    disabled
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFacilityDialog({ open: false, mode: "add" })}>
                Cancel
              </Button>
              <Button onClick={handleSaveFacility} disabled={!facilityForm.item}>
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
                <Label>Program Name *</Label>
                <Input
                  placeholder="e.g., Company Orientation"
                  value={programForm.program}
                  onChange={(e) => setProgramForm({ ...programForm, program: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={programForm.date}
                    onChange={(e) => setProgramForm({ ...programForm, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    placeholder="e.g., Meeting Room A"
                    value={programForm.location}
                    onChange={(e) => setProgramForm({ ...programForm, location: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>PIC (Person In Charge)</Label>
                  <Input
                    placeholder="e.g., HR Team"
                    value={programForm.pic}
                    onChange={(e) => setProgramForm({ ...programForm, pic: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setProgramDialog({ open: false, mode: "add" })}>
                Cancel
              </Button>
              <Button onClick={handleSaveProgram} disabled={!programForm.program}>
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
              <Send className="h-5 w-5 text-blue-600" />
              Send Onboarding
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to send onboarding details to {candidate?.fullname}.
              The candidate will receive an email to review and confirm the offer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Onboarding Summary</span>
              </div>
              <ul className="mt-2 text-sm text-blue-600 dark:text-blue-400 space-y-1">
                <li>Work Location: {formatJobPlacement(jobPlacement) || "No Data"}</li>
                <li>Join Date: {joinDate || "No Data"}</li>
                <li>{onboarding?.facilities.length || 0} facilities assigned</li>
                <li>{onboarding?.programs.length || 0} programs scheduled</li>
              </ul>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isConverting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSendOnboarding}
              disabled={isConverting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isConverting && <Loader2 className="animate-spin" />}
              <Send />
              Send Onboarding
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default OnboardingContent;
