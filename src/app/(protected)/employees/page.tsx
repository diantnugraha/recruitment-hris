"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, AlertCircle } from "lucide-react";

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
import { TuvBadge } from "@/components/shared/tuv-badge";

import { useEmployeeStore } from "@/stores/employee-store";
import employeeService from "@/services/employee.service";
import type { EmployeeWithRelations } from "@/types";
import { showToast } from "@/lib/utils/toast-messages";
import { useIsHr } from "@/hooks/useIsHr";
import {
  EMPLOYEE_STATUSES,
  ACTIVE_STATUSES,
  getEmployeeStatusConfig,
} from "@/lib/constants/employeeStatus";

// --- TuvBadge variant mapping for employee statuses ---

type TuvBadgeVariant = "success" | "danger" | "info" | "warning" | "dark" | "brand" | "purple" | "rose";

const STATUS_TO_TUV_VARIANT: Record<string, TuvBadgeVariant> = {
  active: "success",
  permanent: "success",
  contract: "brand",
  probation: "warning",
  outsource: "info",
  on_leave: "warning",
  inactive: "dark",
  terminated: "danger",
  exit: "danger",
};

function getStatusTuvVariant(status: string): TuvBadgeVariant {
  return STATUS_TO_TUV_VARIANT[status] ?? "dark";
}

// --- Page component ---

export default function EmployeesPage() {
  const router = useRouter();
  const isHr = useIsHr();

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

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

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
                Employee List
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
              Manage and monitor all employee data across your organization.
            </p>
          </div>
          {isHr && (
            <Button
              onClick={() => router.push("/employees/new")}
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
              Create Employee
            </Button>
          )}
        </div>

        {/* 2. Outer wrapper -- white bg, rounded */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "8px",
            padding: "16px",
            border: "1px solid rgba(120, 134, 127, 0.2)",
          }}
        >
          {/* Search row */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "16px",
            }}
          >
            {/* Search */}
            <div className="relative" style={{ width: "280px" }}>
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ width: "16px", height: "16px", color: "var(--hsd-ui-color-gray-400)" }}
              />
              <Input
                placeholder="Search by name, email, NIK..."
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
                    onClick={fetchEmployees}
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
                  No employees found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow
                      onMouseOver={undefined}
                      onMouseOut={undefined}
                      style={{ backgroundColor: "transparent", borderBottom: "1px solid rgba(120, 134, 127, 0.2)" }}
                    >
                      <TableHead style={{ width: "30%" }}>Employee</TableHead>
                      <TableHead style={{ width: "15%" }}>NIK</TableHead>
                      <TableHead style={{ width: "20%" }}>Department</TableHead>
                      <TableHead style={{ width: "20%" }}>Position</TableHead>
                      <TableHead style={{ width: "15%" }}>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((row) => {
                      const fullName = `${row.firstName || ""} ${row.lastName || ""}`.trim();
                      const initials = fullName
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase();
                      const statusConfig = getEmployeeStatusConfig(row.status);

                      return (
                        <TableRow key={row.id}>
                          {/* Employee name + avatar */}
                          <TableCell>
                            <button
                              type="button"
                              className="flex items-center gap-3 text-left"
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: 0,
                              }}
                              onClick={() => router.push(`/employees/${row.id}`)}
                            >
                              <div
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  borderRadius: "50%",
                                  backgroundColor: "var(--hsd-ui-color-navy-50)",
                                  color: "var(--hsd-ui-color-navy-500)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  flexShrink: 0,
                                }}
                              >
                                {initials || "?"}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <p
                                  className="hover:underline"
                                  style={{
                                    color: "var(--hsd-ui-color-navy-500)",
                                    fontWeight: 500,
                                    fontSize: "0.875rem",
                                    margin: 0,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {fullName || "No Data"}
                                </p>
                                <p
                                  style={{
                                    fontSize: "0.75rem",
                                    fontWeight: 400,
                                    color: "var(--hsd-ui-color-gray-400)",
                                    margin: 0,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {row.email || "No Data"}
                                </p>
                              </div>
                            </button>
                          </TableCell>

                          {/* NIK */}
                          <TableCell>
                            <span
                              style={{
                                fontSize: "0.875rem",
                                fontWeight: 400,
                                color: "var(--hsd-ui-color-gray-500)",
                              }}
                            >
                              {row.employeeNik || "No Data"}
                            </span>
                          </TableCell>

                          {/* Department */}
                          <TableCell>
                            <span
                              style={{
                                fontSize: "0.875rem",
                                fontWeight: 400,
                                color: "var(--hsd-ui-color-gray-700)",
                              }}
                            >
                              {row.department?.name || "No Data"}
                            </span>
                          </TableCell>

                          {/* Position */}
                          <TableCell>
                            <span
                              style={{
                                fontSize: "0.875rem",
                                fontWeight: 400,
                                color: "var(--hsd-ui-color-gray-700)",
                              }}
                            >
                              {row.jobTitle?.name || "No Data"}
                            </span>
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <TuvBadge
                              text={statusConfig.label}
                              variant={getStatusTuvVariant(row.status)}
                              size="sm"
                              border
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
    </>
  );
}
