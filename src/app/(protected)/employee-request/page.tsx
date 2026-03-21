"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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

import { showToast } from "@/lib/utils/toast-messages";
import { useDebounce } from "@/hooks/use-debounce";
import {
  EMPLOYEE_REQUEST_STATUS_CONFIG,
  EMPLOYMENT_TYPE_LABELS,
  type EmploymentType,
} from "@/lib/constants/employeeRequest";
import { employeeRequestService } from "@/services/employee-request.service";
import type { EmployeeRequestWithRelations } from "@/types/employee-request";

const PAGE_LIMIT = 10;

// --- Table Columns (module level) ---
const columns = [
  {
    key: "code",
    label: "Code",
    className: "w-[140px]",
    render: (row: EmployeeRequestWithRelations) => (
      <Link
        href={`/employee-request/${row.id}`}
        className="font-medium text-accent hover:underline"
      >
        {row.code}
      </Link>
    ),
  },
  {
    key: "jobTitle",
    label: "Position",
    render: (row: EmployeeRequestWithRelations) => (
      <span className="text-sm font-medium">{row.jobTitle?.name || "-"}</span>
    ),
  },
  {
    key: "department",
    label: "Department",
    render: (row: EmployeeRequestWithRelations) => (
      <div className="space-y-0.5">
        <p className="text-sm">{row.department?.name || "-"}</p>
        {row.division?.name && (
          <p className="text-xs text-muted-foreground">{row.division.name}</p>
        )}
      </div>
    ),
  },
  {
    key: "employmentType",
    label: "Type",
    className: "w-[120px]",
    render: (row: EmployeeRequestWithRelations) => (
      <span className="text-sm text-muted-foreground">
        {row.employmentType
          ? EMPLOYMENT_TYPE_LABELS[row.employmentType as EmploymentType] || row.employmentType
          : "-"}
      </span>
    ),
  },
  {
    key: "quantity",
    label: "Qty",
    className: "w-[100px] text-center",
    render: (row: EmployeeRequestWithRelations) => (
      <span className="font-medium">{row.quantity} HC</span>
    ),
  },
  {
    key: "status",
    label: "Status",
    className: "w-[140px]",
    render: (row: EmployeeRequestWithRelations) => {
      const config = EMPLOYEE_REQUEST_STATUS_CONFIG[row.status];
      return (
        <Badge variant={config?.variant || "secondary"}>
          {config?.label || row.status}
        </Badge>
      );
    },
  },
];

export default function EmployeeRequestPage() {
  const router = useRouter();

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

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch function
  const fetchRequests = React.useCallback(
    async (page: number = 1, search?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const filters: { search?: string } = {};
        if (search) filters.search = search;

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

  // Fetch on search/page change
  React.useEffect(() => {
    fetchRequests(currentPage, debouncedSearch || undefined);
  }, [debouncedSearch, currentPage, fetchRequests]);

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

  // Handlers
  const handleDelete = async () => {
    if (!deleteRequest) return;

    setIsDeleting(true);
    try {
      const result = await employeeRequestService.delete(deleteRequest.id);
      if (result.success) {
        showToast.deleted("Employee Request");
        fetchRequests(currentPage, debouncedSearch || undefined);
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
    fetchRequests(currentPage, debouncedSearch || undefined);
  };

  // Error state (only show full page error on initial load)
  if (error && requests.length === 0 && !isLoading) {
    return (
      <>
        <Header title="Employee Request" />
        <PageContainer>
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={handleRefresh}>
              <RefreshCw />
              Try Again
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Header title="Employee Request" />
      <PageContainer>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-lg font-semibold text-foreground">Request Overview</h2>
            <p className="text-sm text-muted-foreground">Manage and track employee requests across departments.</p>
          </div>

          {/* Stats */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  <div className="flex w-12 shrink-0 items-center justify-center bg-accent/10">
                    <FileText className="h-4 w-4 text-accent" />
                  </div>
                  <div className="flex-1 px-3 py-2.5">
                    <p className="text-[11px] font-medium text-muted-foreground">Total Requests</p>
                    <p className="text-lg font-bold tabular-nums">
                      {isLoading ? "-" : stats.total}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  <div className="flex w-12 shrink-0 items-center justify-center bg-amber-500/10">
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="flex-1 px-3 py-2.5">
                    <p className="text-[11px] font-medium text-muted-foreground">Pending Review</p>
                    <p className="text-lg font-bold tabular-nums">
                      {isLoading ? "-" : stats.pending}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  <div className="flex w-12 shrink-0 items-center justify-center bg-green-500/10">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 px-3 py-2.5">
                    <p className="text-[11px] font-medium text-muted-foreground">Approved</p>
                    <p className="text-lg font-bold tabular-nums">
                      {isLoading ? "-" : stats.approved}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  <div className="flex w-12 shrink-0 items-center justify-center bg-red-500/10">
                    <XCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="flex-1 px-3 py-2.5">
                    <p className="text-[11px] font-medium text-muted-foreground">Rejected</p>
                    <p className="text-lg font-bold tabular-nums">
                      {isLoading ? "-" : stats.rejected}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">*HC = Headcount</p>
            <DataTable
              data={requests}
              columns={columns}
              searchable
              searchPlaceholder="Search requests..."
              onSearch={(value) => {
                setSearchQuery(value);
                setCurrentPage(1);
              }}
              loading={isLoading}
              pagination
              pageSize={pageSize}
              totalItems={pagination.total}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              emptyMessage={
                searchQuery
                  ? "No requests found matching your search"
                  : "No employee requests found"
              }
              actions={
                <Button onClick={() => router.push("/employee-request/new")}>
                  New
                </Button>
              }
            />
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
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="animate-spin" />
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
