"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";

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
import { useOrganizationStore } from "@/stores/organization-store";
import { jobTitleService } from "@/services/job-title.service";
import { jobLevelService } from "@/services/job-level.service";
import { showToast } from "@/lib/utils/toast-messages";
import type { JobTitle } from "@/types";

// Helper to get department names from job title's many-to-many relation
function getDepartmentNames(row: JobTitle): string[] {
  if (row.departments && row.departments.length > 0) {
    return row.departments.map((d) => d.department.name);
  }
  return [];
}

function getTypeBadgeVariant(type: string): "brand" | "purple" | "dark" {
  if (type === "Administration") return "brand";
  if (type === "Technical") return "purple";
  return "dark";
}

export default function JobTitlesPage() {
  const router = useRouter();
  const {
    jobTitles,
    setJobTitles,
    jobLevels,
    setJobLevels,
    isLoading,
    setLoading,
  } = useOrganizationStore();

  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Fetch data on mount
  React.useEffect(() => {
    fetchJobTitles();
    fetchJobLevels();
  }, []);

  const fetchJobTitles = async () => {
    setLoading(true);
    const response = await jobTitleService.fetchAll();
    if (response.success && response.data) {
      setJobTitles(response.data);
    } else {
      showToast.fetchError("job titles", response.message);
      setJobTitles([]);
    }
    setLoading(false);
  };

  const fetchJobLevels = async () => {
    const response = await jobLevelService.fetchAll();
    if (response.success && response.data) {
      setJobLevels(response.data);
    }
  };

  const filteredData = React.useMemo(() => {
    const titleArray = Array.isArray(jobTitles) ? jobTitles : [];
    if (!searchQuery) return titleArray;
    const query = searchQuery.toLowerCase();
    return titleArray.filter((title) =>
      title.name?.toLowerCase().includes(query)
    );
  }, [searchQuery, jobTitles]);

  // Paginated data for current page
  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, pageSize]);

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const getJobLevelName = (row: JobTitle) => {
    return (
      row.jobLevel?.name ||
      jobLevels.find((level) => level.id === row.jobLevelId)?.name ||
      "No Data"
    );
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
                Job Titles
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
                {totalItems}
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
              Manage job titles, levels, and department assignments.
            </p>
          </div>
          <Button
            onClick={() => router.push("/organization/job-titles/new")}
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
            Create Job Title
          </Button>
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
                placeholder="Search job titles"
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
              ) : paginatedData.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "48px 0",
                    color: "var(--hsd-ui-color-gray-500)",
                    fontSize: "0.875rem",
                  }}
                >
                  No job titles found
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
                      <TableHead style={{ width: "30%" }}>Job Title</TableHead>
                      <TableHead style={{ width: "20%" }}>Level</TableHead>
                      <TableHead style={{ width: "30%" }}>Department</TableHead>
                      <TableHead style={{ width: "20%" }}>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((row) => (
                      <TableRow key={row.id}>
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
                              router.push(
                                `/organization/job-titles/${row.id}`
                              )
                            }
                          >
                            {row.name}
                          </button>
                        </TableCell>
                        <TableCell>
                          <TuvBadge
                            text={getJobLevelName(row)}
                            variant="info"
                            size="sm"
                            border
                          />
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const names = getDepartmentNames(row);
                            if (names.length === 0) {
                              return (
                                <span
                                  style={{
                                    fontSize: "0.875rem",
                                    fontWeight: 400,
                                    color: "var(--hsd-ui-color-gray-400)",
                                  }}
                                >
                                  No Data
                                </span>
                              );
                            }
                            return (
                              <div
                                style={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: "4px",
                                }}
                              >
                                {names.map((name) => (
                                  <TuvBadge
                                    key={name}
                                    text={name}
                                    variant="dark"
                                    size="sm"
                                    border
                                  />
                                ))}
                              </div>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          {row.type ? (
                            <TuvBadge
                              text={row.type}
                              variant={getTypeBadgeVariant(row.type)}
                              size="sm"
                              border
                            />
                          ) : (
                            <span
                              style={{
                                fontSize: "0.875rem",
                                fontWeight: 400,
                                color: "var(--hsd-ui-color-gray-400)",
                              }}
                            >
                              No Data
                            </span>
                          )}
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
                    // Build page items with dots like TUV Pagination
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
