"use client";

import * as React from "react";
import Link from "next/link";
import {
  Download,
  Eye,
  Pencil,
  Trash2,
  Users,
  UserCheck,
  UserX,
  Loader2,
  MoreHorizontal,
  Briefcase,
  ShieldCheck,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useEmployeeStore } from "@/stores/employee-store";
import employeeService from "@/services/employee.service";
import {
  EmployeeWithRelations,
  EmployeeStatus,
} from "@/types";
import { getInitials, formatShortDate } from "@/lib/utils";
import { showToast } from "@/lib/utils/toast-messages";

// --- Constants ---

const EMPLOYEE_STATUSES: { value: EmployeeStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "permanent", label: "Permanent" },
  { value: "contract", label: "Contract" },
  { value: "probation", label: "Probation" },
  { value: "outsource", label: "Outsource" },
  { value: "on_leave", label: "On Leave" },
  { value: "inactive", label: "Inactive" },
  { value: "terminated", label: "Terminated" },
  { value: "exit", label: "Exit" },
];

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "success" }
> = {
  active: { label: "Active", variant: "success" },
  permanent: { label: "Permanent", variant: "success" },
  contract: { label: "Contract", variant: "default" },
  probation: { label: "Probation", variant: "secondary" },
  outsource: { label: "Outsource", variant: "secondary" },
  on_leave: { label: "On Leave", variant: "secondary" },
  inactive: { label: "Inactive", variant: "outline" },
  terminated: { label: "Terminated", variant: "outline" },
  exit: { label: "Exit", variant: "outline" },
};

function getStatusConfig(status: string) {
  return (
    statusConfig[status] ?? {
      label: status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      variant: "secondary" as const,
    }
  );
}

// Active statuses for counting
const ACTIVE_STATUSES = new Set<string>(["active", "permanent", "contract", "probation", "outsource"]);

