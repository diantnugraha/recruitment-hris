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
  Layers,
  GitBranch,
  Calendar,
  Tag,
  Info,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

// Info tile component for consistent field display
function InfoTile({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value || "—"}</p>
      </div>
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
        <div className="space-y-6">
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

          {/* Profile Header Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950">
                  <Briefcase className="h-7 w-7 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">{jobTitle.name}</h1>
                  <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-400">
                      {jobLevelName}
                    </Badge>
                    {jobTitle.type && (
                      <Badge
                        variant="outline"
                        className={
                          jobTitle.type === "Technical"
                            ? "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-400"
                            : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400"
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
            </CardContent>
          </Card>

          {/* General Information Card */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                  <Info className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base">General Information</CardTitle>
                  <CardDescription>Job title details and organizational placement</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <InfoTile icon={Briefcase} label="Job Title" value={jobTitle.name} />
                <InfoTile icon={Layers} label="Job Level" value={jobLevelName} />
                <InfoTile icon={Tag} label="Type" value={jobTitle.type || "—"} />
                <InfoTile icon={Building2} label="Division" value={divisionName} />
                <InfoTile icon={GitBranch} label="Direct Report Line" value={directReportName} />
                <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                  <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Departments</p>
                    {departmentNames.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {departmentNames.map((name) => (
                          <Badge key={name} variant="outline" className="gap-1 text-xs">
                            {name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm font-medium">—</p>
                    )}
                  </div>
                </div>
                <InfoTile icon={Calendar} label="Created" value={formatShortDate(jobTitle.createdAt)} />
                <InfoTile icon={Calendar} label="Last Updated" value={formatShortDate(jobTitle.updatedAt)} />
              </div>
            </CardContent>
          </Card>

          {/* General Job Purpose Card */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950">
                  <ClipboardList className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-base">General Job Purpose</CardTitle>
                  <CardDescription>Overall purpose and objective of this role</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {hasLexicalContent(jobTitle.purpose) ? (
                <div className="rounded-lg border bg-secondary/30 p-4">
                  <LexicalRenderer value={jobTitle.purpose} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No Data</p>
              )}
            </CardContent>
          </Card>

          {/* Job Description Card */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950">
                  <FileText className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Job Description</CardTitle>
                  <CardDescription>Detailed responsibilities and duties</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {hasLexicalContent(jobTitle.description) ? (
                <div className="rounded-lg border bg-secondary/30 p-4">
                  <LexicalRenderer value={jobTitle.description} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No Data</p>
              )}
            </CardContent>
          </Card>

          {/* Job Requirements Card */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950">
                  <CheckCircle2 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Job Requirements</CardTitle>
                  <CardDescription>Required qualifications and skills</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {hasLexicalContent(jobTitle.requirement) ? (
                <div className="rounded-lg border bg-secondary/30 p-4">
                  <LexicalRenderer value={jobTitle.requirement} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No Data</p>
              )}
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
