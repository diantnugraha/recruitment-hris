"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Loader2,
  User,
  Briefcase,
  Users,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import userService from "@/services/user.service";
import roleService from "@/services/role.service";
import type { UserManagement, UpdateUserRequest } from "@/types/user-management";
import type { Role } from "@/types/role";
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
import { ASIAN_COUNTRIES } from "@/lib/constants/nationalities";

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

/* Label style helper */
const labelStyle = {
  fontSize: "0.875rem",
  fontWeight: 500,
  color: "var(--hsd-ui-color-gray-700)",
} as const;

/* Section card wrapper */
function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
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
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: "var(--hsd-ui-color-gray-100)" }}
        >
          <Icon
            style={{ width: "16px", height: "16px", color: "var(--hsd-ui-color-gray-500)" }}
          />
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

// --- Constants ---

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
  departmentId: string;
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
  address: string;
  nationality: string;
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
    address: emp.address || "",
    nationality: emp.nationality || "",
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

  // Account & Access state
  const [linkedUser, setLinkedUser] = React.useState<UserManagement | null>(null);
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [accountRoleId, setAccountRoleId] = React.useState<string>("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

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
      autoAssignedDivision: isHeadOfDivision ? selectedJobTitle.division : null,
      autoAssignedDepartment: isManager && departments.length === 1 ? departments[0]?.department : null,
    };
  }, [selectedJobTitle]);

  // Auto-set departmentId when job title changes
  React.useEffect(() => {
    if (!form || !selectedJobTitle) return;

    const { isManager, departments } = structuralInfo;

    if (isManager || departments.length === 1) {
      const deptId = departments[0]?.department?.id;
      if (deptId && form.departmentId !== String(deptId)) {
        setForm((prev) => (prev ? { ...prev, departmentId: String(deptId) } : prev));
      }
    } else if (structuralInfo.isHeadOfDivision && form.departmentId) {
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
      const [empRes, titleRes, allEmpRes, roleRes] = await Promise.all([
        employeeService.getById(id),
        jobTitleService.fetchAll(),
        employeeService.getAll(1, 100),
        roleService.fetchAll(),
      ]);

      const fetchedJobTitles = titleRes.success && titleRes.data ? titleRes.data : [];
      setJobTitles(fetchedJobTitles);
      if (roleRes.success && roleRes.data) setRoles(roleRes.data);

      if (empRes.success && empRes.data) {
        setEmployee(empRes.data);
        const formState = mapEmployeeToFormState(empRes.data, fetchedJobTitles);
        setForm(formState);

        const userRes = await userService.getByEmployeeId(empRes.data.id);
        if (userRes.success && userRes.data) {
          setLinkedUser(userRes.data);
          setAccountRoleId(String(userRes.data.roleId));
        }
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
      departmentId: form.departmentId,
      managerId: form.superior,
      address: form.address,
      location: form.location,
      permanentDate: form.status === "Permanent" ? form.permanentDate : "",
      motherName: form.motherName,
      fatherName: form.fatherName,
      spouseName: form.maritalStatus === "Married" ? form.spouseName : "",
      maritalStatus: form.maritalStatus as MaritalStatus | "",
      religion: form.religion,
      ethnicity: form.ethnic,
      nationality: form.nationality,
    });

    const response = await employeeService.update(employee.id, requestData);

    if (response.success) {
      // Update user account if role or password changed
      if (linkedUser) {
        const hasRoleChange = accountRoleId && String(linkedUser.roleId) !== accountRoleId;
        const hasPasswordChange = newPassword.length > 0;

        if (hasRoleChange || hasPasswordChange) {
          const userUpdateData: UpdateUserRequest = {
            displayName: linkedUser.displayName,
            email: linkedUser.email,
          };
          if (hasRoleChange) {
            userUpdateData.roleId = Number(accountRoleId);
          }
          if (hasPasswordChange) {
            userUpdateData.newPassword = newPassword;
          }

          const userRes = await userService.update(linkedUser.id, userUpdateData);
          if (!userRes.success) {
            showToast.updateError("user account", userRes.message);
          }
        }
      }

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

    if (!structuralInfo.isStructural) {
      await performUpdate();
      return;
    }

    setIsSubmitting(true);

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
  const passwordValid = !newPassword || (newPassword.length >= 8 && newPassword === confirmPassword);

  const isFormValid =
    form &&
    form.fullName.trim() &&
    form.birthDate &&
    form.jobTitleId &&
    form.joinDate &&
    form.email &&
    passwordValid &&
    (!structuralInfo.requireDepartmentSelection || form.departmentId);

  // Loading state
  if (isLoading) {
    return (
      <>
        <Header />
        <PageContainer>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
            <Loader2
              className="animate-spin"
              style={{ width: "24px", height: "24px", color: "var(--hsd-ui-color-navy-500)" }}
            />
          </div>
        </PageContainer>
      </>
    );
  }

  // Error state
  if (error || !employee || !form) {
    return (
      <>
        <Header />
        <PageContainer>
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <p style={{ fontSize: "0.875rem", color: "var(--hsd-ui-color-gray-500)", margin: "0 0 16px" }}>
              {error || "Employee not found"}
            </p>
            <Button variant="outline" onClick={fetchData} style={btnSecondary}>
              Try Again
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Header />
      <PageContainer>
        <div className="space-y-5">
          {/* Top Bar — back link + title */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                href={`/employees/${employee.id}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "0.875rem",
                  fontWeight: 400,
                  color: "var(--hsd-ui-color-gray-500)",
                  textDecoration: "none",
                }}
              >
                <ChevronLeft style={{ width: "16px", height: "16px" }} />
                Back to {form.fullName || "Employee"}
              </Link>
              <h1
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  color: "var(--hsd-ui-color-gray-900)",
                  margin: "8px 0 0",
                }}
              >
                Edit Employee
              </h1>
            </div>
          </div>

          {/* ========== SECTION: BIODATA ========== */}
          <SectionCard title="Personal Information" icon={User}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {/* NIK */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label style={labelStyle}>NIK</Label>
                <Input
                  value={form.nik}
                  disabled
                  className="bg-muted"
                />
              </div>

              {/* Full Name */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label style={labelStyle}>Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="Full Name"
                  value={form.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                />
              </div>

              {/* Birth Date */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label style={labelStyle}>Birth Date *</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => handleChange("birthDate", e.target.value)}
                />
              </div>

              {/* Religion */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label style={labelStyle}>Religion</Label>
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

              {/* Ethnic */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label style={labelStyle}>Ethnic</Label>
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

              {/* Nationality */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label style={labelStyle}>Nationality</Label>
                <SearchableSelect
                  options={ASIAN_COUNTRIES.map((c) => ({
                    value: c.value,
                    label: c.label,
                  }))}
                  value={form.nationality}
                  onValueChange={(v) => handleChange("nationality", v)}
                  placeholder="Select nationality"
                  searchPlaceholder="Search country..."
                  emptyText="No country found."
                />
              </div>
            </div>

            {/* Address — full width below the grid */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "20px" }}>
              <Label style={labelStyle}>Address</Label>
              <Textarea
                id="address"
                placeholder="Address"
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
                rows={3}
              />
            </div>
          </SectionCard>

          {/* ========== SECTION: WORK DETAILS ========== */}
          <SectionCard title="Employment Information" icon={Briefcase}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {/* Employee Type (read-only) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label style={labelStyle}>Employee Type</Label>
                <Input
                  placeholder="Employee Type"
                  value={selectedJobTitle?.type || ""}
                  disabled
                  className="bg-muted"
                />
              </div>

              {/* Job Level (read-only) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label style={labelStyle}>Job Level</Label>
                <Input
                  placeholder="Job Level"
                  value={selectedJobTitle?.jobLevel?.name || ""}
                  disabled
                  className="bg-muted"
                />
              </div>

              {/* Department */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label style={labelStyle}>Department {structuralInfo.requireDepartmentSelection && "*"}</Label>
                {structuralInfo.requireDepartmentSelection ? (
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
                    {structuralInfo.isHeadOfDivision && divisionDepartments.length > 0 && (
                      <ul className="mt-2 space-y-1 text-sm pl-4" style={{ color: "var(--hsd-ui-color-gray-500)" }}>
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

              {/* Division (read-only) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label style={labelStyle}>Division</Label>
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

              {/* Job Title */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label style={labelStyle}>Job Title *</Label>
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

              {/* FTE */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label style={labelStyle}>FTE</Label>
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

              {/* Join Date */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label style={labelStyle}>Join Date *</Label>
                <Input
                  id="joinDate"
                  type="date"
                  value={form.joinDate}
                  onChange={(e) => handleChange("joinDate", e.target.value)}
                />
              </div>

              {/* Mobile Phone */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label style={labelStyle}>Mobile Phone No.</Label>
                <Input
                  id="phone"
                  placeholder="Phone"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
              </div>

              {/* Email */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label style={labelStyle}>Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </div>

              {/* Location */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label style={labelStyle}>Location</Label>
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

              {/* Status */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label style={labelStyle}>Status</Label>
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

              {/* Conditional status fields */}
              {form.status === "Permanent" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <Label style={labelStyle}>Permanent Date</Label>
                  <Input
                    id="permanentDate"
                    type="date"
                    value={form.permanentDate}
                    onChange={(e) => handleChange("permanentDate", e.target.value)}
                  />
                </div>
              )}

              {form.status === "Contract" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <Label style={labelStyle}>Contract Period</Label>
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
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <Label style={labelStyle}>Probation Period</Label>
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
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <Label style={labelStyle}>Resigned Date</Label>
                  <Input
                    id="exitDate"
                    type="date"
                    value={form.exitDate}
                    onChange={(e) => handleChange("exitDate", e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Superior — full width below the grid */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "20px" }}>
              <Label style={labelStyle}>Superior</Label>
              <SearchableSelect
                value={form.superior || "0"}
                onValueChange={(v) => handleChange("superior", v)}
                placeholder="Select superior"
                searchPlaceholder="Search employee..."
                emptyText="No employee found."
                options={[
                  { value: "0", label: "-- No Superior --" },
                  ...employees
                    .filter((emp) => emp.id !== employee?.id)
                    .map((emp) => ({
                      value: emp.id,
                      label: `${emp.firstName} ${emp.lastName}`.trim(),
                    })),
                ]}
              />
            </div>
          </SectionCard>

          {/* ========== SECTION: FAMILY ========== */}
          <SectionCard title="Family Information" icon={Users}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {/* Mother's Name */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label style={labelStyle}>Mothers Name</Label>
                <Input
                  id="motherName"
                  placeholder="Mother Name"
                  value={form.motherName}
                  onChange={(e) => handleChange("motherName", e.target.value)}
                />
              </div>

              {/* Father's Name */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label style={labelStyle}>Fathers Name</Label>
                <Input
                  id="fatherName"
                  placeholder="Father Name"
                  value={form.fatherName}
                  onChange={(e) => handleChange("fatherName", e.target.value)}
                />
              </div>

              {/* Marital Status */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label style={labelStyle}>Marital Status</Label>
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

              {/* Spouse Name (conditional) */}
              {form.maritalStatus === "Married" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <Label style={labelStyle}>Spouse</Label>
                  <Input
                    id="spouseName"
                    placeholder="Your Spouse Name"
                    value={form.spouseName}
                    onChange={(e) => handleChange("spouseName", e.target.value)}
                  />
                </div>
              )}
            </div>
          </SectionCard>

          {/* ========== SECTION: ACCOUNT & ACCESS ========== */}
          <SectionCard title="Account & Access" icon={Shield}>
            {linkedUser ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                {/* Role */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <Label style={labelStyle}>Role</Label>
                  <Select
                    value={accountRoleId}
                    onValueChange={setAccountRoleId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r.roleId} value={String(r.roleId)}>
                          {r.roleName || `Role ${r.roleId}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Spacer for grid alignment */}
                <div />

                {/* New Password */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <Label style={labelStyle}>New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Leave blank to keep current"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--hsd-ui-color-gray-500)" }}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff style={{ width: "16px", height: "16px" }} /> : <Eye style={{ width: "16px", height: "16px" }} />}
                    </button>
                  </div>
                  {newPassword && newPassword.length < 8 && (
                    <p style={{ fontSize: "0.75rem", color: "rgba(250, 55, 70, 1)", margin: 0 }}>Minimum 8 characters</p>
                  )}
                </div>

                {/* Confirm Password */}
                {newPassword && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <Label style={labelStyle}>Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: "var(--hsd-ui-color-gray-500)" }}
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff style={{ width: "16px", height: "16px" }} /> : <Eye style={{ width: "16px", height: "16px" }} />}
                      </button>
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p style={{ fontSize: "0.75rem", color: "rgba(250, 55, 70, 1)", margin: 0 }}>Passwords do not match</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p style={{ fontSize: "0.875rem", color: "var(--hsd-ui-color-gray-500)", margin: 0 }}>
                No user account linked to this employee.
              </p>
            )}
          </SectionCard>

          {/* Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
            <Button
              variant="outline"
              onClick={() => router.push(`/employees/${employee.id}`)}
              disabled={isSubmitting}
              style={btnSecondary}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !isFormValid}
              style={btnPrimary}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
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
                  <strong>{structuralCheck?.currentHolder?.employeeName || "No Data"}</strong>.
                  <br /><br />
                  Assigning this position to <strong>{form?.fullName}</strong> will remove the
                  current holder from this position.
                </>
              ) : (
                <>
                  The <strong>Manager</strong> position for{" "}
                  <strong>{structuralCheck?.targetName}</strong> is currently held by{" "}
                  <strong>{structuralCheck?.currentHolder?.employeeName || "No Data"}</strong>.
                  <br /><br />
                  Assigning this position to <strong>{form?.fullName}</strong> will remove the
                  current holder from this position.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={btnSecondary}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReplace} style={btnPrimary}>
              Yes, Replace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
