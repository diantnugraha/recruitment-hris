"use client";

import * as React from "react";
import {
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Award,
  TrendingUp,
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
import { jobLevels, employees } from "@/data/mock-data";
import { JobLevel } from "@/types";
import { formatCurrency, formatShortDate } from "@/lib/utils";

export default function JobLevelsPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredData = React.useMemo(() => {
    if (!searchQuery) return jobLevels;
    const query = searchQuery.toLowerCase();
    return jobLevels.filter(
      (level) =>
        level.name.toLowerCase().includes(query) ||
        level.code.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const getEmployeeCount = (levelId: string) => {
    return employees.filter((emp) => emp.jobLevelId === levelId).length;
  };

  const columns = [
    {
      key: "name",
      label: "Level",
      render: (_: unknown, row: JobLevel) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary">
            <Award className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{row.name}</p>
              <Badge variant="secondary" className="text-xs">
                L{row.level}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{row.description}</p>
          </div>
        </div>
      ),
    },
    {
      key: "code",
      label: "Code",
      render: (_: unknown, row: JobLevel) => (
        <Badge variant="outline">{row.code}</Badge>
      ),
    },
    {
      key: "salaryRange",
      label: "Salary Range",
      render: (_: unknown, row: JobLevel) => (
        <div className="text-sm">
          <span>{row.minSalary ? formatCurrency(row.minSalary) : "-"}</span>
          <span className="text-muted-foreground"> - </span>
          <span>{row.maxSalary ? formatCurrency(row.maxSalary) : "-"}</span>
        </div>
      ),
    },
    {
      key: "employees",
      label: "Employees",
      render: (_: unknown, row: JobLevel) => (
        <span className="text-sm">{getEmployeeCount(row.id)}</span>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      render: (_: unknown, row: JobLevel) => (
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
      <Header title="Job Levels" />
      <PageContainer>
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
                  <Award className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{jobLevels.length}</p>
                  <p className="text-sm text-muted-foreground">Total Levels</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{jobLevels.length}</p>
                  <p className="text-sm text-muted-foreground">Career Paths</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <DataTable
            data={filteredData}
            columns={columns}
            searchable
            searchPlaceholder="Search job levels..."
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
            emptyMessage="No job levels found"
            actions={
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Job Level
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Job Level</DialogTitle>
                    <DialogDescription>
                      Create a new job level for your organization.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" placeholder="Enter level name" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="code">Code</Label>
                        <Input id="code" placeholder="Enter level code" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="level">Level Number</Label>
                      <Input
                        id="level"
                        type="number"
                        min="1"
                        placeholder="Enter level number"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="minSalary">Min Salary</Label>
                        <Input
                          id="minSalary"
                          type="number"
                          placeholder="Minimum salary"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="maxSalary">Max Salary</Label>
                        <Input
                          id="maxSalary"
                          type="number"
                          placeholder="Maximum salary"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Enter description"
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
                      Add Job Level
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
