"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  FileText,
  Users,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

import { formatShortDate } from "@/lib/utils";
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
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[140px]">Code</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead>Position</TableHead>
            <TableHead className="w-[100px]">Type</TableHead>
            <TableHead className="w-[80px] text-center">Qty</TableHead>
            <TableHead className="w-[120px]">Created</TableHead>
            <TableHead className="w-[60px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[1, 2, 3, 4, 5].map((i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-5 w-28" /></TableCell>
              <TableCell><Skeleton className="h-5 w-20" /></TableCell>
              <TableCell>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </TableCell>
              <TableCell><Skeleton className="h-5 w-20" /></TableCell>
              <TableCell><Skeleton className="h-5 w-8 mx-auto" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-8 w-8" /></TableCell>
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
              <RefreshCw className="mr-2 h-4 w-4" />
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
        <div className="space-y-8">
          {/* Stats */}
          {isLoading ? (
            <StatsSkeletonCards />
          ) : (
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="animate-fade-in">
                <Card className="border-accent/20 bg-accent/5">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          Total Requests
                        </p>
                        <p className="mt-1 font-semibold text-3xl text-accent">
                          {stats.total}
                        </p>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10">
                        <FileText className="h-5 w-5 text-accent" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="animate-fade-in" style={{ animationDelay: "50ms" }}>
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          Pending Review
                        </p>
                        <p className="mt-1 font-semibold text-3xl">{stats.pending}</p>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="animate-fade-in" style={{ animationDelay: "100ms" }}>
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          Approved
                        </p>
                        <p className="mt-1 font-semibold text-3xl">{stats.approved}</p>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
                        <CheckCircle className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="animate-fade-in" style={{ animationDelay: "150ms" }}>
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          Rejected
                        </p>
                        <p className="mt-1 font-semibold text-3xl">{stats.rejected}</p>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
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
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Button>
          </div>

          {/* Table */}
          <div>
              {isLoading ? (
                <TableSkeletonRows />
              ) : (
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[140px]">Code</TableHead>
                        <TableHead className="w-[100px]">Status</TableHead>
                        <TableHead>Position / Department</TableHead>
                        <TableHead className="w-[100px]">Type</TableHead>
                        <TableHead className="w-[80px] text-center">Qty</TableHead>
                        <TableHead className="w-[150px]">Requested By</TableHead>
                        <TableHead className="w-[100px]">Created</TableHead>
                        <TableHead className="w-[60px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="h-32 text-center">
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
                                  size="sm"
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
                              <span className="font-mono text-sm font-medium text-accent">
                                {request.code}
                              </span>
                            </TableCell>

                            {/* Status */}
                            <TableCell>
                              {getStatusBadge(request.status)}
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
                              <span className="font-medium">{request.quantity}</span>
                            </TableCell>

                            {/* Requested By */}
                            <TableCell>
                              <div className="space-y-0.5">
                                <p className="text-sm">{request.requestedByName}</p>
                                {request.candidateCount !== undefined && request.candidateCount > 0 && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Users className="h-3 w-3" />
                                    {request.candidateCount} candidates
                                  </div>
                                )}
                              </div>
                            </TableCell>

                            {/* Created Date */}
                            <TableCell>
                              <span className="text-sm text-muted-foreground whitespace-nowrap">
                                {formatShortDate(request.createdAt)}
                              </span>
                            </TableCell>

                            {/* Actions */}
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => router.push(`/employee-request/${request.id}`)}
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  {["draft", "revise"].includes(request.status) && (
                                    <DropdownMenuItem
                                      onClick={() => router.push(`/employee-request/${request.id}/edit`)}
                                    >
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  {["draft"].includes(request.status) && (
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => setDeleteRequest(request)}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
