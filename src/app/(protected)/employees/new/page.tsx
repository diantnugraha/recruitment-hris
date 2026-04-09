"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Loader2,
  User,
  Briefcase,
  Users,
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
import employeeService, {
  generateNik,
  generateUniqueNik,
  checkNikExists,
  mapFormToRequest,
} from "@/services/employee.service";
import jobTitleService from "@/services/job-title.service";
import { useEmployeeStore } from "@/stores/employee-store";
import type { JobTitle, EmployeeWithRelations, EmployeeStatus, MaritalStatus } from "@/types";
import { showToast } from "@/lib/utils/toast-messages";
import { RequireHr } from "@/components/shared/RequireHr";
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
  // NIK (auto-generated)
  nik: string;
  // Biodata
  fullName: string;
  birthDate: string;
  religion: string;
  ethnic: string;
  nationality: string;
  // Work Details
  jobTitleId: string;
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
  // Family
  motherName: string;
  fatherName: string;
  maritalStatus: string;
  spouseName: string;
}

const initialForm: FormState = {
  nik: "",
  fullName: "",
  birthDate: "",
  religion: "Islam",
  ethnic: "Jawa",
  nationality: "",
  jobTitleId: "",
  fte: "1",
  joinDate: "",
  phone: "",
  email: "",
  location: "",
  status: "Permanent",
  permanentDate: "",
  contractPeriod: "",
  probationPeriod: "",
  exitDate: "",
  superior: "0",
  address: "",
  motherName: "",
  fatherName: "",
  maritalStatus: "",
  spouseName: "",
};

