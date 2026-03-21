"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  AlertCircle,
  Users,
  Briefcase,
  CheckCircle2,
  Target,
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

import { employeeRequestService } from "@/services/employee-request.service";
import {
  candidateService,
  type CandidateWithRelations,
} from "@/services/candidate.service";
import type { EmployeeRequestWithRelations } from "@/types/employee-request";
import {
  EMPLOYEE_REQUEST_STATUS,
  EMPLOYEE_REQUEST_STATUS_CONFIG,
} from "@/lib/constants/employeeRequest";
import {
  calculatePipelineStats,
  type PipelineStats,
} from "@/lib/utils/recruitmentHelpers";

// Extended type with candidates and pipeline stats
interface RecruitmentRequestRow extends EmployeeRequestWithRelations {
  candidates: CandidateWithRelations[];
  pipelineStats: PipelineStats;
}

// --- Table Columns (module level) ---
const columns = [
  {
    key: "recruitmentCode",
    label: "Code",
    className: "w-1/5",
    render: (row: RecruitmentRequestRow) => (
      <Link
        href={`/recruitment/request/${row.id}`}
        className="font-medium text-accent hover:underline"
      >
        {row.recruitmentCode
          ? row.recruitmentCode.replace("REC-", "RC.").replace(/-/g, "")
          : row.code}
      </Link>
    ),
  },
  {
    key: "jobTitle",
    label: "Position",
    className: "w-1/5",
    render: (row: RecruitmentRequestRow) => (
      <span className="text-sm font-medium">
        {row.jobTitle?.name || "Unknown Position"}
      </span>
    ),
  },
  {
    key: "department",
    label: "Department",
    className: "w-1/5",
    render: (row: RecruitmentRequestRow) => (
      <div className="space-y-0.5">
        <p className="text-sm">{row.department?.name || "—"}</p>
        {row.division?.name && (
          <p className="text-xs text-muted-foreground">{row.division.name}</p>
        )}
      </div>
    ),
  },
  {
    key: "quantity",
    label: "Qty",
    className: "w-1/5 text-center",
    render: (row: RecruitmentRequestRow) => (
      <span className="font-medium">{row.quantity} HC</span>
    ),
  },
  {
    key: "status",
    label: "Status",
    className: "w-1/5",
    render: (row: RecruitmentRequestRow) => {
      const config = EMPLOYEE_REQUEST_STATUS_CONFIG[row.status];
      return (
        <Badge variant={config?.variant || "secondary"} className="text-xs">
          {config?.label || row.status}
        </Badge>
      );
    },
  },
];

