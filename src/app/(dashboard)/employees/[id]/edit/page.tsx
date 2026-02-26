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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import employeeService, {
  EmployeeFormData,
  mapFormToUpdateRequest,
} from "@/services/employee.service";
import divisionService from "@/services/division.service";
import departmentService from "@/services/department.service";
import jobLevelService from "@/services/job-level.service";
import jobTitleService from "@/services/job-title.service";
import {
  EmployeeWithRelations,
  EmployeeStatus,
  Division,
  Department,
  JobLevel,
  JobTitle,
} from "@/types";
import { showToast } from "@/lib/utils/toast-messages";

// --- Constants ---

const EMPLOYEE_STATUSES: { value: EmployeeStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "permanent", label: "Permanent" },
  { value: "contract", label: "Contract" },
  { value: "probation", label: "Probation" },
  { value: "outsource", label: "Outsource" },
  { value: "on_leave", label: "On Leave" },
  { value: "inactive", label: "Inactive" },
  { value: "terminated", label: "Terminated" },
  { value: "exit", label: "Exit" },
];

const MARITAL_STATUSES = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
] as const;

const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
] as const;

const EMPLOYEE_TYPES = [
  { value: "Full-Time", label: "Full-Time" },
  { value: "Part-Time", label: "Part-Time" },
  { value: "Contract", label: "Contract" },
  { value: "Internship", label: "Internship" },
] as const;

function mapEmployeeToForm(emp: EmployeeWithRelations): EmployeeFormData {
  return {
    employeeId: emp.employeeId || "",
    firstName: emp.firstName || "",
    lastName: emp.lastName || "",
    nickname: emp.nickname || "",
    email: emp.email || "",
    phone: emp.phone || "",
    dateOfBirth: emp.dateOfBirth || "",
    gender: emp.gender || "male",
    address: emp.address || "",
    hireDate: emp.hireDate || "",
    status: emp.status || "active",
    departmentId: emp.departmentId || "",
    divisionId: emp.divisionId || "",
    jobTitleId: emp.jobTitleId || "",
    jobLevelId: emp.jobLevelId || "",
    managerId: emp.managerId || "",
    employeeType: emp.employeeType || "",
    businessUnit: emp.businessUnit || "",
    extension: emp.extension || "",
    location: emp.location || "",
    fte: emp.fte != null ? String(emp.fte) : "",
    permanentDate: emp.permanentDate || "",
    contractDate: emp.contractDate || "",
    contractEndDate: emp.contractEndDate || "",
    probationDate: emp.probationDate || "",
    probationEndDate: emp.probationEndDate || "",
    motherName: emp.motherName || "",
    fatherName: emp.fatherName || "",
    spouseName: emp.spouseName || "",
    maritalStatus: emp.maritalStatus || "",
    emergencyContactName: emp.emergencyContactName || "",
    emergencyContactRelation: emp.emergencyContactRelation || "",
    emergencyContactPhone: emp.emergencyContactPhone || "",
    religion: emp.religion || "",
    ethnicity: emp.ethnicity || "",
    certificate: emp.certificate || "",
  };
}

