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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";

import { candidateService, type CreateCandidateRequest } from "@/services/candidate.service";
import { jobTitleService } from "@/services/job-title.service";
import { departmentService } from "@/services/department.service";
import type { JobTitle, Department } from "@/types";
import { showToast } from "@/lib/utils/toast-messages";
import { CANDIDATE_SOURCE_OPTIONS } from "@/lib/constants/candidateStatus";

// --- Form State Interface ---

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  source: string;
  currentCompany: string;
  currentPosition: string;
  expectedSalary: string;
  noticePeriod: string;
  resumeUrl: string;
  linkedinUrl: string;
  portfolioUrl: string;
  notes: string;
  jobTitleId: string;
  departmentId: string;
}

const initialForm: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  source: "",
  currentCompany: "",
  currentPosition: "",
  expectedSalary: "",
  noticePeriod: "",
  resumeUrl: "",
  linkedinUrl: "",
  portfolioUrl: "",
  notes: "",
  jobTitleId: "",
  departmentId: "",
};

export default function CandidateNewPage() {
  const router = useRouter();

  const [form, setForm] = React.useState<FormState>(initialForm);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Dropdown data
  const [jobTitles, setJobTitles] = React.useState<JobTitle[]>([]);
  const [departments, setDepartments] = React.useState<Department[]>([]);

  // Fetch dropdown data
  const fetchDropdownData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [titleRes, deptRes] = await Promise.all([
        jobTitleService.fetchAll(),
        departmentService.fetchAll(),
      ]);
      if (titleRes.success && titleRes.data) setJobTitles(titleRes.data);
      if (deptRes.success && deptRes.data) setDepartments(deptRes.data);
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    }
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    fetchDropdownData();
  }, [fetchDropdownData]);

  // Form field change
  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Submit
  const handleSubmit = async () => {
    setIsSubmitting(true);

    const requestData: CreateCandidateRequest = {
      first_name: form.firstName,
      last_name: form.lastName,
      email: form.email,
      phone: form.phone || undefined,
      source: form.source || undefined,
      current_company: form.currentCompany || undefined,
      current_position: form.currentPosition || undefined,
      expected_salary: form.expectedSalary ? Number(form.expectedSalary) : undefined,
      notice_period: form.noticePeriod || undefined,
      resume_url: form.resumeUrl || undefined,
      linkedin_url: form.linkedinUrl || undefined,
      portfolio_url: form.portfolioUrl || undefined,
      notes: form.notes || undefined,
      job_title_id: form.jobTitleId ? Number(form.jobTitleId) : undefined,
      department_id: form.departmentId ? Number(form.departmentId) : undefined,
    };

    const response = await candidateService.create(requestData);

    if (response.success && response.data) {
      showToast.created("Candidate");
      router.push(`/recruitment/${response.data.id}`);
    } else {
      showToast.createError("candidate", response.message);
    }

    setIsSubmitting(false);
  };

  // Form validity
  const isFormValid =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.email.trim();

  // Loading state
  if (isLoading) {
    return (
      <>
        <Header title="Add Candidate" />
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
      <Header title="Add Candidate" />
      <PageContainer>
        <div className="space-y-4">
          {/* Top Bar */}
          <div className="flex items-center">
            <button
              onClick={() => router.push("/recruitment")}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Recruitment
            </button>
          </div>

          {/* Form Card */}
          <Card>
            <CardContent className="p-6 space-y-8">
              {/* ========== SECTION: PERSONAL INFO ========== */}
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide mb-4">
                  Personal Information
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        placeholder="First Name"
                        value={form.firstName}
                        onChange={(e) => handleChange("firstName", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        placeholder="Last Name"
                        value={form.lastName}
                        onChange={(e) => handleChange("lastName", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="email@example.com"
                        value={form.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        placeholder="+62..."
                        value={form.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-dashed" />

              {/* ========== SECTION: APPLICATION INFO ========== */}
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide mb-4">
                  Application Details
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Source</Label>
                      <Select
                        value={form.source}
                        onValueChange={(v) => handleChange("source", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          {CANDIDATE_SOURCE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Job Title</Label>
                      <SearchableSelect
                        options={jobTitles.map((t) => ({
                          value: t.id,
                          label: t.name,
                        }))}
                        value={form.jobTitleId}
                        onValueChange={(v) => handleChange("jobTitleId", v)}
                        placeholder="Select job title"
                        searchPlaceholder="Search job title..."
                        emptyText="No job title found."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Department</Label>
                      <SearchableSelect
                        options={departments.map((d) => ({
                          value: d.id,
                          label: d.name,
                        }))}
                        value={form.departmentId}
                        onValueChange={(v) => handleChange("departmentId", v)}
                        placeholder="Select department"
                        searchPlaceholder="Search department..."
                        emptyText="No department found."
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-dashed" />

              {/* ========== SECTION: CURRENT POSITION ========== */}
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide mb-4">
                  Current Position
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="currentCompany">Current Company</Label>
                      <Input
                        id="currentCompany"
                        placeholder="Company name"
                        value={form.currentCompany}
                        onChange={(e) => handleChange("currentCompany", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="currentPosition">Current Position</Label>
                      <Input
                        id="currentPosition"
                        placeholder="Position title"
                        value={form.currentPosition}
                        onChange={(e) => handleChange("currentPosition", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="expectedSalary">Expected Salary (IDR)</Label>
                      <Input
                        id="expectedSalary"
                        type="number"
                        placeholder="10000000"
                        value={form.expectedSalary}
                        onChange={(e) => handleChange("expectedSalary", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="noticePeriod">Notice Period</Label>
                      <Input
                        id="noticePeriod"
                        placeholder="e.g., 1 month"
                        value={form.noticePeriod}
                        onChange={(e) => handleChange("noticePeriod", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-dashed" />

              {/* ========== SECTION: LINKS ========== */}
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide mb-4">
                  Links
                </h2>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="resumeUrl">Resume URL</Label>
                    <Input
                      id="resumeUrl"
                      placeholder="https://..."
                      value={form.resumeUrl}
                      onChange={(e) => handleChange("resumeUrl", e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                      <Input
                        id="linkedinUrl"
                        placeholder="https://linkedin.com/in/..."
                        value={form.linkedinUrl}
                        onChange={(e) => handleChange("linkedinUrl", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="portfolioUrl">Portfolio URL</Label>
                      <Input
                        id="portfolioUrl"
                        placeholder="https://..."
                        value={form.portfolioUrl}
                        onChange={(e) => handleChange("portfolioUrl", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-dashed" />

              {/* ========== SECTION: NOTES ========== */}
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide mb-4">
                  Notes
                </h2>
                <div className="space-y-1.5">
                  <Textarea
                    id="notes"
                    placeholder="Additional notes..."
                    rows={4}
                    value={form.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bottom Save Bar */}
          <div className="flex items-center justify-end gap-2 pb-6">
            <Button
              variant="outline"
              onClick={() => router.push("/recruitment")}
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
