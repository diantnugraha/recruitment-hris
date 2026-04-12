"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  Loader2,
  Users,
  TrendingUp,
  TrendingDown,
  UserCheck,
  Briefcase,
  CalendarDays,
  Pencil,
  Upload,
  X,
  File,
  FileText,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { TuvBadge } from "@/components/shared/tuv-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { employeeBudgetService } from "@/services/employee-budget.service";
import { departmentService } from "@/services/department.service";
import { employeeService } from "@/services/employee.service";
import { jobTitleService } from "@/services/job-title.service";
import { EmployeeBudget, Department, EmployeeWithRelations, JobTitle, RestBudgetData } from "@/types";
import { showToast } from "@/lib/utils/toast-messages";

// --- TUV button style helpers ---
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

// --- TUV card style ---
const tuvCard = {
  borderRadius: "8px",
  backgroundColor: "#fff",
  borderColor: "rgba(120, 134, 127, 0.2)",
} as const;

// --- Constants ---
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR + 1 - i);

// --- Helper Functions ---
function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// --- Budget Form Dialog ---
interface BudgetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget: EmployeeBudget | null;
  departmentId: string;
  onSuccess: () => void;
}

function BudgetFormDialog({
  open,
  onOpenChange,
  budget,
  departmentId,
  onSuccess,
}: BudgetFormDialogProps) {
  const isEdit = !!budget;
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState({
    year: CURRENT_YEAR + 1,
    technical: 0,
    admin: 0,
    document: "",
  });
  const [selectedFile, setSelectedFile] = React.useState<globalThis.File | null>(null);

  React.useEffect(() => {
    if (open) {
      if (budget) {
        setFormData({
          year: budget.year,
          technical: budget.technical,
          admin: budget.admin,
          document: budget.document || "",
        });
      } else {
        setFormData({
          year: CURRENT_YEAR + 1,
          technical: 0,
          admin: 0,
          document: "",
        });
      }
      setSelectedFile(null);
    }
  }, [open, budget]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = [
        "application/pdf",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(file.type)) {
        showToast.error("Please upload PDF, Excel, or Word document");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        showToast.error("File size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFormData((prev) => ({ ...prev, document: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const documentPath = selectedFile ? selectedFile.name : formData.document;

    const payload = {
      departmentId: Number(departmentId),
      year: formData.year,
      technical: formData.technical,
      admin: formData.admin,
      document: documentPath || undefined,
    };

    const response = isEdit
      ? await employeeBudgetService.update(budget.id, payload)
      : await employeeBudgetService.create(payload);

    if (response.success) {
      showToast.success(isEdit ? "Budget updated successfully" : "Budget created successfully");
      onOpenChange(false);
      onSuccess();
    } else {
      showToast.error(response.message || "Failed to save budget");
    }

    setIsSubmitting(false);
  };

  const totalBudget = formData.technical + formData.admin;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg overflow-hidden">
        <DialogHeader>
          <DialogTitle style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--hsd-ui-color-gray-900)" }}>
            {isEdit ? "Edit Budget" : "New Budget"}
          </DialogTitle>
          <DialogDescription style={{ fontSize: "0.8125rem", color: "var(--hsd-ui-color-gray-500)" }}>
            {isEdit
              ? "Update the budget allocation for this year."
              : "Set the budget allocation for a new year."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="year" style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--hsd-ui-color-gray-700)" }}>
              Budget Year *
            </Label>
            <Select
              value={String(formData.year)}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, year: Number(value) }))
              }
              disabled={isEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="technical" style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--hsd-ui-color-gray-700)" }}>
                Technical Staff
              </Label>
              <Input
                id="technical"
                type="number"
                min="0"
                value={formData.technical}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    technical: Math.max(0, Number(e.target.value) || 0),
                  }))
                }
              />
              <p style={{ fontSize: "0.75rem", color: "var(--hsd-ui-color-gray-500)" }}>
                Number of technical positions
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin" style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--hsd-ui-color-gray-700)" }}>
                Admin Staff
              </Label>
              <Input
                id="admin"
                type="number"
                min="0"
                value={formData.admin}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    admin: Math.max(0, Number(e.target.value) || 0),
                  }))
                }
              />
              <p style={{ fontSize: "0.75rem", color: "var(--hsd-ui-color-gray-500)" }}>
                Number of admin positions
              </p>
            </div>
          </div>

          {/* Document Upload */}
          <div className="space-y-2">
            <Label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--hsd-ui-color-gray-700)" }}>
              Supporting Document
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx"
              onChange={handleFileSelect}
              className="hidden"
            />

            {!selectedFile && !formData.document ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer transition-colors"
                style={{
                  border: "2px dashed rgba(120, 134, 127, 0.3)",
                  borderRadius: "8px",
                  padding: "24px",
                  textAlign: "center",
                }}
              >
                <Upload style={{ width: "32px", height: "32px", margin: "0 auto 8px", color: "var(--hsd-ui-color-gray-400)" }} />
                <p style={{ fontSize: "0.875rem", color: "var(--hsd-ui-color-gray-500)" }}>
                  Click to upload document
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--hsd-ui-color-gray-400)", marginTop: "4px" }}>
                  PDF, Excel, or Word (max 10MB)
                </p>
              </div>
            ) : (
              <div
                className="flex items-center gap-3"
                style={{
                  padding: "12px",
                  border: "1px solid rgba(120, 134, 127, 0.2)",
                  borderRadius: "8px",
                  backgroundColor: "var(--hsd-ui-color-gray-50)",
                }}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center"
                  style={{ borderRadius: "8px", backgroundColor: "var(--hsd-ui-color-navy-50)" }}
                >
                  <File style={{ width: "20px", height: "20px", color: "var(--hsd-ui-color-navy-500)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--hsd-ui-color-gray-900)", margin: 0 }} className="truncate">
                    {selectedFile?.name || "Uploaded Document"}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--hsd-ui-color-gray-500)", margin: 0 }}>
                    {selectedFile
                      ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                      : "Previously uploaded"
                    }
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  style={{ color: "var(--hsd-ui-color-gray-400)" }}
                  onClick={handleRemoveFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Total Summary */}
          <div
            style={{
              borderRadius: "8px",
              border: "1px solid rgba(120, 134, 127, 0.2)",
              backgroundColor: "var(--hsd-ui-color-gray-50)",
              padding: "16px",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--hsd-ui-color-gray-900)", margin: 0 }}>
                  Total Budget
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--hsd-ui-color-gray-500)", margin: 0 }}>
                  Headcount for {formData.year}
                </p>
              </div>
              <span style={{ fontSize: "2.25rem", fontWeight: 700, color: "var(--hsd-ui-color-navy-500)" }} className="tabular-nums">
                {totalBudget}
              </span>
            </div>
            <div
              className="flex gap-4"
              style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(120, 134, 127, 0.15)", fontSize: "0.875rem" }}
            >
              <div className="flex items-center gap-2">
                <span style={{ color: "var(--hsd-ui-color-gray-500)" }}>Technical</span>
                <span style={{ fontWeight: 600, color: "var(--hsd-ui-color-gray-900)" }}>{formData.technical}</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: "var(--hsd-ui-color-gray-500)" }}>Admin</span>
                <span style={{ fontWeight: 600, color: "var(--hsd-ui-color-gray-900)" }}>{formData.admin}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              style={btnSecondary}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} style={btnPrimary}>
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                  {isEdit ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>{isEdit ? "Update Budget" : "Create Budget"}</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Main Page ---
export default function EmployeeBudgetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const departmentId = params.departmentId as string;

  // State
  const [department, setDepartment] = React.useState<Department | null>(null);
  const [budgets, setBudgets] = React.useState<EmployeeBudget[]>([]);
  const [employees, setEmployees] = React.useState<EmployeeWithRelations[]>([]);
  const [deptJobTitles, setDeptJobTitles] = React.useState<JobTitle[]>([]);
  const [restBudgetData, setRestBudgetData] = React.useState<RestBudgetData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Dialog state
  const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);
  const [selectedBudget, setSelectedBudget] = React.useState<EmployeeBudget | null>(null);

  // Fetch data
  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const [deptRes, budgetsRes, jobTitlesRes, employeesRes, restBudgetRes] = await Promise.all([
      departmentService.getById(departmentId),
      employeeBudgetService.fetchAll(),
      jobTitleService.getByDepartmentId(Number(departmentId)),
      employeeService.getAll(1, 1000),
      employeeBudgetService.getRestBudget(Number(departmentId)),
    ]);

    if (deptRes.success && deptRes.data) {
      setDepartment(deptRes.data);
    } else {
      setError("Department not found");
      setIsLoading(false);
      return;
    }

    if (budgetsRes.success && budgetsRes.data) {
      const deptBudgets = budgetsRes.data.filter((b) => String(b.departmentId) === String(departmentId));
      setBudgets(deptBudgets);
    }

    // Store job titles for type lookup
    if (jobTitlesRes.success && jobTitlesRes.data) {
      const jtData = Array.isArray(jobTitlesRes.data) ? jobTitlesRes.data : [];
      setDeptJobTitles(jtData);
    }

    // Filter employees by department (backend resolves department from job title)
    if (employeesRes.success && employeesRes.data) {
      const allEmployees = employeesRes.data.data;
      const filteredEmployees = allEmployees.filter(
        (e) => String(e.departmentId) === String(departmentId)
      );
      setEmployees(filteredEmployees);
    }

    // Rest budget from backend (accurate: budget - active - pending)
    if (restBudgetRes.success && restBudgetRes.data) {
      setRestBudgetData(restBudgetRes.data);
    }

    setIsLoading(false);
  }, [departmentId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Build job title name -> type lookup from department job titles
  // Use startsWith matching to handle name variants like "Administration Staff" vs "Administration Staff (Agri Food)"
  const getJobTitleType = React.useCallback((jtName?: string): string | undefined => {
    if (!jtName) return undefined;
    const key = jtName.trim().toLowerCase();
    for (const jt of deptJobTitles) {
      if (!jt.type) continue;
      const jtKey = jt.name.trim().toLowerCase();
      if (jtKey === key || jtKey.startsWith(key) || key.startsWith(jtKey)) {
        return jt.type;
      }
    }
    return undefined;
  }, [deptJobTitles]);

  // Calculate current employee stats
  const employeeStats = React.useMemo(() => {
    // Only count permanent employees
    const permanent = employees.filter((e) => e.status === "permanent");

    const isMale = (e: EmployeeWithRelations) => e.gender?.toLowerCase() === "male";
    const isFemale = (e: EmployeeWithRelations) => e.gender?.toLowerCase() === "female";

    const technicalMale = permanent.filter(
      (e) => getJobTitleType(e.jobTitle?.name) === "Technical" && isMale(e)
    ).length;
    const technicalFemale = permanent.filter(
      (e) => getJobTitleType(e.jobTitle?.name) === "Technical" && isFemale(e)
    ).length;
    const adminMale = permanent.filter(
      (e) => getJobTitleType(e.jobTitle?.name) === "Administration" && isMale(e)
    ).length;
    const adminFemale = permanent.filter(
      (e) => getJobTitleType(e.jobTitle?.name) === "Administration" && isFemale(e)
    ).length;

    return {
      technical: {
        male: technicalMale,
        female: technicalFemale,
        total: technicalMale + technicalFemale,
      },
      admin: {
        male: adminMale,
        female: adminFemale,
        total: adminMale + adminFemale,
      },
      total: permanent.length,
    };
  }, [employees, getJobTitleType]);

  // Get budget by year
  const getBudgetByYear = (year: number) => {
    return budgets.find((b) => b.year === year);
  };

  // Current year budget
  const currentYearBudget = getBudgetByYear(CURRENT_YEAR);
  const nextYearBudget = getBudgetByYear(CURRENT_YEAR + 1);

  // Rest budget from backend API (budget - activeEmployees - pendingRequests)
  const restBudget = React.useMemo(() => {
    if (!restBudgetData) return { technical: 0, admin: 0, total: 0 };
    return restBudgetData.rest;
  }, [restBudgetData]);

  const handleAddClick = () => {
    setSelectedBudget(null);
    setIsFormDialogOpen(true);
  };

  const handleEditClick = (budget: EmployeeBudget) => {
    setSelectedBudget(budget);
    setIsFormDialogOpen(true);
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

  if (error || !department) {
    return (
      <>
        <Header />
        <PageContainer>
          <div
            className="border"
            style={{
              ...tuvCard,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px 24px",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "0.875rem", color: "var(--hsd-ui-color-gray-500)", margin: 0 }}>
              {error || "Department not found"}
            </p>
            <Button variant="outline" onClick={() => router.back()} className="mt-4" style={btnSecondary}>
              Go Back
            </Button>
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
          {/* Back Link & Title */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/employee-budget"
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
              Back to Budget List
            </Link>
          </div>

          {/* Department Info Header Card */}
          <div
            className="border"
            style={tuvCard}
          >
            <div className="p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center"
                  style={{ borderRadius: "8px", backgroundColor: "var(--hsd-ui-color-navy-50)" }}
                >
                  <Briefcase style={{ width: "28px", height: "28px", color: "var(--hsd-ui-color-navy-500)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--hsd-ui-color-gray-900)", margin: 0 }}>
                    {department.name}
                  </h1>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {department.code && <TuvBadge text={`Code: ${department.code}`} variant="info" size="sm" border />}
                    {department.category && <TuvBadge text={department.category} variant="brand" size="sm" border />}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Current Employee Stats — clean TUV design */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
            {[
              {
                label: "Total Employees",
                value: String(restBudgetData ? restBudgetData.activeEmployees.total : employeeStats.total),
                icon: <Users style={{ width: "18px", height: "18px" }} />,
                iconColor: "var(--hsd-ui-color-navy-500)",
                iconBg: "var(--hsd-ui-color-navy-50)",
              },
              {
                label: "Technical Staff",
                value: String(restBudgetData ? restBudgetData.activeEmployees.technical : employeeStats.technical.total),
                icon: <UserCheck style={{ width: "18px", height: "18px" }} />,
                iconColor: "var(--hsd-ui-color-blue-600)",
                iconBg: "var(--hsd-ui-color-blue-50)",
              },
              {
                label: "Admin Staff",
                value: String(restBudgetData ? restBudgetData.activeEmployees.admin : employeeStats.admin.total),
                icon: <Briefcase style={{ width: "18px", height: "18px" }} />,
                iconColor: "var(--hsd-ui-color-purple-500, #7f39c5)",
                iconBg: "var(--hsd-ui-color-purple-50, #e9def5)",
              },
              {
                label: "Rest Budget",
                value: `${restBudget.total >= 0 ? "+" : ""}${restBudget.total}`,
                icon: restBudget.total >= 0
                  ? <TrendingUp style={{ width: "18px", height: "18px" }} />
                  : <TrendingDown style={{ width: "18px", height: "18px" }} />,
                iconColor: restBudget.total >= 0 ? "var(--hsd-ui-color-green-700, #186742)" : "var(--hsd-ui-color-carmine-600, #bc2935)",
                iconBg: restBudget.total >= 0 ? "var(--hsd-ui-color-lime-50, #f4fee6)" : "var(--hsd-ui-color-carmine-50, #ffebed)",
                valueColor: restBudget.total >= 0 ? "var(--hsd-ui-color-green-700, #186742)" : "var(--hsd-ui-color-carmine-600, #bc2935)",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: "8px",
                  border: "1px solid rgba(120, 134, 127, 0.2)",
                  padding: "16px 20px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 400, color: "var(--hsd-ui-color-gray-500)" }}>
                    {stat.label}
                  </span>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "6px",
                      backgroundColor: stat.iconBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: stat.iconColor,
                    }}
                  >
                    {stat.icon}
                  </div>
                </div>
                <p
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 600,
                    color: (stat as { valueColor?: string }).valueColor || "var(--hsd-ui-color-gray-900)",
                    margin: 0,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Budget by Year Table */}
          <div
            className="border"
            style={tuvCard}
          >
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid rgba(120, 134, 127, 0.15)" }}
            >
              <div>
                <h2
                  className="flex items-center gap-2"
                  style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--hsd-ui-color-gray-900)", margin: 0 }}
                >
                  <CalendarDays style={{ width: "18px", height: "18px", color: "var(--hsd-ui-color-gray-500)" }} />
                  Budget History
                </h2>
                <p style={{ fontSize: "0.8125rem", color: "var(--hsd-ui-color-gray-500)", margin: "4px 0 0" }}>
                  Year-by-year budget allocation and comparison
                </p>
              </div>
              <Button onClick={handleAddClick} style={btnPrimary}>
                New
              </Button>
            </div>
            <div className="px-6 py-5">
              {budgets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p style={{ fontSize: "0.875rem", color: "var(--hsd-ui-color-gray-500)" }}>
                    No budget records found for this department.
                  </p>
                  <Button variant="outline" onClick={handleAddClick} className="mt-4" style={btnSecondary}>
                    New
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--hsd-ui-color-gray-500)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Year</TableHead>
                      <TableHead className="text-center" style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--hsd-ui-color-gray-500)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Technical</TableHead>
                      <TableHead className="text-center" style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--hsd-ui-color-gray-500)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Admin</TableHead>
                      <TableHead className="text-center" style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--hsd-ui-color-gray-500)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total</TableHead>
                      <TableHead className="text-center" style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--hsd-ui-color-gray-500)", textTransform: "uppercase", letterSpacing: "0.05em" }}>vs Previous</TableHead>
                      <TableHead className="text-right" style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--hsd-ui-color-gray-500)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {budgets
                      .sort((a, b) => b.year - a.year)
                      .map((budget, index) => {
                        const prevBudget = budgets.find((b) => b.year === budget.year - 1);
                        const prevTotal = prevBudget
                          ? prevBudget.technical + prevBudget.admin
                          : 0;
                        const currentTotal = budget.technical + budget.admin;
                        const growth = calculateGrowth(currentTotal, prevTotal);

                        return (
                          <TableRow key={budget.id}>
                            <TableCell>
                              <TuvBadge
                                text={budget.year === CURRENT_YEAR ? `${budget.year} (Current)` : String(budget.year)}
                                variant={budget.year === CURRENT_YEAR ? "brand" : "dark"}
                                size="sm"
                                border
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--hsd-ui-color-gray-900)" }} className="tabular-nums">{budget.technical}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--hsd-ui-color-gray-900)" }} className="tabular-nums">{budget.admin}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span
                                className="tabular-nums"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  borderRadius: "6px",
                                  backgroundColor: "var(--hsd-ui-color-navy-50)",
                                  padding: "4px 10px",
                                  fontSize: "0.875rem",
                                  fontWeight: 700,
                                  color: "var(--hsd-ui-color-navy-500)",
                                }}
                              >
                                {currentTotal}
                                <span style={{ fontSize: "0.625rem", fontWeight: 500, opacity: 0.7 }}>total</span>
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              {prevBudget ? (
                                <div className="inline-flex flex-col items-center gap-0.5">
                                  <TuvBadge
                                    text={`${growth > 0 ? "+" : ""}${growth}%`}
                                    variant={growth > 0 ? "success" : growth < 0 ? "danger" : "dark"}
                                    size="sm"
                                    border
                                  />
                                  <span style={{ fontSize: "0.625rem", color: "var(--hsd-ui-color-gray-500)" }} className="tabular-nums">
                                    {currentTotal - prevTotal >= 0 ? "+" : ""}{currentTotal - prevTotal} positions
                                  </span>
                                </div>
                              ) : (
                                <span style={{ fontSize: "0.75rem", color: "var(--hsd-ui-color-gray-500)" }}>First year</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="inline-flex items-center gap-0.5">
                                {budget.document && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => {
                                            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
                                            window.open(`${apiUrl}/${budget.document}`, "_blank");
                                          }}
                                          style={{ color: "var(--hsd-ui-color-gray-500)" }}
                                        >
                                          <FileText className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>View document</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditClick(budget)}
                                  style={{ color: "var(--hsd-ui-color-gray-500)" }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
                </div>
              )}
            </div>
          </div>

          {/* Current Year Budget vs Actual */}
          {currentYearBudget && (
            <div
              className="border"
              style={tuvCard}
            >
              <div
                className="px-6 py-4"
                style={{ borderBottom: "1px solid rgba(120, 134, 127, 0.15)" }}
              >
                <h2 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--hsd-ui-color-gray-900)", margin: 0 }}>
                  {CURRENT_YEAR} Budget vs Actual
                </h2>
                <p style={{ fontSize: "0.8125rem", color: "var(--hsd-ui-color-gray-500)", margin: "4px 0 0" }}>
                  Comparison between approved budget and current employee count
                </p>
              </div>
              <div className="px-6 py-5">
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--hsd-ui-color-gray-500)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Type</TableHead>
                      <TableHead className="text-center" style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--hsd-ui-color-gray-500)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Budget</TableHead>
                      <TableHead className="text-center" style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--hsd-ui-color-gray-500)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Active</TableHead>
                      <TableHead className="text-center" style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--hsd-ui-color-gray-500)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Pending</TableHead>
                      <TableHead style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--hsd-ui-color-gray-500)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Utilization</TableHead>
                      <TableHead className="text-center" style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--hsd-ui-color-gray-500)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Rest</TableHead>
                      <TableHead className="text-center" style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--hsd-ui-color-gray-500)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const rows = [
                        {
                          label: "Technical",
                          budget: restBudgetData?.budget.technical ?? currentYearBudget.technical,
                          active: restBudgetData?.activeEmployees.technical ?? employeeStats.technical.total,
                          pending: restBudgetData?.pendingRequests.technical ?? 0,
                          remaining: restBudget.technical,
                        },
                        {
                          label: "Admin",
                          budget: restBudgetData?.budget.admin ?? currentYearBudget.admin,
                          active: restBudgetData?.activeEmployees.admin ?? employeeStats.admin.total,
                          pending: restBudgetData?.pendingRequests.admin ?? 0,
                          remaining: restBudget.admin,
                        },
                      ];

                      const totalBudget = rows.reduce((s, r) => s + r.budget, 0);
                      const totalActive = rows.reduce((s, r) => s + r.active, 0);
                      const totalPending = rows.reduce((s, r) => s + r.pending, 0);
                      const totalRemaining = rows.reduce((s, r) => s + r.remaining, 0);
                      const totalUsed = totalActive + totalPending;
                      const totalPct = totalBudget > 0 ? Math.round((totalUsed / totalBudget) * 100) : 0;
                      const totalIsOver = totalRemaining < 0;

                      return (
                        <>
                          {rows.map((row) => {
                            const used = row.active + row.pending;
                            const pct = row.budget > 0 ? Math.round((used / row.budget) * 100) : 0;
                            const isOver = row.remaining < 0;

                            return (
                              <TableRow key={row.label}>
                                <TableCell style={{ fontWeight: 500, color: "var(--hsd-ui-color-gray-900)" }}>{row.label}</TableCell>
                                <TableCell className="text-center">
                                  <span style={{ fontWeight: 600, color: "var(--hsd-ui-color-gray-900)" }} className="tabular-nums">{row.budget}</span>
                                </TableCell>
                                <TableCell className="text-center">
                                  <span style={{ fontWeight: 600, color: "var(--hsd-ui-color-gray-900)" }} className="tabular-nums">{row.active}</span>
                                </TableCell>
                                <TableCell className="text-center">
                                  {row.pending > 0 ? (
                                    <span style={{ fontWeight: 600, color: "rgb(217, 119, 6)" }} className="tabular-nums">{row.pending}</span>
                                  ) : (
                                    <span style={{ color: "var(--hsd-ui-color-gray-400)" }}>No Data</span>
                                  )}
                                </TableCell>
                                <TableCell className="min-w-[140px]">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="h-2 flex-1"
                                      style={{ borderRadius: "9999px", backgroundColor: "var(--hsd-ui-color-gray-100)" }}
                                    >
                                      <div
                                        className="h-full transition-all"
                                        style={{
                                          width: `${Math.min(pct, 100)}%`,
                                          borderRadius: "9999px",
                                          backgroundColor: isOver ? "rgb(239, 68, 68)" : pct >= 80 ? "rgb(245, 158, 11)" : "rgb(34, 197, 94)",
                                        }}
                                      />
                                    </div>
                                    <span
                                      style={{
                                        fontSize: "0.75rem",
                                        fontWeight: 500,
                                        color: isOver ? "rgb(220, 38, 38)" : pct >= 80 ? "rgb(217, 119, 6)" : "rgb(22, 163, 74)",
                                      }}
                                      className="tabular-nums"
                                    >
                                      {pct}%
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <span
                                    style={{
                                      fontWeight: 600,
                                      color: isOver ? "rgb(220, 38, 38)" : "rgb(22, 163, 74)",
                                    }}
                                    className="tabular-nums"
                                  >
                                    {row.remaining >= 0 ? "+" : ""}{row.remaining}
                                  </span>
                                </TableCell>
                                <TableCell className="text-center">
                                  <TuvBadge
                                    text={isOver ? "Over Budget" : "Under Budget"}
                                    variant={isOver ? "danger" : "success"}
                                    size="sm"
                                    border
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          <TableRow
                            style={{
                              backgroundColor: "var(--hsd-ui-color-gray-50)",
                              fontWeight: 600,
                            }}
                          >
                            <TableCell style={{ fontWeight: 600, color: "var(--hsd-ui-color-gray-900)" }}>Total</TableCell>
                            <TableCell className="text-center tabular-nums" style={{ fontWeight: 600, color: "var(--hsd-ui-color-gray-900)" }}>{totalBudget}</TableCell>
                            <TableCell className="text-center tabular-nums" style={{ fontWeight: 600, color: "var(--hsd-ui-color-gray-900)" }}>{totalActive}</TableCell>
                            <TableCell className="text-center tabular-nums">
                              {totalPending > 0 ? (
                                <span style={{ color: "rgb(217, 119, 6)", fontWeight: 600 }}>{totalPending}</span>
                              ) : (
                                <span style={{ color: "var(--hsd-ui-color-gray-400)" }}>No Data</span>
                              )}
                            </TableCell>
                            <TableCell className="min-w-[140px]">
                              <div className="flex items-center gap-2">
                                <div
                                  className="h-2 flex-1"
                                  style={{ borderRadius: "9999px", backgroundColor: "var(--hsd-ui-color-gray-100)" }}
                                >
                                  <div
                                    className="h-full transition-all"
                                    style={{
                                      width: `${Math.min(totalPct, 100)}%`,
                                      borderRadius: "9999px",
                                      backgroundColor: totalIsOver ? "rgb(239, 68, 68)" : totalPct >= 80 ? "rgb(245, 158, 11)" : "rgb(34, 197, 94)",
                                    }}
                                  />
                                </div>
                                <span
                                  style={{
                                    fontSize: "0.75rem",
                                    fontWeight: 500,
                                    color: totalIsOver ? "rgb(220, 38, 38)" : totalPct >= 80 ? "rgb(217, 119, 6)" : "rgb(22, 163, 74)",
                                  }}
                                  className="tabular-nums"
                                >
                                  {totalPct}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span
                                style={{
                                  fontWeight: 600,
                                  color: totalIsOver ? "rgb(220, 38, 38)" : "rgb(22, 163, 74)",
                                }}
                                className="tabular-nums"
                              >
                                {totalRemaining >= 0 ? "+" : ""}{totalRemaining}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <TuvBadge
                                text={totalIsOver ? "Over Budget" : "Under Budget"}
                                variant={totalIsOver ? "danger" : "success"}
                                size="sm"
                                border
                              />
                            </TableCell>
                          </TableRow>
                        </>
                      );
                    })()}
                  </TableBody>
                </Table>
                </div>
              </div>
            </div>
          )}
        </div>
      </PageContainer>

      {/* Form Dialog */}
      <BudgetFormDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        budget={selectedBudget}
        departmentId={departmentId}
        onSuccess={fetchData}
      />
    </>
  );
}
