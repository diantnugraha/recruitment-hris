"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Search,
  AlertCircle,
  Briefcase,
  Users,
  CheckCircle2,
  Target,
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
import { TuvBadge } from "@/components/shared/tuv-badge";

import { employeeRequestService } from "@/services/employee-request.service";
import {
  candidateService,
  type CandidateWithRelations,
} from "@/services/candidate.service";
import type { EmployeeRequestWithRelations } from "@/types/employee-request";
import {
  EMPLOYEE_REQUEST_STATUS,
  EMPLOYEE_REQUEST_STATUS_LABELS,
  type EmployeeRequestStatus,
} from "@/lib/constants/employeeRequest";
import {
  calculatePipelineStats,
  type PipelineStats,
} from "@/lib/utils/recruitmentHelpers";
import { SlaBadge } from "@/components/shared/SlaBadge";
import { useDebounce } from "@/hooks/use-debounce";

// --- Constants ---
const PAGE_LIMIT = 10;

// Extended type with candidates and pipeline stats
interface RecruitmentRequestRow extends EmployeeRequestWithRelations {
  candidates: CandidateWithRelations[];
  pipelineStats: PipelineStats;
}

// --- Status -> TuvBadge variant mapping ---
const STATUS_BADGE_VARIANT: Record<
  string,
  "success" | "danger" | "info" | "warning" | "dark" | "brand" | "purple" | "rose"
