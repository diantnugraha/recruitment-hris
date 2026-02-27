"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
import employeeService, {
  generateNik,
  mapFormToRequest,
} from "@/services/employee.service";
import jobTitleService from "@/services/job-title.service";
import { useEmployeeStore } from "@/stores/employee-store";
import type { JobTitle, EmployeeWithRelations, EmployeeGender, EmployeeStatus, MaritalStatus } from "@/types";
import { showToast } from "@/lib/utils/toast-messages";

// --- Constants (matching hris-tuv exactly) ---

const GENDERS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
] as const;

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
  gender: string;
  birthDate: string;
  religion: string;
  ethnic: string;
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
  // Family
  motherName: string;
  fatherName: string;
  maritalStatus: string;
  spouseName: string;
}

const initialForm: FormState = {
  nik: "",
  fullName: "",
  gender: "Male",
  birthDate: "",
  religion: "Islam",
  ethnic: "Jawa",
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
  superior: "",
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
    const [titleRes, empRes] = await Promise.all([
      jobTitleService.getAll(1, 100),
      employeeService.getAll(1, 100),
    ]);
    if (titleRes.success && titleRes.data) setJobTitles(titleRes.data.data || []);
    if (empRes.success && empRes.data) setEmployees(empRes.data.data || []);
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
    generateNik(form.joinDate)
      .then((nik) => {
        if (!cancelled) setForm((prev) => ({ ...prev, nik }));
      })
      .catch(() => {
        // Fallback: use prefix + 001
        if (!cancelled) {
          const d = new Date(form.joinDate);
          const fallback = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}001`;
          setForm((prev) => ({ ...prev, nik: fallback }));
        }
      });
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

    // Split fullName into firstName and lastName
    const nameParts = form.fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const requestData = mapFormToRequest({
      employeeId: form.nik,
      employeeNik: form.nik,
      firstName,
      lastName,
      nickname: "",
      email: form.email,
      phone: form.phone,
      dateOfBirth: form.birthDate,
      gender: form.gender as EmployeeGender,
      address: "",
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
      certificate: "",
    });

    // Explicitly ensure nik is set
    requestData.nik = form.nik;

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
        <Header title="Add Employee" />
        <PageContainer>
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Header title="Add Employee" />
      <PageContainer>
        <div className="space-y-4">
          {/* Top Bar */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/employees")}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Employees
            </button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/employees")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="gap-2"
                onClick={handleSubmit}
                disabled={isSubmitting || !isFormValid}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save
              </Button>
            </div>
          </div>

          {/* Form Card */}
          <Card>
            <CardContent className="p-6 space-y-8">
              {/* ========== SECTION: BIODATA ========== */}
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide mb-4">
                  Biodata
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>NIK</Label>
                      <Input
                        placeholder="Auto-generated from Join Date"
                        value={form.nik}
                        disabled
                        className="bg-muted font-mono"
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Gender</Label>
                      <Select
                        value={form.gender}
                        onValueChange={(v) => handleChange("gender", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {GENDERS.map((g) => (
                            <SelectItem key={g.value} value={g.value}>
                              {g.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Religion</Label>
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
                    <div className="space-y-1.5">
                      <Label>Ethnic</Label>
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
                  </div>

                </div>
              </div>

              <div className="border-t border-dashed" />

              {/* ========== SECTION: WORK DETAILS ========== */}
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide mb-4">
                  Work Details
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Department</Label>
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
                    <div className="space-y-1.5">
                      <Label>OBS</Label>
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
                  </div>

                  <div className="grid grid-cols-[1fr_120px] gap-4">
                    <div className="space-y-1.5">
                      <Label>Job Title *</Label>
                      <Select
                        value={form.jobTitleId}
                        onValueChange={(v) => handleChange("jobTitleId", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Job Title" />
                        </SelectTrigger>
                        <SelectContent>
                          {jobTitles.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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

                  <div className="grid grid-cols-2 gap-4">
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

                  <div className="grid grid-cols-2 gap-4">
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

                  <div className="grid grid-cols-2 gap-4">
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
                    <Select
                      value={form.superior}
                      onValueChange={(v) => handleChange("superior", v === "__none__" ? "" : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select superior" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— No Superior —</SelectItem>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {`${emp.firstName} ${emp.lastName}`.trim()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="border-t border-dashed" />

              {/* ========== SECTION: FAMILY ========== */}
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide mb-4">
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
              onClick={() => router.push("/employees")}
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
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save
            </Button>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
