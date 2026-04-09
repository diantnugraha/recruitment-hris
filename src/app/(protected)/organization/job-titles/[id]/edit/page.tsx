"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Loader2,
  ChevronsUpDown,
  X,
  Info,
  FileText,
  ClipboardList,
  CheckSquare,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

/* TUV button style helpers */
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

  // Error state (no data loaded)
  if (!jobTitle) {
    return (
      <>
        <Header />
        <PageContainer>
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--hsd-ui-color-gray-500)" }}>
            <p style={{ fontSize: "0.875rem", margin: "0 0 12px" }}>{error || "Job title not found"}</p>
            <Button variant="outline" onClick={fetchData} style={btnSecondary}>
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
      <Header />
      <PageContainer>
        <div className="space-y-5">
          {/* Top Bar — back link + title */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                href={`/organization/job-titles/${id}`}
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
                Position: Job Title Detail
              </Link>
              <h1
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  color: "var(--hsd-ui-color-gray-900)",
                  margin: "8px 0 0",
                }}
              >
                Edit Job Title
              </h1>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div
              className="flex items-center gap-2 rounded-lg p-3"
              style={{
                backgroundColor: "rgba(250, 55, 70, 0.08)",
                fontSize: "0.875rem",
                color: "rgba(250, 55, 70, 1)",
              }}
            >
              <span>{error}</span>
              <Button
                variant="ghost"
                className="ml-auto h-6 px-2 text-xs"
                onClick={() => setError(null)}
              >
                Dismiss
              </Button>
            </div>
          )}

          {/* General Information Section */}
          <SectionCard title="General Information" icon={Info}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {/* Name */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label style={labelStyle}>Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter job title name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Job Level */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label style={labelStyle}>Job Level *</Label>
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
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label style={labelStyle}>Type *</Label>
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
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label style={labelStyle}>Division</Label>
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
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label style={labelStyle}>Departments *</Label>
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
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label style={labelStyle}>Direct Report Line</Label>
                <div className="relative" ref={directReportRef}>
                  <button
                    type="button"
                    onClick={() => setIsDirectReportOpen(!isDirectReportOpen)}
                    className="flex w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <span className={!formData.directReportId ? "text-muted-foreground" : ""}>
                      {formData.directReportId
                        ? directReportOptions.find((jt) => String(jt.id) === formData.directReportId)?.name || "Select direct report"
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
                        {directReportOptions
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
                        {directReportOptions.filter((jt) =>
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
          </SectionCard>

          {/* Rich Text: General Job Purpose */}
          <SectionCard title="General Job Purpose" icon={FileText}>
            <LexicalEditor
              value={formData.purpose}
              onChange={(val) => setFormData((prev) => ({ ...prev, purpose: val }))}
              placeholder="Describe the general purpose of this job..."
            />
          </SectionCard>

          {/* Rich Text: Job Description */}
          <SectionCard title="Job Description" icon={ClipboardList}>
            <LexicalEditor
              value={formData.description}
              onChange={(val) => setFormData((prev) => ({ ...prev, description: val }))}
              placeholder="Describe the job responsibilities..."
            />
          </SectionCard>

          {/* Rich Text: Job Requirements */}
          <SectionCard title="Job Requirements" icon={CheckSquare}>
            <LexicalEditor
              value={formData.requirement}
              onChange={(val) => setFormData((prev) => ({ ...prev, requirement: val }))}
              placeholder="Describe the job requirements..."
            />
          </SectionCard>

          {/* Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
            <Button
              variant="outline"
              onClick={() => router.push(`/organization/job-titles/${id}`)}
              disabled={isSaving}
              style={btnSecondary}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !isFormValid}
              style={btnPrimary}
            >
              {isSaving ? (
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
    </>
  );
}
