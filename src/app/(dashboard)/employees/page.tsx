"use client";

import * as React from "react";
import Link from "next/link";
import {
  Plus,
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
} from "@/services/employee.service";
import divisionService from "@/services/division.service";
import departmentService from "@/services/department.service";
import jobLevelService from "@/services/job-level.service";
import jobTitleService from "@/services/job-title.service";
import {
  EmployeeWithRelations,
  EmployeeStatus,
  Division,
  Department,
  JobLevel,
  JobTitle,
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

const MARITAL_STATUSES = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
] as const;

const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
] as const;

const EMPLOYEE_TYPES = [
  { value: "Full-Time", label: "Full-Time" },
  { value: "Part-Time", label: "Part-Time" },
  { value: "Contract", label: "Contract" },
  { value: "Internship", label: "Internship" },
] as const;

// Active statuses for counting
const ACTIVE_STATUSES = new Set<string>(["active", "permanent", "contract", "probation", "outsource"]);

// Initial form data
const initialFormData: EmployeeFormData = {
  employeeId: "",
  firstName: "",
  lastName: "",
  nickname: "",
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
  employeeType: "",
  businessUnit: "",
  extension: "",
  location: "",
  fte: "",
  permanentDate: "",
  contractDate: "",
  contractEndDate: "",
  probationDate: "",
  probationEndDate: "",
  motherName: "",
  fatherName: "",
  spouseName: "",
  maritalStatus: "",
  emergencyContactName: "",
  emergencyContactRelation: "",
  emergencyContactPhone: "",
  religion: "",
  ethnicity: "",
  certificate: "",
};

