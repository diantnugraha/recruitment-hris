"use client";

import * as React from "react";
import {
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Layers,
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
import { divisions, organizations, departments, employees } from "@/data/mock-data";
import { Division } from "@/types";
import { formatShortDate } from "@/lib/utils";

export default function DivisionsPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredData = React.useMemo(() => {
    if (!searchQuery) return divisions;
    const query = searchQuery.toLowerCase();
    return divisions.filter(
      (div) =>
        div.name.toLowerCase().includes(query) ||
        div.code.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const getOrganizationName = (orgId: string) => {
    return organizations.find((org) => org.id === orgId)?.name || "-";
  };

  const getDepartmentCount = (divId: string) => {
    return departments.filter((dept) => dept.divisionId === divId).length;
  };

  const getEmployeeCount = (divId: string) => {
    return employees.filter((emp) => emp.divisionId === divId).length;
  };

  const columns = [
    {
      key: "name",
      label: "Division",
      render: (_: unknown, row: Division) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary">
            <Layers className="h-4 w-4 text-muted-foreground" />
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
      render: (_: unknown, row: Division) => (
        <Badge variant="outline">{row.code}</Badge>
      ),
    },
    {
      key: "organization",
      label: "Organization",
      render: (_: unknown, row: Division) => (
        <span className="text-sm">{getOrganizationName(row.organizationId)}</span>
      ),
    },
    {
      key: "departments",
      label: "Departments",
      render: (_: unknown, row: Division) => (
        <span className="text-sm">{getDepartmentCount(row.id)}</span>
      ),
    },
    {
      key: "employees",
      label: "Employees",
      render: (_: unknown, row: Division) => (
        <span className="text-sm">{getEmployeeCount(row.id)}</span>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      render: (_: unknown, row: Division) => (
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
      <Header title="Divisions" />
      <PageContainer>
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
                  <Layers className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{divisions.length}</p>
                  <p className="text-sm text-muted-foreground">Total Divisions</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">
                    {employees.filter((e) => e.status === "active").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Employees</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
                  <Layers className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{departments.length}</p>
                  <p className="text-sm text-muted-foreground">Total Departments</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <DataTable
            data={filteredData}
            columns={columns}
            searchable
            searchPlaceholder="Search divisions..."
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
            emptyMessage="No divisions found"
            actions={
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Division
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Division</DialogTitle>
                    <DialogDescription>
                      Create a new division in your organization.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" placeholder="Enter division name" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="code">Code</Label>
                      <Input id="code" placeholder="Enter division code" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="organization">Organization</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select organization" />
                        </SelectTrigger>
                        <SelectContent>
                          {organizations.map((org) => (
                            <SelectItem key={org.id} value={org.id}>
                              {org.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      Add Division
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
