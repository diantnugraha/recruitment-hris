"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
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
import employeeService, {
  mapFormToUpdateRequest,
  type StructuralPositionCheck,
} from "@/services/employee.service";
import jobTitleService from "@/services/job-title.service";
import departmentService from "@/services/department.service";
import type {
  EmployeeWithRelations,
  JobTitle,
  EmployeeStatus,
  MaritalStatus,
  DepartmentJobTitle,
  Department,
} from "@/types";
import { DIVISION_HEAD_CODES, DEPARTMENT_MANAGER_CODES } from "@/types";
import { showToast } from "@/lib/utils/toast-messages";

// --- Constants (matching hris-tuv exactly) ---


const RELIGIONS = [
  { value: "Islam", label: "Islam" },
  { value: "Kristen", label: "Kristen" },
  { value: "Katholik", label: "Katholik" },
  { value: "Hindu", label: "Hindu" },
  { value: "Budha", label: "Budha" },
] as const;

const ETHNICITIES = [
  { value: "Jawa", label: "Jawa" },
  { value: "Sunda", label: "Sunda" },
  { value: "Batak", label: "Batak" },
  { value: "Betawi", label: "Betawi" },
  { value: "Dayak", label: "Dayak" },
  { value: "Asmat", label: "Asmat" },
  { value: "Bugis", label: "Bugis" },
  { value: "Madura", label: "Madura" },
  { value: "Minang", label: "Minang" },
  { value: "Baduy", label: "Baduy" },
  { value: "Bali", label: "Bali" },
  { value: "Ambon", label: "Ambon" },
  { value: "Gayo", label: "Gayo" },
  { value: "Tengger", label: "Tengger" },
  { value: "Sasak", label: "Sasak" },
  { value: "Sumbawa", label: "Sumbawa" },
  { value: "Flores", label: "Flores" },
  { value: "Toraja", label: "Toraja" },
  { value: "Osing", label: "Osing" },
  { value: "Mandar", label: "Mandar" },
] as const;

const EMPLOYEE_STATUSES = [
  { value: "Permanent", label: "Permanent" },
  { value: "Contract", label: "Contract" },
  { value: "Probation", label: "Probation" },
  { value: "Resigned", label: "Resigned" },
] as const;

const LOCATIONS = [
  { value: "Head Office", label: "Head Office" },
  { value: "Cikarang Office", label: "Cikarang Office" },
  { value: "Surabaya Branch Office", label: "Surabaya Branch Office" },
  { value: "Medan Representative Office", label: "Medan Representative Office" },
] as const;

const MARITAL_STATUSES = [
  { value: "Single", label: "Single" },
  { value: "Married", label: "Married" },
  { value: "Divorced", label: "Divorced" },
  { value: "Widowed", label: "Widowed" },
] as const;

const CONTRACT_PERIODS = [
  { value: "1", label: "1 Year" },
  { value: "2", label: "2 Year" },
  { value: "3", label: "3 Year" },
] as const;

const PROBATION_PERIODS = [
  { value: "1", label: "1 Month" },
  { value: "2", label: "2 Month" },
  { value: "3", label: "3 Month" },
] as const;

// --- Form State Interface ---

interface FormState {
  nik: string;
  fullName: string;
  birthDate: string;
  religion: string;
  ethnic: string;
  jobTitleId: string;
  departmentId: string; // NEW: for non-structural job titles with multiple departments
  fte: string;
  joinDate: string;
  phone: string;
  email: string;
  location: string;
  status: string;
  permanentDate: string;
  contractPeriod: string;
  probationPeriod: string;
  exitDate: string;
  superior: string;
  motherName: string;
  fatherName: string;
  maritalStatus: string;
  spouseName: string;
}

// Capitalize first letter to match backend enum values
function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
}

// Map API status values back to backend enum format
function mapStatusToForm(status: string): string {
  const map: Record<string, string> = {
    permanent: "Permanent",
    contract: "Contract",
    probation: "Probation",
    terminated: "Resigned",
    resigned: "Resigned",
    active: "Permanent",
    inactive: "",
  };
  return map[status.toLowerCase()] ?? capitalize(status);
}