export default function EmployeesPage() {
  // Store
  const {
    employees,
    setEmployees,
    addEmployee,
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

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
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

  // CRUD Handlers
  const handleCreate = async () => {
    setIsSubmitting(true);

    const requestData = mapFormToRequest(formData);
    const response = await employeeService.create(requestData);

    if (response.success && response.data) {
      addEmployee(response.data);
      setIsAddDialogOpen(false);
      setFormData(initialFormData);
      showToast.created("Employee");
    } else {
      showToast.createError("employee", response.message);
    }

    setIsSubmitting(false);
  };

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

  // Dialog handlers
  const handleAddClick = () => {
    setFormData(initialFormData);
    setIsAddDialogOpen(true);
  };

  const handleDeleteClick = (employee: EmployeeWithRelations) => {
    setSelectedEmployee(employee);
    setIsDeleteDialogOpen(true);
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
              {row.employeeNik || row.employeeId || "—"}
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
              <MoreHorizontal className="h-4 w-4" />
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

  // Form dialog content — sectioned layout
  const renderFormFields = () => (
    <div className="max-h-[60vh] space-y-6 overflow-y-auto py-4 pr-2">
      {/* Section: Basic Information */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Basic Information
        </h3>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="employeeId">Employee ID *</Label>
              <Input
                id="employeeId"
                placeholder="EMP-001"
                value={formData.employeeId}
                onChange={(e) => handleFieldChange("employeeId", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleFieldChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYEE_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                placeholder="John"
                value={formData.firstName}
                onChange={(e) => handleFieldChange("firstName", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) => handleFieldChange("lastName", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nickname">Nickname</Label>
              <Input
                id="nickname"
                placeholder="Johnny"
                value={formData.nickname}
                onChange={(e) => handleFieldChange("nickname", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@company.com"
                value={formData.email}
                onChange={(e) => handleFieldChange("email", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                placeholder="+62 812 3456 7890"
                value={formData.phone}
                onChange={(e) => handleFieldChange("phone", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleFieldChange("dateOfBirth", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Gender *</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => handleFieldChange("gender", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {GENDERS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Marital Status</Label>
              <Select
                value={formData.maritalStatus}
                onValueChange={(value) => handleFieldChange("maritalStatus", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {MARITAL_STATUSES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="religion">Religion</Label>
              <Input
                id="religion"
                placeholder="e.g. Islam, Kristen, Katolik"
                value={formData.religion}
                onChange={(e) => handleFieldChange("religion", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ethnicity">Ethnicity</Label>
              <Input
                id="ethnicity"
                placeholder="e.g. Jawa, Sunda, Batak"
                value={formData.ethnicity}
                onChange={(e) => handleFieldChange("ethnicity", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
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
      </div>

      {/* Section: Employment Details */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Employment Details
        </h3>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="hireDate">Hire Date *</Label>
              <Input
                id="hireDate"
                type="date"
                value={formData.hireDate}
                onChange={(e) => handleFieldChange("hireDate", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Employee Type</Label>
              <Select
                value={formData.employeeType}
                onValueChange={(value) => handleFieldChange("employeeType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYEE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
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
            <div className="space-y-1.5">
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
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
            <div className="space-y-1.5">
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

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="businessUnit">Business Unit</Label>
              <Input
                id="businessUnit"
                placeholder="e.g. BU-01"
                value={formData.businessUnit}
                onChange={(e) => handleFieldChange("businessUnit", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g. Jakarta"
                value={formData.location}
                onChange={(e) => handleFieldChange("location", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fte">FTE</Label>
              <Input
                id="fte"
                type="number"
                step="0.1"
                min="0"
                max="1"
                placeholder="1.0"
                value={formData.fte}
                onChange={(e) => handleFieldChange("fte", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="certificate">Certificate / Qualification</Label>
            <Input
              id="certificate"
              placeholder="e.g. S1 Teknik Informatika"
              value={formData.certificate}
              onChange={(e) => handleFieldChange("certificate", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Section: Contract & Probation Dates */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Contract & Probation Dates
        </h3>
        <div className="grid gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="permanentDate">Permanent Date</Label>
            <Input
              id="permanentDate"
              type="date"
              value={formData.permanentDate}
              onChange={(e) => handleFieldChange("permanentDate", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="contractDate">Contract Start Date</Label>
              <Input
                id="contractDate"
                type="date"
                value={formData.contractDate}
                onChange={(e) => handleFieldChange("contractDate", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contractEndDate">Contract End Date</Label>
              <Input
                id="contractEndDate"
                type="date"
                value={formData.contractEndDate}
                onChange={(e) => handleFieldChange("contractEndDate", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="probationDate">Probation Start Date</Label>
              <Input
                id="probationDate"
                type="date"
                value={formData.probationDate}
                onChange={(e) => handleFieldChange("probationDate", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="probationEndDate">Probation End Date</Label>
              <Input
                id="probationEndDate"
                type="date"
                value={formData.probationEndDate}
                onChange={(e) => handleFieldChange("probationEndDate", e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section: Family Information */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Family Information
        </h3>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fatherName">Father&apos;s Name</Label>
              <Input
                id="fatherName"
                placeholder="Father's full name"
                value={formData.fatherName}
                onChange={(e) => handleFieldChange("fatherName", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="motherName">Mother&apos;s Name</Label>
              <Input
                id="motherName"
                placeholder="Mother's full name"
                value={formData.motherName}
                onChange={(e) => handleFieldChange("motherName", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="spouseName">Spouse Name</Label>
            <Input
              id="spouseName"
              placeholder="Spouse's full name"
              value={formData.spouseName}
              onChange={(e) => handleFieldChange("spouseName", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Section: Emergency Contact */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Emergency Contact
        </h3>
        <div className="grid gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="emergencyContactName">Contact Name</Label>
            <Input
              id="emergencyContactName"
              placeholder="Emergency contact name"
              value={formData.emergencyContactName}
              onChange={(e) => handleFieldChange("emergencyContactName", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="emergencyContactRelation">Relationship</Label>
              <Input
                id="emergencyContactRelation"
                placeholder="e.g. Spouse, Parent, Sibling"
                value={formData.emergencyContactRelation}
                onChange={(e) => handleFieldChange("emergencyContactRelation", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emergencyContactPhone">Phone Number</Label>
              <Input
                id="emergencyContactPhone"
                placeholder="+62 812 3456 7890"
                value={formData.emergencyContactPhone}
                onChange={(e) => handleFieldChange("emergencyContactPhone", e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Check if form is valid (minimum required fields)
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
                        size="sm"
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
        <DialogContent className="max-w-2xl">
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
