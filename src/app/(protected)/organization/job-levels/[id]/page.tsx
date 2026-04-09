"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Pencil,
  Trash2,
  Loader2,
  Save,
  X,
  Info,
  Layers,
  FileText,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { TuvBadge } from "@/components/shared/tuv-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { jobLevelService } from "@/services/job-level.service";
import { showToast } from "@/lib/utils/toast-messages";
import type { JobLevel } from "@/types";

const JOB_LEVEL_CATEGORIES = ["Structural", "Functional"] as const;

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

/* Reusable detail item — like Job Title's DetailItem but with TUV tokens */
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

/* Section card wrapper — Job Title pattern + TUV border/colors */
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

export default function JobLevelDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [jobLevel, setJobLevel] = React.useState<JobLevel | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const [formData, setFormData] = React.useState({
    name: "",
    category: "" as "Structural" | "Functional" | "",
    order: "",
    description: "",
    canCreateJobTitle: false,
    canCreateKpi: false,
  });

  React.useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    setIsLoading(true);
    const response = await jobLevelService.getById(id);
    if (response.success && response.data) {
      setJobLevel(response.data);
      setFormData({
        name: response.data.name,
        category: (response.data.category as "Structural" | "Functional") || "",
        order: response.data.order != null ? String(response.data.order) : "",
        description: response.data.description || "",
        canCreateJobTitle: response.data.canCreateJobTitle ?? false,
        canCreateKpi: response.data.canCreateKpi ?? false,
      });
    } else {
      showToast.fetchError("job level", response.message);
    }
    setIsLoading(false);
  };

  const handleStartEdit = () => {
    if (jobLevel) {
      setFormData({
        name: jobLevel.name,
        category: (jobLevel.category as "Structural" | "Functional") || "",
        order: jobLevel.order != null ? String(jobLevel.order) : "",
        description: jobLevel.description || "",
        canCreateJobTitle: jobLevel.canCreateJobTitle ?? false,
        canCreateKpi: jobLevel.canCreateKpi ?? false,
      });
    }
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (jobLevel) {
      setFormData({
        name: jobLevel.name,
        category: (jobLevel.category as "Structural" | "Functional") || "",
        order: jobLevel.order != null ? String(jobLevel.order) : "",
        description: jobLevel.description || "",
        canCreateJobTitle: jobLevel.canCreateJobTitle ?? false,
        canCreateKpi: jobLevel.canCreateKpi ?? false,
      });
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    const response = await jobLevelService.update(id, {
      name: formData.name,
      category: formData.category || undefined,
      order: formData.order ? Number(formData.order) : undefined,
      description: formData.description || undefined,
      canCreateJobTitle: formData.canCreateJobTitle,
      canCreateKpi: formData.canCreateKpi,
    });
    if (response.success && response.data) {
      setJobLevel(response.data);
      setIsEditing(false);
      showToast.updated("Job Level");
    } else {
      showToast.updateError("job level", response.message);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    const response = await jobLevelService.delete(id);
    if (response.success) {
      showToast.deleted("Job Level");
      router.push("/organization/job-levels");
    } else {
      showToast.deleteError("job level", response.message);
    }
    setIsSubmitting(false);
  };

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

  if (!jobLevel) {
    return (
      <>
        <Header />
        <PageContainer>
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--hsd-ui-color-gray-500)" }}>
            Job level not found
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
          {/* Top Bar — back link + actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/organization/job-levels"
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
              Position: Job Levels
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={handleCancelEdit} disabled={isSubmitting} style={btnSecondary}>
                    <X style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isSubmitting || !formData.name} style={btnPrimary}>
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                    ) : (
                      <Save style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                    )}
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => setIsDeleteDialogOpen(true)} style={btnDanger}>
                    <Trash2 style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                    Delete
                  </Button>
                  <Button onClick={handleStartEdit} style={btnPrimary}>
                    <Pencil style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                    Edit
                  </Button>
                </>
              )}
            </div>
          </div>

          {isEditing ? (
            /* ===== EDIT MODE: Single form card ===== */
            <div
              className="border"
              style={{ borderRadius: "8px", backgroundColor: "#fff", borderColor: "rgba(120, 134, 127, 0.2)", padding: "24px" }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <Label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--hsd-ui-color-gray-700)" }}>Name *</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter name" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <Label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--hsd-ui-color-gray-700)" }}>Category *</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v as "Structural" | "Functional" })}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {JOB_LEVEL_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <Label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--hsd-ui-color-gray-700)" }}>Order</Label>
                  <Input type="number" value={formData.order} onChange={(e) => setFormData({ ...formData, order: e.target.value })} placeholder="Enter order" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <Label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--hsd-ui-color-gray-700)" }}>Code</Label>
                  <p style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--hsd-ui-color-gray-500)", margin: 0, paddingTop: "10px" }}>{jobLevel.code || "-"}</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "24px", marginTop: "20px" }}>
                <div className="flex items-center space-x-2">
                  <Checkbox id="edit-cjt" checked={formData.canCreateJobTitle} onCheckedChange={(c) => setFormData({ ...formData, canCreateJobTitle: c === true })} />
                  <Label htmlFor="edit-cjt" className="cursor-pointer" style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--hsd-ui-color-gray-700)" }}>Can Create Job Title</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="edit-ckpi" checked={formData.canCreateKpi} onCheckedChange={(c) => setFormData({ ...formData, canCreateKpi: c === true })} />
                  <Label htmlFor="edit-ckpi" className="cursor-pointer" style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--hsd-ui-color-gray-700)" }}>Can Create KPI</Label>
                </div>
              </div>
              <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--hsd-ui-color-gray-700)" }}>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} placeholder="Enter description" />
              </div>
            </div>
          ) : (
            /* ===== VIEW MODE: Section cards ===== */
            <>
              {/* Profile Header Card */}
              <div
                className="border"
                style={{ borderRadius: "8px", backgroundColor: "#fff", borderColor: "rgba(120, 134, 127, 0.2)" }}
              >
                <div className="p-6">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                    <div
                      className="flex h-20 w-20 shrink-0 items-center justify-center"
                      style={{ borderRadius: "8px", backgroundColor: "var(--hsd-ui-color-navy-50)" }}
                    >
                      <Layers style={{ width: "36px", height: "36px", color: "var(--hsd-ui-color-navy-500)" }} />
                    </div>
                    <div className="flex-1 min-w-0 sm:pt-2">
                      <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--hsd-ui-color-gray-900)", margin: 0 }}>
                        {jobLevel.name}
                      </h1>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <TuvBadge text={jobLevel.category} variant={jobLevel.category === "Structural" ? "brand" : "dark"} size="sm" border />
                        {jobLevel.code && <TuvBadge text={jobLevel.code} variant="info" size="sm" border />}
                      </div>
                      <div className="mt-5 pt-4 grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4" style={{ borderTop: "1px solid rgba(120, 134, 127, 0.15)" }}>
                        <DetailItem label="Category" value={jobLevel.category} />
                        <DetailItem label="Order" value={jobLevel.order != null ? String(jobLevel.order) : ""} />
                        <DetailItem label="Can Create Job Title" value={jobLevel.canCreateJobTitle ? "Yes" : "No"} />
                        <DetailItem label="Can Create KPI" value={jobLevel.canCreateKpi ? "Yes" : "No"} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* General Information */}
              <SectionCard title="General Information" icon={Info}>
                <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                  <DetailItem label="Job Level" value={jobLevel.name} />
                  <DetailItem label="Category" value={jobLevel.category} />
                  <DetailItem label="Order" value={jobLevel.order != null ? String(jobLevel.order) : ""} />
                  <DetailItem label="Code" value={jobLevel.code || ""} />
                  <DetailItem label="Can Create Job Title" value={jobLevel.canCreateJobTitle ? "Yes" : "No"} />
                  <DetailItem label="Can Create KPI" value={jobLevel.canCreateKpi ? "Yes" : "No"} />
                </div>
              </SectionCard>

              {/* Description */}
              <SectionCard title="Description" icon={FileText}>
                <p
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 400,
                    color: jobLevel.description ? "var(--hsd-ui-color-gray-700)" : "var(--hsd-ui-color-gray-400)",
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    fontStyle: jobLevel.description ? "normal" : "italic",
                  }}
                >
                  {jobLevel.description || "No Data"}
                </p>
              </SectionCard>
            </>
          )}
        </div>
      </PageContainer>

      {/* Delete confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job Level</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{jobLevel.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting} style={btnSecondary}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isSubmitting} style={btnDanger}>
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                  Deleting...
                </>
              ) : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