function mapEmployeeToFormState(
  emp: EmployeeWithRelations,
  jobTitles: JobTitle[]
): FormState {
  const fullName = `${emp.firstName || ""} ${emp.lastName || ""}`.trim();

  // Find job title by NAME because employee API returns slug (jt-xxx)
  // while JobTitle API returns numeric IDs (59, 60, etc)
  let jobTitleId = "";
  if (emp.jobTitle?.name && jobTitles.length > 0) {
    const match = jobTitles.find(
      (jt) => jt.name.toLowerCase() === emp.jobTitle!.name.toLowerCase()
    );
    if (match) {
      jobTitleId = match.id;
    }
  }

  return {
    nik: emp.employeeNik || "",
    fullName,
    birthDate: emp.dateOfBirth || "",
    religion: emp.religion || "",
    ethnic: emp.ethnicity || "",
    jobTitleId,
    departmentId: emp.departmentId || "",
    fte: emp.fte != null ? String(emp.fte) : "1",
    joinDate: emp.hireDate || "",
    phone: emp.phone || "",
    email: emp.email || "",
    location: emp.location || "",
    status: mapStatusToForm(emp.status || "Permanent"),
    permanentDate: emp.permanentDate || "",
    contractPeriod: "",
    probationPeriod: "",
    exitDate: emp.exitDate || "",
    superior: emp.managerId || "0",
    motherName: emp.motherName || "",
    fatherName: emp.fatherName || "",
    maritalStatus: emp.maritalStatus ? capitalize(emp.maritalStatus) : "",
    spouseName: emp.spouseName || "",
  };
}

