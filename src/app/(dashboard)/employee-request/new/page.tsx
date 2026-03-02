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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import { jobTitleService } from "@/services/job-title.service";
import { departmentService } from "@/services/department.service";
import { employeeRequestService } from "@/services/employee-request.service";
import { showToast } from "@/lib/utils/toast-messages";
import {
  REQUEST_REASON_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  EDUCATION_LEVEL_OPTIONS,
  GENDER_PREFERENCE_OPTIONS,
} from "@/lib/constants/employeeRequest";
import type { JobTitle, Department } from "@/types";

// --- Schema ---

const employeeRequestSchema = z.object({
  jobTitleId: z.string().min(1, "Job title is required"),
  departmentId: z.string().min(1, "Department is required"),
  reason: z.string().min(1, "Reason is required"),
  purpose: z.string().min(10, "Purpose must be at least 10 characters"),
  quantity: z.coerce.number().min(1, "At least 1 position required"),
  employmentType: z.string().min(1, "Employment type is required"),
  education: z.string().min(1, "Education level is required"),
  experience: z.string().min(1, "Experience requirement is required"),
  skills: z.string().optional(),
  certification: z.string().optional(),
  genderPreference: z.string().min(1, "Gender preference is required"),
  ageMin: z.coerce.number().optional(),
  ageMax: z.coerce.number().optional(),
  jobPlacement: z.string().optional(),
  budgetMin: z.coerce.number().optional(),
  budgetMax: z.coerce.number().optional(),
  expectedOnboardDate: z.string().optional(),
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

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeRequestFormData>({
    resolver: zodResolver(employeeRequestSchema),
    defaultValues: {
      quantity: 1,
      genderPreference: "any",
    },
  });

  const watchedJobTitleId = watch("jobTitleId");
  const watchedDepartmentId = watch("departmentId");
  const watchedReason = watch("reason");
  const watchedEmploymentType = watch("employmentType");
  const watchedEducation = watch("education");
  const watchedGenderPreference = watch("genderPreference");

  // Fetch job titles and departments
  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        const [jobTitlesRes, departmentsRes] = await Promise.all([
          jobTitleService.getAll(1, 100),
          departmentService.getAll(1, 100),
        ]);

        if (jobTitlesRes.success && jobTitlesRes.data) {
          setJobTitles(jobTitlesRes.data.data);
        }
        if (departmentsRes.success && departmentsRes.data) {
          setDepartments(departmentsRes.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, []);

  // Handlers
  const onSubmit = async (data: EmployeeRequestFormData, status: "draft" | "created") => {
    try {
      const payload = {
        job_title_id: Number(data.jobTitleId),
        department_id: Number(data.departmentId),
        reason: data.reason,
        purpose: data.purpose,
        quantity: data.quantity,
        employment_type: data.employmentType,
        education: data.education,
        experience: data.experience,
        skills: data.skills || undefined,
        certification: data.certification || undefined,
        gender_preference: data.genderPreference,
        age_min: data.ageMin || undefined,
        age_max: data.ageMax || undefined,
        job_placement: data.jobPlacement || undefined,
        budget_min: data.budgetMin || undefined,
        budget_max: data.budgetMax || undefined,
        expected_onboard_date: data.expectedOnboardDate || undefined,
        job_description: data.jobDescription || undefined,
        job_requirement: data.jobRequirement || undefined,
        status,
      };

      const response = await employeeRequestService.create(payload);

      if (response.success) {
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
  const handleSubmitRequest = handleSubmit((data) => onSubmit(data, "created"));

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
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save as Draft
              </Button>
              <Button onClick={handleSubmitRequest} disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
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
                    <Select
                      value={watchedJobTitleId}
                      onValueChange={(value) => setValue("jobTitleId", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select job title" />
                      </SelectTrigger>
                      <SelectContent>
                        {jobTitles.map((jt) => (
                          <SelectItem key={jt.id} value={String(jt.id)}>
                            {jt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.jobTitleId && (
                      <p className="text-sm text-destructive">{errors.jobTitleId.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="departmentId">
                      Department <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={watchedDepartmentId}
                      onValueChange={(value) => setValue("departmentId", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={String(d.id)}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.departmentId && (
                      <p className="text-sm text-destructive">{errors.departmentId.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
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
                    <Label htmlFor="quantity">
                      Quantity <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      {...register("quantity")}
                    />
                    {errors.quantity && (
                      <p className="text-sm text-destructive">{errors.quantity.message}</p>
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
                    <Input
                      placeholder="e.g., 2-3 years"
                      {...register("experience")}
                    />
                    {errors.experience && (
                      <p className="text-sm text-destructive">{errors.experience.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="skills">Skills</Label>
                    <Textarea
                      placeholder="List required skills..."
                      rows={2}
                      {...register("skills")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="certification">Certification</Label>
                    <Textarea
                      placeholder="Required certifications (if any)..."
                      rows={2}
                      {...register("certification")}
                    />
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

            {/* Budget & Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Budget & Timeline</CardTitle>
                <CardDescription>
                  Set the budget range and expected timeline
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="budgetMin">Budget Min (IDR)</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 8000000"
                      {...register("budgetMin")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budgetMax">Budget Max (IDR)</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 12000000"
                      {...register("budgetMax")}
                    />
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
                  <Input
                    placeholder="e.g., Jakarta Office, Remote, etc."
                    {...register("jobPlacement")}
                  />
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
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="jobDescription">Job Description</Label>
                  <Textarea
                    placeholder="Describe the role, responsibilities, and day-to-day activities..."
                    rows={5}
                    {...register("jobDescription")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobRequirement">Additional Requirements</Label>
                  <Textarea
                    placeholder="Any additional requirements or nice-to-haves..."
                    rows={3}
                    {...register("jobRequirement")}
                  />
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </PageContainer>
    </>
  );
}
