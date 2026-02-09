"use client";

import * as React from "react";
import {
  Plus,
  Download,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Users,
  UserCheck,
  UserX,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { employees, departments, jobTitles } from "@/data/mock-data";
import { EmployeeWithRelations } from "@/types";
import { getInitials, formatShortDate } from "@/lib/utils";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "success" }> = {
  active: { label: "Active", variant: "success" },
  on_leave: { label: "On Leave", variant: "secondary" },
  inactive: { label: "Inactive", variant: "outline" },
  terminated: { label: "Terminated", variant: "outline" },
};

const stats = [
  {
    label: "Total Employees",
    value: employees.length,
    icon: Users,
    description: "All employees"
  },
  {
    label: "Active",
    value: employees.filter(e => e.status === "active").length,
    icon: UserCheck,
    description: "Currently working"
  },
  {
    label: "On Leave",
    value: employees.filter(e => e.status === "on_leave").length,
    icon: UserX,
    description: "Temporary leave"
  },
];

export default function EmployeesPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredData = React.useMemo(() => {
    if (!searchQuery) return employees;
    const query = searchQuery.toLowerCase();
    return employees.filter(
      (emp) =>
        emp.firstName.toLowerCase().includes(query) ||
        emp.lastName.toLowerCase().includes(query) ||
        emp.email.toLowerCase().includes(query) ||
        emp.employeeId.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const columns = [
    {
      key: "employee",
      label: "Employee",
      render: (_: unknown, row: EmployeeWithRelations) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-border">
            <AvatarFallback className="bg-accent/10 font-semibold text-xs text-accent">
              {getInitials(`${row.firstName} ${row.lastName}`)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{row.firstName} {row.lastName}</p>
            <p className="text-xs text-muted-foreground font-mono">{row.employeeId}</p>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      render: (_: unknown, row: EmployeeWithRelations) => (
        <span className="text-sm text-muted-foreground">{row.email}</span>
      ),
    },
    {
      key: "department",
      label: "Department",
      render: (_: unknown, row: EmployeeWithRelations) => (
        <span className="text-sm">{row.department?.name || "—"}</span>
      ),
    },
    {
      key: "position",
      label: "Position",
      render: (_: unknown, row: EmployeeWithRelations) => (
        <span className="text-sm">{row.jobTitle?.name || "—"}</span>
      ),
    },
    {
      key: "hireDate",
      label: "Hire Date",
      render: (_: unknown, row: EmployeeWithRelations) => (
        <span className="text-sm text-muted-foreground">{formatShortDate(row.hireDate)}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (_: unknown, row: EmployeeWithRelations) => {
        const config = statusConfig[row.status] || statusConfig.inactive;
        return (
          <Badge variant={config.variant}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      label: "",
      className: "w-10",
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
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <Header title="Employees" />
      <PageContainer>
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            {stats.map((stat, index) => (
              <div key={stat.label} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                <Card className={index === 0 ? "border-accent/20 bg-accent/5" : ""}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                        <p className={`mt-1 font-semibold text-3xl font-medium ${index === 0 ? "text-accent" : ""}`}>
                          {stat.value}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
                      </div>
                      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${index === 0 ? "bg-accent/10" : "bg-secondary"}`}>
                        <stat.icon className={`h-5 w-5 ${index === 0 ? "text-accent" : "text-muted-foreground"}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="animate-fade-in stagger-3">
            <DataTable
              data={paginatedData}
              columns={columns}
              searchable
              searchPlaceholder="Search by name, email, or ID..."
              onSearch={setSearchQuery}
              pagination
              pageSize={pageSize}
              totalItems={filteredData.length}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
              emptyMessage="No employees found"
              actions={
                <>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Employee
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle className="font-semibold text-xl">Add New Employee</DialogTitle>
                        <DialogDescription>
                          Add a new team member to your organization.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input id="firstName" placeholder="John" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input id="lastName" placeholder="Doe" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input id="email" type="email" placeholder="john.doe@company.com" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>Department</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select department" />
                              </SelectTrigger>
                              <SelectContent>
                                {departments.map((d) => (
                                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Job Title</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select title" />
                              </SelectTrigger>
                              <SelectContent>
                                {jobTitles.map((t) => (
                                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="hireDate">Start Date</Label>
                          <Input id="hireDate" type="date" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={() => setIsAddDialogOpen(false)}>
                          Add Employee
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              }
            />
          </div>
        </div>
      </PageContainer>
    </>
  );
}