export default function EmployeeEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [employee, setEmployee] = React.useState<EmployeeWithRelations | null>(null);
  const [form, setForm] = React.useState<FormState | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Dropdown data
  const [jobTitles, setJobTitles] = React.useState<JobTitle[]>([]);
  const [employees, setEmployees] = React.useState<EmployeeWithRelations[]>([]);

  // Departments in division (for HEAD_OF_DIVISION display)
  const [divisionDepartments, setDivisionDepartments] = React.useState<Department[]>([]);

  // Structural position confirmation dialog
  const [showReplaceDialog, setShowReplaceDialog] = React.useState(false);
  const [structuralCheck, setStructuralCheck] = React.useState<StructuralPositionCheck | null>(null);

  // Derived read-only fields from selected job title
  const selectedJobTitle = React.useMemo(
    () => (form ? jobTitles.find((jt) => jt.id === form.jobTitleId) : null),
    [jobTitles, form]
  );

  // Determine structural type and department selection requirement
  const structuralInfo = React.useMemo(() => {
    if (!selectedJobTitle?.jobLevel) {
      return { isStructural: false, requireDepartmentSelection: false, departments: [] };
    }

    const { code } = selectedJobTitle.jobLevel;
    const isHeadOfDivision = code ? DIVISION_HEAD_CODES.includes(code) : false;
    const isManager = code ? DEPARTMENT_MANAGER_CODES.includes(code) : false;
    const isStructural = isHeadOfDivision || isManager;

    const departments = selectedJobTitle.departments || [];
    const requireDepartmentSelection = !isStructural && departments.length > 1;

    return {
      isStructural,
      isHeadOfDivision,
      isManager,
      requireDepartmentSelection,
      departments,
      // Auto-assigned values for structural positions
      autoAssignedDivision: isHeadOfDivision ? selectedJobTitle.division : null,
      autoAssignedDepartment: isManager && departments.length === 1 ? departments[0]?.department : null,
    };
  }, [selectedJobTitle]);

  // Auto-set departmentId when job title changes
  React.useEffect(() => {
    if (!form || !selectedJobTitle) return;

    const { isManager, departments } = structuralInfo;

    // For MANAGER or single department, auto-set departmentId
    if (isManager || departments.length === 1) {
      const deptId = departments[0]?.department?.id;
      if (deptId && form.departmentId !== String(deptId)) {
        setForm((prev) => (prev ? { ...prev, departmentId: String(deptId) } : prev));
      }
    }
    // Clear departmentId for HEAD_OF_DIVISION (they manage entire division, not a single dept)
    else if (structuralInfo.isHeadOfDivision && form.departmentId) {
      setForm((prev) => (prev ? { ...prev, departmentId: "" } : prev));
    }
  }, [form?.jobTitleId, structuralInfo, selectedJobTitle]);

  // Fetch departments by division for HEAD_OF_DIVISION
  React.useEffect(() => {
    if (!structuralInfo.isHeadOfDivision || !selectedJobTitle?.division?.id) {
      setDivisionDepartments([]);
      return;
    }

    const fetchDivisionDepartments = async () => {
      const res = await departmentService.getByDivisionId(String(selectedJobTitle.division!.id));
      if (res.success && res.data) {
        setDivisionDepartments(res.data);
      }
    };

    fetchDivisionDepartments();
  }, [structuralInfo.isHeadOfDivision, selectedJobTitle?.division?.id]);

  // Fetch data
  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [empRes, titleRes, allEmpRes] = await Promise.all([
        employeeService.getById(id),
        jobTitleService.fetchAll(),
        employeeService.getAll(1, 100),
      ]);

      // Get job titles first
      const fetchedJobTitles = titleRes.success && titleRes.data ? titleRes.data : [];
      setJobTitles(fetchedJobTitles);

      if (empRes.success && empRes.data) {
        setEmployee(empRes.data);
        // Pass jobTitles to find matching ID by name
        const formState = mapEmployeeToFormState(empRes.data, fetchedJobTitles);
        setForm(formState);
      } else {
        setError(empRes.message || "Failed to fetch employee");
      }

      if (allEmpRes.success && allEmpRes.data) setEmployees(allEmpRes.data.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load employee data");
    }

    setIsLoading(false);
  }, [id]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Form field change
  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  // Calculate contract/probation end dates
  const getContractEndDate = (): string => {
    if (!form?.joinDate || !form?.contractPeriod) return "";
    const date = new Date(form.joinDate);
    date.setFullYear(date.getFullYear() + Number(form.contractPeriod));
    return date.toISOString().split("T")[0];
  };

  const getProbationEndDate = (): string => {
    if (!form?.joinDate || !form?.probationPeriod) return "";
    const date = new Date(form.joinDate);
    date.setMonth(date.getMonth() + Number(form.probationPeriod));
    return date.toISOString().split("T")[0];
  };

  // Perform the actual update
  const performUpdate = async () => {
    if (!employee || !form) return;
    setIsSubmitting(true);

    const nameParts = form.fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const requestData = mapFormToUpdateRequest({
      firstName,
      lastName,
      email: form.email,
      phone: form.phone,
      dateOfBirth: form.birthDate,
      hireDate: form.joinDate,
      status: form.status as EmployeeStatus,
      jobTitleId: selectedJobTitle?.name || "",
      departmentId: form.departmentId, // Include department for non-structural positions
      managerId: form.superior,
      location: form.location,
      permanentDate: form.status === "Permanent" ? form.permanentDate : "",
      motherName: form.motherName,
      fatherName: form.fatherName,
      spouseName: form.maritalStatus === "Married" ? form.spouseName : "",
      maritalStatus: form.maritalStatus as MaritalStatus | "",
      religion: form.religion,
      ethnicity: form.ethnic,
    });

    const response = await employeeService.update(employee.id, requestData);

    if (response.success) {
      showToast.updated("Employee");
      router.push(`/employees/${employee.id}`);
    } else {
      showToast.updateError("employee", response.message);
    }

    setIsSubmitting(false);
  };

  // Submit - check structural position first
  const handleSubmit = async () => {
    if (!employee || !form || !selectedJobTitle) {
      await performUpdate();
      return;
    }

    // Only check for structural positions (HEAD_OF_DIVISION or MANAGER)
    if (!structuralInfo.isStructural) {
      await performUpdate();
      return;
    }

    setIsSubmitting(true);

    // Check if position is already occupied by someone else
    const deptId = form.departmentId ? Number(form.departmentId) : undefined;
    const checkResult = await employeeService.checkStructuralPosition(
      selectedJobTitle.name,
      deptId
    );

    if (
      checkResult.success &&
      checkResult.data?.isOccupied &&
      String(checkResult.data.currentHolder?.employeeId) !== employee.employeeId
    ) {
      // Position occupied by someone else - show confirmation dialog
      setStructuralCheck(checkResult.data);
      setShowReplaceDialog(true);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    await performUpdate();
  };

  // Handle confirmation to replace position holder
  const handleConfirmReplace = async () => {
    setShowReplaceDialog(false);
    setStructuralCheck(null);
    await performUpdate();
  };

  // Form validity
  const isFormValid =
    form &&
    form.fullName.trim() &&
    form.birthDate &&
    form.jobTitleId &&
    form.joinDate &&
    form.email &&
    // Department required for non-structural with multiple departments
    (!structuralInfo.requireDepartmentSelection || form.departmentId);

  // Loading state
  if (isLoading) {
    return (
      <>
        <Header title="Edit Employee" />
        <PageContainer>
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </PageContainer>
      </>
    );
  }

  // Error state
  if (error || !employee || !form) {
    return (
      <>
        <Header title="Edit Employee" />
        <PageContainer>
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <p className="text-sm text-muted-foreground">{error || "Employee not found"}</p>
            <Button variant="outline" onClick={fetchData}>
              Try Again
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Header title="Edit Employee" />
      <PageContainer>
        <div className="space-y-4">
          {/* Top Bar */}
          <div className="flex items-center">
            <button
              onClick={() => router.push(`/employees/${employee.id}`)}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to {form.fullName || "Employee"}
            </button>
          </div>

          {/* Form Card */}
          <Card>
            <CardContent className="p-6 space-y-8">
              {/* ========== SECTION: BIODATA ========== */}
              <div>
                <h2 className="text-base font-semibold uppercase tracking-wide mb-4">
                  Biodata
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>NIK</Label>
                      <Input
                        value={form.nik}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      placeholder="Full Name"
                      value={form.fullName}
                      onChange={(e) => handleChange("fullName", e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="birthDate">Birth Date *</Label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={form.birthDate}
                        onChange={(e) => handleChange("birthDate", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Religion</Label>
                      <Select
                        value={form.religion}
                        onValueChange={(v) => handleChange("religion", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select religion" />
                        </SelectTrigger>
                        <SelectContent>
                          {RELIGIONS.map((r) => (
                            <SelectItem key={r.value} value={r.value}>
                              {r.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Ethnic</Label>
                      <Select
                        value={form.ethnic}
                        onValueChange={(v) => handleChange("ethnic", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select ethnic" />
                        </SelectTrigger>
                        <SelectContent>
                          {ETHNICITIES.map((e) => (
                            <SelectItem key={e.value} value={e.value}>
                              {e.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                </div>
              </div>

              <div className="border-t border-dashed" />

              {/* ========== SECTION: WORK DETAILS ========== */}
              <div>
                <h2 className="text-base font-semibold uppercase tracking-wide mb-4">
                  Work Details
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Employee Type</Label>
                      <Input
                        placeholder="Employee Type"
                        value={selectedJobTitle?.type || ""}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Job Level</Label>
                      <Input
                        placeholder="Job Level"
                        value={selectedJobTitle?.jobLevel?.name || ""}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Department {structuralInfo.requireDepartmentSelection && "*"}</Label>
                      {structuralInfo.requireDepartmentSelection ? (
                        // Multiple departments - user must select
                        <Select
                          value={form.departmentId}
                          onValueChange={(v) => handleChange("departmentId", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            {structuralInfo.departments.map((d) => (
                              <SelectItem key={d.department.id} value={String(d.department.id)}>
                                {d.department.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        // Auto-assigned or single department - read-only
                        <>
                          <Input
                            placeholder="Department"
                            value={
                              structuralInfo.isHeadOfDivision
                                ? "(All departments in division)"
                                : selectedJobTitle?.departments
                                    ?.map((d) => d.department?.name)
                                    .filter(Boolean)
                                    .join(", ") || ""
                            }
                            disabled
                            className="bg-muted"
                          />
                          {/* Show department list for HEAD_OF_DIVISION */}
                          {structuralInfo.isHeadOfDivision && divisionDepartments.length > 0 && (
                            <ul className="mt-2 space-y-1 text-sm text-muted-foreground pl-4">
                              {divisionDepartments.map((dept) => (
                                <li key={dept.id} className="list-disc">
                                  {dept.name}
                                </li>
                              ))}
                            </ul>
                          )}
                        </>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Division</Label>
                      <Input
                        placeholder="Division"
                        value={
                          structuralInfo.isHeadOfDivision
                            ? selectedJobTitle?.division?.name || ""
                            : selectedJobTitle?.departments?.[0]?.department?.division?.name || ""
                        }
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-4">
                    <div className="space-y-1.5">
                      <Label>Job Title *</Label>
                      <SearchableSelect
                        options={jobTitles.map((t) => ({
                          value: t.id,
                          label: t.name,
                        }))}
                        value={form.jobTitleId}
                        onValueChange={(v) => handleChange("jobTitleId", v)}
                        placeholder="Job Title"
                        searchPlaceholder="Search job title..."
                        emptyText="No job title found."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="fte">FTE</Label>
                      <Input
                        id="fte"
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="1"
                        value={form.fte}
                        onChange={(e) => handleChange("fte", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="joinDate">Join Date *</Label>
                      <Input
                        id="joinDate"
                        type="date"
                        value={form.joinDate}
                        onChange={(e) => handleChange("joinDate", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Mobile Phone No.</Label>
                      <Input
                        id="phone"
                        placeholder="Phone"
                        value={form.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Location</Label>
                      <Select
                        value={form.location}
                        onValueChange={(v) => handleChange("location", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          {LOCATIONS.map((l) => (
                            <SelectItem key={l.value} value={l.value}>
                              {l.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Status</Label>
                      <Select
                        value={form.status}
                        onValueChange={(v) => handleChange("status", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EMPLOYEE_STATUSES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {form.status === "Permanent" && (
                      <div className="space-y-1.5">
                        <Label htmlFor="permanentDate">Permanent Date</Label>
                        <Input
                          id="permanentDate"
                          type="date"
                          value={form.permanentDate}
                          onChange={(e) => handleChange("permanentDate", e.target.value)}
                        />
                      </div>
                    )}

                    {form.status === "Contract" && (
                      <div className="space-y-1.5">
                        <Label>Contract Period</Label>
                        <Select
                          value={form.contractPeriod}
                          onValueChange={(v) => handleChange("contractPeriod", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select period" />
                          </SelectTrigger>
                          <SelectContent>
                            {CONTRACT_PERIODS.map((p) => (
                              <SelectItem key={p.value} value={p.value}>
                                {p.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {form.status === "Probation" && (
                      <div className="space-y-1.5">
                        <Label>Probation Period</Label>
                        <Select
                          value={form.probationPeriod}
                          onValueChange={(v) => handleChange("probationPeriod", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select period" />
                          </SelectTrigger>
                          <SelectContent>
                            {PROBATION_PERIODS.map((p) => (
                              <SelectItem key={p.value} value={p.value}>
                                {p.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {form.status === "Resigned" && (
                      <div className="space-y-1.5">
                        <Label htmlFor="exitDate">Resigned Date</Label>
                        <Input
                          id="exitDate"
                          type="date"
                          value={form.exitDate}
                          onChange={(e) => handleChange("exitDate", e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label>Superior</Label>
                    <SearchableSelect
                      value={form.superior || "0"}
                      onValueChange={(v) => handleChange("superior", v)}
                      placeholder="Select superior"
                      searchPlaceholder="Search employee..."
                      emptyText="No employee found."
                      options={[
                        { value: "0", label: "— No Superior —" },
                        ...employees
                          .filter((emp) => emp.id !== employee?.id)
                          .map((emp) => ({
                            value: emp.id,
                            label: `${emp.firstName} ${emp.lastName}`.trim(),
                          })),
                      ]}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-dashed" />

              {/* ========== SECTION: FAMILY ========== */}
              <div>
                <h2 className="text-base font-semibold uppercase tracking-wide mb-4">
                  Family
                </h2>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="motherName">Mothers Name</Label>
                    <Input
                      id="motherName"
                      placeholder="Mother Name"
                      value={form.motherName}
                      onChange={(e) => handleChange("motherName", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="fatherName">Fathers Name</Label>
                    <Input
                      id="fatherName"
                      placeholder="Father Name"
                      value={form.fatherName}
                      onChange={(e) => handleChange("fatherName", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Marital Status</Label>
                    <Select
                      value={form.maritalStatus}
                      onValueChange={(v) => handleChange("maritalStatus", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select marital status" />
                      </SelectTrigger>
                      <SelectContent>
                        {MARITAL_STATUSES.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {form.maritalStatus === "Married" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="spouseName">Spouse</Label>
                      <Input
                        id="spouseName"
                        placeholder="Your Spouse Name"
                        value={form.spouseName}
                        onChange={(e) => handleChange("spouseName", e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bottom Save Bar */}
          <div className="flex items-center justify-end gap-2 pb-6">
            <Button
              variant="outline"
              onClick={() => router.push(`/employees/${employee.id}`)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="gap-2"
              onClick={handleSubmit}
              disabled={isSubmitting || !isFormValid}
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Save />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </PageContainer>

      {/* Structural Position Replacement Confirmation Dialog */}
      <AlertDialog open={showReplaceDialog} onOpenChange={setShowReplaceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace Current Position Holder?</AlertDialogTitle>
            <AlertDialogDescription>
              {structuralCheck?.positionType === "HEAD_OF_DIVISION" ? (
                <>
                  The <strong>Head of Division</strong> position for{" "}
                  <strong>{structuralCheck?.targetName}</strong> is currently held by{" "}
                  <strong>{structuralCheck?.currentHolder?.employeeName || "Unknown"}</strong>.
                  <br /><br />
                  Assigning this position to <strong>{form?.fullName}</strong> will remove the
                  current holder from this position.
                </>
              ) : (
                <>
                  The <strong>Manager</strong> position for{" "}
                  <strong>{structuralCheck?.targetName}</strong> is currently held by{" "}
                  <strong>{structuralCheck?.currentHolder?.employeeName || "Unknown"}</strong>.
                  <br /><br />
                  Assigning this position to <strong>{form?.fullName}</strong> will remove the
                  current holder from this position.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReplace}>
              Yes, Replace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
