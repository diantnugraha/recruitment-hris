"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useOrganizationStore } from "@/stores/organization-store";
import { jobTitleService } from "@/services/job-title.service";
import { jobLevelService } from "@/services/job-level.service";
import { showToast } from "@/lib/utils/toast-messages";
import { JobTitle } from "@/types";

// Helper to get department names from job title's many-to-many relation
function getDepartmentNames(row: JobTitle): string[] {
  if (row.departments && row.departments.length > 0) {
    return row.departments.map((d) => d.department.name);
  }
  return [];
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
    return titleArray.filter(
      (title) => title.name?.toLowerCase().includes(query)
    );
  }, [searchQuery, jobTitles]);

  // Paginated data for current page
  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, pageSize]);

  const getJobLevelName = (row: JobTitle) => {
    return row.jobLevel?.name || jobLevels.find((level) => level.id === row.jobLevelId)?.name || "-";
  };

  const columns = [
    {
      key: "name",
      label: "Job Title",
      render: (row: JobTitle) => (
        <button
          type="button"
          className="font-medium text-accent hover:underline text-left"
          onClick={() => router.push(`/organization/job-titles/${row.id}`)}
        >
          {row.name}
        </button>
      ),
    },
    {
      key: "level",
      label: "Level",
      render: (row: JobTitle) => (
        <Badge variant="secondary">{getJobLevelName(row)}</Badge>
      ),
    },
    {
      key: "department",
      label: "Department",
      render: (row: JobTitle) => {
        const names = getDepartmentNames(row);
        if (names.length === 0) return <span className="text-sm text-muted-foreground">-</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {names.map((name) => (
              <Badge key={name} variant="outline" className="text-xs">
                {name}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      key: "type",
      label: "Type",
      render: (row: JobTitle) => (
        row.type ? (
          <Badge variant={row.type === "Administration" ? "default" : "secondary"}>
            {row.type}
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )
      ),
    },
  ];

  return (
    <>
      <Header title="Position" />
      <PageContainer>
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Job Titles</h2>
            <p className="text-sm text-muted-foreground">Manage job titles, levels, and department assignments.</p>
          </div>

          {/* Table */}
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
              searchPlaceholder="Search job titles..."
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
              emptyMessage="No job titles found"
              actions={
                <Button onClick={() => router.push("/organization/job-titles/new")}>
                  New
                </Button>
              }
            />
          )}
        </div>
      </PageContainer>
    </>
  );
}
