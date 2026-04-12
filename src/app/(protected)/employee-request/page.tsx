"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Search,
  AlertCircle,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TuvBadge } from "@/components/shared/tuv-badge";

import { showToast } from "@/lib/utils/toast-messages";
import { useDebounce } from "@/hooks/use-debounce";
import {
  EMPLOYEE_REQUEST_STATUS_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  type EmployeeRequestStatus,
  type EmploymentType,
} from "@/lib/constants/employeeRequest";
import { ROLES } from "@/lib/constants/roles";
import { employeeRequestService } from "@/services/employee-request.service";
import { departmentService } from "@/services/department.service";
import { useAuthStore } from "@/stores/auth-store";
import type { Department } from "@/types";
import type { EmployeeRequestWithRelations } from "@/types/employee-request";

// --- Constants ---
const PAGE_LIMIT = 10;

// --- Status → TuvBadge variant mapping ---
const STATUS_BADGE_VARIANT: Record<string, "success" | "danger" | "info" | "warning" | "dark" | "brand" | "purple" | "rose"> = {
  draft: "dark",
  created: "info",
  hod_reviewed: "brand",
  reviewed: "purple",
  approved: "success",
  rejected: "danger",
  revise: "warning",
  in_recruitment: "info",
  completed: "success",
};

export default function EmployeeRequestPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const userRoleId = user?.roleId ?? 0;
  const canCreate = userRoleId === ROLES.MANAGER || userRoleId === ROLES.SUPER_ADMIN;
  const isHOD = userRoleId === ROLES.HOD;

  // State
  const [requests, setRequests] = React.useState<EmployeeRequestWithRelations[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [deleteRequest, setDeleteRequest] = React.useState<EmployeeRequestWithRelations | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(PAGE_LIMIT);
  const [pagination, setPagination] = React.useState({
    page: 1,
    limit: PAGE_LIMIT,
    total: 0,
    totalPages: 0,
  });
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = React.useState<string>("");

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch departments for HOD filter
  React.useEffect(() => {
    if (!isHOD || !user?.headOfDivisions?.length) return;

    const fetchDepartments = async () => {
      const allDepts: Department[] = [];
      for (const division of user.headOfDivisions!) {
        const res = await departmentService.getByDivisionId(String(division.id));
        if (res.success && res.data) {
          allDepts.push(...res.data);
        }
      }
      setDepartments(allDepts);
    };

    fetchDepartments();
  }, [isHOD, user?.headOfDivisions]);

  // Fetch function
  const fetchRequests = React.useCallback(
    async (page: number = 1, search?: string, departmentId?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const filters: { search?: string; department_id?: number } = {};
        if (search) filters.search = search;
        if (departmentId) filters.department_id = Number(departmentId);

        const result = await employeeRequestService.getAll(page, pageSize, filters);

        if (result.success && result.data) {
          setRequests(result.data.data);
          setPagination(result.data.pagination);
        } else {
          setError(result.message || "Failed to fetch employee requests");
          setRequests([]);
        }
      } catch (err) {
        console.error("Error fetching employee requests:", err);
        setError("Failed to fetch employee requests");
        setRequests([]);
      } finally {
        setIsLoading(false);
      }
    },
    [pageSize]
  );

  // Fetch on search/page/department change
  React.useEffect(() => {
    fetchRequests(currentPage, debouncedSearch || undefined, selectedDepartmentId || undefined);
  }, [debouncedSearch, currentPage, selectedDepartmentId, fetchRequests]);

  // Computed values
  const stats = React.useMemo(() => {
    return {
      total: pagination.total,
      pending: requests.filter((r) =>
        ["created", "reviewed"].includes(r.status)
      ).length,
      approved: requests.filter((r) => r.status === "approved").length,
      rejected: requests.filter((r) => r.status === "rejected").length,
    };
  }, [requests, pagination.total]);

  // Pagination computed
  const totalItems = pagination.total;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Handlers
  const handleDelete = async () => {
    if (!deleteRequest) return;

    setIsDeleting(true);
    try {
      const result = await employeeRequestService.delete(deleteRequest.id);
      if (result.success) {
        showToast.deleted("Employee Request");
        fetchRequests(currentPage, debouncedSearch || undefined, selectedDepartmentId || undefined);
      } else {
        showToast.error(result.message || "Failed to delete employee request");
      }
    } catch (err) {
      showToast.error("Failed to delete employee request");
    } finally {
      setIsDeleting(false);
      setDeleteRequest(null);
    }
  };

  const handleRefresh = () => {
    fetchRequests(currentPage, debouncedSearch || undefined, selectedDepartmentId || undefined);
  };

  // Helper: get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    return STATUS_BADGE_VARIANT[status] || "dark";
  };

  // Helper: get status label
  const getStatusLabel = (status: string) => {
    return EMPLOYEE_REQUEST_STATUS_LABELS[status as EmployeeRequestStatus] || status;
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
                Employee Request
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
              Manage and track employee requests across departments.
            </p>
          </div>
          {canCreate && (
            <Button
              onClick={() => router.push("/employee-request/new")}
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
              Create Request
            </Button>
          )}
        </div>

        {/* 2. Stats Cards -- TUV design */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
          {[
            {
              label: "Total Requests",
              value: isLoading ? "-" : String(stats.total),
              icon: <FileText style={{ width: "18px", height: "18px" }} />,
              iconColor: "var(--hsd-ui-color-navy-500)",
              iconBg: "var(--hsd-ui-color-navy-50)",
            },
            {
              label: "Pending Review",
              value: isLoading ? "-" : String(stats.pending),
              icon: <Clock style={{ width: "18px", height: "18px" }} />,
              iconColor: "var(--hsd-ui-color-gray-700, #48504c)",
              iconBg: "var(--hsd-ui-color-yellow-50, #fffde6)",
            },
            {
              label: "Approved",
              value: isLoading ? "-" : String(stats.approved),
              icon: <CheckCircle style={{ width: "18px", height: "18px" }} />,
              iconColor: "var(--hsd-ui-color-green-700, #186742)",
              iconBg: "var(--hsd-ui-color-lime-50, #f4fee6)",
            },
            {
              label: "Rejected",
              value: isLoading ? "-" : String(stats.rejected),
              icon: <XCircle style={{ width: "18px", height: "18px" }} />,
              iconColor: "var(--hsd-ui-color-carmine-600, #bc2935)",
              iconBg: "var(--hsd-ui-color-carmine-50, #ffebed)",
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
                  color: "var(--hsd-ui-color-gray-900)",
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
                placeholder="Search requests..."
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
                    onClick={handleRefresh}
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
              ) : requests.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "48px 0",
                    color: "var(--hsd-ui-color-gray-500)",
                    fontSize: "0.875rem",
                  }}
                >
                  {searchQuery || selectedDepartmentId
                    ? "No requests found matching your search"
                    : "No employee requests found"}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow
                      onMouseOver={undefined}
                      onMouseOut={undefined}
                      style={{ backgroundColor: "transparent", borderBottom: "1px solid rgba(120, 134, 127, 0.2)" }}
                    >
                      <TableHead style={{ width: "12%" }}>Code</TableHead>
                      <TableHead style={{ width: "18%" }}>Position</TableHead>
                      <TableHead style={{ width: "20%" }}>Department</TableHead>
                      <TableHead style={{ width: "12%" }}>Type</TableHead>
                      <TableHead style={{ width: "10%", textAlign: "center" }}>Qty</TableHead>
                      <TableHead style={{ width: "14%" }}>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((row) => (
                      <TableRow key={row.id}>
                        {/* Code -- navy clickable link */}
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
                            onClick={() => router.push(`/employee-request/${row.id}`)}
                          >
                            {row.code}
                          </button>
                        </TableCell>

                        {/* Position */}
                        <TableCell>
                          <span
                            style={{
                              fontSize: "0.875rem",
                              fontWeight: 500,
                              color: "var(--hsd-ui-color-gray-900)",
                            }}
                            dangerouslySetInnerHTML={{ __html: row.jobTitle?.name || "No Data" }}
                          />
                        </TableCell>

                        {/* Department */}
                        <TableCell>
                          <div>
                            <span
                              style={{
                                fontSize: "0.875rem",
                                fontWeight: 400,
                                color: "var(--hsd-ui-color-gray-700)",
                                display: "block",
                              }}
                            >
                              {row.department?.name || "No Data"}
                            </span>
                            {row.division?.name && (
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  fontWeight: 400,
                                  color: "var(--hsd-ui-color-gray-400)",
                                  display: "block",
                                  marginTop: "2px",
                                }}
                              >
                                {row.division.name}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Type */}
                        <TableCell>
                          <span
                            style={{
                              fontSize: "0.875rem",
                              fontWeight: 400,
                              color: "var(--hsd-ui-color-gray-500)",
                            }}
                          >
                            {row.employmentType
                              ? EMPLOYMENT_TYPE_LABELS[row.employmentType as EmploymentType] || row.employmentType
                              : "No Data"}
                          </span>
                        </TableCell>

                        {/* Qty */}
                        <TableCell style={{ textAlign: "center" }}>
                          <span
                            style={{
                              fontSize: "0.875rem",
                              fontWeight: 500,
                              color: "var(--hsd-ui-color-gray-700)",
                            }}
                          >
                            {row.quantity}
                          </span>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <TuvBadge
                            text={getStatusLabel(row.status)}
                            variant={getStatusBadgeVariant(row.status)}
                            size="sm"
                            border
                          />
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteRequest} onOpenChange={() => !isDeleting && setDeleteRequest(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete request {deleteRequest?.code}? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
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
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              style={{
                backgroundColor: "var(--hsd-ui-color-carmine-600, #bc2935)",
                borderColor: "var(--hsd-ui-color-carmine-600, #bc2935)",
                color: "#fff",
                borderRadius: "4px",
                height: "38px",
                padding: "0 16px",
                fontSize: "0.875rem",
                fontWeight: 500,
              }}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="animate-spin" style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
