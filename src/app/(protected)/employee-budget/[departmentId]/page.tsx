"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
          <DialogTitle>{isEdit ? "Edit Budget" : "New Budget"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the budget allocation for this year."
              : "Set the budget allocation for a new year."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="year">Budget Year *</Label>
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
              <Label htmlFor="technical">Technical Staff</Label>
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
              <p className="text-xs text-muted-foreground">
                Number of technical positions
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin">Admin Staff</Label>
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
              <p className="text-xs text-muted-foreground">
                Number of admin positions
              </p>
            </div>
          </div>

          {/* Document Upload */}
          <div className="space-y-2">
            <Label>Supporting Document</Label>
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
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-accent/50 hover:bg-accent/5 transition-colors"
              >
                <Upload className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Click to upload document
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  PDF, Excel, or Word (max 10MB)
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <File className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {selectedFile?.name || "Uploaded Document"}
                  </p>
                  <p className="text-xs text-muted-foreground">
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
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={handleRemoveFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Total Summary */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Total Budget</p>
                <p className="text-xs text-muted-foreground">
                  Headcount for {formData.year}
                </p>
              </div>
              <span className="text-4xl font-bold tabular-nums text-accent">
                {totalBudget}
              </span>
            </div>
            <div className="mt-3 flex gap-4 border-t pt-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Technical</span>
                <span className="font-semibold">{formData.technical}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Admin</span>
                <span className="font-semibold">{formData.admin}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" />
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

  // Build job title name → type lookup from department job titles
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
        <Header title="Employee Budget" />
        <PageContainer>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </PageContainer>
      </>
    );
  }

  if (error || !department) {
    return (
      <>
        <Header title="Employee Budget" />
        <PageContainer>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">{error || "Department not found"}</p>
              <Button variant="outline" onClick={() => router.back()} className="mt-4">
                Go Back
              </Button>
            </CardContent>
          </Card>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Header title={`Budget - ${department.name}`} />
      <PageContainer>
        <div className="space-y-6">
          {/* Back Button & Actions */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" asChild>
              <Link href="/employee-budget">
                <ArrowLeft />
                Back to Budget List
              </Link>
            </Button>
          </div>

          {/* Department Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                  <Briefcase className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <CardTitle>{department.name}</CardTitle>
                  <CardDescription>
                    Code: {department.code} | Category: {department.category}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Current Employee Stats */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  <div className="flex w-12 shrink-0 items-center justify-center bg-accent/10">
                    <Users className="h-4 w-4 text-accent" />
                  </div>
                  <div className="flex-1 px-3 py-2.5">
                    <p className="text-[11px] font-medium text-muted-foreground">Total Employees</p>
                    <p className="text-lg font-bold tabular-nums">{restBudgetData ? restBudgetData.activeEmployees.total : employeeStats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  <div className="flex w-12 shrink-0 items-center justify-center bg-blue-500/10">
                    <UserCheck className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 px-3 py-2.5">
                    <p className="text-[11px] font-medium text-muted-foreground">Technical Staff</p>
                    <p className="text-lg font-bold tabular-nums">{restBudgetData ? restBudgetData.activeEmployees.technical : employeeStats.technical.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  <div className="flex w-12 shrink-0 items-center justify-center bg-purple-500/10">
                    <Briefcase className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1 px-3 py-2.5">
                    <p className="text-[11px] font-medium text-muted-foreground">Admin Staff</p>
                    <p className="text-lg font-bold tabular-nums">{restBudgetData ? restBudgetData.activeEmployees.admin : employeeStats.admin.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  <div className={`flex w-12 shrink-0 items-center justify-center ${restBudget.total >= 0 ? "bg-green-500/10" : "bg-red-500/10"}`}>
                    {restBudget.total >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 px-3 py-2.5">
                    <p className="text-[11px] font-medium text-muted-foreground">Rest Budget</p>
                    <p className={`text-lg font-bold tabular-nums ${restBudget.total >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {restBudget.total >= 0 ? "+" : ""}{restBudget.total}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Budget by Year Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    Budget History
                  </CardTitle>
                  <CardDescription className="mt-1.5">
                    Year-by-year budget allocation and comparison
                  </CardDescription>
                </div>
                <Button onClick={handleAddClick}>
                  New
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {budgets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-muted-foreground">No budget records found for this department.</p>
                  <Button variant="outline" onClick={handleAddClick} className="mt-4">
                    New
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Year</TableHead>
                      <TableHead className="text-center">Technical</TableHead>
                      <TableHead className="text-center">Admin</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">vs Previous</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
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
                              <Badge variant={budget.year === CURRENT_YEAR ? "default" : "outline"}>
                                {budget.year}
                                {budget.year === CURRENT_YEAR && " (Current)"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-semibold tabular-nums">{budget.technical}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-semibold tabular-nums">{budget.admin}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="inline-flex items-center gap-1.5 rounded-md bg-accent/10 px-2.5 py-1 text-sm font-bold tabular-nums text-accent">
                                {currentTotal}
                                <span className="text-[10px] font-medium text-accent/70">total</span>
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              {prevBudget ? (
                                <div className="inline-flex flex-col items-center gap-0.5">
                                  <Badge
                                    variant={
                                      growth > 0
                                        ? "success"
                                        : growth < 0
                                        ? "destructive"
                                        : "outline"
                                    }
                                    className="gap-1"
                                  >
                                    {growth > 0 ? (
                                      <TrendingUp className="h-3 w-3" />
                                    ) : growth < 0 ? (
                                      <TrendingDown className="h-3 w-3" />
                                    ) : null}
                                    {growth > 0 ? "+" : ""}
                                    {growth}%
                                  </Badge>
                                  <span className="text-[10px] text-muted-foreground tabular-nums">
                                    {currentTotal - prevTotal >= 0 ? "+" : ""}{currentTotal - prevTotal} positions
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">First year</span>
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
            </CardContent>
          </Card>

          {/* Current Year Budget vs Actual */}
          {currentYearBudget && (
            <Card>
              <CardHeader>
                <CardTitle>{CURRENT_YEAR} Budget vs Actual</CardTitle>
                <CardDescription>
                  Comparison between approved budget and current employee count
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-center">Budget</TableHead>
                      <TableHead className="text-center">Active</TableHead>
                      <TableHead className="text-center">Pending</TableHead>
                      <TableHead>Utilization</TableHead>
                      <TableHead className="text-center">Rest</TableHead>
                      <TableHead className="text-center">Status</TableHead>
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
                                <TableCell className="font-medium">{row.label}</TableCell>
                                <TableCell className="text-center">
                                  <span className="font-semibold tabular-nums">{row.budget}</span>
                                </TableCell>
                                <TableCell className="text-center">
                                  <span className="font-semibold tabular-nums">{row.active}</span>
                                </TableCell>
                                <TableCell className="text-center">
                                  {row.pending > 0 ? (
                                    <span className="font-semibold tabular-nums text-amber-600">{row.pending}</span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="min-w-[140px]">
                                  <div className="flex items-center gap-2">
                                    <div className="h-2 flex-1 rounded-full bg-muted">
                                      <div
                                        className={`h-full rounded-full transition-all ${
                                          isOver ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-green-500"
                                        }`}
                                        style={{ width: `${Math.min(pct, 100)}%` }}
                                      />
                                    </div>
                                    <span className={`text-xs font-medium tabular-nums ${
                                      isOver ? "text-red-600" : pct >= 80 ? "text-amber-600" : "text-green-600"
                                    }`}>
                                      {pct}%
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <span className={`font-semibold tabular-nums ${isOver ? "text-red-600" : "text-green-600"}`}>
                                    {row.remaining >= 0 ? "+" : ""}{row.remaining}
                                  </span>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant={isOver ? "destructive" : "success"}>
                                    {isOver ? "Over Budget" : "Under Budget"}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          <TableRow className="bg-muted/50 font-semibold">
                            <TableCell>Total</TableCell>
                            <TableCell className="text-center tabular-nums">{totalBudget}</TableCell>
                            <TableCell className="text-center tabular-nums">{totalActive}</TableCell>
                            <TableCell className="text-center tabular-nums">
                              {totalPending > 0 ? (
                                <span className="text-amber-600">{totalPending}</span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="min-w-[140px]">
                              <div className="flex items-center gap-2">
                                <div className="h-2 flex-1 rounded-full bg-muted">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      totalIsOver ? "bg-red-500" : totalPct >= 80 ? "bg-amber-500" : "bg-green-500"
                                    }`}
                                    style={{ width: `${Math.min(totalPct, 100)}%` }}
                                  />
                                </div>
                                <span className={`text-xs font-medium tabular-nums ${
                                  totalIsOver ? "text-red-600" : totalPct >= 80 ? "text-amber-600" : "text-green-600"
                                }`}>
                                  {totalPct}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={`tabular-nums ${totalIsOver ? "text-red-600" : "text-green-600"}`}>
                                {totalRemaining >= 0 ? "+" : ""}{totalRemaining}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={totalIsOver ? "destructive" : "success"}>
                                {totalIsOver ? "Over Budget" : "Under Budget"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        </>
                      );
                    })()}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
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