> = {
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

export default function RecruitmentPage() {
  const router = useRouter();

  // State
  const [requests, setRequests] = React.useState<RecruitmentRequestRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(PAGE_LIMIT);

  const debouncedSearch = useDebounce(searchQuery, 300);

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
    return {
      totalPositions: requests.reduce((sum, r) => sum + r.quantity, 0),
      totalRequests: requests.length,
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

  // Filtered data (search only, no status filter)
  const filteredRequests = React.useMemo(() => {
    let filtered = requests;

    if (debouncedSearch.length >= 2) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.recruitmentCode?.toLowerCase().includes(query) ||
          r.code.toLowerCase().includes(query) ||
          r.jobTitle?.name.toLowerCase().includes(query) ||
          r.department?.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [requests, debouncedSearch]);

  // Paginate
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRequests.slice(start, start + pageSize);
  }, [filteredRequests, currentPage, pageSize]);

  // Pagination computed
  const totalItems = filteredRequests.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Helpers
  const getStatusBadgeVariant = (status: string) => {
    return STATUS_BADGE_VARIANT[status] || "dark";
  };

  const getStatusLabel = (status: string) => {
    return (
      EMPLOYEE_REQUEST_STATUS_LABELS[status as EmployeeRequestStatus] || status
    );
  };

  const handleRefresh = () => {
    fetchData();
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
                Recruitment
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
              Track recruitment progress and manage candidates across positions.
            </p>
          </div>
        </div>

        {/* 2. Stats Cards -- TUV design */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          {[
            {
              label: "Open Positions",
              value: isLoading ? "-" : String(stats.totalPositions),
              icon: <Briefcase style={{ width: "18px", height: "18px" }} />,
              iconColor: "var(--hsd-ui-color-navy-500)",
              iconBg: "var(--hsd-ui-color-navy-50)",
            },
            {
              label: "Active Requests",
              value: isLoading ? "-" : String(stats.totalRequests),
              icon: <Target style={{ width: "18px", height: "18px" }} />,
              iconColor: "var(--hsd-ui-color-gray-700, #48504c)",
              iconBg: "var(--hsd-ui-color-yellow-50, #fffde6)",
            },
            {
              label: "Total Candidates",
              value: isLoading ? "-" : String(stats.totalCandidates),
              icon: <Users style={{ width: "18px", height: "18px" }} />,
              iconColor: "var(--hsd-ui-color-blue-800, #1565c0)",
              iconBg: "var(--hsd-ui-color-blue-50, #e3f2fd)",
            },
            {
              label: "Positions Filled",
              value: isLoading ? "-" : String(stats.positionsFilled),
              icon: <CheckCircle2 style={{ width: "18px", height: "18px" }} />,
              iconColor: "var(--hsd-ui-color-green-700, #186742)",
              iconBg: "var(--hsd-ui-color-lime-50, #f4fee6)",
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                }}
              >
                <span
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 400,
                    color: "var(--hsd-ui-color-gray-500)",
                  }}
                >
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
                style={{
                  width: "16px",
                  height: "16px",
                  color: "var(--hsd-ui-color-gray-400)",
                }}
              />
              <Input
                placeholder="Search by code, position, department..."
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
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: "48px 0",
                  }}
                >
                  <Loader2
                    className="animate-spin"
                    style={{
                      width: "24px",
                      height: "24px",
                      color: "var(--hsd-ui-color-navy-500)",
                    }}
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
                    style={{
                      width: "32px",
                      height: "32px",
                      color: "var(--hsd-ui-color-gray-400)",
                    }}
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
              ) : paginatedData.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "48px 0",
                    color: "var(--hsd-ui-color-gray-500)",
                    fontSize: "0.875rem",
                  }}
                >
                  {searchQuery
                    ? "No recruitment requests found matching your search"
                    : "No recruitment requests found"}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow
                      onMouseOver={undefined}
                      onMouseOut={undefined}
                      style={{
                        backgroundColor: "transparent",
                        borderBottom: "1px solid rgba(120, 134, 127, 0.2)",
                      }}
                    >
                      <TableHead style={{ width: "14%" }}>Code</TableHead>
                      <TableHead style={{ width: "18%" }}>Position</TableHead>
                      <TableHead style={{ width: "18%" }}>Department</TableHead>
                      <TableHead style={{ width: "10%", textAlign: "center" }}>
                        Qty
                      </TableHead>
                      <TableHead style={{ width: "12%" }}>SLA</TableHead>
                      <TableHead style={{ width: "14%" }}>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((row) => (
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
                            onClick={() =>
                              router.push(`/recruitment/request/${row.id}`)
                            }
                          >
                            {row.recruitmentCode
                              ? row.recruitmentCode
                                  .replace("REC-", "RC.")
                                  .replace(/-/g, "")
                              : row.code}
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
                          >
                            {row.jobTitle?.name || "No Data"}
                          </span>
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

                        {/* Qty */}
                        <TableCell style={{ textAlign: "center" }}>
                          <span
                            style={{
                              fontSize: "0.875rem",
                              fontWeight: 500,
                              color: "var(--hsd-ui-color-gray-700)",
                            }}
                          >
                            {row.quantity} Position
                          </span>
                        </TableCell>

                        {/* SLA */}
                        <TableCell>
                          <SlaBadge sla={row.sla} />
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
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "24px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 400,
                      color: "var(--hsd-ui-color-gray-400)",
                    }}
                  >
                    {startItem} - {endItem} of {totalItems}
                  </span>
                  <div
                    style={{
                      width: "1px",
                      height: "32px",
                      backgroundColor: "rgba(120, 134, 127, 0.15)",
                    }}
                  />
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
                          style={{
                            fontSize: "0.875rem",
                            padding: "8px 12px",
                          }}
                        >
                          {size} Per row
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Right: page numbers */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0",
                  }}
                >
                  {(() => {
                    const buildPageItems = (): (number | "dots")[] => {
                      if (totalPages <= 7) {
                        return Array.from(
                          { length: totalPages },
                          (_, i) => i + 1
                        );
                      }
                      const middle = Array.from(
                        { length: Math.min(3, totalPages - 2) },
                        (_, i) => Math.max(2, currentPage - 1) + i
                      ).filter((n) => n >= 2 && n <= totalPages - 1);

                      return [
                        1,
                        ...(middle[0] > 2 ? (["dots"] as const) : []),
                        ...middle,
                        ...(middle[middle.length - 1] < totalPages - 1
                          ? (["dots"] as const)
                          : []),
                        totalPages,
                      ];
                    };
                    const items = buildPageItems();

                    const pageBtn = (
                      num: number | "dots",
                      idx: number
                    ) => {
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
                            backgroundColor: isActive
                              ? "var(--hsd-ui-color-navy-500)"
                              : "transparent",
                            color: isActive
                              ? "#fff"
                              : "var(--hsd-ui-color-gray-900)",
                          }}
                        >
                          {num}
                        </button>
                      );
                    };

                    return (
                      <>
                        <button
                          onClick={() =>
                            currentPage > 1 &&
                            setCurrentPage(currentPage - 1)
                          }
                          disabled={currentPage === 1}
                          style={{
                            width: "36px",
                            height: "36px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "none",
                            background: "none",
                            cursor:
                              currentPage === 1 ? "default" : "pointer",
                            color:
                              currentPage === 1
                                ? "var(--hsd-ui-color-gray-300)"
                                : "var(--hsd-ui-color-gray-700)",
                            fontSize: "1.25rem",
                          }}
                        >
                          &#8249;
                        </button>
                        {items.map((item, idx) => pageBtn(item, idx))}
                        <button
                          onClick={() =>
                            currentPage < totalPages &&
                            setCurrentPage(currentPage + 1)
                          }
                          disabled={currentPage === totalPages}
                          style={{
                            width: "36px",
                            height: "36px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "none",
                            background: "none",
                            cursor:
                              currentPage === totalPages
                                ? "default"
                                : "pointer",
                            color:
                              currentPage === totalPages
                                ? "var(--hsd-ui-color-gray-300)"
                                : "var(--hsd-ui-color-gray-700)",
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
