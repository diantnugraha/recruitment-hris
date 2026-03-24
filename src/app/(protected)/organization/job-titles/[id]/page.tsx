"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
  Tag,
  Info,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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

// --- Reusable sub-components (module level) ---

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={`mt-0.5 text-sm font-medium ${value ? "text-foreground" : "text-muted-foreground"}`}>
        {value || "No Data"}
      </p>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-5">
      {/* Profile header skeleton */}
      <div className="rounded-2xl border bg-card p-6">
        <div className="flex items-start gap-5">
          <Skeleton className="h-20 w-20 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-3 pt-1">
            <Skeleton className="h-7 w-56" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <div className="pt-3 grid grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Content skeletons */}
      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border bg-card p-6 space-y-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

// --- Page component ---

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
          <div className="mb-5">
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
          <DetailSkeleton />
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
            <Button variant="outline" onClick={fetchJobTitle}>
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
    "";

  // Get department names from many-to-many relation
  const departmentNames =
    jobTitle.departments && jobTitle.departments.length > 0
      ? jobTitle.departments.map((d) => d.department.name)
      : [];

  // Resolve division from department relation
  const divisionName =
    jobTitle.departments?.[0]?.department?.division?.name ||
    jobTitle.division?.name ||
    "";
  const directReportName = jobTitle.directReport?.name || "";

  return (
    <>
      <Header title="Job Title Details" />
      <PageContainer>
        <div className="space-y-5">
          {/* Top Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="ghost"
              className="gap-1.5 text-muted-foreground w-fit h-auto px-2 py-1.5 text-sm"
              asChild
            >
              <Link href="/organization/job-titles">
                <ArrowLeft className="h-4 w-4" />
                Job Titles
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <Button
                className="gap-2"
                onClick={() => router.push(`/organization/job-titles/${id}/edit`)}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button
                variant="outline"
                className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
          </div>

          {/* ===== Profile Header Card ===== */}
          <div className="rounded-2xl border bg-card">
            <div className="p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                {/* Icon */}
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-accent/10">
                  <Briefcase className="h-9 w-9 text-accent" />
                </div>

                <div className="flex-1 min-w-0 sm:pt-2">
                  {/* Name */}
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    {jobTitle.name}
                  </h1>

                  {/* Badges */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {jobLevelName && (
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-400">
                        {jobLevelName}
                      </Badge>
                    )}
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

                  {/* Key facts row */}
                  <div className="mt-5 pt-4 border-t border-border/60 grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
                    <DetailItem label="Division" value={divisionName} />
                    <DetailItem label="Job Level" value={jobLevelName} />
                    <DetailItem label="Direct Report" value={directReportName} />
                    <DetailItem label="Type" value={jobTitle.type || ""} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== General Information ===== */}
          <section className="rounded-2xl border bg-card">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
              <h2 className="text-base font-semibold text-foreground">General Information</h2>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="px-6 py-5">
              <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                <DetailItem label="Job Title" value={jobTitle.name} />
                <DetailItem label="Job Level" value={jobLevelName} />
                <DetailItem label="Type" value={jobTitle.type || ""} />
                <DetailItem label="Division" value={divisionName} />
                <DetailItem label="Direct Report Line" value={directReportName} />
              </div>

              {/* Departments */}
              <div className="mt-5 pt-4 border-t border-border/40">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Departments
                </p>
                {departmentNames.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {departmentNames.map((name) => (
                      <Badge key={name} variant="outline" className="text-xs">
                        {name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="mt-0.5 text-sm font-medium text-muted-foreground">{"No Data"}</p>
                )}
              </div>
            </div>
          </section>

          {/* ===== Rich Text Sections ===== */}
          <section className="rounded-2xl border bg-card">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
              <h2 className="text-base font-semibold text-foreground">General Job Purpose</h2>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="px-6 py-5">
              {hasLexicalContent(jobTitle.purpose) ? (
                <LexicalRenderer value={jobTitle.purpose} />
              ) : (
                <p className="text-sm text-muted-foreground italic">No Data</p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border bg-card">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
              <h2 className="text-base font-semibold text-foreground">Job Description</h2>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="px-6 py-5">
              {hasLexicalContent(jobTitle.description) ? (
                <LexicalRenderer value={jobTitle.description} />
              ) : (
                <p className="text-sm text-muted-foreground italic">No Data</p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border bg-card">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
              <h2 className="text-base font-semibold text-foreground">Job Requirements</h2>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="px-6 py-5">
              {hasLexicalContent(jobTitle.requirement) ? (
                <LexicalRenderer value={jobTitle.requirement} />
              ) : (
                <p className="text-sm text-muted-foreground italic">No Data</p>
              )}
            </div>
          </section>
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
              {isDeleting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
