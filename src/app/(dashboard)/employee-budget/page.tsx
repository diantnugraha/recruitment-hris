"use client";

import * as React from "react";
import Link from "next/link";
import {
  Plus,
  Download,
  Loader2,
  Wallet,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Upload,
  X,
  File,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { SearchableSelect } from "@/components/ui/searchable-select";

import { employeeBudgetService } from "@/services/employee-budget.service";
import { departmentService } from "@/services/department.service";
import { EmployeeBudget, Department } from "@/types";
import { showToast } from "@/lib/utils/toast-messages";

// --- Constants ---
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR + 1 - i);

// --- Helper Functions ---
function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function GrowthBadge({ value }: { value: number }) {
  if (value === 0) {
    return <Badge variant="outline">0%</Badge>;
  }
  if (value > 0) {
    return (
      <Badge variant="success" className="gap-1">
        <TrendingUp className="h-3 w-3" />
        +{value}%
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="gap-1">
      <TrendingDown className="h-3 w-3" />
      {value}%
    </Badge>
  );
}

// --- Budget Form Dialog ---
interface BudgetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget: EmployeeBudget | null;
  departments: Department[];
  onSuccess: () => void;
}

function BudgetFormDialog({
  open,
  onOpenChange,
  budget,
  departments,
  onSuccess,
}: BudgetFormDialogProps) {
  const isEdit = !!budget;
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState({
    departmentId: "",
    year: CURRENT_YEAR + 1,
    technical: 0,
    admin: 0,
    document: "",
  });
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      if (budget) {
        setFormData({
          departmentId: budget.departmentId,
          year: budget.year,
          technical: budget.technical,
          admin: budget.admin,
          document: budget.document || "",
        });
        setSelectedFile(null);
      } else {
        setFormData({
          departmentId: "",
          year: CURRENT_YEAR + 1,
          technical: 0,
          admin: 0,
          document: "",
        });
        setSelectedFile(null);
      }
    }
  }, [open, budget]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (PDF, Excel, Word)
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
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showToast.error("File size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFormData((prev) => ({ ...prev, document: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.departmentId) {
      showToast.error("Please select a department");
      return;
    }

    setIsSubmitting(true);

    // Store file name locally for now (upload endpoint not available yet)
    const documentPath = selectedFile ? selectedFile.name : formData.document;

    const payload = {
      departmentId: Number(formData.departmentId),
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
          <DialogTitle>{isEdit ? "Edit Employee Budget" : "Add Employee Budget"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the employee budget allocation for this department."
              : "Set the employee budget allocation for a department."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Department Selection */}
          <div className="space-y-2">
            <Label htmlFor="department">Department *</Label>
            <SearchableSelect
              options={departments.map((dept) => ({
                value: String(dept.id),
                label: dept.name,
              }))}
              value={formData.departmentId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, departmentId: value }))
              }
              placeholder="Select department"
              searchPlaceholder="Search department..."
              emptyText="No department found."
              disabled={isEdit}
            />
          </div>

          {/* Year Selection */}
          <div className="space-y-2">
            <Label htmlFor="year">Budget Year *</Label>
            <Select
              value={String(formData.year)}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, year: Number(value) }))
              }
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

          {/* Budget Inputs */}
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

          {/* Actions */}
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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