export default function EmployeeEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // State
  const [employee, setEmployee] = React.useState<EmployeeWithRelations | null>(null);
  const [formData, setFormData] = React.useState<EmployeeFormData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Dropdown data
  const [divisions, setDivisions] = React.useState<Division[]>([]);
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [jobLevels, setJobLevels] = React.useState<JobLevel[]>([]);
  const [jobTitles, setJobTitles] = React.useState<JobTitle[]>([]);

  // Fetch employee and dropdown data
  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const [empRes, divRes, deptRes, levelRes, titleRes] = await Promise.all([
      employeeService.getById(id),
      divisionService.getAll(1, 100),
      departmentService.getAll(1, 100),
      jobLevelService.getAll(1, 100),
      jobTitleService.getAll(1, 100),
    ]);

    if (empRes.success && empRes.data) {
      setEmployee(empRes.data);
      setFormData(mapEmployeeToForm(empRes.data));
    } else {
      setError(empRes.message || "Failed to fetch employee");
    }

    if (divRes.success && divRes.data) setDivisions(divRes.data.data || []);
    if (deptRes.success && deptRes.data) setDepartments(deptRes.data.data || []);
    if (levelRes.success && levelRes.data) setJobLevels(levelRes.data.data || []);
    if (titleRes.success && titleRes.data) setJobTitles(titleRes.data.data || []);

    setIsLoading(false);
  }, [id]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Form field change
  const handleFieldChange = (field: keyof EmployeeFormData, value: string) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  // Submit
  const handleSubmit = async () => {
    if (!employee || !formData) return;
    setIsSubmitting(true);

    const requestData = mapFormToUpdateRequest(formData);
    const response = await employeeService.update(employee.id, requestData);

    if (response.success) {
      showToast.updated("Employee");
      router.push(`/employees/${employee.id}`);
    } else {
      showToast.updateError("employee", response.message);
    }

    setIsSubmitting(false);
  };

  // Form validity
  const isFormValid =
    formData &&
    formData.employeeId &&
    formData.firstName &&
    formData.lastName &&
    formData.email &&
    formData.phone &&
    formData.dateOfBirth &&
    formData.hireDate &&
    formData.divisionId &&
    formData.departmentId &&
    formData.jobLevelId &&
    formData.jobTitleId &&
    formData.address;

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
  if (error || !employee || !formData) {
    return (
      <>
        <Header title="Edit Employee" />
        <PageContainer>
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <p className="text-sm text-muted-foreground">{error || "Employee not found"}</p>
            <Button variant="outline" size="sm" onClick={fetchData}>
              Try Again
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  const fullName = `${employee.firstName || ""} ${employee.lastName || ""}`.trim();

  return (
    <>
      <Header title="Edit Employee" />
      <PageContainer>
        <div className="space-y-4">
          {/* Top Bar */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push(`/employees/${employee.id}`)}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to {fullName || "Employee"}
            </button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/employees/${employee.id}`)}
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
                Save Changes
              </Button>
            </div>
          </div>

          {/* Form Card */}
          <Card className="border-0 shadow-none">
            <CardContent className="p-6 space-y-8">
              {/* Section: Basic Information */}
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide mb-4">
                  Basic Information
                </h2>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="employeeId">Employee ID *</Label>
                      <Input
                        id="employeeId"
                        placeholder="EMP-001"
                        value={formData.employeeId}
                        onChange={(e) => handleFieldChange("employeeId", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Status *</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => handleFieldChange("status", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
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
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={(e) => handleFieldChange("firstName", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={(e) => handleFieldChange("lastName", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="nickname">Nickname</Label>
                      <Input
                        id="nickname"
                        placeholder="Johnny"
                        value={formData.nickname}
                        onChange={(e) => handleFieldChange("nickname", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john.doe@company.com"
                        value={formData.email}
                        onChange={(e) => handleFieldChange("email", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        placeholder="+62 812 3456 7890"
                        value={formData.phone}
                        onChange={(e) => handleFieldChange("phone", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => handleFieldChange("dateOfBirth", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Gender *</Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(value) => handleFieldChange("gender", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
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
                      <Label>Marital Status</Label>
                      <Select
                        value={formData.maritalStatus}
                        onValueChange={(value) => handleFieldChange("maritalStatus", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
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
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="religion">Religion</Label>
                      <Input
                        id="religion"
                        placeholder="e.g. Islam, Kristen, Katolik"
                        value={formData.religion}
                        onChange={(e) => handleFieldChange("religion", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ethnicity">Ethnicity</Label>
                      <Input
                        id="ethnicity"
                        placeholder="e.g. Jawa, Sunda, Batak"
                        value={formData.ethnicity}
                        onChange={(e) => handleFieldChange("ethnicity", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="address">Address *</Label>
                    <Textarea
                      id="address"
                      placeholder="Enter full address"
                      value={formData.address}
                      onChange={(e) => handleFieldChange("address", e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Separator */}
              <div className="border-t border-dashed" />

              {/* Section: Employment Details */}
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide mb-4">
                  Employment Details
                </h2>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="hireDate">Hire Date *</Label>
                      <Input
                        id="hireDate"
                        type="date"
                        value={formData.hireDate}
                        onChange={(e) => handleFieldChange("hireDate", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Employee Type</Label>
                      <Select
                        value={formData.employeeType}
                        onValueChange={(value) => handleFieldChange("employeeType", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {EMPLOYEE_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Division *</Label>
                      <Select
                        value={formData.divisionId}
                        onValueChange={(value) => handleFieldChange("divisionId", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select division" />
                        </SelectTrigger>
                        <SelectContent>
                          {divisions.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Department *</Label>
                      <Select
                        value={formData.departmentId}
                        onValueChange={(value) => handleFieldChange("departmentId", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Job Level *</Label>
                      <Select
                        value={formData.jobLevelId}
                        onValueChange={(value) => handleFieldChange("jobLevelId", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select job level" />
                        </SelectTrigger>
                        <SelectContent>
                          {jobLevels.map((l) => (
                            <SelectItem key={l.id} value={l.id}>
                              {l.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Job Title *</Label>
                      <Select
                        value={formData.jobTitleId}
                        onValueChange={(value) => handleFieldChange("jobTitleId", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select job title" />
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
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="businessUnit">Business Unit</Label>
                      <Input
                        id="businessUnit"
                        placeholder="e.g. BU-01"
                        value={formData.businessUnit}
                        onChange={(e) => handleFieldChange("businessUnit", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        placeholder="e.g. Jakarta"
                        value={formData.location}
                        onChange={(e) => handleFieldChange("location", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="fte">FTE</Label>
                      <Input
                        id="fte"
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        placeholder="1.0"
                        value={formData.fte}
                        onChange={(e) => handleFieldChange("fte", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="certificate">Certificate / Qualification</Label>
                    <Input
                      id="certificate"
                      placeholder="e.g. S1 Teknik Informatika"
                      value={formData.certificate}
                      onChange={(e) => handleFieldChange("certificate", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Separator */}
              <div className="border-t border-dashed" />

              {/* Section: Contract & Probation Dates */}
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide mb-4">
                  Contract & Probation Dates
                </h2>
                <div className="grid gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="permanentDate">Permanent Date</Label>
                    <Input
                      id="permanentDate"
                      type="date"
                      value={formData.permanentDate}
                      onChange={(e) => handleFieldChange("permanentDate", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="contractDate">Contract Start Date</Label>
                      <Input
                        id="contractDate"
                        type="date"
                        value={formData.contractDate}
                        onChange={(e) => handleFieldChange("contractDate", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="contractEndDate">Contract End Date</Label>
                      <Input
                        id="contractEndDate"
                        type="date"
                        value={formData.contractEndDate}
                        onChange={(e) => handleFieldChange("contractEndDate", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="probationDate">Probation Start Date</Label>
                      <Input
                        id="probationDate"
                        type="date"
                        value={formData.probationDate}
                        onChange={(e) => handleFieldChange("probationDate", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="probationEndDate">Probation End Date</Label>
                      <Input
                        id="probationEndDate"
                        type="date"
                        value={formData.probationEndDate}
                        onChange={(e) => handleFieldChange("probationEndDate", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Separator */}
              <div className="border-t border-dashed" />

              {/* Section: Family Information */}
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide mb-4">
                  Family Information
                </h2>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="fatherName">Father&apos;s Name</Label>
                      <Input
                        id="fatherName"
                        placeholder="Father's full name"
                        value={formData.fatherName}
                        onChange={(e) => handleFieldChange("fatherName", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="motherName">Mother&apos;s Name</Label>
                      <Input
                        id="motherName"
                        placeholder="Mother's full name"
                        value={formData.motherName}
                        onChange={(e) => handleFieldChange("motherName", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="spouseName">Spouse Name</Label>
                    <Input
                      id="spouseName"
                      placeholder="Spouse's full name"
                      value={formData.spouseName}
                      onChange={(e) => handleFieldChange("spouseName", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Separator */}
              <div className="border-t border-dashed" />

              {/* Section: Emergency Contact */}
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide mb-4">
                  Emergency Contact
                </h2>
                <div className="grid gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="emergencyContactName">Contact Name</Label>
                    <Input
                      id="emergencyContactName"
                      placeholder="Emergency contact name"
                      value={formData.emergencyContactName}
                      onChange={(e) => handleFieldChange("emergencyContactName", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="emergencyContactRelation">Relationship</Label>
                      <Input
                        id="emergencyContactRelation"
                        placeholder="e.g. Spouse, Parent, Sibling"
                        value={formData.emergencyContactRelation}
                        onChange={(e) => handleFieldChange("emergencyContactRelation", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="emergencyContactPhone">Phone Number</Label>
                      <Input
                        id="emergencyContactPhone"
                        placeholder="+62 812 3456 7890"
                        value={formData.emergencyContactPhone}
                        onChange={(e) => handleFieldChange("emergencyContactPhone", e.target.value)}
                      />
                    </div>
                  </div>
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
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
