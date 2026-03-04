"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Download,
  Loader2,
  Wallet,
  TrendingUp,
  TrendingDown,
  Users,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";

import { employeeBudgetService } from "@/services/employee-budget.service";
import { departmentService } from "@/services/department.service";
import { divisionService } from "@/services/division.service";
import { EmployeeBudget, Department, Division } from "@/types";
import { showToast } from "@/lib/utils/toast-messages";

// --- Constants ---
const CURRENT_YEAR = new Date().getFullYear();

// --- Helper Functions ---
function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// --- Types ---
interface DepartmentBudgetRow {
  departmentId: string;
  departmentName: string;
  divisionName: string;
  category: string;
  budgetYears: number;
}

// --- Table Columns (module level) ---
const columns = [
  {
    key: "departmentName",
    label: "Department Name",
    render: (_: unknown, row: DepartmentBudgetRow) => (
      <Link
        href={`/employee-budget/${row.departmentId}`}
        className="font-medium text-accent hover:underline"
      >
        {row.departmentName}
      </Link>
    ),
  },
  {
    key: "divisionName",
    label: "Division",
    render: (_: unknown, row: DepartmentBudgetRow) => (
      <span className="text-sm">{row.divisionName}</span>
    ),
  },
  {
    key: "category",
    label: "Category",
    className: "w-[180px]",
    render: (_: unknown, row: DepartmentBudgetRow) => (
      <Badge variant={row.category === "Profit Center" ? "default" : "secondary"}>
        {row.category}
      </Badge>
    ),
  },
  {
    key: "budgetYears",
    label: "Periode",
    className: "w-[120px] text-center",
    render: (_: unknown, row: DepartmentBudgetRow) => (
      <span className="tabular-nums">
        {row.budgetYears} {row.budgetYears === 1 ? "year" : "years"}
      </span>
    ),
  },
];

// --- Add Department Dialog ---
interface AddDepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departments: Department[];
  onSelect: (departmentId: string) => void;
}

function AddDepartmentDialog({
  open,
  onOpenChange,
  departments,
  onSelect,
}: AddDepartmentDialogProps) {
  const [selectedDepartmentId, setSelectedDepartmentId] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setSelectedDepartmentId("");
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDepartmentId) {
      showToast.error("Please select a department");
      return;
    }

    onOpenChange(false);
    onSelect(selectedDepartmentId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Department Budget</DialogTitle>
          <DialogDescription>
            Select a department to manage its budget allocation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="department">Department *</Label>
            <SearchableSelect
              options={departments.map((dept) => ({
                value: String(dept.id),
                label: dept.name,
              }))}
              value={selectedDepartmentId}
              onValueChange={setSelectedDepartmentId}
              placeholder="Select department"
              searchPlaceholder="Search department..."
              emptyText="No department found."
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedDepartmentId}>
              Continue
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Main Page Component ---
export default function EmployeeBudgetPage() {
  const router = useRouter();

  // State
  const [budgets, setBudgets] = React.useState<EmployeeBudget[]>([]);
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [divisions, setDivisions] = React.useState<Division[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  // Dialog state
  const [isDepartmentDialogOpen, setIsDepartmentDialogOpen] = React.useState(false);

  // Fetch data
  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const [budgetsRes, departmentsRes, divisionsRes] = await Promise.all([
      employeeBudgetService.fetchAll(),
      departmentService.fetchAll(),
      divisionService.fetchAll(),
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

    if (divisionsRes.success && divisionsRes.data) {
      setDivisions(divisionsRes.data);
    }

    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Group budgets by department
  const departmentRows = React.useMemo<DepartmentBudgetRow[]>(() => {
    const grouped = new Map<string, EmployeeBudget[]>();

    for (const b of budgets) {
      const key = String(b.departmentId);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(b);
    }

    // Build lookups
    const deptLookup = new Map<string, Department>();
    for (const dept of departments) {
      deptLookup.set(String(dept.id), dept);
    }

    const divisionLookup = new Map<string, Division>();
    for (const div of divisions) {
      divisionLookup.set(String(div.id), div);
    }

    return Array.from(grouped.entries()).map(([deptId, deptBudgets]) => {
      const dept = deptLookup.get(deptId) || deptBudgets[0]?.department;
      const division = dept?.divisionId ? divisionLookup.get(String(dept.divisionId)) : undefined;

      return {
        departmentId: deptId,
        departmentName: dept?.name || "Unknown",
        divisionName: division?.name || "-",
        category: dept?.category || "-",
        budgetYears: deptBudgets.length,
      };
    });
  }, [budgets, departments, divisions]);

  // Paginate
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return departmentRows.slice(start, start + pageSize);
  }, [departmentRows, currentPage, pageSize]);

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
  const handleAddDepartmentClick = () => {
    setIsDepartmentDialogOpen(true);
  };

  const handleDepartmentSelect = (departmentId: string) => {
    router.push(`/employee-budget/${departmentId}`);
  };

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
                totalItems={departmentRows.length}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                emptyMessage="No department budgets found"
                actions={
                  <>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                    <Button size="sm" onClick={handleAddDepartmentClick}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Department Budget
                    </Button>
                  </>
                }
              />
            )}
          </div>
        </div>
      </PageContainer>

      {/* Add Department Dialog */}
      <AddDepartmentDialog
        open={isDepartmentDialogOpen}
        onOpenChange={setIsDepartmentDialogOpen}
        departments={departments}
        onSelect={handleDepartmentSelect}
      />
    </>
  );
}
