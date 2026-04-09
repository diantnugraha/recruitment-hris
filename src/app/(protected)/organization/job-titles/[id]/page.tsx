"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Pencil,
  Trash2,
  Loader2,
  Briefcase,
  ClipboardList,
  CheckCircle2,
  FileText,
  Info,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { TuvBadge } from "@/components/shared/tuv-badge";
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
import { useIsHr } from "@/hooks/useIsHr";
import { JobTitle, JobLevel } from "@/types";

// --- TUV button style helpers (from Job Level detail) ---

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

const btnDanger = {
  backgroundColor: "rgba(250, 55, 70, 1)",
  borderColor: "rgba(250, 55, 70, 1)",
  color: "#fff",
  borderRadius: "4px",
  height: "38px",
  padding: "0 16px",
  fontSize: "0.875rem",
  fontWeight: 500,
} as const;

// --- TUV-styled DetailItem ---

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        style={{
          fontSize: "0.6875rem",
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "var(--hsd-ui-color-gray-500)",
          margin: 0,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: "0.875rem",
          fontWeight: 500,
          color: value ? "var(--hsd-ui-color-gray-900)" : "var(--hsd-ui-color-gray-400)",
          margin: "2px 0 0",
        }}
      >
        {value || "No Data"}
      </p>
    </div>
  );
}

// --- TUV Section card wrapper ---

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

// --- Page component ---

export default function JobTitleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isHr = useIsHr();

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

  // Loading state — simple Loader2 spinner (TUV pattern)
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

  // Error state
  if (error || !jobTitle) {
    return (
      <>
        <Header />
        <PageContainer>
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--hsd-ui-color-gray-500)" }}>
            <p style={{ fontSize: "0.875rem", margin: "0 0 12px" }}>{error || "Job title not found"}</p>
            <Button variant="outline" onClick={fetchJobTitle} style={btnSecondary}>
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
      <Header />
      <PageContainer>
        <div className="space-y-5">
          {/* Top Bar — back link + actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/organization/job-titles"
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
              Position: Job Titles
            </Link>
            {isHr && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Button onClick={() => setIsDeleteDialogOpen(true)} style={btnDanger}>
                  <Trash2 style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                  Delete
                </Button>
                <Button onClick={() => router.push(`/organization/job-titles/${id}/edit`)} style={btnPrimary}>
                  <Pencil style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                  Edit
                </Button>
              </div>
            )}
          </div>

          {/* ===== Profile Header Card ===== */}
          <div
            className="border"
            style={{ borderRadius: "8px", backgroundColor: "#fff", borderColor: "rgba(120, 134, 127, 0.2)" }}
          >
            <div className="p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                {/* Icon */}
                <div
                  className="flex h-20 w-20 shrink-0 items-center justify-center"
                  style={{ borderRadius: "8px", backgroundColor: "var(--hsd-ui-color-navy-50)" }}
                >
                  <Briefcase style={{ width: "36px", height: "36px", color: "var(--hsd-ui-color-navy-500)" }} />
                </div>

                <div className="flex-1 min-w-0 sm:pt-2">
                  {/* Name */}
                  <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--hsd-ui-color-gray-900)", margin: 0 }}>
                    {jobTitle.name}
                  </h1>

                  {/* Badges */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {jobLevelName && (
                      <TuvBadge text={jobLevelName} variant="info" size="sm" border />
                    )}
                    {jobTitle.type && (
                      <TuvBadge
                        text={jobTitle.type}
                        variant={jobTitle.type === "Technical" ? "brand" : "dark"}
                        size="sm"
                        border
                      />
                    )}
                    {departmentNames.map((name) => (
                      <TuvBadge key={name} text={name} variant="dark" size="sm" border />
                    ))}
                  </div>

                  {/* Key facts row */}
                  <div
                    className="mt-5 pt-4 grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4"
                    style={{ borderTop: "1px solid rgba(120, 134, 127, 0.15)" }}
                  >
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
          <SectionCard title="General Information" icon={Info}>
            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
              <DetailItem label="Job Title" value={jobTitle.name} />
              <DetailItem label="Job Level" value={jobLevelName} />
              <DetailItem label="Type" value={jobTitle.type || ""} />
              <DetailItem label="Division" value={divisionName} />
              <DetailItem label="Direct Report Line" value={directReportName} />
            </div>

            {/* Departments */}
            <div className="mt-5 pt-4" style={{ borderTop: "1px solid rgba(120, 134, 127, 0.15)" }}>
              <p
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--hsd-ui-color-gray-500)",
                  margin: 0,
                }}
              >
                Departments
              </p>
              {departmentNames.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {departmentNames.map((name) => (
                    <TuvBadge key={name} text={name} variant="dark" size="sm" border />
                  ))}
                </div>
              ) : (
                <p
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "var(--hsd-ui-color-gray-400)",
                    margin: "2px 0 0",
                  }}
                >
                  No Data
                </p>
              )}
            </div>
          </SectionCard>

          {/* ===== Rich Text Sections ===== */}
          <SectionCard title="General Job Purpose" icon={ClipboardList}>
            {hasLexicalContent(jobTitle.purpose) ? (
              <LexicalRenderer value={jobTitle.purpose} />
            ) : (
              <p
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 400,
                  color: "var(--hsd-ui-color-gray-400)",
                  margin: 0,
                  fontStyle: "italic",
                }}
              >
                No Data
              </p>
            )}
          </SectionCard>

          <SectionCard title="Job Description" icon={FileText}>
            {hasLexicalContent(jobTitle.description) ? (
              <LexicalRenderer value={jobTitle.description} />
            ) : (
              <p
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 400,
                  color: "var(--hsd-ui-color-gray-400)",
                  margin: 0,
                  fontStyle: "italic",
                }}
              >
                No Data
              </p>
            )}
          </SectionCard>

          <SectionCard title="Job Requirements" icon={CheckCircle2}>
            {hasLexicalContent(jobTitle.requirement) ? (
              <LexicalRenderer value={jobTitle.requirement} />
            ) : (
              <p
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 400,
                  color: "var(--hsd-ui-color-gray-400)",
                  margin: 0,
                  fontStyle: "italic",
                }}
              >
                No Data
              </p>
            )}
          </SectionCard>
        </div>
      </PageContainer>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job Title</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{jobTitle.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} style={btnSecondary}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} style={btnDanger}>
              {isDeleting ? (
                <>
                  <Loader2 className="animate-spin" style={{ width: "16px", height: "16px", marginRight: "6px" }} />
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
