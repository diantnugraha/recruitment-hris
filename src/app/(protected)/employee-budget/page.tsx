"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Search,
  AlertCircle,
  Users,
  Wallet,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { TuvBadge } from "@/components/shared/tuv-badge";

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
              style={{
                borderRadius: "4px",
                height: "38px",
                padding: "0 16px",
                fontSize: "0.875rem",
                fontWeight: 500,
                borderColor: "rgba(120,134,127,0.2)",
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedDepartmentId}
              style={{
                backgroundColor: "var(--hsd-ui-background-color-primary)",
                borderColor: "var(--hsd-ui-border-color-primary)",
                color: "var(--hsd-ui-text-color-primary)",
                borderRadius: "4px",
                height: "38px",
                padding: "0 16px",
                fontSize: "0.875rem",
                fontWeight: 500,
              }}
            >
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

  // Search
  const [searchQuery, setSearchQuery] = React.useState("");

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

  // Search filter (no category filter)
  const filteredData = React.useMemo(() => {
    let result = departmentRows;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (row) =>
          row.departmentName.toLowerCase().includes(query) ||
          row.divisionName.toLowerCase().includes(query)
      );
    }

    return result;
  }, [departmentRows, searchQuery]);

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

  // Pagination computed values
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Handlers
  const handleAddDepartmentClick = () => {
    setIsDepartmentDialogOpen(true);
  };

  const handleDepartmentSelect = (departmentId: string) => {
    router.push(`/employee-budget/${departmentId}`);
  };

  // Category badge variant
  const getCategoryBadgeVariant = (category: string): "success" | "dark" => {
    return category === "Profit Center" ? "success" : "dark";
  };

  return (
    <>
      <Header />
      <PageContainer>
        {/* 1. Page Title Row -- title + count + action button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "24px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <h1
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  color: "var(--hsd-ui-color-gray-900)",
                  margin: 0,
                }}
              >
                Employee Budget
              </h1>
              <span
                style={{
                  backgroundColor: "var(--hsd-ui-color-blue-50)",
                  color: "var(--hsd-ui-color-blue-600)",
                  padding: "2px 10px",
                  borderRadius: "4px",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  border: "1px solid var(--hsd-ui-color-blue-200)",
                }}
              >
                {isLoading ? "\u2014" : totalItems}
              </span>
            </div>
            <p
              style={{
                fontSize: "0.875rem",
                fontWeight: 300,
                color: "var(--hsd-ui-color-gray-500)",
                margin: "4px 0 0",
              }}
            >
              Manage and monitor employee budget allocation across departments.
            </p>
          </div>
          <Button
            onClick={handleAddDepartmentClick}
            style={{
              backgroundColor: "var(--hsd-ui-background-color-primary)",
              borderColor: "var(--hsd-ui-border-color-primary)",
              color: "var(--hsd-ui-text-color-primary)",
              borderRadius: "4px",
              height: "38px",
              padding: "0 16px",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            Create Budget
          </Button>
        </div>

        {/* 2. Stats Cards — clean TUV design */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
          {[
            {
              label: "Departments",
              value: isLoading ? "-" : String(stats.totalDepartments),
              icon: <Users style={{ width: "18px", height: "18px" }} />,
              iconColor: "var(--hsd-ui-color-navy-500)",
              iconBg: "var(--hsd-ui-color-navy-50)",
            },
            {
              label: `${CURRENT_YEAR} Budget`,
              value: isLoading ? "-" : `${stats.currentYearTotal} positions`,
              icon: <Wallet style={{ width: "18px", height: "18px" }} />,
              iconColor: "var(--hsd-ui-color-blue-600)",
              iconBg: "var(--hsd-ui-color-blue-50)",
            },
            {
              label: `${CURRENT_YEAR + 1} Budget`,
              value: isLoading ? "-" : `${stats.nextYearTotal} positions`,
              icon: <Wallet style={{ width: "18px", height: "18px" }} />,
              iconColor: "var(--hsd-ui-color-green-700, #186742)",
              iconBg: "var(--hsd-ui-color-lime-50, #f4fee6)",
            },
            {
              label: "YoY Growth",
              value: isLoading ? "-" : `${stats.growth > 0 ? "+" : ""}${stats.growth}%`,
              icon: stats.growth >= 0
                ? <TrendingUp style={{ width: "18px", height: "18px" }} />
                : <TrendingDown style={{ width: "18px", height: "18px" }} />,
              iconColor: stats.growth >= 0 ? "var(--hsd-ui-color-green-700, #186742)" : "var(--hsd-ui-color-carmine-600, #bc2935)",
              iconBg: stats.growth >= 0 ? "var(--hsd-ui-color-lime-50, #f4fee6)" : "var(--hsd-ui-color-carmine-50, #ffebed)",
              valueColor: stats.growth >= 0 ? "var(--hsd-ui-color-green-700, #186742)" : "var(--hsd-ui-color-carmine-600, #bc2935)",
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

        {/* 3. Outer wrapper -- white bg, rounded */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "8px",
            padding: "16px",
            border: "1px solid rgba(120, 134, 127, 0.2)",
          }}
        >
          {/* Search -- right aligned */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "16px",
            }}
          >
            <div className="relative" style={{ width: "280px" }}>
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ width: "16px", height: "16px", color: "var(--hsd-ui-color-gray-400)" }}
              />
              <Input
                placeholder="Search by department or division..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
                style={{
                  borderColor: "rgba(120, 134, 127, 0.2)",
                  borderRadius: "4px",
                  backgroundColor: "#fff",
                  fontSize: "0.875rem",
                }}
              />
            </div>
          </div>

          {/* Inner white card -- table + pagination */}
          <div
            style={{
              backgroundColor: "#fff",
              border: "1px solid rgba(120, 134, 127, 0.2)",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            {/* Table */}
            <div>
              {isLoading ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "48px 0" }}>
                  <Loader2
                    className="animate-spin"
                    style={{ width: "24px", height: "24px", color: "var(--hsd-ui-color-navy-500)" }}
                  />
                </div>
              ) : error ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "12px",
                    padding: "48px 0",
                  }}
                >
                  <AlertCircle
                    style={{ width: "32px", height: "32px", color: "var(--hsd-ui-color-gray-400)" }}
                  />
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--hsd-ui-color-gray-500)",
                      margin: 0,
                    }}
                  >
                    {error}
                  </p>
                  <Button
                    variant="outline"
                    onClick={fetchData}
                    style={{
                      borderRadius: "4px",
                      height: "38px",
                      padding: "0 16px",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      borderColor: "rgba(120, 134, 127, 0.2)",
                    }}
                  >
                    Try Again
                  </Button>
                </div>
              ) : paginatedData.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "48px 0",
                    color: "var(--hsd-ui-color-gray-500)",
                    fontSize: "0.875rem",
                  }}
                >
                  No department budgets found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow
                      onMouseOver={undefined}
                      onMouseOut={undefined}
                      style={{ backgroundColor: "transparent", borderBottom: "1px solid rgba(120, 134, 127, 0.2)" }}
                    >
                      <TableHead style={{ width: "30%" }}>Department Name</TableHead>
                      <TableHead style={{ width: "25%" }}>Division</TableHead>
                      <TableHead style={{ width: "25%" }}>Category</TableHead>
                      <TableHead style={{ width: "20%" }}>Period</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((row) => (
                      <TableRow key={row.departmentId}>
                        {/* Department Name -- navy clickable link */}
                        <TableCell>
                          <button
                            type="button"
                            className="hover:underline text-left"
                            style={{
                              color: "var(--hsd-ui-color-navy-500)",
                              fontWeight: 500,
                              fontSize: "0.875rem",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: 0,
                            }}
                            onClick={() => router.push(`/employee-budget/${row.departmentId}`)}
                          >
                            {row.departmentName}
                          </button>
                        </TableCell>

                        {/* Division */}
                        <TableCell>
                          <span
                            style={{
                              fontSize: "0.875rem",
                              fontWeight: 400,
                              color: "var(--hsd-ui-color-gray-700)",
                            }}
                          >
                            {row.divisionName}
                          </span>
                        </TableCell>

                        {/* Category */}
                        <TableCell>
                          <TuvBadge
                            text={row.category}
                            variant={getCategoryBadgeVariant(row.category)}
                            size="sm"
                            border
                          />
                        </TableCell>

                        {/* Period */}
                        <TableCell>
                          <span
                            style={{
                              fontSize: "0.875rem",
                              fontWeight: 400,
                              color: "var(--hsd-ui-color-gray-700)",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {row.budgetYears} {row.budgetYears === 1 ? "year" : "years"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Pagination */}
            {totalItems > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderTop: "1px solid rgba(120, 134, 127, 0.2)",
                  borderRadius: "0 0 8px 8px",
                }}
              >
                {/* Left: "X - Y of Z" | divider | "N Per row" */}
                <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                  <span
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 400,
                      color: "var(--hsd-ui-color-gray-400)",
                    }}
                  >
                    {startItem} - {endItem} of {totalItems}
                  </span>
                  <div style={{ width: "1px", height: "32px", backgroundColor: "rgba(120, 134, 127, 0.15)" }} />
                  <Select
                    value={String(pageSize)}
                    onValueChange={(value) => {
                      setPageSize(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger
                      style={{
                        width: "auto",
                        minWidth: "145px",
                        height: "38px",
                        border: "1px solid rgba(120, 134, 127, 0.2)",
                        borderRadius: "4px",
                        fontSize: "0.875rem",
                        fontWeight: 400,
                        color: "var(--hsd-ui-color-gray-700)",
                        padding: "0 12px",
                        gap: "8px",
                        backgroundColor: "#fff",
                      }}
                    >
                      <SelectValue placeholder="10 Per row" />
                    </SelectTrigger>
                    <SelectContent
                      side="top"
                      style={{
                        minWidth: "140px",
                        borderRadius: "8px",
                        fontSize: "0.875rem",
                      }}
                    >
                      {[5, 10, 20, 50, 100].map((size) => (
                        <SelectItem
                          key={size}
                          value={String(size)}
                          style={{ fontSize: "0.875rem", padding: "8px 12px" }}
                        >
                          {size} Per row
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Right: page numbers */}
                <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
                  {(() => {
                    const buildPageItems = (): (number | "dots")[] => {
                      if (totalPages <= 7) {
                        return Array.from({ length: totalPages }, (_, i) => i + 1);
                      }
                      const middle = Array.from(
                        { length: Math.min(3, totalPages - 2) },
                        (_, i) => Math.max(2, currentPage - 1) + i
                      ).filter((n) => n >= 2 && n <= totalPages - 1);

                      return [
                        1,
                        ...(middle[0] > 2 ? ["dots" as const] : []),
                        ...middle,
                        ...(middle[middle.length - 1] < totalPages - 1 ? ["dots" as const] : []),
                        totalPages,
                      ];
                    };
                    const items = buildPageItems();

                    const pageBtn = (num: number | "dots", idx: number) => {
                      if (num === "dots") {
                        return (
                          <span
                            key={`dots-${idx}`}
                            style={{
                              width: "36px",
                              height: "36px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.875rem",
                              color: "var(--hsd-ui-color-gray-700)",
                            }}
                          >
                            ...
                          </span>
                        );
                      }
                      const isActive = currentPage === num;
                      return (
                        <button
                          key={num}
                          onClick={() => setCurrentPage(num)}
                          style={{
                            width: "36px",
                            height: "36px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "6px",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "0.875rem",
                            fontWeight: isActive ? 500 : 400,
                            backgroundColor: isActive ? "var(--hsd-ui-color-navy-500)" : "transparent",
                            color: isActive ? "#fff" : "var(--hsd-ui-color-gray-900)",
                          }}
                        >
                          {num}
                        </button>
                      );
                    };

                    return (
                      <>
                        <button
                          onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          style={{
                            width: "36px",
                            height: "36px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "none",
                            background: "none",
                            cursor: currentPage === 1 ? "default" : "pointer",
                            color: currentPage === 1 ? "var(--hsd-ui-color-gray-300)" : "var(--hsd-ui-color-gray-700)",
                            fontSize: "1.25rem",
                          }}
                        >
                          &#8249;
                        </button>
                        {items.map((item, idx) => pageBtn(item, idx))}
                        <button
                          onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          style={{
                            width: "36px",
                            height: "36px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "none",
                            background: "none",
                            cursor: currentPage === totalPages ? "default" : "pointer",
                            color: currentPage === totalPages ? "var(--hsd-ui-color-gray-300)" : "var(--hsd-ui-color-gray-700)",
                            fontSize: "1.25rem",
                          }}
                        >
                          &#8250;
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
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