export default function EmployeeNewPage() {
  const router = useRouter();
  const { addEmployee } = useEmployeeStore();

  const [form, setForm] = React.useState<FormState>(initialForm);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Dropdown data
  const [jobTitles, setJobTitles] = React.useState<JobTitle[]>([]);
  const [employees, setEmployees] = React.useState<EmployeeWithRelations[]>([]);

  // Derived read-only fields from selected job title
  const selectedJobTitle = React.useMemo(
    () => jobTitles.find((jt) => jt.id === form.jobTitleId),
    [jobTitles, form.jobTitleId]
  );

  // Fetch dropdown data
  const fetchDropdownData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [titleRes, empRes] = await Promise.all([
        jobTitleService.fetchAll(),
        employeeService.getAll(1, 100),
      ]);
      if (titleRes.success && titleRes.data) setJobTitles(titleRes.data);
      if (empRes.success && empRes.data) setEmployees(empRes.data.data || []);
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    }
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    fetchDropdownData();
  }, [fetchDropdownData]);

  // Auto-generate NIK when join date changes
  React.useEffect(() => {
    if (!form.joinDate) {
      setForm((prev) => ({ ...prev, nik: "" }));
      return;
    }
    let cancelled = false;

    const generateNikAsync = async () => {
      try {
        const nik = await generateNik(form.joinDate);
        if (!cancelled) {
          setForm((prev) => ({ ...prev, nik }));
        }
      } catch (error) {
        console.error("Error generating NIK:", error);
        // Fallback: use prefix + 001
        if (!cancelled) {
          const d = new Date(form.joinDate);
          const fallback = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}001`;
          setForm((prev) => ({ ...prev, nik: fallback }));
        }
      }
    };

    generateNikAsync();
    return () => { cancelled = true; };
  }, [form.joinDate]);

  // Form field change
  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Calculate contract/probation end dates
  const getContractEndDate = (): string => {
    if (!form.joinDate || !form.contractPeriod) return "";
    const date = new Date(form.joinDate);
    date.setFullYear(date.getFullYear() + Number(form.contractPeriod));
    return date.toISOString().split("T")[0];
  };

  const getProbationEndDate = (): string => {
    if (!form.joinDate || !form.probationPeriod) return "";
    const date = new Date(form.joinDate);
    date.setMonth(date.getMonth() + Number(form.probationPeriod));
    return date.toISOString().split("T")[0];
  };

  // Submit — map form to API request
  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Re-generate NIK right before submission to avoid race conditions
    let finalNik = form.nik;
    if (form.joinDate) {
      try {
        finalNik = await generateUniqueNik(form.joinDate);
        setForm((prev) => ({ ...prev, nik: finalNik }));
      } catch {
        finalNik = form.nik;
      }
    }

    // Double-check NIK doesn't exist (safety check)
    const nikExists = await checkNikExists(finalNik);
    if (nikExists) {
      showToast.createError("employee", "NIK already exists. Please try again.");
      setIsSubmitting(false);
      return;
    }

    // Split fullName into firstName and lastName
    const nameParts = form.fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const requestData = mapFormToRequest({
      employeeId: finalNik,
      employeeNik: finalNik,
      firstName,
      lastName,
      nickname: "",
      email: form.email,
      phone: form.phone,
      dateOfBirth: form.birthDate,
      address: form.address,
      hireDate: form.joinDate,
      status: form.status as EmployeeStatus,
      departmentId: "",
      divisionId: "",
      jobTitleId: selectedJobTitle?.name || "",
      jobLevelId: "",
      managerId: form.superior,
      employeeType: "",
      businessUnit: "",
      extension: "",
      location: form.location,
      fte: form.fte,
      permanentDate: form.status === "Permanent" ? form.permanentDate : "",
      contractDate: "",
      contractEndDate: "",
      probationDate: "",
      probationEndDate: "",
      motherName: form.motherName,
      fatherName: form.fatherName,
      spouseName: form.maritalStatus === "Married" ? form.spouseName : "",
      maritalStatus: form.maritalStatus as MaritalStatus | "",
      emergencyContactName: "",
      emergencyContactRelation: "",
      emergencyContactPhone: "",
      religion: form.religion,
      ethnicity: form.ethnic,
      nationality: form.nationality,
      certificate: "",
    });

    // Explicitly ensure nik is set
    requestData.nik = finalNik;

    const response = await employeeService.create(requestData);

    if (response.success && response.data) {
      addEmployee(response.data);
      showToast.created("Employee");
      router.push("/employees");
    } else {
      showToast.createError("employee", response.message);
    }

    setIsSubmitting(false);
  };

  // Form validity — include nik so submit waits for generation
  const isFormValid =
    form.nik &&
    form.fullName.trim() &&
    form.birthDate &&
    form.jobTitleId &&
    form.joinDate &&
    form.email;

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

  return (
    <RequireHr>
      <Header />
      <PageContainer>
        <div className="space-y-5">
          {/* Top Bar — back link + title */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                href="/employees"
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
                Employees
              </Link>
              <h1
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  color: "var(--hsd-ui-color-gray-900)",
                  margin: "8px 0 0",
                }}
              >
                Create New Employee
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
                  placeholder="Auto-generated from Join Date"
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
                    <SelectValue />
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
                    <SelectValue />
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

              {/* Department (read-only) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label style={labelStyle}>Department</Label>
                <Input
                  placeholder="Department"
                  value={
                    selectedJobTitle?.departments
                      ?.map((d) => d.department?.name)
                      .filter(Boolean)
                      .join(", ") || ""
                  }
                  disabled
                  className="bg-muted"
                />
              </div>

              {/* OBS (read-only) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label style={labelStyle}>OBS</Label>
                <Input
                  placeholder="OBS"
                  value={
                    selectedJobTitle?.departments
                      ?.map((d) => d.department?.obs?.name)
                      .filter(Boolean)
                      .join(", ") || ""
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
                  ...employees.map((emp) => ({
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

          {/* Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
            <Button
              variant="outline"
              onClick={() => router.push("/employees")}
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
                  Creating...
                </>
              ) : (
                "Create Employee"
              )}
            </Button>
          </div>
        </div>
      </PageContainer>
    </RequireHr>
  );
}
