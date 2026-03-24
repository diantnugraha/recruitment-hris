"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Users,
  Wallet,
  TrendingUp,
  TrendingDown,
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
    render: (row: DepartmentBudgetRow) => (
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
    render: (row: DepartmentBudgetRow) => (
      <span className="text-sm">{row.divisionName}</span>
    ),
  },
  {
    key: "category",
    label: "Category",
    className: "w-[180px]",
    render: (row: DepartmentBudgetRow) => (
      <Badge variant={row.category === "Profit Center" ? "default" : "secondary"}>
        {row.category}
      </Badge>
    ),
  },
  {
    key: "budgetYears",
    label: "Period",
    className: "w-[120px] text-center",
    render: (row: DepartmentBudgetRow) => (
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
          <DialogTitle>New Department Budget</DialogTitle>
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
        departmentName: dept?.name || "No Data",
        divisionName: division?.name || "No Data",
        category: dept?.category || "No Data",
        budgetYears: deptBudgets.length,
      };
    });
  }, [budgets, departments, divisions]);

  // Search & filter
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");

  const filteredData = React.useMemo(() => {
    let result = departmentRows;

    if (categoryFilter && categoryFilter !== "all") {
      result = result.filter((row) => row.category === categoryFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (row) =>
          row.departmentName.toLowerCase().includes(query) ||
          row.divisionName.toLowerCase().includes(query)
      );
    }

    return result;
  }, [departmentRows, searchQuery, categoryFilter]);

  // Paginate
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Stats
  const stats = React.useMemo(() => {
    const totalDepartments = new Set(budgets.map((b) => b.departmentId)).size;
    const currentYearBudgets = budgets.filter((b) => b.year === CURRENT_YEAR);
    const nextYearBudgets = budgets.filter((b) => b.year === CURRENT_YEAR + 1);

    const currentYearTotal = currentYearBudgets.reduce((sum, b) => sum + b.technical + b.admin, 0);
    const nextYearTotal = nextYearBudgets.reduce((sum, b) => sum + b.technical + b.admin, 0);
    const growth = calculateGrowth(nextYearTotal, currentYearTotal);

    return { totalDepartments, currentYearTotal, nextYearTotal, growth };
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
          {/* Header & Stats */}
          <div>
            <h2 className="text-lg font-semibold text-foreground">Budget Overview</h2>
            <p className="text-sm text-muted-foreground">Manage and monitor employee budget allocation across departments.</p>
          </div>

          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  <div className="flex w-12 shrink-0 items-center justify-center bg-accent/10">
                    <Users className="h-4 w-4 text-accent" />
                  </div>
                  <div className="flex-1 px-3 py-2.5">
                    <p className="text-[11px] font-medium text-muted-foreground">Departments</p>
                    <p className="text-lg font-bold tabular-nums">
                      {isLoading ? "-" : stats.totalDepartments}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  <div className="flex w-12 shrink-0 items-center justify-center bg-blue-500/10">
                    <Wallet className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 px-3 py-2.5">
                    <p className="text-[11px] font-medium text-muted-foreground">{CURRENT_YEAR} Budget</p>
                    <p className="text-lg font-bold tabular-nums">
                      {isLoading ? "-" : stats.currentYearTotal}
                      {!isLoading && <span className="ml-1 text-xs font-medium text-muted-foreground">positions</span>}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  <div className="flex w-12 shrink-0 items-center justify-center bg-emerald-500/10">
                    <Wallet className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 px-3 py-2.5">
                    <p className="text-[11px] font-medium text-muted-foreground">{CURRENT_YEAR + 1} Budget</p>
                    <p className="text-lg font-bold tabular-nums">
                      {isLoading ? "-" : stats.nextYearTotal}
                      {!isLoading && <span className="ml-1 text-xs font-medium text-muted-foreground">positions</span>}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  <div className={`flex w-12 shrink-0 items-center justify-center ${
                    stats.growth >= 0 ? "bg-green-500/10" : "bg-red-500/10"
                  }`}>
                    {stats.growth >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 px-3 py-2.5">
                    <p className="text-[11px] font-medium text-muted-foreground">YoY Growth</p>
                    <p className={`text-lg font-bold tabular-nums ${
                      stats.growth >= 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {isLoading ? "-" : `${stats.growth > 0 ? "+" : ""}${stats.growth}%`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <div>
            {error ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-muted-foreground">{error}</p>
                  <Button variant="outline" onClick={fetchData} className="mt-4">
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : isLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
              </Card>
            ) : (
              <DataTable
                data={paginatedData}
                columns={columns}
                searchable
                searchPlaceholder="Search by department or division..."
                onSearch={(value) => {
                  setSearchQuery(value);
                  setCurrentPage(1);
                }}
                pagination
                pageSize={pageSize}
                totalItems={filteredData.length}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                emptyMessage="No department budgets found"
                filters={
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Category</Label>
                      <Select
                        value={categoryFilter}
                        onValueChange={(value) => {
                          setCategoryFilter(value);
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger className="h-9 w-[180px]">
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          <SelectItem value="Profit Center">Profit Center</SelectItem>
                          <SelectItem value="Cost Center">Cost Center</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {categoryFilter !== "all" && (
                      <Button
                        variant="ghost"
                        className="h-9"
                        onClick={() => {
                          setCategoryFilter("all");
                          setCurrentPage(1);
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                }
                actions={
                  <Button onClick={handleAddDepartmentClick}>
                    New
                  </Button>
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
