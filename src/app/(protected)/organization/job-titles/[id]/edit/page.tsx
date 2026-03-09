"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  ChevronsUpDown,
  X,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LexicalEditor } from "@/components/shared/lexical-editor";
import { showToast } from "@/lib/utils/toast-messages";
import { jobTitleService, UpdateJobTitleRequest } from "@/services/job-title.service";
import { jobLevelService } from "@/services/job-level.service";
import { departmentService } from "@/services/department.service";
import { divisionService } from "@/services/division.service";
import { JobTitle, JobLevel, Department, Division } from "@/types";

interface FormData {
  name: string;
  jobLevelId: string;
  type: "Administration" | "Technical" | "";
  divisionId: string;
  directReportId: string;
  departmentIds: string[];
  purpose: string;
  description: string;
  requirement: string;
}

const initialFormData: FormData = {
  name: "",
  jobLevelId: "",
  type: "",
  divisionId: "",
  directReportId: "",
  departmentIds: [],
  purpose: "",
  description: "",
  requirement: "",
};

export default function JobTitleEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [jobTitle, setJobTitle] = React.useState<JobTitle | null>(null);
  const [jobLevels, setJobLevels] = React.useState<JobLevel[]>([]);
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [divisions, setDivisions] = React.useState<Division[]>([]);
  const [allJobTitles, setAllJobTitles] = React.useState<JobTitle[]>([]);

  const [formData, setFormData] = React.useState<FormData>(initialFormData);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Department multi-select dropdown
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = React.useState(false);
  const deptDropdownRef = React.useRef<HTMLDivElement>(null);

  // Close department dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(event.target as Node)) {
        setIsDeptDropdownOpen(false);
      }
    }
    if (isDeptDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isDeptDropdownOpen]);

  // Fetch all data on mount
  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const [titleRes, levelsRes, deptsRes, divsRes, allTitlesRes] = await Promise.all([
      jobTitleService.getById(id),
      jobLevelService.fetchAll(),
      departmentService.fetchAll(),
      divisionService.fetchAll(),
      jobTitleService.fetchAll(),
    ]);

    if (levelsRes.success && levelsRes.data) setJobLevels(levelsRes.data);
    if (deptsRes.success && deptsRes.data) setDepartments(deptsRes.data);
    if (divsRes.success && divsRes.data) setDivisions(divsRes.data);
    if (allTitlesRes.success && allTitlesRes.data) setAllJobTitles(allTitlesRes.data);

    if (titleRes.success && titleRes.data) {
      const jt = titleRes.data;
      setJobTitle(jt);

      // Extract department IDs from many-to-many relation
      const deptIds = jt.departments
        ? jt.departments.map((d) => String(d.department.id))
        : [];

      setFormData({
        name: jt.name || "",
        jobLevelId: String(jt.jobLevelId || ""),
        type: jt.type || "",
        divisionId: jt.divisionId ? String(jt.divisionId) : "",
        directReportId: jt.directReportId ? String(jt.directReportId) : "",
        departmentIds: deptIds,
        // Rich text fields - pass as-is, LexicalEditor handles parsing
        purpose: typeof jt.purpose === "string" ? jt.purpose : JSON.stringify(jt.purpose || ""),
        description: typeof jt.description === "string" ? jt.description : JSON.stringify(jt.description || ""),
        requirement: typeof jt.requirement === "string" ? jt.requirement : JSON.stringify(jt.requirement || ""),
      });
    } else {
      setError(titleRes.message || "Failed to fetch job title");
    }

    setIsLoading(false);
  }, [id]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    const data: UpdateJobTitleRequest = {
      name: formData.name,
      job_level_id: Number(formData.jobLevelId),
      type: formData.type === "Administration" || formData.type === "Technical" ? formData.type : undefined,
      division_id: formData.divisionId ? Number(formData.divisionId) : undefined,
      direct_report_id: formData.directReportId ? Number(formData.directReportId) : undefined,
      purpose: formData.purpose,
      description: formData.description,
      requirement: formData.requirement,
      department_sync: formData.departmentIds.map(Number),
    };

    const response = await jobTitleService.update(id, data);

    if (response.success) {
      showToast.updated("Job Title");
      router.push(`/organization/job-titles/${id}`);
    } else {
      showToast.updateError("job title", response.message);
      setIsSaving(false);
    }
  };

  const toggleDepartment = (deptId: string) => {
    setFormData((prev) => ({
      ...prev,
      departmentIds: prev.departmentIds.includes(deptId)
        ? prev.departmentIds.filter((did) => did !== deptId)
        : [...prev.departmentIds, deptId],
    }));
  };

  // Loading state
  if (isLoading) {
    return (
      <>
        <Header title="Edit Job Title" />
        <PageContainer>
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </PageContainer>
      </>
    );
  }

  // Error state (no data loaded)
  if (!jobTitle) {
    return (
      <>
        <Header title="Edit Job Title" />
        <PageContainer>
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <p className="text-sm text-muted-foreground">{error || "Job title not found"}</p>
            <Button variant="outline" size="sm" onClick={fetchData}>
              Try Again
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  // Filter out current job title from direct report options
  const directReportOptions = allJobTitles.filter((jt) => jt.id !== id);

  const selectedDeptNames = formData.departmentIds
    .map((did) => departments.find((d) => String(d.id) === did)?.name)
    .filter(Boolean);

  const isFormValid = formData.name && formData.jobLevelId && formData.type && formData.departmentIds.length > 0;

  return (
    <>
      <Header title="Edit Job Title" />
      <PageContainer>
        <div className="space-y-4">
          {/* Top Bar: Back */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push(`/organization/job-titles/${id}`)}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Job Title Detail
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <span>{error}</span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-6 px-2 text-xs"
                onClick={() => setError(null)}
              >
                Dismiss
              </Button>
            </div>
          )}

          {/* Form Card */}
          <Card className="border-0 shadow-none">
            <CardContent className="p-6 space-y-6">
              {/* Basic Fields */}
              <div>
                <h2 className="text-base font-semibold uppercase tracking-wide mb-4">
                  General Information
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      placeholder="Enter job title name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  {/* Job Level */}
                  <div className="space-y-1.5">
                    <Label>Job Level *</Label>
                    <Select
                      value={formData.jobLevelId}
                      onValueChange={(value) => setFormData({ ...formData, jobLevelId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        {jobLevels.map((level) => (
                          <SelectItem key={level.id} value={String(level.id)}>
                            {level.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Type */}
                  <div className="space-y-1.5">
                    <Label>Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, type: value as "Administration" | "Technical" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Administration">Administration</SelectItem>
                        <SelectItem value="Technical">Technical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Division */}
                  <div className="space-y-1.5">
                    <Label>Division</Label>
                    <Select
                      value={formData.divisionId}
                      onValueChange={(value) => setFormData({ ...formData, divisionId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select division" />
                      </SelectTrigger>
                      <SelectContent>
                        {divisions.map((div) => (
                          <SelectItem key={div.id} value={String(div.id)}>
                            {div.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Departments Multi-Select */}
                  <div className="space-y-1.5">
                    <Label>Departments *</Label>
                    <div className="relative" ref={deptDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setIsDeptDropdownOpen(!isDeptDropdownOpen)}
                        className="flex w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <span className={selectedDeptNames.length === 0 ? "text-muted-foreground" : ""}>
                          {selectedDeptNames.length === 0
                            ? "Select departments"
                            : `${selectedDeptNames.length} selected`}
                        </span>
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                      </button>

                      {isDeptDropdownOpen && (
                        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
                          <ScrollArea className="max-h-[200px]">
                            {departments.map((dept) => {
                              const isChecked = formData.departmentIds.includes(String(dept.id));
                              return (
                                <label
                                  key={dept.id}
                                  className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                                >
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={() => toggleDepartment(String(dept.id))}
                                  />
                                  {dept.name}
                                </label>
                              );
                            })}
                          </ScrollArea>
                        </div>
                      )}

                      {selectedDeptNames.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {formData.departmentIds.map((did) => {
                            const dept = departments.find((d) => String(d.id) === did);
                            if (!dept) return null;
                            return (
                              <Badge key={did} variant="secondary" className="gap-1 text-xs">
                                {dept.name}
                                <button
                                  type="button"
                                  onClick={() => toggleDepartment(did)}
                                  className="ml-0.5 rounded-full hover:bg-muted-foreground/20"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Direct Report Line */}
                  <div className="space-y-1.5">
                    <Label>Direct Report Line</Label>
                    <Select
                      value={formData.directReportId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, directReportId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select direct report" />
                      </SelectTrigger>
                      <SelectContent>
                        {directReportOptions.map((jt) => (
                          <SelectItem key={jt.id} value={String(jt.id)}>
                            {jt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Rich Text: General Job Purpose */}
              <div className="border-t border-dashed pt-6">
                <h2 className="text-base font-semibold uppercase tracking-wide mb-4">
                  General Job Purpose
                </h2>
                <LexicalEditor
                  value={formData.purpose}
                  onChange={(val) => setFormData((prev) => ({ ...prev, purpose: val }))}
                  placeholder="Describe the general purpose of this job..."
                />
              </div>

              {/* Rich Text: Job Description */}
              <div className="border-t border-dashed pt-6">
                <h2 className="text-base font-semibold uppercase tracking-wide mb-4">
                  Job Description
                </h2>
                <LexicalEditor
                  value={formData.description}
                  onChange={(val) => setFormData((prev) => ({ ...prev, description: val }))}
                  placeholder="Describe the job responsibilities..."
                />
              </div>

              {/* Rich Text: Job Requirements */}
              <div className="border-t border-dashed pt-6">
                <h2 className="text-base font-semibold uppercase tracking-wide mb-4">
                  Job Requirements
                </h2>
                <LexicalEditor
                  value={formData.requirement}
                  onChange={(val) => setFormData((prev) => ({ ...prev, requirement: val }))}
                  placeholder="Describe the job requirements..."
                />
              </div>

              {/* Action Buttons */}
              <div className="border-t border-dashed pt-6 flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/organization/job-titles/${id}`)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !isFormValid}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </>
  );
}
