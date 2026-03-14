"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Trash2,
  Briefcase,
  Users,
  Loader2,
  AlertCircle,
  Eye,
  ChevronsUpDown,
  MoreHorizontal,
  X,
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
import { Checkbox } from "@/components/ui/checkbox";
import { useOrganizationStore } from "@/stores/organization-store";
import { jobTitleService, CreateJobTitleRequest } from "@/services/job-title.service";
import { jobLevelService } from "@/services/job-level.service";
import { departmentService } from "@/services/department.service";
import { divisionService } from "@/services/division.service";
import { ScrollArea } from "@/components/ui/scroll-area";
import { showToast } from "@/lib/utils/toast-messages";
import { JobTitle } from "@/types";

interface FormData {
  name: string;
  description: string;
  purpose: string;
  requirement: string;
  jobLevelId: string;
  type: "Administration" | "Technical" | "";
  divisionId: string;
  directReportId: string;
  departmentIds: string[];
}

const initialFormData: FormData = {
  name: "",
  description: "",
  purpose: "",
  requirement: "",
  jobLevelId: "",
  type: "",
  divisionId: "",
  directReportId: "",
  departmentIds: [],
};

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
    addJobTitle,
    deleteJobTitle,
    jobLevels,
    setJobLevels,
    departments,
    setDepartments,
    divisions,
    setDivisions,
    isLoading,
    setLoading,
    error,
    setError,
  } = useOrganizationStore();

  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedJobTitle, setSelectedJobTitle] = React.useState<JobTitle | null>(null);
  const [formData, setFormData] = React.useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = React.useState(false);
  const deptDropdownRef = React.useRef<HTMLDivElement>(null);

  // Close department dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(event.target as Node)) {
        setIsDeptDropdownOpen(false);
      }
    }
    if (isDeptDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isDeptDropdownOpen]);

  // Fetch data on mount
  React.useEffect(() => {
    fetchJobTitles();
    fetchJobLevels();
    fetchDepartments();
    fetchDivisions();
  }, []);

  const fetchJobTitles = async () => {
    setLoading(true);
    setError(null);

    const response = await jobTitleService.fetchAll();

    if (response.success && response.data) {
      setJobTitles(response.data);
    } else {
      setError(response.message || "Failed to fetch job titles");
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

  const fetchDepartments = async () => {
    const response = await departmentService.fetchAll();
    if (response.success && response.data) {
      setDepartments(response.data);
    }
  };

  const fetchDivisions = async () => {
    const response = await divisionService.fetchAll();
    if (response.success && response.data) {
      setDivisions(response.data);
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

  const handleAddClick = () => {
    setFormData(initialFormData);
    setIsAddDialogOpen(true);
  };

  const handleDeleteClick = (title: JobTitle) => {
    setSelectedJobTitle(title);
    setIsDeleteDialogOpen(true);
  };

  const toggleDepartment = (deptId: string) => {
    setFormData((prev) => ({
      ...prev,
      departmentIds: prev.departmentIds.includes(deptId)
        ? prev.departmentIds.filter((id) => id !== deptId)
        : [...prev.departmentIds, deptId],
    }));
  };

  const handleCreate = async () => {
    setIsSubmitting(true);

    const data: CreateJobTitleRequest = {
      name: formData.name,
      job_level_id: Number(formData.jobLevelId),
      type: formData.type === "Administration" || formData.type === "Technical" ? formData.type : undefined,
      division_id: formData.divisionId ? Number(formData.divisionId) : undefined,
      direct_report_id: formData.directReportId ? Number(formData.directReportId) : undefined,
      description: formData.description || undefined,
      purpose: formData.purpose || undefined,
      requirement: formData.requirement || undefined,
      department_sync: formData.departmentIds.map(Number),
    };

    const response = await jobTitleService.create(data);

    if (response.success && response.data) {
      addJobTitle(response.data);
      setIsAddDialogOpen(false);
      setFormData(initialFormData);
      showToast.created("Job Title");
    } else {
      showToast.createError("job title", response.message);
    }

    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!selectedJobTitle) return;

    setIsSubmitting(true);

    const response = await jobTitleService.delete(selectedJobTitle.id);

    if (response.success) {
      deleteJobTitle(selectedJobTitle.id);
      setIsDeleteDialogOpen(false);
      setSelectedJobTitle(null);
      showToast.deleted("Job Title");
    } else {
      showToast.deleteError("job title", response.message);
    }

    setIsSubmitting(false);
  };

  const columns = [
    {
      key: "name",
      label: "Job Title",
      render: (_: unknown, row: JobTitle) => (
        <p className="font-medium">{row.name}</p>
      ),
    },
    {
      key: "level",
      label: "Level",
      render: (_: unknown, row: JobTitle) => (
        <Badge variant="secondary">{getJobLevelName(row)}</Badge>
      ),
    },
    {
      key: "department",
      label: "Department",
      render: (_: unknown, row: JobTitle) => {
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
      render: (_: unknown, row: JobTitle) => (
        row.type ? (
          <Badge
            variant="outline"
            className={
              row.type === "Technical"
                ? "border-purple-200 bg-purple-50 text-purple-700"
                : "border-amber-200 bg-amber-50 text-amber-700"
            }
          >
            {row.type}
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )
      ),
    },
    {
      key: "actions",
      label: "",
      className: "w-[50px]",
      render: (_: unknown, row: JobTitle) => (
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
            <DropdownMenuItem onClick={() => router.push(`/organization/job-titles/${row.id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              Detail
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/organization/job-titles/${row.id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
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

  // Reusable department multi-select component
  const DepartmentMultiSelect = () => {
    const selectedNames = formData.departmentIds
      .map((id) => departments.find((d) => String(d.id) === id)?.name)
      .filter(Boolean);

    return (
      <div className="space-y-1.5">
        <Label>Department *</Label>
        <div className="relative" ref={deptDropdownRef}>
          <button
            type="button"
            onClick={() => setIsDeptDropdownOpen(!isDeptDropdownOpen)}
            className="flex w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <span className={selectedNames.length === 0 ? "text-muted-foreground" : ""}>
              {selectedNames.length === 0
                ? "Select departments"
                : `${selectedNames.length} selected`}
            </span>
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </button>

          {isDeptDropdownOpen && (
            <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
              <ScrollArea className="max-h-[200px]">
                {departments.map((dept) => {
                  const isChecked = formData.departmentIds.includes(String(dept.id));
                  return (
                    <label
                      key={dept.id}
                      className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleDepartment(String(dept.id))}
                      />
                      {dept.name}
                    </label>
                  );
                })}
              </ScrollArea>
            </div>
          )}

          {selectedNames.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {formData.departmentIds.map((id) => {
                const dept = departments.find((d) => String(d.id) === id);
                if (!dept) return null;
                return (
                  <Badge key={id} variant="secondary" className="gap-1 text-xs">
                    {dept.name}
                    <button
                      type="button"
                      onClick={() => toggleDepartment(id)}
                      className="ml-0.5 rounded-full hover:bg-muted-foreground/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Header title="Job Titles" />
      <PageContainer>
        <div className="space-y-6">
          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
              <Button
                variant="ghost"
               
                className="ml-auto h-6 px-2 text-xs"
                onClick={() => setError(null)}
              >
                Dismiss
              </Button>
            </div>
          )}

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">
                    {isLoading ? "-" : (jobTitles?.length || 0)}
                  </p>
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
                  <p className="text-2xl font-semibold">
                    {isLoading ? "-" : (jobLevels?.length || 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Job Levels</p>
                </div>
              </CardContent>
            </Card>
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
                <Button onClick={handleAddClick}>
                  New
                </Button>
              }
            />
          )}
        </div>

        {/* Add Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>New Job Title</DialogTitle>
              <DialogDescription>
                Create a new job title for your organization.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter job title"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="level">Job Level *</Label>
                <Select
                  value={formData.jobLevelId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, jobLevelId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobLevels.map((level) => (
                      <SelectItem key={level.id} value={String(level.id)}>
                        {level.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value as "Administration" | "Technical" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Administration">Administration</SelectItem>
                    <SelectItem value="Technical">Technical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="division">Division</Label>
                <Select
                  value={formData.divisionId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, divisionId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select division" />
                  </SelectTrigger>
                  <SelectContent>
                    {divisions.map((div) => (
                      <SelectItem key={div.id} value={String(div.id)}>
                        {div.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DepartmentMultiSelect />
              <div className="space-y-1.5">
                <Label htmlFor="directReport">Direct Report Line</Label>
                <Select
                  value={formData.directReportId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, directReportId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select direct report" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobTitles.map((jt) => (
                      <SelectItem key={jt.id} value={String(jt.id)}>
                        {jt.name}
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
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="purpose">Purpose</Label>
                <Textarea
                  id="purpose"
                  placeholder="Enter purpose of this job title"
                  value={formData.purpose}
                  onChange={(e) =>
                    setFormData({ ...formData, purpose: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="requirement">Requirement</Label>
                <Textarea
                  id="requirement"
                  placeholder="Enter requirements"
                  value={formData.requirement}
                  onChange={(e) =>
                    setFormData({ ...formData, requirement: e.target.value })
                  }
                />
              </div>
            </div>
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
                disabled={
                  isSubmitting ||
                  !formData.name ||
                  !formData.jobLevelId ||
                  !formData.type ||
                  formData.departmentIds.length === 0
                }
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Job Title"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Job Title</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{selectedJobTitle?.name}&quot;? This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
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
      </PageContainer>
    </>
  );
}
