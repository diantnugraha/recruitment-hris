"use client";

import * as React from "react";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Briefcase,
  Users,
  Loader2,
  AlertCircle,
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
import { useOrganizationStore } from "@/stores/organization-store";
import { jobTitleService, CreateJobTitleRequest } from "@/services/job-title.service";
import { jobLevelService } from "@/services/job-level.service";
import { departmentService } from "@/services/department.service";
import { JobTitle } from "@/types";
import { formatShortDate } from "@/lib/utils";

interface FormData {
  name: string;
  code: string;
  description: string;
  jobLevelId: string;
  departmentId: string;
  responsibilities: string;
  requirements: string;
}

const initialFormData: FormData = {
  name: "",
  code: "",
  description: "",
  jobLevelId: "",
  departmentId: "",
  responsibilities: "",
  requirements: "",
};

export default function JobTitlesPage() {
  const {
    jobTitles,
    setJobTitles,
    addJobTitle,
    updateJobTitle,
    deleteJobTitle,
    jobLevels,
    setJobLevels,
    departments,
    setDepartments,
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
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedJobTitle, setSelectedJobTitle] = React.useState<JobTitle | null>(null);
  const [formData, setFormData] = React.useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Fetch data on mount
  React.useEffect(() => {
    fetchJobTitles();
    fetchJobLevels();
    fetchDepartments();
  }, []);

  const fetchJobTitles = async () => {
    setLoading(true);
    setError(null);

    const response = await jobTitleService.getAll(1, 100);
    console.log("Job Title API Response:", response);

    if (response.success && response.data) {
      setJobTitles(response.data.data || []);
    } else {
      setError(response.message || "Failed to fetch job titles");
      setJobTitles([]);
    }

    setLoading(false);
  };

  const fetchJobLevels = async () => {
    const response = await jobLevelService.getAll(1, 100);
    if (response.success && response.data) {
      setJobLevels(response.data.data || []);
    }
  };

  const fetchDepartments = async () => {
    const response = await departmentService.getAll(1, 100);
    if (response.success && response.data) {
      setDepartments(response.data.data || []);
    }
  };

  const filteredData = React.useMemo(() => {
    const titleArray = Array.isArray(jobTitles) ? jobTitles : [];
    if (!searchQuery) return titleArray;
    const query = searchQuery.toLowerCase();
    return titleArray.filter(
      (title) =>
        title.name.toLowerCase().includes(query) ||
        title.code.toLowerCase().includes(query)
    );
  }, [searchQuery, jobTitles]);

  const getJobLevelName = (levelId: string) => {
    return jobLevels.find((level) => level.id === levelId)?.name || "-";
  };

  const getDepartmentName = (deptId?: string) => {
    if (!deptId) return "All Departments";
    return departments.find((dept) => dept.id === deptId)?.name || "-";
  };

  const handleAddClick = () => {
    setFormData(initialFormData);
    setIsAddDialogOpen(true);
  };

  const handleEditClick = (title: JobTitle) => {
    setSelectedJobTitle(title);
    setFormData({
      name: title.name,
      code: title.code,
      description: title.description || "",
      jobLevelId: title.jobLevelId,
      departmentId: title.departmentId || "",
      responsibilities: title.responsibilities?.join("\n") || "",
      requirements: title.requirements?.join("\n") || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (title: JobTitle) => {
    setSelectedJobTitle(title);
    setIsDeleteDialogOpen(true);
  };

  const handleCreate = async () => {
    setIsSubmitting(true);

    const data: CreateJobTitleRequest = {
      name: formData.name,
      code: formData.code,
      description: formData.description || undefined,
      jobLevelId: formData.jobLevelId,
      departmentId: formData.departmentId || undefined,
      responsibilities: formData.responsibilities
        ? formData.responsibilities.split("\n").filter((r) => r.trim())
        : undefined,
      requirements: formData.requirements
        ? formData.requirements.split("\n").filter((r) => r.trim())
        : undefined,
    };

    const response = await jobTitleService.create(data);

    if (response.success && response.data) {
      addJobTitle(response.data);
      setIsAddDialogOpen(false);
      setFormData(initialFormData);
    } else {
      setError(response.message || "Failed to create job title");
    }

    setIsSubmitting(false);
  };

  const handleUpdate = async () => {
    if (!selectedJobTitle) return;

    setIsSubmitting(true);

    const response = await jobTitleService.update(selectedJobTitle.id, {
      name: formData.name,
      code: formData.code,
      description: formData.description || undefined,
      jobLevelId: formData.jobLevelId,
      departmentId: formData.departmentId || undefined,
      responsibilities: formData.responsibilities
        ? formData.responsibilities.split("\n").filter((r) => r.trim())
        : undefined,
      requirements: formData.requirements
        ? formData.requirements.split("\n").filter((r) => r.trim())
        : undefined,
    });

    if (response.success && response.data) {
      updateJobTitle(selectedJobTitle.id, response.data);
      setIsEditDialogOpen(false);
      setSelectedJobTitle(null);
      setFormData(initialFormData);
    } else {
      setError(response.message || "Failed to update job title");
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
    } else {
      setError(response.message || "Failed to delete job title");
    }

    setIsSubmitting(false);
  };

  const columns = [
    {
      key: "name",
      label: "Job Title",
      render: (_: unknown, row: JobTitle) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-xs text-muted-foreground">{row.description}</p>
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
      render: (_: unknown, row: JobTitle) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEditClick(row)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
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
                size="sm"
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
              data={filteredData || []}
              columns={columns}
              searchable
              searchPlaceholder="Search job titles..."
              onSearch={setSearchQuery}
              pagination
              pageSize={pageSize}
              totalItems={filteredData?.length || 0}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              emptyMessage="No job titles found"
              actions={
                <Button size="sm" onClick={handleAddClick}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Job Title
                </Button>
              }
            />
          )}
        </div>

        {/* Add Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter job title"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    placeholder="Enter code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
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
                        <SelectItem key={level.id} value={level.id}>
                          {level.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={formData.departmentId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, departmentId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Departments</SelectItem>
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
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="responsibilities">Responsibilities</Label>
                <Textarea
                  id="responsibilities"
                  placeholder="Enter responsibilities (one per line)"
                  value={formData.responsibilities}
                  onChange={(e) =>
                    setFormData({ ...formData, responsibilities: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="requirements">Requirements</Label>
                <Textarea
                  id="requirements"
                  placeholder="Enter requirements (one per line)"
                  value={formData.requirements}
                  onChange={(e) =>
                    setFormData({ ...formData, requirements: e.target.value })
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
                  !formData.code ||
                  !formData.jobLevelId
                }
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Add Job Title"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Job Title</DialogTitle>
              <DialogDescription>
                Update the job title details.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-name">Name *</Label>
                  <Input
                    id="edit-name"
                    placeholder="Enter job title"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-code">Code *</Label>
                  <Input
                    id="edit-code"
                    placeholder="Enter code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-level">Job Level *</Label>
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
                        <SelectItem key={level.id} value={level.id}>
                          {level.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-department">Department</Label>
                  <Select
                    value={formData.departmentId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, departmentId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Departments</SelectItem>
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
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Enter description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-responsibilities">Responsibilities</Label>
                <Textarea
                  id="edit-responsibilities"
                  placeholder="Enter responsibilities (one per line)"
                  value={formData.responsibilities}
                  onChange={(e) =>
                    setFormData({ ...formData, responsibilities: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-requirements">Requirements</Label>
                <Textarea
                  id="edit-requirements"
                  placeholder="Enter requirements (one per line)"
                  value={formData.requirements}
                  onChange={(e) =>
                    setFormData({ ...formData, requirements: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={
                  isSubmitting ||
                  !formData.name ||
                  !formData.code ||
                  !formData.jobLevelId
                }
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
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
      </PageContainer>
    </>
  );
}