export default function RecruitmentPage() {
  const router = useRouter();

  // State
  const [requests, setRequests] = React.useState<RecruitmentRequestRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  // Fetch data
  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [approvedRes, inRecruitmentRes, completedRes] = await Promise.all([
        employeeRequestService.getAll(1, 100, {
          status: EMPLOYEE_REQUEST_STATUS.APPROVED,
        }),
        employeeRequestService.getAll(1, 100, {
          status: EMPLOYEE_REQUEST_STATUS.IN_RECRUITMENT,
        }),
        employeeRequestService.getAll(1, 100, {
          status: EMPLOYEE_REQUEST_STATUS.COMPLETED,
        }),
      ]);

      const allRequests: EmployeeRequestWithRelations[] = [];

      if (approvedRes.success && approvedRes.data) {
        allRequests.push(...approvedRes.data.data);
      }
      if (inRecruitmentRes.success && inRecruitmentRes.data) {
        allRequests.push(...inRecruitmentRes.data.data);
      }
      if (completedRes.success && completedRes.data) {
        allRequests.push(...completedRes.data.data);
      }

      // Fetch candidates for each employee request and calculate stats
      const requestsWithData = await Promise.all(
        allRequests.map(async (request) => {
          const employeeRequestId = Number(request.id);

          const candidatesRes = await candidateService.getByEmployeeRequest(
            employeeRequestId,
            1,
            100
          );

          const candidates =
            candidatesRes.success && candidatesRes.data
              ? candidatesRes.data.data
              : [];
          const pipelineStats = calculatePipelineStats(candidates);

          return {
            ...request,
            candidates,
            pipelineStats,
          };
        })
      );

      setRequests(requestsWithData);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("Failed to load recruitment data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate summary stats
  const stats = React.useMemo(() => {
    const approved = requests.filter(
      (r) => r.status === EMPLOYEE_REQUEST_STATUS.APPROVED
    );
    const inRecruitment = requests.filter(
      (r) => r.status === EMPLOYEE_REQUEST_STATUS.IN_RECRUITMENT
    );
    const completed = requests.filter(
      (r) => r.status === EMPLOYEE_REQUEST_STATUS.COMPLETED
    );

    return {
      totalRequests: requests.length,
      approvedCount: approved.length,
      inRecruitmentCount: inRecruitment.length,
      completedCount: completed.length,
      totalPositions: requests.reduce((sum, r) => sum + r.quantity, 0),
      totalCandidates: requests.reduce(
        (sum, r) => sum + r.pipelineStats.total,
        0
      ),
      positionsFilled: requests.reduce(
        (sum, r) => sum + r.pipelineStats.passed,
        0
      ),
    };
  }, [requests]);

  // Filtered data
  const filteredRequests = React.useMemo(() => {
    let filtered = requests;

    if (statusFilter === "approved") {
      filtered = filtered.filter(
        (r) => r.status === EMPLOYEE_REQUEST_STATUS.APPROVED
      );
    } else if (statusFilter === "in_recruitment") {
      filtered = filtered.filter(
        (r) => r.status === EMPLOYEE_REQUEST_STATUS.IN_RECRUITMENT
      );
    } else if (statusFilter === "completed") {
      filtered = filtered.filter(
        (r) => r.status === EMPLOYEE_REQUEST_STATUS.COMPLETED
      );
    }

    if (searchQuery.length >= 2) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.recruitmentCode?.toLowerCase().includes(query) ||
          r.code.toLowerCase().includes(query) ||
          r.jobTitle?.name.toLowerCase().includes(query) ||
          r.department?.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [requests, statusFilter, searchQuery]);

  // Paginate
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRequests.slice(start, start + pageSize);
  }, [filteredRequests, currentPage, pageSize]);

  // Error state
  if (error && !isLoading) {
    return (
      <>
        <Header title="Recruitment" />
        <PageContainer>
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={fetchData}>Try Again</Button>
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Header title="Recruitment" />
      <PageContainer>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-lg font-semibold text-foreground">Recruitment Overview</h2>
            <p className="text-sm text-muted-foreground">Track recruitment progress and manage candidates across positions.</p>
          </div>

          {/* Stats */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  <div className="flex w-12 shrink-0 items-center justify-center bg-accent/10">
                    <Briefcase className="h-4 w-4 text-accent" />
                  </div>
                  <div className="flex-1 px-3 py-2.5">
                    <p className="text-[11px] font-medium text-muted-foreground">Open Positions</p>
                    <p className="text-lg font-bold tabular-nums">
                      {isLoading ? "-" : stats.totalPositions}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  <div className="flex w-12 shrink-0 items-center justify-center bg-amber-500/10">
                    <Target className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="flex-1 px-3 py-2.5">
                    <p className="text-[11px] font-medium text-muted-foreground">Active Requests</p>
                    <p className="text-lg font-bold tabular-nums">
                      {isLoading ? "-" : stats.totalRequests}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  <div className="flex w-12 shrink-0 items-center justify-center bg-blue-500/10">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 px-3 py-2.5">
                    <p className="text-[11px] font-medium text-muted-foreground">Total Candidates</p>
                    <p className="text-lg font-bold tabular-nums">
                      {isLoading ? "-" : stats.totalCandidates}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  <div className="flex w-12 shrink-0 items-center justify-center bg-emerald-500/10">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 px-3 py-2.5">
                    <p className="text-[11px] font-medium text-muted-foreground">Positions Filled</p>
                    <p className="text-lg font-bold tabular-nums text-emerald-600">
                      {isLoading ? "-" : stats.positionsFilled}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <div>
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
                searchPlaceholder="Search by code, position, department..."
                onSearch={(value) => {
                  setSearchQuery(value);
                  setCurrentPage(1);
                }}
                pagination
                pageSize={pageSize}
                totalItems={filteredRequests.length}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                emptyMessage={
                  statusFilter === "approved"
                    ? "No approved requests"
                    : statusFilter === "in_recruitment"
                    ? "No requests in recruitment"
                    : statusFilter === "completed"
                    ? "No completed requests"
                    : "No recruitment requests found"
                }
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
                          <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="in_recruitment">Recruiting</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
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
              />
            )}
          </div>
        </div>
      </PageContainer>
    </>
  );
}
