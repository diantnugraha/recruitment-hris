"use client";

import * as React from "react";
import {
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Briefcase,
  Users,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { jobTitles, jobLevels, departments, employees } from "@/data/mock-data";
import { JobTitle } from "@/types";
import { formatShortDate } from "@/lib/utils";

export default function JobTitlesPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredData = React.useMemo(() => {
    if (!searchQuery) return jobTitles;
    const query = searchQuery.toLowerCase();
    return jobTitles.filter(
      (title) =>
        title.name.toLowerCase().includes(query) ||
        title.code.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const getJobLevelName = (levelId: string) => {
    return jobLevels.find((level) => level.id === levelId)?.name || "-";
  };

  const getDepartmentName = (deptId?: string) => {
    if (!deptId) return "All Departments";
    return departments.find((dept) => dept.id === deptId)?.name || "-";
  };

  const getEmployeeCount = (titleId: string) => {
    return employees.filter((emp) => emp.jobTitleId === titleId).length;
  };

  const columns = [
    {
      key: "name",
      label: "Job Title",
      render: (_: unknown, row: JobTitle) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">{row.name}</p>
            <p className="text-xs text-muted-foreground">{row.description}</p>
          </div>
        </div>
      ),
    },
    {
      key: "code",
      label: "Code",
      render: (_: unknown, row: JobTitle) => (
        <Badge variant="outline">{row.code}</Badge>
      ),
    },
    {
      key: "level",
      label: "Level",
      render: (_: unknown, row: JobTitle) => (
        <Badge variant="secondary">{getJobLevelName(row.jobLevelId)}</Badge>
      ),
    },
    {
      key: "department",
      label: "Department",
      render: (_: unknown, row: JobTitle) => (
        <span className="text-sm">{getDepartmentName(row.departmentId)}</span>
      ),
    },
    {
      key: "employees",
      label: "Employees",
      render: (_: unknown, row: JobTitle) => (
        <span className="text-sm">{getEmployeeCount(row.id)}</span>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      render: (_: unknown, row: JobTitle) => (
        <span className="text-sm text-muted-foreground">
          {formatShortDate(row.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      className: "w-[50px]",
      render: () => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <Header title="Job Titles" />
      <PageContainer>
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{jobTitles.length}</p>
                  <p className="text-sm text-muted-foreground">Total Job Titles</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{employees.length}</p>
                  <p className="text-sm text-muted-foreground">Assigned Employees</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <DataTable
            data={filteredData}
            columns={columns}
            searchable
            searchPlaceholder="Search job titles..."
            onSearch={setSearchQuery}
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
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Job Title
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add New Job Title</DialogTitle>
                    <DialogDescription>
                      Create a new job title for your organization.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" placeholder="Enter job title" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="code">Code</Label>
                        <Input id="code" placeholder="Enter code" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="level">Job Level</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            {jobLevels.map((level) => (
                              <SelectItem key={level.id} value={level.id}>
                                {level.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="department">Department</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Departments</SelectItem>
                            {departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Enter description"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="responsibilities">Responsibilities</Label>
                      <Textarea
                        id="responsibilities"
                        placeholder="Enter responsibilities (one per line)"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="requirements">Requirements</Label>
                      <Textarea
                        id="requirements"
                        placeholder="Enter requirements (one per line)"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={() => setIsAddDialogOpen(false)}>
                      Add Job Title
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            }
          />
        </div>
      </PageContainer>
    </>
  );
}