export default function EmployeesPage() {
  // Store
  const {
    employees,
    setEmployees,
    deleteEmployee,
    isLoading,
    setLoading,
    error,
    setError,
  } = useEmployeeStore();

  // Local state
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  // Delete dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedEmployee, setSelectedEmployee] =
    React.useState<EmployeeWithRelations | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Fetch all employees (multi-page)
  const fetchEmployees = React.useCallback(async () => {
    const PAGE_LIMIT = 100;

    setLoading(true);
    setError(null);

    const firstPage = await employeeService.getAll(1, PAGE_LIMIT);

    if (!firstPage.success || !firstPage.data) {
      setError(firstPage.message || "Failed to fetch employees");
      setEmployees([]);
      setLoading(false);
      showToast.fetchError("employees", firstPage.message);
      return;
    }

    const { data: firstPageData, pagination } = firstPage.data;
    const totalPages = pagination?.totalPages ?? 1;

    if (totalPages <= 1) {
      setEmployees(firstPageData);
      setLoading(false);
      return;
    }

    const remainingPages = Array.from(
      { length: totalPages - 1 },
      (_, i) => i + 2
    );

    const remainingResponses = await Promise.all(
      remainingPages.map((page) => employeeService.getAll(page, PAGE_LIMIT))
    );

    const allEmployees = [
      ...firstPageData,
      ...remainingResponses.flatMap((res) =>
        res.success && res.data ? res.data.data : []
      ),
    ];

    setEmployees(allEmployees);
    setLoading(false);
  }, [setEmployees, setLoading, setError]);

  // Initial fetch
  React.useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Filter and pagination
  const filteredData = React.useMemo(() => {
    const empArray = Array.isArray(employees) ? employees : [];
    let result = empArray;

    // Status filter
    if (statusFilter && statusFilter !== "all") {
      if (statusFilter === "active_all") {
        result = result.filter((emp) => ACTIVE_STATUSES.has(emp.status));
      } else {
        result = result.filter((emp) => emp.status === statusFilter);
      }
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (emp) =>
          emp.firstName?.toLowerCase().includes(query) ||
          emp.lastName?.toLowerCase().includes(query) ||
          emp.email?.toLowerCase().includes(query) ||
          emp.employeeId?.toLowerCase().includes(query) ||
          emp.employeeNik?.toLowerCase().includes(query) ||
          emp.nickname?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [searchQuery, statusFilter, employees]);

  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Stats
  const stats = React.useMemo(() => {
    const empArray = Array.isArray(employees) ? employees : [];
    const activeCount = empArray.filter((e) => ACTIVE_STATUSES.has(e.status)).length;
    const permanentCount = empArray.filter((e) => e.status === "permanent").length;
    const contractCount = empArray.filter((e) => e.status === "contract").length;
    const probationCount = empArray.filter((e) => e.status === "probation").length;

    return [
      {
        label: "Total Employees",
        value: empArray.length,
        icon: Users,
        description: "All employees",
        accent: true,
      },
      {
        label: "Active",
        value: activeCount,
        icon: UserCheck,
        description: "Currently working",
        accent: false,
      },
      {
        label: "Permanent",
        value: permanentCount,
        icon: ShieldCheck,
        description: "Permanent status",
        accent: false,
      },
      {
        label: "Contract",
        value: contractCount,
        icon: Briefcase,
        description: "Contract employees",
        accent: false,
      },
      {
        label: "Probation",
        value: probationCount,
        icon: UserX,
        description: "On probation",
        accent: false,
      },
    ];
  }, [employees]);

  // Delete handler
  const handleDelete = async () => {
    if (!selectedEmployee) return;
    setIsSubmitting(true);

    const response = await employeeService.delete(selectedEmployee.id);

    if (response.success) {
      deleteEmployee(selectedEmployee.id);
      setIsDeleteDialogOpen(false);
      setSelectedEmployee(null);
      showToast.deleted("Employee");
    } else {
      showToast.deleteError("employee", response.message);
    }

    setIsSubmitting(false);
  };

  const handleDeleteClick = (employee: EmployeeWithRelations) => {
    setSelectedEmployee(employee);
    setIsDeleteDialogOpen(true);
  };

  // Table columns
  const columns = [
    {
      key: "employee",
      label: "Employee",
      render: (_: unknown, row: EmployeeWithRelations) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-border">
            <AvatarFallback className="bg-accent/10 text-xs font-semibold text-accent">
              {getInitials(`${row.firstName || ""} ${row.lastName || ""}`)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">
              {row.firstName || ""} {row.lastName || ""}
            </p>
            <p className="text-xs text-muted-foreground">
              {row.employeeNik || "No Data"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      render: (_: unknown, row: EmployeeWithRelations) => (
        <span className="text-sm text-muted-foreground">{row.email || "—"}</span>
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
        <span className="text-sm text-muted-foreground">
          {row.hireDate ? formatShortDate(row.hireDate) : "—"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (_: unknown, row: EmployeeWithRelations) => {
        const config = getStatusConfig(row.status);
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      key: "actions",
      label: "",
      className: "w-[50px]",
      render: (_: unknown, row: EmployeeWithRelations) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/employees/${row.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Detail
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/employees/${row.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => handleDeleteClick(row)}
            >
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
      <Header title="Employees" />
      <PageContainer>
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-5">
            {stats.map((stat) => (
              <Card key={stat.label} className={stat.accent ? "border-accent/20 bg-accent/5" : ""}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        {stat.label}
                      </p>
                      <p
                        className={`mt-1 text-3xl font-semibold ${
                          stat.accent ? "text-accent" : ""
                        }`}
                      >
                        {isLoading ? "-" : stat.value}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {stat.description}
                      </p>
                    </div>
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                        stat.accent ? "bg-accent/10" : "bg-secondary"
                      }`}
                    >
                      <stat.icon
                        className={`h-5 w-5 ${
                          stat.accent ? "text-accent" : "text-muted-foreground"
                        }`}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Table */}
          <div className="animate-fade-in stagger-3">
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
                searchPlaceholder="Search by name, email, NIK, or ID..."
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
                emptyMessage="No employees found"
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
                          <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="active_all">All Active</SelectItem>
                          {EMPLOYEE_STATUSES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
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
                actions={
                  <>
                    <Button variant="outline">
                      <Download />
                      Export
                    </Button>
                    <Button asChild>
                      <Link href="/employees/new">
                        New
                      </Link>
                    </Button>
                  </>
                }
              />
            )}
          </div>
        </div>
      </PageContainer>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {selectedEmployee?.firstName || ""} {selectedEmployee?.lastName || ""}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedEmployee(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" />
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
