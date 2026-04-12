"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ChevronLeft,
  Loader2,
  Save,
  Send,
  AlertTriangle,
  Info,
  Briefcase,
  UserCheck,
  CalendarClock,
  FileText,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LexicalEditor } from "@/components/shared/lexical-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { jobTitleService } from "@/services/job-title.service";
import { departmentService } from "@/services/department.service";
import { employeeRequestService } from "@/services/employee-request.service";
import { employeeBudgetService } from "@/services/employee-budget.service";
import { showToast } from "@/lib/utils/toast-messages";
import {
  REQUEST_REASON_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  EDUCATION_LEVEL_OPTIONS,
  GENDER_PREFERENCE_OPTIONS,
  WORK_LOCATION_OPTIONS,
} from "@/lib/constants/employeeRequest";
import { ROLES } from "@/lib/constants/roles";
import { useAuthStore } from "@/stores/auth-store";
import type { JobTitle, Department, RestBudgetData } from "@/types";

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

// --- Schema ---

const employeeRequestSchema = z.object({
  jobTitleId: z.string().min(1, "Job title is required"),
  departmentId: z.string().min(1, "Department is required"),
  reason: z.string().min(1, "Reason is required"),
  purpose: z.string().min(10, "Purpose must be at least 10 characters"),
  employmentType: z.string().min(1, "Employment type is required"),
  education: z.string().min(1, "Education level is required"),
  experience: z.coerce.number().min(0, "Experience is required"),
  genderPreference: z.string().min(1, "Gender preference is required"),
  ageMin: z.coerce.number().optional(),
  ageMax: z.coerce.number().optional(),
  jobPlacement: z.string().optional(),
  headcount: z.coerce.number().min(1, "At least 1 headcount required"),
  expectedOnboardDate: z.string().optional(),
  generalJobPurpose: z.string().optional(),
  jobDescription: z.string().optional(),
  jobRequirement: z.string().optional(),
});

type EmployeeRequestFormData = z.infer<typeof employeeRequestSchema>;

