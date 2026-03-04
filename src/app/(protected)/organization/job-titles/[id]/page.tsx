"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Loader2,
  Briefcase,
  ClipboardList,
  CheckCircle2,
  Building2,
  FileText,
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
import { LexicalRenderer, hasLexicalContent } from "@/components/shared/lexical-renderer";
import { showToast } from "@/lib/utils/toast-messages";
import { JobTitle, JobLevel } from "@/types";
import { formatShortDate } from "@/lib/utils";

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
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const fetchJobTitle = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const [titleRes, levelRes] = await Promise.all([
      jobTitleService.getById(id),
      jobLevelService.fetchAll(),
    ]);

    if (titleRes.success && titleRes.data) {
      setJobTitle(titleRes.data);
    } else {
      setError(titleRes.message || "Failed to fetch job title");
    }

    if (levelRes.success && levelRes.data) {
      setAllJobLevels(levelRes.data);
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
      showToast.deleted("Job Title");
      router.push("/organization/job-titles");
    } else {
      showToast.deleteError("job title", res.message);
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

  // Resolve job level name
  const jobLevelName =
    jobTitle.jobLevel?.name ||
    allJobLevels.find((l) => l.id === jobTitle.jobLevelId)?.name ||
    "—";

  // Get department names from many-to-many relation
  const departmentNames =
    jobTitle.departments && jobTitle.departments.length > 0
      ? jobTitle.departments.map((d) => d.department.name)
      : [];

  // Resolve division and direct report
  const divisionName = jobTitle.division?.name || "—";
  const directReportName = jobTitle.directReport?.name || "—";

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
                className="gap-2"
                onClick={() => router.push(`/organization/job-titles/${id}/edit`)}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
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
                    <h1 className="text-lg font-bold">{jobTitle.name}</h1>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                        {jobLevelName}
                      </Badge>
                      {jobTitle.type && (
                        <Badge
                          variant="outline"
                          className={
                            jobTitle.type === "Technical"
                              ? "border-purple-200 bg-purple-50 text-purple-700"
                              : "border-amber-200 bg-amber-50 text-amber-700"
                          }
                        >
                          {jobTitle.type}
                        </Badge>
                      )}
                      {departmentNames.map((name) => (
                        <Badge key={name} variant="secondary">
                          {name}
                        </Badge>
                      ))}
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
                  <DetailField label="Job Level" value={jobLevelName} />
                  <DetailField label="Type" value={jobTitle.type || "—"} />
                  <DetailField label="Division" value={divisionName} />
                  <DetailField label="Direct Report Line" value={directReportName} />
                  <div />
                  <div className="col-span-2">
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Departments
                      </p>
                      {departmentNames.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {departmentNames.map((name) => (
                            <Badge key={name} variant="outline" className="gap-1 text-xs">
                              <Building2 className="h-3 w-3" />
                              {name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm font-medium">—</p>
                      )}
                    </div>
                  </div>
                  <DetailField label="Created" value={formatShortDate(jobTitle.createdAt)} />
                  <DetailField label="Last Updated" value={formatShortDate(jobTitle.updatedAt)} />
                </div>
              </div>

              {/* General Job Purpose */}
              <div className="border-t border-dashed" />
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-6 w-6 rounded-md bg-blue-100 flex items-center justify-center">
                    <ClipboardList className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide">
                    General Job Purpose
                  </h2>
                </div>
                {hasLexicalContent(jobTitle.purpose) ? (
                  <LexicalRenderer value={jobTitle.purpose} />
                ) : (
                  <p className="text-sm text-muted-foreground italic">No Data</p>
                )}
              </div>

              {/* Job Description */}
              <div className="border-t border-dashed" />
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-6 w-6 rounded-md bg-gray-100 flex items-center justify-center">
                    <FileText className="h-3.5 w-3.5 text-gray-600" />
                  </div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide">
                    Job Description
                  </h2>
                </div>
                {hasLexicalContent(jobTitle.description) ? (
                  <LexicalRenderer value={jobTitle.description} />
                ) : (
                  <p className="text-sm text-muted-foreground italic">No Data</p>
                )}
              </div>

              {/* Job Requirements */}
              <div className="border-t border-dashed" />
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-6 w-6 rounded-md bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                  </div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide">
                    Job Requirements
                  </h2>
                </div>
                {hasLexicalContent(jobTitle.requirement) ? (
                  <LexicalRenderer value={jobTitle.requirement} />
                ) : (
                  <p className="text-sm text-muted-foreground italic">No Data</p>
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
