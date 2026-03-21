"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
import { jobTitleService, CreateJobTitleRequest } from "@/services/job-title.service";
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

export default function JobTitleNewPage() {
  const router = useRouter();

  const [jobLevels, setJobLevels] = React.useState<JobLevel[]>([]);
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [divisions, setDivisions] = React.useState<Division[]>([]);
  const [allJobTitles, setAllJobTitles] = React.useState<JobTitle[]>([]);

  const [formData, setFormData] = React.useState<FormData>(initialFormData);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  // Department multi-select dropdown
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = React.useState(false);
  const [deptSearchQuery, setDeptSearchQuery] = React.useState("");
  const deptDropdownRef = React.useRef<HTMLDivElement>(null);

  // Direct report searchable dropdown
  const [isDirectReportOpen, setIsDirectReportOpen] = React.useState(false);
  const [directReportSearch, setDirectReportSearch] = React.useState("");
  const directReportRef = React.useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(event.target as Node)) {
        setIsDeptDropdownOpen(false);
        setDeptSearchQuery("");
      }
      if (directReportRef.current && !directReportRef.current.contains(event.target as Node)) {
        setIsDirectReportOpen(false);
        setDirectReportSearch("");
      }
    }
    if (isDeptDropdownOpen || isDirectReportOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isDeptDropdownOpen, isDirectReportOpen]);

  // Fetch reference data on mount
  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      const [levelsRes, deptsRes, divsRes, titlesRes] = await Promise.all([
        jobLevelService.fetchAll(),
        departmentService.fetchAll(),
        divisionService.fetchAll(),
        jobTitleService.fetchAll(),
      ]);

      if (levelsRes.success && levelsRes.data) setJobLevels(levelsRes.data);
      if (deptsRes.success && deptsRes.data) setDepartments(deptsRes.data);
      if (divsRes.success && divsRes.data) setDivisions(divsRes.data);
      if (titlesRes.success && titlesRes.data) setAllJobTitles(titlesRes.data);

      setIsLoading(false);
    };

    fetchData();
  }, []);

  const handleCreate = async () => {
    setIsSaving(true);

    const data: CreateJobTitleRequest = {
      name: formData.name,
      job_level_id: Number(formData.jobLevelId),
      type: formData.type === "Administration" || formData.type === "Technical" ? formData.type : undefined,
      division_id: formData.divisionId ? Number(formData.divisionId) : undefined,
      direct_report_id: formData.directReportId ? Number(formData.directReportId) : undefined,
      purpose: formData.purpose || undefined,
      description: formData.description || undefined,
      requirement: formData.requirement || undefined,
      department_sync: formData.departmentIds.map(Number),
    };

    const response = await jobTitleService.create(data);

    if (response.success && response.data) {
      showToast.created("Job Title");
      router.push(`/organization/job-titles/${response.data.id}`);
    } else {
      showToast.createError("job title", response.message);
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
        <Header title="Position" />
        <PageContainer>
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </PageContainer>
      </>
    );
  }

  const selectedDeptNames = formData.departmentIds
    .map((did) => departments.find((d) => String(d.id) === did)?.name)
    .filter(Boolean);

  const isFormValid = formData.name && formData.jobLevelId && formData.type && formData.departmentIds.length > 0;

  return (
    <>
      <Header title="Position" />
      <PageContainer>
        <div className="space-y-4">
          {/* Top Bar: Back */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/organization/job-titles")}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Job Titles
            </button>
          </div>

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
                        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                          <div className="p-2 border-b">
                            <Input
                              placeholder="Search departments..."
                              value={deptSearchQuery}
                              onChange={(e) => setDeptSearchQuery(e.target.value)}
                              className="h-8"
                              autoFocus
                            />
                          </div>
                          <ScrollArea className="max-h-[200px] p-1">
                            {departments
                              .filter((dept) =>
                                dept.name.toLowerCase().includes(deptSearchQuery.toLowerCase())
                              )
                              .map((dept) => {
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
                            {departments.filter((dept) =>
                              dept.name.toLowerCase().includes(deptSearchQuery.toLowerCase())
                            ).length === 0 && (
                              <p className="px-2 py-3 text-sm text-center text-muted-foreground">
                                No departments found
                              </p>
                            )}
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
                    <div className="relative" ref={directReportRef}>
                      <button
                        type="button"
                        onClick={() => setIsDirectReportOpen(!isDirectReportOpen)}
                        className="flex w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <span className={!formData.directReportId ? "text-muted-foreground" : ""}>
                          {formData.directReportId
                            ? allJobTitles.find((jt) => String(jt.id) === formData.directReportId)?.name || "Select direct report"
                            : "Select direct report"}
                        </span>
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                      </button>

                      {isDirectReportOpen && (
                        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                          <div className="p-2 border-b">
                            <Input
                              placeholder="Search job titles..."
                              value={directReportSearch}
                              onChange={(e) => setDirectReportSearch(e.target.value)}
                              className="h-8"
                              autoFocus
                            />
                          </div>
                          <ScrollArea className="max-h-[200px] p-1">
                            {formData.directReportId && (
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, directReportId: "" });
                                  setIsDirectReportOpen(false);
                                  setDirectReportSearch("");
                                }}
                                className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent"
                              >
                                Clear selection
                              </button>
                            )}
                            {allJobTitles
                              .filter((jt) =>
                                jt.name.toLowerCase().includes(directReportSearch.toLowerCase())
                              )
                              .map((jt) => (
                                <button
                                  key={jt.id}
                                  type="button"
                                  onClick={() => {
                                    setFormData({ ...formData, directReportId: String(jt.id) });
                                    setIsDirectReportOpen(false);
                                    setDirectReportSearch("");
                                  }}
                                  className={`flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent ${
                                    formData.directReportId === String(jt.id) ? "bg-accent text-accent-foreground" : ""
                                  }`}
                                >
                                  {jt.name}
                                </button>
                              ))}
                            {allJobTitles.filter((jt) =>
                              jt.name.toLowerCase().includes(directReportSearch.toLowerCase())
                            ).length === 0 && (
                              <p className="px-2 py-3 text-sm text-center text-muted-foreground">
                                No job titles found
                              </p>
                            )}
                          </ScrollArea>
                        </div>
                      )}
                    </div>
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
                  onClick={() => router.push("/organization/job-titles")}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={isSaving || !isFormValid}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Job Title"
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
