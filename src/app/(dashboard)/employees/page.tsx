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
  AlertCircle,
  Loader2,
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
} from "@/components/ui/dialog";
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

import { useEmployeeStore } from "@/stores/employee-store";
import employeeService, {
  EmployeeFormData,
  mapFormToRequest,
  mapFormToUpdateRequest,
} from "@/services/employee.service";
import divisionService from "@/services/division.service";
import departmentService from "@/services/department.service";
import jobLevelService from "@/services/job-level.service";
import jobTitleService from "@/services/job-title.service";
import { EmployeeWithRelations, Division, Department, JobLevel, JobTitle } from "@/types";
import { getInitials, formatShortDate } from "@/lib/utils";

// Status configuration
const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "success" }
> = {
  active: { label: "Active", variant: "success" },
  on_leave: { label: "On Leave", variant: "secondary" },
  inactive: { label: "Inactive", variant: "outline" },
  terminated: { label: "Terminated", variant: "outline" },
};

// Initial form data (camelCase for frontend)
const initialFormData: EmployeeFormData = {
  employeeId: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  gender: "male",
  address: "",
  hireDate: "",
  status: "active",
  departmentId: "",
  divisionId: "",
  jobTitleId: "",
  jobLevelId: "",
  managerId: "",
};

export default function EmployeesPage() {
  // Store
  const {
    employees,
    setEmployees,
    addEmployee,
    updateEmployee,
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

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = React.useState(false);
  const [selectedEmployee, setSelectedEmployee] =
    React.useState<EmployeeWithRelations | null>(null);
  const [formData, setFormData] =
    React.useState<EmployeeFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Dropdown data
  const [divisions, setDivisions] = React.useState<Division[]>([]);
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [jobLevels, setJobLevels] = React.useState<JobLevel[]>([]);
  const [jobTitles, setJobTitles] = React.useState<JobTitle[]>([]);

  // Fetch employees
  const fetchEmployees = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await employeeService.getAll(1, 100);

    if (response.success && response.data) {
      setEmployees(response.data.data || []);
    } else {
      setError(response.message || "Failed to fetch employees");
      setEmployees([]);
    }

    setLoading(false);
  }, [setEmployees, setLoading, setError]);

  // Fetch dropdown data
  const fetchDropdownData = React.useCallback(async () => {
    const [divRes, deptRes, levelRes, titleRes] = await Promise.all([
      divisionService.getAll(1, 100),
      departmentService.getAll(1, 100),
      jobLevelService.getAll(1, 100),
      jobTitleService.getAll(1, 100),
    ]);

    if (divRes.success && divRes.data) {
      setDivisions(divRes.data.data || []);
    }
    if (deptRes.success && deptRes.data) {
      setDepartments(deptRes.data.data || []);
    }
    if (levelRes.success && levelRes.data) {
      setJobLevels(levelRes.data.data || []);
    }
    if (titleRes.success && titleRes.data) {
      setJobTitles(titleRes.data.data || []);
    }
  }, []);

  // Initial fetch
  React.useEffect(() => {
    fetchEmployees();
    fetchDropdownData();
  }, [fetchEmployees, fetchDropdownData]);

  // Filter and pagination
  const filteredData = React.useMemo(() => {
    const empArray = Array.isArray(employees) ? employees : [];
    if (!searchQuery) return empArray;
    const query = searchQuery.toLowerCase();
    return empArray.filter(
      (emp) =>
        emp.firstName?.toLowerCase().includes(query) ||
        emp.lastName?.toLowerCase().includes(query) ||
        emp.email?.toLowerCase().includes(query) ||
        emp.employeeId?.toLowerCase().includes(query)
    );
  }, [searchQuery, employees]);

  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Stats
  const stats = React.useMemo(() => {
    const empArray = Array.isArray(employees) ? employees : [];
    return [
      {
        label: "Total Employees",
        value: empArray.length,
        icon: Users,
        description: "All employees",
      },
      {
        label: "Active",
        value: empArray.filter((e) => e.status === "active").length,
        icon: UserCheck,
        description: "Currently working",
      },
      {
        label: "On Leave",
        value: empArray.filter((e) => e.status === "on_leave").length,
        icon: UserX,
        description: "Temporary leave",
      },
    ];
  }, [employees]);

  // CRUD Handlers
  const handleCreate = async () => {
    setIsSubmitting(true);
    setError(null);

    // Map camelCase form data to snake_case API request
    const requestData = mapFormToRequest(formData);
    const response = await employeeService.create(requestData);

    if (response.success && response.data) {
      addEmployee(response.data);
      setIsAddDialogOpen(false);
      setFormData(initialFormData);
    } else {
      setError(response.message || "Failed to create employee");
    }

    setIsSubmitting(false);
  };

  const handleUpdate = async () => {
    if (!selectedEmployee) return;
    setIsSubmitting(true);
    setError(null);

    // Map camelCase form data to snake_case API request
    const requestData = mapFormToUpdateRequest(formData);
    const response = await employeeService.update(selectedEmployee.id, requestData);

    if (response.success && response.data) {
      updateEmployee(selectedEmployee.id, response.data);
      setIsEditDialogOpen(false);
      setSelectedEmployee(null);
      setFormData(initialFormData);
    } else {
      setError(response.message || "Failed to update employee");
    }

    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!selectedEmployee) return;
    setIsSubmitting(true);
    setError(null);

    const response = await employeeService.delete(selectedEmployee.id);

    if (response.success) {
      deleteEmployee(selectedEmployee.id);
      setIsDeleteDialogOpen(false);
      setSelectedEmployee(null);
    } else {
      setError(response.message || "Failed to delete employee");
    }

    setIsSubmitting(false);
  };

  // Dialog handlers
  const handleAddClick = () => {
    setFormData(initialFormData);
    setIsAddDialogOpen(true);
  };

  const handleEditClick = (employee: EmployeeWithRelations) => {
    setSelectedEmployee(employee);
    setFormData({
      employeeId: employee.employeeId || "",
      firstName: employee.firstName || "",
      lastName: employee.lastName || "",
      email: employee.email || "",
      phone: employee.phone || "",
      dateOfBirth: employee.dateOfBirth || "",
      gender: employee.gender || "male",
      address: employee.address || "",
      hireDate: employee.hireDate || "",
      status: employee.status || "active",
      departmentId: employee.departmentId || "",
      divisionId: employee.divisionId || "",
      jobTitleId: employee.jobTitleId || "",
      jobLevelId: employee.jobLevelId || "",
      managerId: employee.managerId || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (employee: EmployeeWithRelations) => {
    setSelectedEmployee(employee);
    setIsDeleteDialogOpen(true);
  };

  const handleViewClick = (employee: EmployeeWithRelations) => {
    setSelectedEmployee(employee);
    setIsViewDialogOpen(true);
  };

  // Form field change handler
  const handleFieldChange = (field: keyof EmployeeFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
            <p className="font-mono text-xs text-muted-foreground">
              {row.employeeId || row.id}
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
        const config = statusConfig[row.status] || statusConfig.inactive;
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      key: "actions",
      label: "",
      className: "w-10",
      render: (_: unknown, row: EmployeeWithRelations) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleViewClick(row)}>
              <Eye className="mr-2 h-4 w-4" />
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEditClick(row)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => handleDeleteClick(row)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Form dialog content
  const renderFormFields = () => (
    <div className="grid gap-4 py-4">
      {/* Employee ID & Status */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="employeeId">Employee ID *</Label>
          <Input
            id="employeeId"
            placeholder="EMP-001"
            value={formData.employeeId}
            onChange={(e) => handleFieldChange("employeeId", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Status *</Label>
          <Select
            value={formData.status}
            onValueChange={(value) =>
              handleFieldChange(
                "status",
                value as "active" | "inactive" | "on_leave" | "terminated"
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="on_leave">On Leave</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Name */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            placeholder="John"
            value={formData.firstName}
            onChange={(e) => handleFieldChange("firstName", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            placeholder="Doe"
            value={formData.lastName}
            onChange={(e) => handleFieldChange("lastName", e.target.value)}
          />
        </div>
      </div>

      {/* Email & Phone */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="john.doe@company.com"
            value={formData.email}
            onChange={(e) => handleFieldChange("email", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone *</Label>
          <Input
            id="phone"
            placeholder="+62 812 3456 7890"
            value={formData.phone}
            onChange={(e) => handleFieldChange("phone", e.target.value)}
          />
        </div>
      </div>

      {/* Date of Birth & Gender */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of Birth *</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => handleFieldChange("dateOfBirth", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Gender *</Label>
          <Select
            value={formData.gender}
            onValueChange={(value) =>
              handleFieldChange("gender", value as "male" | "female")
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Hire Date */}
      <div className="space-y-2">
        <Label htmlFor="hireDate">Hire Date *</Label>
        <Input
          id="hireDate"
          type="date"
          value={formData.hireDate}
          onChange={(e) => handleFieldChange("hireDate", e.target.value)}
        />
      </div>

      {/* Division & Department */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Division *</Label>
          <Select
            value={formData.divisionId}
            onValueChange={(value) => handleFieldChange("divisionId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select division" />
            </SelectTrigger>
            <SelectContent>
              {divisions.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Department *</Label>
          <Select
            value={formData.departmentId}
            onValueChange={(value) => handleFieldChange("departmentId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Job Level & Job Title */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Job Level *</Label>
          <Select
            value={formData.jobLevelId}
            onValueChange={(value) => handleFieldChange("jobLevelId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select job level" />
            </SelectTrigger>
            <SelectContent>
              {jobLevels.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Job Title *</Label>
          <Select
            value={formData.jobTitleId}
            onValueChange={(value) => handleFieldChange("jobTitleId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select job title" />
            </SelectTrigger>
            <SelectContent>
              {jobTitles.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Address */}
      <div className="space-y-2">
        <Label htmlFor="address">Address *</Label>
        <Textarea
          id="address"
          placeholder="Enter full address"
          value={formData.address}
          onChange={(e) => handleFieldChange("address", e.target.value)}
          rows={2}
        />
      </div>
    </div>
  );

  // Check if form is valid
  const isFormValid =
    formData.employeeId &&
    formData.firstName &&
    formData.lastName &&
    formData.email &&
    formData.phone &&
    formData.dateOfBirth &&
    formData.hireDate &&
    formData.divisionId &&
    formData.departmentId &&
    formData.jobLevelId &&
    formData.jobTitleId &&
    formData.address;

  return (
    <>
      <Header title="Employees" />
      <PageContainer>
        <div className="space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-6 px-2 text-xs"
                onClick={() => setError(null)}
              >
                Dismiss
              </Button>
            </div>
          )}

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Card
                  className={index === 0 ? "border-accent/20 bg-accent/5" : ""}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          {stat.label}
                        </p>
                        <p
                          className={`mt-1 text-3xl font-semibold ${
                            index === 0 ? "text-accent" : ""
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
                          index === 0 ? "bg-accent/10" : "bg-secondary"
                        }`}
                      >
                        <stat.icon
                          className={`h-5 w-5 ${
                            index === 0 ? "text-accent" : "text-muted-foreground"
                          }`}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
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
                searchPlaceholder="Search by name, email, or ID..."
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
                actions={
                  <>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                    <Button size="sm" onClick={handleAddClick}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Employee
                    </Button>
                  </>
                }
              />
            )}
          </div>
        </div>
      </PageContainer>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Add New Employee
            </DialogTitle>
            <DialogDescription>
              Add a new team member to your organization.
            </DialogDescription>
          </DialogHeader>
          {renderFormFields()}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isSubmitting || !isFormValid}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Edit Employee
            </DialogTitle>
            <DialogDescription>
              Update employee information.
            </DialogDescription>
          </DialogHeader>
          {renderFormFields()}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedEmployee(null);
                setFormData(initialFormData);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isSubmitting || !isFormValid}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Employee Profile
            </DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border border-border">
                  <AvatarFallback className="bg-accent/10 text-lg font-semibold text-accent">
                    {getInitials(
                      `${selectedEmployee.firstName || ""} ${selectedEmployee.lastName || ""}`
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedEmployee.firstName || ""} {selectedEmployee.lastName || ""}
                  </h3>
                  <p className="font-mono text-sm text-muted-foreground">
                    {selectedEmployee.employeeId || selectedEmployee.id}
                  </p>
                  <Badge
                    variant={
                      statusConfig[selectedEmployee.status]?.variant || "outline"
                    }
                    className="mt-1"
                  >
                    {statusConfig[selectedEmployee.status]?.label ||
                      selectedEmployee.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedEmployee.email || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedEmployee.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Gender</p>
                  <p className="font-medium capitalize">
                    {selectedEmployee.gender || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">
                    {selectedEmployee.dateOfBirth ? formatShortDate(selectedEmployee.dateOfBirth) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Division</p>
                  <p className="font-medium">
                    {selectedEmployee.division?.name || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Department</p>
                  <p className="font-medium">
                    {selectedEmployee.department?.name || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Job Level</p>
                  <p className="font-medium">
                    {selectedEmployee.jobLevel?.name || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Job Title</p>
                  <p className="font-medium">
                    {selectedEmployee.jobTitle?.name || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Hire Date</p>
                  <p className="font-medium">
                    {selectedEmployee.hireDate ? formatShortDate(selectedEmployee.hireDate) : "—"}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Address</p>
                  <p className="font-medium">{selectedEmployee.address || "—"}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsViewDialogOpen(false);
                setSelectedEmployee(null);
              }}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setIsViewDialogOpen(false);
                if (selectedEmployee) {
                  handleEditClick(selectedEmployee);
                }
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove{" "}
              <span className="font-semibold">
                {selectedEmployee?.firstName || ""} {selectedEmployee?.lastName || ""}
              </span>{" "}
              from the system. This action cannot be undone.
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
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
