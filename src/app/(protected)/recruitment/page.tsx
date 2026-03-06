"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  AlertCircle,
  Users,
  Search,
  Building2,
  Calendar,
  Briefcase,
  CheckCircle2,
  Eye,
  Target,
  Mail,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { employeeRequestService } from "@/services/employee-request.service";
import {
  candidateService,
  type CandidateWithRelations,
} from "@/services/candidate.service";
import type { EmployeeRequestWithRelations } from "@/types/employee-request";
import {
  EMPLOYEE_REQUEST_STATUS,
  EMPLOYEE_REQUEST_STATUS_CONFIG,
  type EmployeeRequestStatus,
} from "@/lib/constants/employeeRequest";
import { formatShortDate } from "@/lib/utils";
import {
  calculatePipelineStats,
  type PipelineStats,
} from "@/lib/utils/recruitmentHelpers";

// Extended type with candidates and pipeline stats
interface RecruitmentRequestRow extends EmployeeRequestWithRelations {
  candidates: CandidateWithRelations[];
  pipelineStats: PipelineStats;
}

// Status filter type
type StatusFilter = "all" | "approved" | "in_recruitment";

export default function RecruitmentPage() {
  const router = useRouter();

  // State
  const [requests, setRequests] = React.useState<RecruitmentRequestRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");

  // Fetch data
  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch employee requests that are approved or in_recruitment
      const [approvedRes, inRecruitmentRes] = await Promise.all([
        employeeRequestService.getAll(1, 100, {
          status: EMPLOYEE_REQUEST_STATUS.APPROVED,
        }),
        employeeRequestService.getAll(1, 100, {
          status: EMPLOYEE_REQUEST_STATUS.IN_RECRUITMENT,
        }),
      ]);

      const allRequests: EmployeeRequestWithRelations[] = [];

      if (approvedRes.success && approvedRes.data) {
        allRequests.push(...approvedRes.data.data);
      }
      if (inRecruitmentRes.success && inRecruitmentRes.data) {
        allRequests.push(...inRecruitmentRes.data.data);
      }

      // Debug: Log employee requests
      console.log("Employee Requests fetched:", allRequests.map(r => ({
        id: r.id,
        numericId: Number(r.id),
        code: r.code,
        status: r.status
      })));

      // Fetch candidates for each employee request and calculate stats
      const requestsWithData = await Promise.all(
        allRequests.map(async (request) => {
          const employeeRequestId = Number(request.id);
          console.log(`Fetching candidates for employee_request_id: ${employeeRequestId}`);

          const candidatesRes = await candidateService.getByEmployeeRequest(
            employeeRequestId,
            1,
            100
          );

          // Debug: Log result
          console.log(`Candidates for ${request.code} (id=${request.id}):`, {
            success: candidatesRes.success,
            count: candidatesRes.data?.data?.length || 0,
            message: candidatesRes.message || 'OK'
          });

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

    return {
      totalRequests: requests.length,
      approvedCount: approved.length,
      inRecruitmentCount: inRecruitment.length,
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

    // Status filter
    if (statusFilter === "approved") {
      filtered = filtered.filter(
        (r) => r.status === EMPLOYEE_REQUEST_STATUS.APPROVED
      );
    } else if (statusFilter === "in_recruitment") {
      filtered = filtered.filter(
        (r) => r.status === EMPLOYEE_REQUEST_STATUS.IN_RECRUITMENT
      );
    }

    // Search filter
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

  // Get status badge
  const getStatusBadge = (status: EmployeeRequestStatus) => {
    const config = EMPLOYEE_REQUEST_STATUS_CONFIG[status];
    return (
      <Badge variant={config?.variant || "secondary"} className="text-xs">
        {config?.label || status}
      </Badge>
    );
  };

  // Handle row click
  const handleRowClick = (requestId: string) => {
    router.push(`/recruitment/request/${requestId}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <>
        <Header title="Recruitment" />
        <PageContainer>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </PageContainer>
      </>
    );
  }

  // Error state
  if (error) {
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
          {/* Stats Summary */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Positions */}
            <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                      Open Positions
                    </p>
                    <p className="mt-1 font-semibold text-3xl text-accent">
                      {stats.totalPositions}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                    <Briefcase className="h-6 w-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Requests */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                      Active Requests
                    </p>
                    <p className="mt-1 font-semibold text-3xl">
                      {stats.totalRequests}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>Approved: {stats.approvedCount}</span>
                      <span className="text-border">|</span>
                      <span>Recruiting: {stats.inRecruitmentCount}</span>
                    </div>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                    <Target className="h-6 w-6 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Candidates */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                      Total Candidates
                    </p>
                    <p className="mt-1 font-semibold text-3xl">
                      {stats.totalCandidates}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Positions Filled */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                      Positions Filled
                    </p>
                    <p className="mt-1 font-semibold text-3xl text-emerald-600">
                      {stats.positionsFilled}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by code, position, department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-[300px]"
                />
              </div>
              <Tabs
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as StatusFilter)}
              >
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="approved">Approved</TabsTrigger>
                  <TabsTrigger value="in_recruitment">Recruiting</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[180px]">Recruitment Code</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead className="w-[100px]">Qty</TableHead>
                  <TableHead className="w-[120px]">Candidates</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[130px]">Expected Date</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Briefcase className="h-10 w-10 text-muted-foreground/30" />
                        <p className="text-muted-foreground">
                          {statusFilter === "approved"
                            ? "No approved requests"
                            : statusFilter === "in_recruitment"
                            ? "No requests in recruitment"
                            : "No recruitment requests found"}
                        </p>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => router.push("/employee-request")}
                        >
                          Go to Employee Requests
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request) => (
                    <TableRow
                      key={request.id}
                      className="cursor-pointer group"
                      onClick={() => handleRowClick(request.id)}
                    >
                      {/* Recruitment Code */}
                      <TableCell>
                        <div className="text-sm font-medium text-accent">
                          {request.recruitmentCode
                            ? request.recruitmentCode
                                .replace("REC-", "RC.")
                                .replace(/-/g, "")
                            : request.code}
                        </div>
                      </TableCell>

                      {/* Position & Department */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {request.jobTitle?.name || "Unknown Position"}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Building2 className="h-3.5 w-3.5" />
                            {request.department?.name || "—"}
                          </div>
                        </div>
                      </TableCell>

                      {/* Quantity */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{request.quantity}</span>
                        </div>
                      </TableCell>

                      {/* Candidates Count */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-foreground">
                              {request.pipelineStats.passed}
                            </span>
                            <span className="text-muted-foreground">/</span>
                            <span className="text-muted-foreground">
                              {request.quantity}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              filled
                            </span>
                          </div>
                          {request.pipelineStats.total > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {request.pipelineStats.total} candidate
                              {request.pipelineStats.total !== 1 ? "s" : ""}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>{getStatusBadge(request.status)}</TableCell>

                      {/* Expected Date */}
                      <TableCell>
                        {request.expectedOnboardDate ? (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatShortDate(request.expectedOnboardDate)}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/recruitment/request/${request.id}`);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>

          {/* Info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>
              Click on a request to view details and send invitation to
              candidates
            </span>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
