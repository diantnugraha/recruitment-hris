"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  User,
  MapPin,
  Clock,
  Send,
  PartyPopper,
  UserCheck,
  Plus,
  Pencil,
  Trash2,
  Package,
  GraduationCap,
  Save,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
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
import { formatShortDate, getInitials, cn } from "@/lib/utils";
import { showToast } from "@/lib/utils/toast-messages";
import {
  WORK_LOCATION_LABELS,
  type WorkLocation,
} from "@/lib/constants/employeeRequest";

// Facility conditions and statuses
const FACILITY_CONDITIONS = ["New", "Good", "Used", "Refurbished"] as const;
const FACILITY_STATUSES = ["Pending", "Assigned", "Returned"] as const;
const PROGRAM_STATUSES = ["Scheduled", "In Progress", "Completed", "Cancelled"] as const;

export default function OnboardingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = params.candidateId as string;

  // State
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
    item: "",
    qty: 1,
    unit: "Unit",
    condition: "New",
    status: "Pending",
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

  // Convert to employee dialog
  const [showConvertDialog, setShowConvertDialog] = React.useState(false);

  // Fetch data
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
      console.error("Failed to fetch data:", err);
      setError("Failed to load onboarding data");
    } finally {
      setIsLoading(false);
    }
  }, [candidateId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Create onboarding if not exists
  const ensureOnboarding = async (): Promise<boolean> => {
    if (onboarding) return true;

    try {
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

  // Save job placement
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

  // Facility handlers
  const handleOpenFacilityDialog = (mode: "add" | "edit", facility?: Facility) => {
    if (mode === "edit" && facility) {
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
        status: "Pending",
      });
    }
    setFacilityDialog({ open: true, mode, facility });
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
          await fetchData();
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
          await fetchData();
        } else {
          showToast.error(response.message || "Failed to update facility");
        }
      }
    } catch (err) {
      showToast.error("Failed to save facility");
    }

    setFacilityDialog({ open: false, mode: "add" });
  };

  const handleDeleteFacility = async (id: number) => {
    try {
      const response = await candidateService.deleteFacility(candidateId, id);
      if (response.success) {
        showToast.deleted("Facility");
        await fetchData();
      } else {
        showToast.error(response.message || "Failed to delete facility");
      }
    } catch (err) {
      showToast.error("Failed to delete facility");
    }
    setDeleteConfirm(null);
  };

  // Program handlers
  const handleOpenProgramDialog = (mode: "add" | "edit", program?: OnboardingProgram) => {
    if (mode === "edit" && program) {
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
    setProgramDialog({ open: true, mode, program });
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
          await fetchData();
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
          await fetchData();
        } else {
          showToast.error(response.message || "Failed to update program");
        }
      }
    } catch (err) {
      showToast.error("Failed to save program");
    }

    setProgramDialog({ open: false, mode: "add" });
  };

  const handleDeleteProgram = async (id: number) => {
    try {
      const response = await candidateService.deleteProgram(candidateId, id);
      if (response.success) {
        showToast.deleted("Program");
        await fetchData();
      } else {
        showToast.error(response.message || "Failed to delete program");
      }
    } catch (err) {
      showToast.error("Failed to delete program");
    }
    setDeleteConfirm(null);
  };

  // Convert to employee
  const handleConvertToEmployee = async () => {
    setIsConverting(true);

    try {
      const response = await candidateService.convertToEmployee(candidateId);
      if (response.success) {
        showToast.success("Candidate converted to employee successfully!");
        setShowConvertDialog(false);
        router.push("/employees");
      } else {
        showToast.error(response.message || "Failed to convert to employee");
      }
    } catch (err) {
      showToast.error("Failed to convert to employee");
    } finally {
      setIsConverting(false);
    }
  };

  // Check if ready to convert
  const canConvert = onboarding &&
    onboarding.jobPlacement &&
    onboarding.facilities.length > 0 &&
    onboarding.programs.length > 0;

  // Loading state
  if (isLoading) {
    return (
      <>
        <Header title="Onboarding" />
        <PageContainer>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </PageContainer>
      </>
    );
  }

  // Error state
  if (error || !candidate) {
    return (
      <>
        <Header title="Onboarding" />
        <PageContainer>
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-muted-foreground">{error || "Candidate not found"}</p>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Header title="Onboarding" />
      <PageContainer>
        <div className="space-y-6">
          {/* Back Button */}
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Recruitment
          </Button>

          {/* Candidate Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                  <AvatarFallback className="bg-accent/10 text-accent text-2xl font-semibold">
                    {getInitials(candidate.fullname)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <div>
                    <h1 className="text-2xl font-bold">{candidate.fullname}</h1>
                    {candidate.jobTitle && (
                      <p className="text-lg text-muted-foreground">
                        Position: {candidate.jobTitle.name}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-4 w-4" />
                      {candidate.email}
                    </span>
                    {candidate.mobilePhone && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-4 w-4" />
                        {candidate.mobilePhone}
                      </span>
                    )}
                    {candidate.employeeRequest && (
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="h-4 w-4" />
                        {candidate.employeeRequest.code}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Badge className="gap-1 bg-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Ready for Onboarding
                    </Badge>
                    {canConvert && (
                      <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-600">
                        <PartyPopper className="h-3.5 w-3.5" />
                        Ready to Convert
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => setShowConvertDialog(true)}
                    disabled={!canConvert}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    Generate Employee
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content - 2 columns */}
            <div className="lg:col-span-2 space-y-6">
              {/* Facilities Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Facilities / Equipment
                      </CardTitle>
                      <CardDescription>
                        Equipment and items assigned to the new employee
                      </CardDescription>
                    </div>
                    <Button size="sm" onClick={() => handleOpenFacilityDialog("add")}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Facility
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {(!onboarding || onboarding.facilities.length === 0) ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
                      <Package className="h-10 w-10 text-muted-foreground/30" />
                      <p className="mt-2 text-muted-foreground">No facilities assigned yet</p>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => handleOpenFacilityDialog("add")}
                      >
                        Add the first facility
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Inventory No</TableHead>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-center">Qty</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead>Condition</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {onboarding.facilities.map((facility) => (
                          <TableRow key={facility.id}>
                            <TableCell className="text-sm">
                              {facility.inventoryNo || "—"}
                            </TableCell>
                            <TableCell className="font-medium">{facility.item}</TableCell>
                            <TableCell className="text-center">{facility.qty}</TableCell>
                            <TableCell>{facility.unit}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{facility.condition}</Badge>
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
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenFacilityDialog("edit", facility)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeleteConfirm({
                                    open: true,
                                    type: "facility",
                                    id: facility.id,
                                    name: facility.item,
                                  })}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Onboarding Programs Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        Onboarding Programs
                      </CardTitle>
                      <CardDescription>
                        Training and orientation schedule for the new employee
                      </CardDescription>
                    </div>
                    <Button size="sm" onClick={() => handleOpenProgramDialog("add")}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Program
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {(!onboarding || onboarding.programs.length === 0) ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
                      <GraduationCap className="h-10 w-10 text-muted-foreground/30" />
                      <p className="mt-2 text-muted-foreground">No programs scheduled yet</p>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => handleOpenProgramDialog("add")}
                      >
                        Schedule the first program
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Program</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>PIC</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {onboarding.programs.map((program) => (
                          <TableRow key={program.id}>
                            <TableCell className="font-medium">{program.program}</TableCell>
                            <TableCell>
                              {program.date ? formatShortDate(program.date) : "—"}
                            </TableCell>
                            <TableCell>{program.location || "—"}</TableCell>
                            <TableCell>{program.pic || "—"}</TableCell>
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
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenProgramDialog("edit", program)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeleteConfirm({
                                    open: true,
                                    type: "program",
                                    id: program.id,
                                    name: program.program,
                                  })}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - 1 column */}
            <div className="space-y-6">
              {/* Job Placement */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Job Placement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="jobPlacement">Work Location / Placement</Label>
                    <Input
                      id="jobPlacement"
                      placeholder="e.g., Jakarta Head Office"
                      value={jobPlacement}
                      onChange={(e) => setJobPlacement(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="joinDate">Join Date</Label>
                    <Input
                      id="joinDate"
                      type="date"
                      value={joinDate}
                      onChange={(e) => setJoinDate(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleSaveJobPlacement}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save
                  </Button>
                </CardContent>
              </Card>

              {/* Conversion Checklist */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Conversion Checklist
                  </CardTitle>
                  <CardDescription>
                    Requirements before converting to employee
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    {onboarding?.jobPlacement ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span className={cn(
                      "text-sm",
                      onboarding?.jobPlacement ? "" : "text-muted-foreground"
                    )}>
                      Job placement set
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {onboarding && onboarding.facilities.length > 0 ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground" />
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
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span className={cn(
                      "text-sm",
                      onboarding && onboarding.programs.length > 0 ? "" : "text-muted-foreground"
                    )}>
                      At least 1 program scheduled
                    </span>
                  </div>

                  <Separator className="my-4" />

                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => setShowConvertDialog(true)}
                    disabled={!canConvert}
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    Generate Employee
                  </Button>
                  {!canConvert && (
                    <p className="text-xs text-muted-foreground text-center">
                      Complete all checklist items first
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </PageContainer>

      {/* Facility Dialog */}
      <Dialog
        open={facilityDialog.open}
        onOpenChange={(open) => setFacilityDialog({ ...facilityDialog, open })}
      >
        <DialogContent>
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
            <div className="grid grid-cols-2 gap-4">
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
                <Input
                  placeholder="e.g., Laptop"
                  value={facilityForm.item}
                  onChange={(e) => setFacilityForm({ ...facilityForm, item: e.target.value })}
                />
              </div>
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
                  placeholder="e.g., Unit, Pcs"
                  value={facilityForm.unit}
                  onChange={(e) => setFacilityForm({ ...facilityForm, unit: e.target.value })}
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
                <Select
                  value={facilityForm.status}
                  onValueChange={(v) => setFacilityForm({ ...facilityForm, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FACILITY_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

      {/* Program Dialog */}
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

      {/* Convert to Employee Dialog */}
      <AlertDialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <PartyPopper className="h-5 w-5 text-emerald-600" />
              Generate Employee
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to convert {candidate.fullname} from candidate to employee.
              This will create an employee record and user account for them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Ready to convert</span>
              </div>
              <ul className="mt-2 text-sm text-emerald-600 dark:text-emerald-400 space-y-1">
                <li>Job placement: {onboarding?.jobPlacement ? (WORK_LOCATION_LABELS[onboarding.jobPlacement as WorkLocation] || onboarding.jobPlacement) : "—"}</li>
                <li>{onboarding?.facilities.length} facilities assigned</li>
                <li>{onboarding?.programs.length} programs scheduled</li>
              </ul>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isConverting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConvertToEmployee}
              disabled={isConverting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isConverting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <UserCheck className="mr-2 h-4 w-4" />
              Generate Employee
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
