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
  FileText,
  Building,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { departmentService } from "@/services/department.service";
import { divisionService } from "@/services/division.service";
import { showToast } from "@/lib/utils/toast-messages";
import type { Department, Division } from "@/types";

const DEPARTMENT_CATEGORIES = ["Profit Center", "Non Profit Center"] as const;

const formatCategory = (category: string) => category.replace(/_/g, " ");

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

/* Reusable detail item */
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

export default function DepartmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [department, setDepartment] = React.useState<Department | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [divisions, setDivisions] = React.useState<Division[]>([]);

  // Edit form state
  const [formData, setFormData] = React.useState({
    name: "",
    code: "",
    category: "" as "Profit Center" | "Non Profit Center" | "",
    description: "",
    divisionId: "",
  });

  React.useEffect(() => {
    fetchDetail();
    fetchDivisions();
  }, [id]);

  const fetchDetail = async () => {
    setIsLoading(true);
    const response = await departmentService.getById(id);
    if (response.success && response.data) {
      setDepartment(response.data);
      setFormData({
        name: response.data.name,
        code: response.data.code || "",
        category: response.data.category || "",
        description: response.data.description || "",
        divisionId: response.data.divisionId || "",
      });
    } else {
      showToast.fetchError("department", response.message);
    }
    setIsLoading(false);
  };

  const fetchDivisions = async () => {
    const response = await divisionService.fetchAll();
    if (response.success && response.data) {
      setDivisions(response.data);
    }
  };

  const getDivisionName = (divId?: string): string => {
    if (!divId) return "";
    return divisions.find((div) => div.id === divId)?.name || department?.division?.name || "";
  };

  const handleStartEdit = () => {
    if (department) {
      setFormData({
        name: department.name,
        code: department.code || "",
        category: department.category || "",
        description: department.description || "",
        divisionId: department.divisionId || "",
      });
    }
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (department) {
      setFormData({
        name: department.name,
        code: department.code || "",
        category: department.category || "",
        description: department.description || "",
        divisionId: department.divisionId || "",
      });
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    const response = await departmentService.update(id, {
      name: formData.name,
      code: formData.code || undefined,
      category: (formData.category as "Profit Center" | "Non Profit Center") || undefined,
      description: formData.description || undefined,
      divisionId: formData.divisionId || undefined,
    });
    if (response.success && response.data) {
      setDepartment(response.data);
      setIsEditing(false);
      showToast.updated("Department");
    } else {
      showToast.updateError("department", response.message);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    const response = await departmentService.delete(id);
    if (response.success) {
      showToast.deleted("Department");
      router.push("/organization/departments");
    } else {
      showToast.deleteError("department", response.message);
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

  if (!department) {
    return (
      <>
        <Header />
        <PageContainer>
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--hsd-ui-color-gray-500)" }}>
            Department not found
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
              href="/organization/departments"
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
              Organization: Departments
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
                  <Label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--hsd-ui-color-gray-700)" }}>Code</Label>
                  <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="Enter code" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <Label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--hsd-ui-color-gray-700)" }}>Category</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v as "Profit Center" | "Non Profit Center" })}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {DEPARTMENT_CATEGORIES.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <Label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--hsd-ui-color-gray-700)" }}>Division</Label>
                  <Select value={formData.divisionId} onValueChange={(v) => setFormData({ ...formData, divisionId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select division" /></SelectTrigger>
                    <SelectContent>
                      {divisions.map((div) => <SelectItem key={div.id} value={div.id}>{div.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
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
                      <Building style={{ width: "36px", height: "36px", color: "var(--hsd-ui-color-navy-500)" }} />
                    </div>
                    <div className="flex-1 min-w-0 sm:pt-2">
                      <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--hsd-ui-color-gray-900)", margin: 0 }}>
                        {department.name}
                      </h1>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {department.category && (
                          <TuvBadge
                            text={formatCategory(department.category)}
                            variant={department.category === "Profit Center" ? "success" : "dark"}
                            size="sm"
                            border
                          />
                        )}
                        {department.code && <TuvBadge text={department.code} variant="info" size="sm" border />}
                      </div>
                      <div className="mt-5 pt-4 grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4" style={{ borderTop: "1px solid rgba(120, 134, 127, 0.15)" }}>
                        <DetailItem label="Code" value={department.code || ""} />
                        <DetailItem label="Category" value={department.category ? formatCategory(department.category) : ""} />
                        <DetailItem label="Division" value={getDivisionName(department.divisionId)} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* General Information */}
              <SectionCard title="General Information" icon={Info}>
                <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                  <DetailItem label="Name" value={department.name} />
                  <DetailItem label="Code" value={department.code || ""} />
                  <DetailItem label="Category" value={department.category ? formatCategory(department.category) : ""} />
                  <DetailItem label="Division" value={getDivisionName(department.divisionId)} />
                </div>
              </SectionCard>

              {/* Description */}
              <SectionCard title="Description" icon={FileText}>
                <p
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 400,
                    color: department.description ? "var(--hsd-ui-color-gray-700)" : "var(--hsd-ui-color-gray-400)",
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    fontStyle: department.description ? "normal" : "italic",
                  }}
                >
                  {department.description || "No Data"}
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
            <AlertDialogTitle>Delete Department</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{department.name}&quot;? This action cannot be undone.
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
