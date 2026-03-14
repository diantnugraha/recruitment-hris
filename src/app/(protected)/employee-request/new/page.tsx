"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Save, Send } from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
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
import { showToast } from "@/lib/utils/toast-messages";
import {
  REQUEST_REASON_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  EDUCATION_LEVEL_OPTIONS,
  GENDER_PREFERENCE_OPTIONS,
  WORK_LOCATION_OPTIONS,
} from "@/lib/constants/employeeRequest";
import type { JobTitle, Department } from "@/types";

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

export default function NewEmployeeRequestPage() {
  const router = useRouter();

  // State
  const [jobTitles, setJobTitles] = React.useState<JobTitle[]>([]);
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(true);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = React.useState(false);
  const [submitComment, setSubmitComment] = React.useState("");
  const [pendingFormData, setPendingFormData] = React.useState<EmployeeRequestFormData | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeRequestFormData>({
    resolver: zodResolver(employeeRequestSchema),
    defaultValues: {
      headcount: 1,
      genderPreference: "any",
    },
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

  // Fetch all job titles and departments (no pagination limit)
  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        const [jobTitlesRes, departmentsRes] = await Promise.all([
          jobTitleService.fetchAll(),
          departmentService.fetchAll(),
        ]);

        if (jobTitlesRes.success && jobTitlesRes.data) {
          setJobTitles(jobTitlesRes.data);
        }
        if (departmentsRes.success && departmentsRes.data) {
          setDepartments(departmentsRes.data);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, []);

  // Auto-populate department when job title is selected
  React.useEffect(() => {
    if (!watchedJobTitleId) return;

    const selectedJobTitle = jobTitles.find(
      (jt) => String(jt.id) === watchedJobTitleId
    );

    if (selectedJobTitle?.departments && selectedJobTitle.departments.length > 0) {
      const firstDepartment = selectedJobTitle.departments[0].department;
      if (firstDepartment?.id) {
        setValue("departmentId", String(firstDepartment.id));
      }
    }
  }, [watchedJobTitleId, jobTitles, setValue]);

  // Handlers
  const onSubmit = async (data: EmployeeRequestFormData, status: "draft" | "created", comment?: string) => {
    try {
      const payload = {
        job_title_id: Number(data.jobTitleId),
        department_id: Number(data.departmentId),
        // DB purpose = dropdown (new/replacement), DB reason = free text justification
        purpose: data.reason,    // FE "Reason" dropdown → DB purpose
        reason: data.purpose,    // FE "Purpose/Justification" textarea → DB reason
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
        status,
      };

      const response = await employeeRequestService.create(payload);

      if (response.success && response.data) {
        // Add comment if provided
        if (comment && comment.trim()) {
          await employeeRequestService.addComment(response.data.id, comment.trim());
        }

        showToast.success(
          status === "draft"
            ? "Request saved as draft"
            : "Request submitted successfully"
        );
        router.push("/employee-request");
      } else {
        showToast.error(response.message || "Failed to create employee request");
      }
    } catch (error) {
      console.error("Failed to create employee request:", error);
      showToast.error("Failed to create employee request");
    }
  };

  const handleSaveDraft = handleSubmit((data) => onSubmit(data, "draft"));

  // Open dialog for submit with comment
  const handleOpenSubmitDialog = handleSubmit((data) => {
    setPendingFormData(data);
    setSubmitComment("");
    setIsSubmitDialogOpen(true);
  });

  // Confirm submit with comment
  const handleConfirmSubmit = async () => {
    if (!pendingFormData) return;
    setIsSubmitDialogOpen(false);
    await onSubmit(pendingFormData, "created", submitComment);
    setPendingFormData(null);
    setSubmitComment("");
  };

  if (isLoadingData) {
    return (
      <>
        <Header title="New Employee Request" />
        <PageContainer>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Header title="New Employee Request" />
      <PageContainer>
        <div className="space-y-6">
          {/* Back button */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => router.push("/employee-request")}>
              <ArrowLeft />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Save />
                )}
                Save as Draft
              </Button>
              <Button onClick={handleOpenSubmitDialog} disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Send />
                )}
                Submit Request
              </Button>
            </div>
          </div>

          <form className="space-y-6">
            {/* Position Details */}
            <Card>
              <CardHeader>
                <CardTitle>Position Details</CardTitle>
                <CardDescription>
                  Specify the position and department for this request
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="jobTitleId">
                      Job Title <span className="text-destructive">*</span>
                    </Label>
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
                      <p className="text-sm text-destructive">{errors.jobTitleId.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="departmentId">
                      Department <span className="text-destructive">*</span>
                    </Label>
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
                    />
                    {errors.departmentId && (
                      <p className="text-sm text-destructive">{errors.departmentId.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="reason">
                      Reason <span className="text-destructive">*</span>
                    </Label>
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
                      <p className="text-sm text-destructive">{errors.reason.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="employmentType">
                      Employment Type <span className="text-destructive">*</span>
                    </Label>
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
                      <p className="text-sm text-destructive">{errors.employmentType.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose">
                    Purpose / Justification <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    placeholder="Explain why this position is needed..."
                    rows={3}
                    {...register("purpose")}
                  />
                  {errors.purpose && (
                    <p className="text-sm text-destructive">{errors.purpose.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
                <CardDescription>
                  Define the qualifications and requirements for candidates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="education">
                      Education Level <span className="text-destructive">*</span>
                    </Label>
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
                      <p className="text-sm text-destructive">{errors.education.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience">
                      Experience <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        placeholder="e.g., 2"
                        className="w-24"
                        {...register("experience")}
                      />
                      <span className="text-sm text-muted-foreground">years</span>
                    </div>
                    {errors.experience && (
                      <p className="text-sm text-destructive">{errors.experience.message}</p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="genderPreference">
                      Gender Preference <span className="text-destructive">*</span>
                    </Label>
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

                  <div className="space-y-2">
                    <Label htmlFor="ageMin">Age Min</Label>
                    <Input
                      type="number"
                      min={18}
                      max={60}
                      placeholder="e.g., 22"
                      {...register("ageMin")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ageMax">Age Max</Label>
                    <Input
                      type="number"
                      min={18}
                      max={60}
                      placeholder="e.g., 35"
                      {...register("ageMax")}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Headcount & Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Headcount & Timeline</CardTitle>
                <CardDescription>
                  Set the headcount and expected timeline
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="headcount">
                      Headcount <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      placeholder="e.g., 5"
                      {...register("headcount")}
                    />
                    {errors.headcount && (
                      <p className="text-sm text-destructive">{errors.headcount.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expectedOnboardDate">Expected Onboard Date</Label>
                    <Input
                      type="date"
                      {...register("expectedOnboardDate")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobPlacement">Work Location / Placement</Label>
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
              </CardContent>
            </Card>

            {/* Job Description */}
            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
                <CardDescription>
                  Provide detailed job description and requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>General Job Purpose</Label>
                  <LexicalEditor
                    value={watchedGeneralJobPurpose}
                    onChange={(val) => setValue("generalJobPurpose", val)}
                    placeholder="Describe the general purpose of this position..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Job Description</Label>
                  <LexicalEditor
                    value={watchedJobDescription}
                    onChange={(val) => setValue("jobDescription", val)}
                    placeholder="Describe the role, responsibilities, and day-to-day activities..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Job Requirement</Label>
                  <LexicalEditor
                    value={watchedJobRequirement}
                    onChange={(val) => setValue("jobRequirement", val)}
                    placeholder="List the requirements, qualifications, and skills needed..."
                  />
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </PageContainer>

      {/* Submit Confirmation Dialog */}
      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Submit Employee Request</DialogTitle>
            <DialogDescription>
              Add a comment to describe your request. This will be recorded in the activity history.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="submitComment">Comment</Label>
              <Textarea
                id="submitComment"
                placeholder="Enter your comment here..."
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
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Send />
              )}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
