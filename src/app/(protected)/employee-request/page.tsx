"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  AlertCircle,
  Search,
  RefreshCw,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { showToast } from "@/lib/utils/toast-messages";
import { useDebounce } from "@/hooks/use-debounce";
import {
  EMPLOYEE_REQUEST_STATUS_CONFIG,
  EMPLOYMENT_TYPE_LABELS,
  type EmployeeRequestStatus,
  type EmploymentType,
} from "@/lib/constants/employeeRequest";
import { employeeRequestService } from "@/services/employee-request.service";
import type { EmployeeRequestWithRelations } from "@/types/employee-request";

const PAGE_LIMIT = 20;

export default function EmployeeRequestPage() {
  const router = useRouter();

  // State
  const [requests, setRequests] = React.useState<EmployeeRequestWithRelations[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [deleteRequest, setDeleteRequest] = React.useState<EmployeeRequestWithRelations | null>(null);
  const [pagination, setPagination] = React.useState({
    page: 1,
    limit: PAGE_LIMIT,
    total: 0,
    totalPages: 0,
  });

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch function
  const fetchRequests = React.useCallback(
    async (page: number = 1, search?: string, status?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const filters: { search?: string; status?: string } = {};
        if (search) filters.search = search;
        if (status && status !== "all") filters.status = status;

        const result = await employeeRequestService.getAll(page, PAGE_LIMIT, filters);

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
    []
  );

  // Initial fetch and search effect
  React.useEffect(() => {
    fetchRequests(1, debouncedSearch || undefined);
  }, [debouncedSearch, fetchRequests]);

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

  const filteredRequests = requests;

  // Handlers
  const handleDelete = async () => {
    if (!deleteRequest) return;

    setIsDeleting(true);
    try {
      const result = await employeeRequestService.delete(deleteRequest.id);
      if (result.success) {
        showToast.deleted("Employee Request");
        // Refresh list
        fetchRequests(pagination.page, debouncedSearch || undefined);
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
    fetchRequests(pagination.page, debouncedSearch || undefined);
  };

  const getStatusBadge = (status: EmployeeRequestStatus) => {
    const config = EMPLOYEE_REQUEST_STATUS_CONFIG[status];
    return (
      <Badge variant={config?.variant || "secondary"}>
        {config?.label || status}
      </Badge>
    );
  };

  // Loading skeleton for stats
  const StatsSkeletonCards = () => (
    <div className="grid gap-4 sm:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-12" />
              </div>
              <Skeleton className="h-11 w-11 rounded-xl" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Loading skeleton for table
  const TableSkeletonRows = () => (
    <Card>
      <Table className="table-fixed w-full">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[140px]">Code</TableHead>
            <TableHead>Position</TableHead>
            <TableHead className="w-[120px]">Type</TableHead>
            <TableHead className="w-[140px] text-center">Qty</TableHead>
            <TableHead className="w-[140px]">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[1, 2, 3, 4, 5].map((i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-5 w-28" /></TableCell>
              <TableCell>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </TableCell>
              <TableCell><Skeleton className="h-5 w-20" /></TableCell>
              <TableCell><Skeleton className="h-5 w-8 mx-auto" /></TableCell>
              <TableCell><Skeleton className="h-5 w-24" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );

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
          {/* Stats */}
          {isLoading ? (
            <StatsSkeletonCards />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    <div className="flex w-14 shrink-0 items-center justify-center bg-accent/10">
                      <FileText className="h-5 w-5 text-accent" />
                    </div>
                    <div className="flex-1 p-4">
                      <p className="text-xs font-medium text-muted-foreground">Total Requests</p>
                      <p className="mt-1 text-xl font-bold tabular-nums">
                        {stats.total}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    <div className="flex w-14 shrink-0 items-center justify-center bg-amber-500/10">
                      <Clock className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1 p-4">
                      <p className="text-xs font-medium text-muted-foreground">Pending Review</p>
                      <p className="mt-1 text-xl font-bold tabular-nums">
                        {stats.pending}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    <div className="flex w-14 shrink-0 items-center justify-center bg-green-500/10">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 p-4">
                      <p className="text-xs font-medium text-muted-foreground">Approved</p>
                      <p className="mt-1 text-xl font-bold tabular-nums">
                        {stats.approved}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    <div className="flex w-14 shrink-0 items-center justify-center bg-red-500/10">
                      <XCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1 p-4">
                      <p className="text-xs font-medium text-muted-foreground">Rejected</p>
                      <p className="mt-1 text-xl font-bold tabular-nums">
                        {stats.rejected}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Button onClick={() => router.push("/employee-request/new")}>
              New
            </Button>
          </div>

          {/* Table */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">*HC = Headcount</p>
              {isLoading ? (
                <TableSkeletonRows />
              ) : (
                <Card>
                  <Table className="table-fixed w-full">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[140px]">Code</TableHead>
                        <TableHead>Position / Department</TableHead>
                        <TableHead className="w-[120px]">Type</TableHead>
                        <TableHead className="w-[140px] text-center">Qty</TableHead>
                        <TableHead className="w-[140px]">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-32 text-center">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <FileText className="h-10 w-10 text-muted-foreground/30" />
                              <p className="text-muted-foreground">
                                {searchQuery
                                  ? "No requests found matching your search"
                                  : "No employee requests found"}
                              </p>
                              {!searchQuery && (
                                <Button
                                  variant="link"
                                 
                                  onClick={() => router.push("/employee-request/new")}
                                >
                                  Create New Request
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRequests.map((request) => (
                          <TableRow
                            key={request.id}
                            className="cursor-pointer group"
                            onClick={() => router.push(`/employee-request/${request.id}`)}
                          >
                            {/* Code */}
                            <TableCell>
                              <span className="text-sm font-medium text-accent">
                                {request.code}
                              </span>
                            </TableCell>

                            {/* Position / Department */}
                            <TableCell>
                              <div className="space-y-0.5">
                                <p className="font-medium text-sm">
                                  {request.jobTitle?.name}
                                </p>
                                {(request.department?.name || request.division?.name) && (
                                  <p className="text-xs text-muted-foreground">
                                    {request.department?.name}
                                    {request.division?.name && ` • ${request.division.name}`}
                                  </p>
                                )}
                              </div>
                            </TableCell>

                            {/* Employment Type */}
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {request.employmentType &&
                                  (EMPLOYMENT_TYPE_LABELS[request.employmentType as EmploymentType] || request.employmentType)}
                              </span>
                            </TableCell>

                            {/* Quantity */}
                            <TableCell className="text-center">
                              <span className="font-medium">{request.quantity} HC</span>
                            </TableCell>

                            {/* Status */}
                            <TableCell>
                              {getStatusBadge(request.status)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </Card>
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
