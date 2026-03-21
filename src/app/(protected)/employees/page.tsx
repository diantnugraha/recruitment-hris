"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useEmployeeStore } from "@/stores/employee-store";
import employeeService from "@/services/employee.service";
import { EmployeeWithRelations, EmployeeStatus } from "@/types";
import { showToast } from "@/lib/utils/toast-messages";

// --- Constants ---

const EMPLOYEE_STATUSES: { value: EmployeeStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "permanent", label: "Permanent" },
  { value: "contract", label: "Contract" },
  { value: "probation", label: "Probation" },
  { value: "outsource", label: "Outsource" },
  { value: "on_leave", label: "On Leave" },
  { value: "inactive", label: "Inactive" },
  { value: "terminated", label: "Terminated" },
  { value: "exit", label: "Exit" },
];

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "success" }
> = {
  active: { label: "Active", variant: "success" },
  permanent: { label: "Permanent", variant: "success" },
  contract: { label: "Contract", variant: "default" },
  probation: { label: "Probation", variant: "secondary" },
  outsource: { label: "Outsource", variant: "secondary" },
  on_leave: { label: "On Leave", variant: "secondary" },
  inactive: { label: "Inactive", variant: "outline" },
  terminated: { label: "Terminated", variant: "outline" },
  exit: { label: "Exit", variant: "outline" },
};

function getStatusConfig(status: string) {
  return (
    statusConfig[status] ?? {
      label: status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      variant: "secondary" as const,
    }
  );
}

// Active statuses for counting
const ACTIVE_STATUSES = new Set<string>(["active", "permanent", "contract", "probation", "outsource"]);

export default function EmployeesPage() {
  const router = useRouter();

  // Store
  const {
    employees,
    setEmployees,
    isLoading,
    setLoading,
    error,
    setError,
  } = useEmployeeStore();

  // Local state
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  // Fetch all employees (multi-page)
  const fetchEmployees = React.useCallback(async () => {
    const PAGE_LIMIT = 100;

    setLoading(true);
    setError(null);

    const firstPage = await employeeService.getAll(1, PAGE_LIMIT);

    if (!firstPage.success || !firstPage.data) {
      setError(firstPage.message || "Failed to fetch employees");
      setEmployees([]);
      setLoading(false);
      showToast.fetchError("employees", firstPage.message);
      return;
    }

    const { data: firstPageData, pagination } = firstPage.data;
    const totalPages = pagination?.totalPages ?? 1;

    if (totalPages <= 1) {
      setEmployees(firstPageData);
      setLoading(false);
      return;
    }

    const remainingPages = Array.from(
      { length: totalPages - 1 },
      (_, i) => i + 2
    );

    const remainingResponses = await Promise.all(
      remainingPages.map((page) => employeeService.getAll(page, PAGE_LIMIT))
    );

    const allEmployees = [
      ...firstPageData,
      ...remainingResponses.flatMap((res) =>
        res.success && res.data ? res.data.data : []
      ),
    ];

    setEmployees(allEmployees);
    setLoading(false);
  }, [setEmployees, setLoading, setError]);

  // Initial fetch
  React.useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Filter and pagination
  const filteredData = React.useMemo(() => {
    const empArray = Array.isArray(employees) ? employees : [];
    let result = empArray;

    // Status filter
    if (statusFilter && statusFilter !== "all") {
      if (statusFilter === "active_all") {
        result = result.filter((emp) => ACTIVE_STATUSES.has(emp.status));
      } else {
        result = result.filter((emp) => emp.status === statusFilter);
      }
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (emp) =>
          emp.firstName?.toLowerCase().includes(query) ||
          emp.lastName?.toLowerCase().includes(query) ||
          emp.email?.toLowerCase().includes(query) ||
          emp.employeeId?.toLowerCase().includes(query) ||
          emp.employeeNik?.toLowerCase().includes(query) ||
          emp.nickname?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [searchQuery, statusFilter, employees]);

  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Stats
  const stats = React.useMemo(() => {
    const empArray = Array.isArray(employees) ? employees : [];
    const activeCount = empArray.filter((e) => ACTIVE_STATUSES.has(e.status)).length;
    const permanentCount = empArray.filter((e) => e.status === "permanent").length;
    const contractCount = empArray.filter((e) => e.status === "contract").length;
    const probationCount = empArray.filter((e) => e.status === "probation").length;

    return [
      { label: "Total Employees", value: empArray.length, accent: true },
      { label: "Active", value: activeCount, accent: false },
      { label: "Permanent", value: permanentCount, accent: false },
      { label: "Contract", value: contractCount, accent: false },
      { label: "Probation", value: probationCount, accent: false },
    ];
  }, [employees]);

  // Table columns
  const columns = [
    {
      key: "employee",
      label: "Employee",
      render: (row: EmployeeWithRelations) => {
        const fullName = `${row.firstName || ""} ${row.lastName || ""}`.trim();
        const initials = fullName
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase();

        return (
          <button
            type="button"
            className="flex items-center gap-3 text-left"
            onClick={() => router.push(`/employees/${row.id}`)}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent">
              {initials || "?"}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-accent hover:underline truncate">
                {fullName || "—"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {row.email || "—"}
              </p>
            </div>
          </button>
        );
      },
    },
    {
      key: "nik",
      label: "NIK",
      render: (row: EmployeeWithRelations) => (
        <span className="text-sm text-muted-foreground">
          {row.employeeNik || "No Data"}
        </span>
      ),
    },
    {
      key: "department",
      label: "Department",
      render: (row: EmployeeWithRelations) => (
        <span className="text-sm">{row.department?.name || "—"}</span>
      ),
    },
    {
      key: "position",
      label: "Position",
      render: (row: EmployeeWithRelations) => (
        <span className="text-sm">{row.jobTitle?.name || "—"}</span>
      ),
    },
{
      key: "status",
      label: "Status",
      render: (row: EmployeeWithRelations) => {
        const config = getStatusConfig(row.status);
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
  ];

  return (
    <>
      <Header title="Employees" />
      <PageContainer>
        <div className="space-y-6">
          {/* Header & Stats */}
          <div>
            <h2 className="text-lg font-semibold text-foreground">Employee Overview</h2>
            <p className="text-sm text-muted-foreground">Manage and monitor all employee data across your organization.</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted-foreground">
            {stats.map((stat, i) => (
              <React.Fragment key={stat.label}>
                {i > 0 && <span className="text-border">|</span>}
                <span>
                  {stat.label}:{" "}
                  <span className={`font-semibold tabular-nums ${stat.accent ? "text-accent" : "text-foreground"}`}>
                    {isLoading ? "-" : stat.value}
                  </span>
                </span>
              </React.Fragment>
            ))}
          </div>

          {/* Table */}
          <div className="animate-fade-in stagger-3">
            {isLoading ? (
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
                searchPlaceholder="Search by name, email, NIK, or ID..."
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
                emptyMessage="No employees found"
                filters={
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Status</Label>
                      <Select
                        value={statusFilter}
                        onValueChange={(value) => {
                          setStatusFilter(value);
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger className="h-9 w-[180px]">
                          <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="active_all">All Active</SelectItem>
                          {EMPLOYEE_STATUSES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {statusFilter !== "all" && (
                      <Button
                        variant="ghost"
                       
                        className="h-9"
                        onClick={() => {
                          setStatusFilter("all");
                          setCurrentPage(1);
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                }
                actions={
                  <Button asChild>
                    <Link href="/employees/new">
                      New
                    </Link>
                  </Button>
                }
              />
            )}
          </div>
        </div>
      </PageContainer>
    </>
  );
}