// --- Main Page Component ---
export default function EmployeeBudgetPage() {
  // State
  const [budgets, setBudgets] = React.useState<EmployeeBudget[]>([]);
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Pagination & Filters
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [yearFilter, setYearFilter] = React.useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = React.useState<string>("all");

  // Dialog states
  const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);
  const [selectedBudget, setSelectedBudget] = React.useState<EmployeeBudget | null>(null);

  // Fetch data
  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const [budgetsRes, departmentsRes] = await Promise.all([
      employeeBudgetService.fetchAll(),
      departmentService.fetchAll(),
    ]);

    if (budgetsRes.success && budgetsRes.data) {
      setBudgets(budgetsRes.data);
    } else {
      setError(budgetsRes.message || "Failed to fetch budgets");
      setBudgets([]);
    }

    if (departmentsRes.success && departmentsRes.data) {
      setDepartments(departmentsRes.data);
    }

    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter data
  const filteredData = React.useMemo(() => {
    let result = budgets;

    if (yearFilter !== "all") {
      result = result.filter((b) => b.year === Number(yearFilter));
    }

    if (departmentFilter !== "all") {
      result = result.filter((b) => String(b.departmentId) === departmentFilter);
    }

    return result;
  }, [budgets, yearFilter, departmentFilter]);

  // Paginate
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Stats
  const stats = React.useMemo(() => {
    const currentYearBudgets = budgets.filter((b) => b.year === CURRENT_YEAR);
    const nextYearBudgets = budgets.filter((b) => b.year === CURRENT_YEAR + 1);

    const totalCurrentTechnical = currentYearBudgets.reduce((sum, b) => sum + b.technical, 0);
    const totalCurrentAdmin = currentYearBudgets.reduce((sum, b) => sum + b.admin, 0);
    const totalNextTechnical = nextYearBudgets.reduce((sum, b) => sum + b.technical, 0);
    const totalNextAdmin = nextYearBudgets.reduce((sum, b) => sum + b.admin, 0);

    return {
      totalDepartments: new Set(budgets.map((b) => b.departmentId)).size,
      currentYearTotal: totalCurrentTechnical + totalCurrentAdmin,
      nextYearTotal: totalNextTechnical + totalNextAdmin,
      growth: calculateGrowth(
        totalNextTechnical + totalNextAdmin,
        totalCurrentTechnical + totalCurrentAdmin
      ),
    };
  }, [budgets]);

  // Handlers
  const handleAddClick = () => {
    setSelectedBudget(null);
    setIsFormDialogOpen(true);
  };

  // Get unique years from data
  const availableYears = React.useMemo(() => {
    const years = new Set(budgets.map((b) => b.year));
    return Array.from(years).sort((a, b) => b - a);
  }, [budgets]);

  // Table columns
  const columns = [
    {
      key: "year",
      label: "Year",
      className: "w-[100px]",
      render: (_: unknown, row: EmployeeBudget) => (
        <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-sm font-medium tabular-nums">
          {row.year}
        </span>
      ),
    },
    {
      key: "department",
      label: "Department",
      render: (_: unknown, row: EmployeeBudget) => (
        <Link
          href={`/employee-budget/${row.departmentId}`}
          className="font-medium text-accent hover:underline"
        >
          {row.department?.name || "Unknown"}
        </Link>
      ),
    },
    {
      key: "technical",
      label: "Technical",
      className: "w-[100px] text-center",
      render: (_: unknown, row: EmployeeBudget) => (
        <span className="tabular-nums">{row.technical}</span>
      ),
    },
    {
      key: "admin",
      label: "Admin",
      className: "w-[100px] text-center",
      render: (_: unknown, row: EmployeeBudget) => (
        <span className="tabular-nums">{row.admin}</span>
      ),
    },
    {
      key: "total",
      label: "Total",
      className: "w-[100px] text-center",
      render: (_: unknown, row: EmployeeBudget) => (
        <span className="inline-flex items-center rounded-md bg-accent/10 px-2.5 py-1 text-sm font-semibold tabular-nums text-accent">
          {row.technical + row.admin}
        </span>
      ),
    },
    {
      key: "document",
      label: "Document",
      className: "w-[120px]",
      render: (_: unknown, row: EmployeeBudget) =>
        row.document ? (
          <a
            href={row.document}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <FileText className="h-4 w-4" />
            <span>View</span>
          </a>
        ) : (
          <span className="text-muted-foreground/50">—</span>
        ),
    },
  ];

  return (
    <>
      <Header title="Employee Budget" />
      <PageContainer>
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  <div className="flex w-14 shrink-0 items-center justify-center bg-accent/10">
                    <Users className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex-1 p-4">
                    <p className="text-xs font-medium text-muted-foreground">Departments</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums">
                      {isLoading ? "-" : stats.totalDepartments}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  <div className="flex w-14 shrink-0 items-center justify-center bg-blue-500/10">
                    <Wallet className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 p-4">
                    <p className="text-xs font-medium text-muted-foreground">{CURRENT_YEAR} Budget</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums">
                      {isLoading ? "-" : stats.currentYearTotal}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  <div className="flex w-14 shrink-0 items-center justify-center bg-emerald-500/10">
                    <Wallet className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 p-4">
                    <p className="text-xs font-medium text-muted-foreground">{CURRENT_YEAR + 1} Budget</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums">
                      {isLoading ? "-" : stats.nextYearTotal}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  <div className={`flex w-14 shrink-0 items-center justify-center ${
                    stats.growth >= 0 ? "bg-green-500/10" : "bg-red-500/10"
                  }`}>
                    {stats.growth >= 0 ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 p-4">
                    <p className="text-xs font-medium text-muted-foreground">YoY Growth</p>
                    <p className={`mt-1 text-2xl font-bold tabular-nums ${
                      stats.growth >= 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {isLoading ? "-" : `${stats.growth > 0 ? "+" : ""}${stats.growth}%`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Table */}
          <div className="animate-fade-in stagger-3">
            {isLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
              </Card>
            ) : error ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-muted-foreground">{error}</p>
                  <Button variant="outline" onClick={fetchData} className="mt-4">
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <DataTable
                data={paginatedData}
                columns={columns}
                searchable={false}
                pagination
                pageSize={pageSize}
                totalItems={filteredData.length}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                emptyMessage="No employee budgets found"
                filters={
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Year</Label>
                      <Select
                        value={yearFilter}
                        onValueChange={(value) => {
                          setYearFilter(value);
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger className="h-9 w-[120px]">
                          <SelectValue placeholder="All Years" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Years</SelectItem>
                          {availableYears.map((year) => (
                            <SelectItem key={year} value={String(year)}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Department</Label>
                      <SearchableSelect
                        options={[
                          { value: "all", label: "All Departments" },
                          ...departments.map((dept) => ({
                            value: String(dept.id),
                            label: dept.name,
                          })),
                        ]}
                        value={departmentFilter}
                        onValueChange={(value) => {
                          setDepartmentFilter(value);
                          setCurrentPage(1);
                        }}
                        placeholder="All Departments"
                        searchPlaceholder="Search department..."
                        emptyText="No department found."
                        className="h-9 w-[280px]"
                      />
                    </div>

                    {(yearFilter !== "all" || departmentFilter !== "all") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9"
                        onClick={() => {
                          setYearFilter("all");
                          setDepartmentFilter("all");
                          setCurrentPage(1);
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                }
                actions={
                  <>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                    <Button size="sm" onClick={handleAddClick}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Budget
                    </Button>
                  </>
                }
              />
            )}
          </div>
        </div>
      </PageContainer>

      {/* Form Dialog */}
      <BudgetFormDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        budget={selectedBudget}
        departments={departments}
        onSuccess={fetchData}
      />
    </>
  );
}
