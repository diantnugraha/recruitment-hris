"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Trash2,
  Loader2,
  Briefcase,
  ClipboardList,
  CheckCircle2,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { jobTitleService } from "@/services/job-title.service";
import { jobLevelService } from "@/services/job-level.service";
import { departmentService } from "@/services/department.service";
import { JobTitle, JobLevel, Department } from "@/types";
import {
  formatShortDate,
  parseRichTextToArray,
  parseRichTextToString,
  splitTextToItems,
} from "@/lib/utils";

// Detail field component — label on top, value below
function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  );
}

export default function JobTitleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [jobTitle, setJobTitle] = React.useState<JobTitle | null>(null);
  const [allJobLevels, setAllJobLevels] = React.useState<JobLevel[]>([]);
  const [allDepartments, setAllDepartments] = React.useState<Department[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const fetchJobTitle = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const [titleRes, levelRes, deptRes] = await Promise.all([
      jobTitleService.getById(id),
      jobLevelService.fetchAll(),
      departmentService.fetchAll(),
    ]);

    if (titleRes.success && titleRes.data) {
      setJobTitle(titleRes.data);
    } else {
      setError(titleRes.message || "Failed to fetch job title");
    }

    if (levelRes.success && levelRes.data) {
      setAllJobLevels(levelRes.data);
    }
    if (deptRes.success && deptRes.data) {
      setAllDepartments(deptRes.data);
    }

    setIsLoading(false);
  }, [id]);

  React.useEffect(() => {
    fetchJobTitle();
  }, [fetchJobTitle]);

  const handleDelete = async () => {
    if (!jobTitle) return;
    setIsDeleting(true);
    const res = await jobTitleService.delete(jobTitle.id);
    if (res.success) {
      router.push("/organization/job-titles");
    } else {
      setError(res.message || "Failed to delete job title");
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <>
        <Header title="Job Title Details" />
        <PageContainer>
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </PageContainer>
      </>
    );
  }

  // Error state
  if (error || !jobTitle) {
    return (
      <>
        <Header title="Job Title Details" />
        <PageContainer>
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <p className="text-sm text-muted-foreground">{error || "Job title not found"}</p>
            <Button variant="outline" size="sm" onClick={fetchJobTitle}>
              Try Again
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  // Resolve relations: use embedded relation first, then lookup from fetched lists
  const jobLevelName =
    jobTitle.jobLevel?.name ||
    allJobLevels.find((l) => l.id === jobTitle.jobLevelId)?.name ||
    "—";
  const departmentName =
    jobTitle.department?.name ||
    allDepartments.find((d) => d.id === jobTitle.departmentId)?.name ||
    "—";

  const descText = parseRichTextToString(jobTitle.description);

  // Get responsibilities — from field or parse from description
  let responsibilities = parseRichTextToArray(jobTitle.responsibilities);
  if (responsibilities.length === 0 && descText && descText.length > 50) {
    responsibilities = splitTextToItems(descText);
  }

  const requirements = parseRichTextToArray(jobTitle.requirements);

  // Only show description if it's not being used as responsibilities
  const showDescription =
    descText && !(responsibilities.length > 0 && !jobTitle.responsibilities);

  return (
    <>
      <Header title="Job Title Details" />
      <PageContainer>
        <div className="space-y-4">
          {/* Top Bar: Back + Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/organization/job-titles")}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Job Titles
            </button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>

          {/* Single card with all content */}
          <Card className="border-0 shadow-none">
            <CardContent className="p-6 space-y-6">
              {/* Profile Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                    <Briefcase className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h1 className="text-lg font-bold">{jobTitle.name}</h1>
                      <Badge variant="outline" className="font-mono">
                        {jobTitle.code}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                        {jobLevelName}
                      </Badge>
                      <Badge variant="secondary">
                        {departmentName}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dashed separator */}
              <div className="border-t border-dashed" />

              {/* General Information */}
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide mb-4">
                  General Information
                </h2>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <DetailField label="Job Title" value={jobTitle.name} />
                  <DetailField label="Code" value={jobTitle.code} />
                  <DetailField label="Job Level" value={jobLevelName} />
                  <DetailField label="Department" value={departmentName} />
                  {showDescription && (
                    <div className="col-span-2">
                      <DetailField label="Description" value={descText} />
                    </div>
                  )}
                  <DetailField label="Created" value={formatShortDate(jobTitle.createdAt)} />
                  <DetailField label="Last Updated" value={formatShortDate(jobTitle.updatedAt)} />
                </div>
              </div>

              {/* Dashed separator */}
              <div className="border-t border-dashed" />

              {/* Responsibilities */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2">
                    <div className="h-6 w-6 rounded-md bg-blue-100 flex items-center justify-center">
                      <ClipboardList className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    Responsibilities
                  </h2>
                  {responsibilities.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {responsibilities.length} items
                    </span>
                  )}
                </div>
                {responsibilities.length > 0 ? (
                  <div className="rounded-lg border bg-card">
                    {responsibilities.map((item, index) => (
                      <div
                        key={index}
                        className={`flex items-start gap-3 px-4 py-3 text-sm ${
                          index !== responsibilities.length - 1 ? "border-b" : ""
                        }`}
                      >
                        <span className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </span>
                        <span className="text-muted-foreground leading-relaxed">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      No responsibilities defined
                    </p>
                  </div>
                )}
              </div>

              {/* Dashed separator */}
              <div className="border-t border-dashed" />

              {/* Requirements */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2">
                    <div className="h-6 w-6 rounded-md bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    </div>
                    Requirements
                  </h2>
                  {requirements.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {requirements.length} items
                    </span>
                  )}
                </div>
                {requirements.length > 0 ? (
                  <div className="rounded-lg border bg-card">
                    {requirements.map((item, index) => (
                      <div
                        key={index}
                        className={`flex items-start gap-3 px-4 py-3 text-sm ${
                          index !== requirements.length - 1 ? "border-b" : ""
                        }`}
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground leading-relaxed">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      No requirements defined
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job Title</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium">{jobTitle.name}</span>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