export default function EditEmployeeRequestPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user } = useAuthStore();
  const userRoleId = user?.roleId ?? 0;

  // State
  const [jobTitles, setJobTitles] = React.useState<JobTitle[]>([]);
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(true);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = React.useState(false);
  const [submitComment, setSubmitComment] = React.useState("");
  const [pendingFormData, setPendingFormData] = React.useState<EmployeeRequestFormData | null>(null);
  const [restBudget, setRestBudget] = React.useState<RestBudgetData | null>(null);
  const [isLoadingBudget, setIsLoadingBudget] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeRequestFormData>({
    resolver: zodResolver(employeeRequestSchema),
  });

  const watchedJobTitleId = watch("jobTitleId");
  const watchedDepartmentId = watch("departmentId");
  const watchedReason = watch("reason");
  const watchedEmploymentType = watch("employmentType");
  const watchedEducation = watch("education");
  const watchedGenderPreference = watch("genderPreference");
  const watchedJobPlacement = watch("jobPlacement");
  const watchedGeneralJobPurpose = watch("generalJobPurpose");
  const watchedJobDescription = watch("jobDescription");
  const watchedJobRequirement = watch("jobRequirement");

  // Fetch existing data + reference data
  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        const [requestRes, jobTitlesRes, departmentsRes] = await Promise.all([
          employeeRequestService.getById(id),
          jobTitleService.fetchAll(),
          departmentService.fetchAll(),
        ]);

        if (jobTitlesRes.success && jobTitlesRes.data) {
          setJobTitles(jobTitlesRes.data);
        }
        if (departmentsRes.success && departmentsRes.data) {
          setDepartments(departmentsRes.data);
        }

        if (requestRes.success && requestRes.data) {
          const req = requestRes.data;

          // Only allow editing draft or revise status
          if (!["draft", "revise"].includes(req.status)) {
            showToast.error("This request cannot be edited in its current status");
            router.push(`/employee-request/${id}`);
            return;
          }

          // Only owner or admin can edit
          if (req.requestedById !== Number(user?.id) && userRoleId !== ROLES.SUPER_ADMIN) {
            showToast.error("You don't have permission to edit this request");
            router.push(`/employee-request/${id}`);
            return;
          }

          // Parse experience number from string like "2" or "2 years"
          const experienceNum = parseInt(req.experience) || 0;

          reset({
            jobTitleId: req.jobTitle ? String(req.jobTitle.id) : "",
            departmentId: req.department ? String(req.department.id) : "",
            reason: req.reason || "",
            purpose: req.purpose || "",
            employmentType: req.employmentType || "",
            education: req.education || "",
            experience: experienceNum,
            genderPreference: req.genderPreference || "any",
            ageMin: req.ageMin || undefined,
            ageMax: req.ageMax || undefined,
            jobPlacement: req.jobPlacement || "",
            headcount: req.headcount || 1,
            expectedOnboardDate: req.expectedOnboardDate
              ? req.expectedOnboardDate.split("T")[0]
              : "",
            generalJobPurpose: req.generalJobPurpose || "",
            jobDescription: req.jobDescription || "",
            jobRequirement: req.jobRequirement || "",
          });
        } else {
          showToast.error("Employee request not found");
          router.push("/employee-request");
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        showToast.error("Failed to load data");
        router.push("/employee-request");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [id, user?.id, userRoleId, router, reset]);

  const isManager = userRoleId === ROLES.MANAGER;

  // Derive job title category from selected job title
  const selectedJobTitle = jobTitles.find(
    (jt) => String(jt.id) === watchedJobTitleId
  );
  const jobTitleCategory = selectedJobTitle?.type as "Technical" | "Administration" | undefined;
  const budgetCategory = jobTitleCategory === "Technical" ? "technical" : jobTitleCategory === "Administration" ? "admin" : null;
  const availableBudget = restBudget && budgetCategory ? restBudget.rest[budgetCategory] : null;

  // Fetch rest budget when department changes
  React.useEffect(() => {
    if (!watchedDepartmentId) {
      setRestBudget(null);
      return;
    }

    const controller = new AbortController();
    const fetchBudget = async () => {
      setIsLoadingBudget(true);
      try {
        const res = await employeeBudgetService.getRestBudget(Number(watchedDepartmentId));
        if (!controller.signal.aborted && res.success && res.data) {
          setRestBudget(res.data);
        }
      } catch {
        if (!controller.signal.aborted) {
          setRestBudget(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingBudget(false);
        }
      }
    };

    fetchBudget();
    return () => controller.abort();
  }, [watchedDepartmentId]);

  // Handlers
  const onSave = async (data: EmployeeRequestFormData) => {
    try {
      const payload = {
        job_title_id: Number(data.jobTitleId),
        department_id: Number(data.departmentId),
        purpose: data.reason,
        reason: data.purpose,
        quantity: data.headcount,
        employment_type: data.employmentType,
        education: data.education,
        experience: String(data.experience),
        gender_preference: data.genderPreference,
        age_min: data.ageMin || undefined,
        age_max: data.ageMax || undefined,
        job_placement: data.jobPlacement || undefined,
        headcount: data.headcount,
        expected_onboard_date: data.expectedOnboardDate || undefined,
        general_job_purpose: data.generalJobPurpose || undefined,
        job_description: data.jobDescription || undefined,
        job_requirement: data.jobRequirement || undefined,
      };

      const response = await employeeRequestService.update(id, payload);

      if (response.success) {
        showToast.success("Request updated successfully");
        router.push(`/employee-request/${id}`);
      } else {
        showToast.error(response.message || "Failed to update employee request");
      }
    } catch (error) {
      console.error("Failed to update employee request:", error);
      showToast.error("Failed to update employee request");
    }
  };

  const onResubmit = async (data: EmployeeRequestFormData, comment?: string) => {
    try {
      const payload = {
        job_title_id: Number(data.jobTitleId),
        department_id: Number(data.departmentId),
        purpose: data.reason,
        reason: data.purpose,
        quantity: data.headcount,
        employment_type: data.employmentType,
        education: data.education,
        experience: String(data.experience),
        gender_preference: data.genderPreference,
        age_min: data.ageMin || undefined,
        age_max: data.ageMax || undefined,
        job_placement: data.jobPlacement || undefined,
        headcount: data.headcount,
        expected_onboard_date: data.expectedOnboardDate || undefined,
        general_job_purpose: data.generalJobPurpose || undefined,
        job_description: data.jobDescription || undefined,
        job_requirement: data.jobRequirement || undefined,
      };

      // Update first
      const updateRes = await employeeRequestService.update(id, payload);
      if (!updateRes.success) {
        showToast.error(updateRes.message || "Failed to update employee request");
        return;
      }

      // Then change status to created (resubmit)
      const statusRes = await employeeRequestService.updateStatus(id, {
        status: "created",
        comment: comment || undefined,
      });

      if (statusRes.success) {
        showToast.success("Request updated and resubmitted for review");
        router.push(`/employee-request/${id}`);
      } else {
        showToast.error(statusRes.message || "Failed to resubmit");
      }
    } catch (error) {
      console.error("Failed to resubmit:", error);
      showToast.error("Failed to resubmit employee request");
    }
  };

  const handleSave = handleSubmit((data) => onSave(data));

  const handleOpenResubmitDialog = handleSubmit((data) => {
    if (!jobTitleCategory) {
      showToast.error("Job title does not have a category (Technical/Administration). Please update the job title first.");
      return;
    }
    if (availableBudget !== null && availableBudget <= 0) {
      showToast.error("Insufficient budget for this department.");
      return;
    }
    setPendingFormData(data);
    setSubmitComment("");
    setIsSubmitDialogOpen(true);
  });

  const handleConfirmResubmit = async () => {
    if (!pendingFormData) return;
    setIsSubmitDialogOpen(false);
    await onResubmit(pendingFormData, submitComment);
    setPendingFormData(null);
    setSubmitComment("");
  };

  if (isLoadingData) {
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
    <>
      <Header />
      <PageContainer>
        <div className="space-y-5">
          {/* Top Bar -- back link + title + actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Link
                href={`/employee-request/${id}`}
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
                Employee Request
              </Link>
              <h1
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  color: "var(--hsd-ui-color-gray-900)",
                  margin: "8px 0 0",
                }}
              >
                Edit Employee Request
              </h1>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={isSubmitting}
                style={btnSecondary}
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                ) : (
                  <Save style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                )}
                Save
              </Button>
              <Button
                onClick={handleOpenResubmitDialog}
                disabled={isSubmitting}
                style={btnPrimary}
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                ) : (
                  <Send style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                )}
                Save & Resubmit
              </Button>
            </div>
          </div>

          {/* Position Details */}
          <SectionCard title="Position Details" icon={Briefcase}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {/* Job Title */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label style={labelStyle}>Job Title *</Label>
                <SearchableSelect
                  options={jobTitles.map((jt) => ({
                    value: String(jt.id),
                    label: jt.name,
                  }))}
                  value={watchedJobTitleId}
                  onValueChange={(value) => setValue("jobTitleId", value)}
                  placeholder="Select job title"
                  searchPlaceholder="Search job title..."
                  emptyText="No job title found."
                />
                {errors.jobTitleId && (
                  <p style={{ fontSize: "0.75rem", color: "var(--destructive)", margin: 0 }}>{errors.jobTitleId.message}</p>
                )}
              </div>

              {/* Department */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label style={labelStyle}>Department *</Label>
                <SearchableSelect
                  options={departments.map((d) => ({
                    value: String(d.id),
                    label: d.name,
                  }))}
                  value={watchedDepartmentId}
                  onValueChange={(value) => setValue("departmentId", value)}
                  placeholder="Select department"
                  searchPlaceholder="Search department..."
                  emptyText="No department found."
                  disabled={isManager}
                />
                {errors.departmentId && (
                  <p style={{ fontSize: "0.75rem", color: "var(--destructive)", margin: 0 }}>{errors.departmentId.message}</p>
                )}
              </div>
            </div>

            {/* Budget Info Card */}
            {watchedDepartmentId && watchedJobTitleId && (
              <div
                style={{ marginTop: "20px" }}
                className={`rounded-lg border p-4 ${
                  !jobTitleCategory
                    ? "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950"
                    : availableBudget !== null && availableBudget <= 0
                      ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
                      : "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950"
                }`}
              >
                {isLoadingBudget ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading budget info...
                  </div>
                ) : !jobTitleCategory ? (
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Job title has no category
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                        This job title does not have a category (Technical/Administration). Please update the job title first before submitting.
                      </p>
                    </div>
                  </div>
                ) : restBudget ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {availableBudget !== null && availableBudget <= 0 ? (
                        <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                      ) : (
                        <Info className="h-5 w-5 text-blue-600 shrink-0" />
                      )}
                      <p className="text-sm font-medium">
                        Budget Info — {jobTitleCategory}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Budget</p>
                        <p className="text-lg font-semibold">{restBudget.budget[budgetCategory!]}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Active</p>
                        <p className="text-lg font-semibold">{restBudget.activeEmployees[budgetCategory!]}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Pending</p>
                        <p className="text-lg font-semibold">{restBudget.pendingRequests[budgetCategory!]}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Available</p>
                        <p className={`text-lg font-semibold ${
                          availableBudget !== null && availableBudget <= 0
                            ? "text-red-600"
                            : "text-green-600"
                        }`}>
                          {availableBudget}
                        </p>
                      </div>
                    </div>
                    {availableBudget !== null && availableBudget <= 0 && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        Insufficient budget. You cannot submit this request until more budget is available.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Info className="h-4 w-4" />
                    No budget allocated for this department in the current year.
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px" }}>
              {/* Reason */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label style={labelStyle}>Reason *</Label>
                <Select
                  value={watchedReason}
                  onValueChange={(value) => setValue("reason", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {REQUEST_REASON_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.reason && (
                  <p style={{ fontSize: "0.75rem", color: "var(--destructive)", margin: 0 }}>{errors.reason.message}</p>
                )}
              </div>

              {/* Employment Type */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label style={labelStyle}>Employment Type *</Label>
                <Select
                  value={watchedEmploymentType}
                  onValueChange={(value) => setValue("employmentType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.employmentType && (
                  <p style={{ fontSize: "0.75rem", color: "var(--destructive)", margin: 0 }}>{errors.employmentType.message}</p>
                )}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "20px" }}>
              <Label style={labelStyle}>Purpose / Justification *</Label>
              <Textarea
                placeholder="Explain why this position is needed..."
                rows={3}
                {...register("purpose")}
              />
              {errors.purpose && (
                <p style={{ fontSize: "0.75rem", color: "var(--destructive)", margin: 0 }}>{errors.purpose.message}</p>
              )}
            </div>
          </SectionCard>

          {/* Requirements */}
          <SectionCard title="Requirements" icon={UserCheck}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {/* Education Level */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label style={labelStyle}>Education Level *</Label>
                <Select
                  value={watchedEducation}
                  onValueChange={(value) => setValue("education", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select education" />
                  </SelectTrigger>
                  <SelectContent>
                    {EDUCATION_LEVEL_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.education && (
                  <p style={{ fontSize: "0.75rem", color: "var(--destructive)", margin: 0 }}>{errors.education.message}</p>
                )}
              </div>

              {/* Experience */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label style={labelStyle}>Experience *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    placeholder="e.g., 2"
                    className="w-24"
                    {...register("experience")}
                  />
                  <span style={{ fontSize: "0.875rem", color: "var(--hsd-ui-color-gray-500)" }}>years</span>
                </div>
                {errors.experience && (
                  <p style={{ fontSize: "0.75rem", color: "var(--destructive)", margin: 0 }}>{errors.experience.message}</p>
                )}
              </div>
            </div>

            <div
              style={{
                borderTop: "1px solid rgba(120, 134, 127, 0.15)",
                marginTop: "20px",
                paddingTop: "20px",
              }}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
              {/* Gender Preference */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label style={labelStyle}>Gender Preference *</Label>
                <Select
                  value={watchedGenderPreference}
                  onValueChange={(value) => setValue("genderPreference", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select preference" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDER_PREFERENCE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Age Min */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label style={labelStyle}>Age Min</Label>
                <Input
                  type="number"
                  min={18}
                  max={60}
                  placeholder="e.g., 22"
                  {...register("ageMin")}
                />
              </div>

              {/* Age Max */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label style={labelStyle}>Age Max</Label>
                <Input
                  type="number"
                  min={18}
                  max={60}
                  placeholder="e.g., 35"
                  {...register("ageMax")}
                />
              </div>
            </div>
          </SectionCard>

          {/* Headcount & Timeline */}
          <SectionCard title="Headcount & Timeline" icon={CalendarClock}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {/* Headcount */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label style={labelStyle}>Headcount *</Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="e.g., 5"
                  {...register("headcount")}
                />
                {errors.headcount && (
                  <p style={{ fontSize: "0.75rem", color: "var(--destructive)", margin: 0 }}>{errors.headcount.message}</p>
                )}
              </div>

              {/* Expected Onboard Date */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label style={labelStyle}>Expected Onboard Date</Label>
                <Input
                  type="date"
                  {...register("expectedOnboardDate")}
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "20px" }}>
              <Label style={labelStyle}>Work Location / Placement</Label>
              <Select
                value={watchedJobPlacement}
                onValueChange={(value) => setValue("jobPlacement", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {WORK_LOCATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </SectionCard>

          {/* Job Description */}
          <SectionCard title="Job Description" icon={FileText}>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label style={labelStyle}>General Job Purpose</Label>
                <LexicalEditor
                  value={watchedGeneralJobPurpose}
                  onChange={(val) => setValue("generalJobPurpose", val)}
                  placeholder="Describe the general purpose of this position..."
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label style={labelStyle}>Job Description</Label>
                <LexicalEditor
                  value={watchedJobDescription}
                  onChange={(val) => setValue("jobDescription", val)}
                  placeholder="Describe the role, responsibilities, and day-to-day activities..."
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label style={labelStyle}>Job Requirement</Label>
                <LexicalEditor
                  value={watchedJobRequirement}
                  onChange={(val) => setValue("jobRequirement", val)}
                  placeholder="List the requirements, qualifications, and skills needed..."
                />
              </div>
            </div>
          </SectionCard>

          {/* Action Buttons (bottom) */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
            <Button
              variant="outline"
              onClick={() => router.push(`/employee-request/${id}`)}
              disabled={isSubmitting}
              style={btnSecondary}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={isSubmitting}
              style={btnSecondary}
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" style={{ width: "16px", height: "16px", marginRight: "6px" }} />
              ) : (
                <Save style={{ width: "16px", height: "16px", marginRight: "6px" }} />
              )}
              Save
            </Button>
            <Button
              onClick={handleOpenResubmitDialog}
              disabled={isSubmitting}
              style={btnPrimary}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                  Submitting...
                </>
              ) : (
                <>
                  <Send style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                  Save & Resubmit
                </>
              )}
            </Button>
          </div>
        </div>
      </PageContainer>

      {/* Resubmit Confirmation Dialog */}
      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Resubmit Employee Request</DialogTitle>
            <DialogDescription>
              This will save your changes and resubmit the request for HOD review.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <Label style={labelStyle}>Comment</Label>
              <Textarea
                id="submitComment"
                placeholder="Describe what was changed..."
                rows={4}
                value={submitComment}
                onChange={(e) => setSubmitComment(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSubmitDialogOpen(false)}
              style={btnSecondary}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmResubmit} disabled={isSubmitting} style={btnPrimary}>
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                  Submitting...
                </>
              ) : (
                <>
                  <Send style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                  Save & Resubmit
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
