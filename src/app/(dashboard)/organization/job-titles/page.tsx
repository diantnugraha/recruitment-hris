"use client";

import * as React from "react";
import Link from "next/link";
import {
  Plus,
  Pencil,
  Trash2,
  Briefcase,
  Users,
  Loader2,
  AlertCircle,
  Eye,
  CheckCircle2,
  ClipboardList,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { JobTitle } from "@/types";
import { formatShortDate, parseRichTextToArray, parseRichTextToString, splitTextToItems } from "@/lib/utils";

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
  const [isViewDialogOpen, setIsViewDialogOpen] = React.useState(false);
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

  const filteredData = React.useMemo(() => {
    const titleArray = Array.isArray(jobTitles) ? jobTitles : [];
    if (!searchQuery) return titleArray;
    const query = searchQuery.toLowerCase();
    return titleArray.filter(
      (title) =>
        title.name?.toLowerCase().includes(query) ||
        title.code?.toLowerCase().includes(query)
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

  const getDepartmentName = (row: JobTitle) => {
    if (row.department?.name) return row.department.name;
    if (!row.departmentId) return "All Departments";
    return departments.find((dept) => dept.id === row.departmentId)?.name || "-";
  };

  const handleAddClick = () => {
    setFormData(initialFormData);
    setIsAddDialogOpen(true);
  };

  const handleViewClick = (title: JobTitle) => {
    setSelectedJobTitle(title);
    setIsViewDialogOpen(true);
  };

  const handleEditClick = (title: JobTitle) => {
    setSelectedJobTitle(title);

    // Get responsibilities - from field or parse from description
    let responsibilities = parseRichTextToArray(title.responsibilities);
    const descText = parseRichTextToString(title.description);

    // If no responsibilities but has long description, use description as responsibilities
    if (responsibilities.length === 0 && descText && descText.length > 50) {
      responsibilities = splitTextToItems(descText);
    }

    setFormData({
      name: title.name,
      code: title.code,
      description: responsibilities.length > 0 ? "" : descText, // Clear description if moved to responsibilities
      jobLevelId: title.jobLevelId,
      departmentId: title.departmentId || "",
      responsibilities: responsibilities.join("\n"),
      requirements: parseRichTextToArray(title.requirements).join("\n"),
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
      render: (_: unknown, row: JobTitle) => (
        <span className="text-sm">{getDepartmentName(row)}</span>
      ),
    },
    {
      key: "details",
      label: "Details",
      render: (_: unknown, row: JobTitle) => {
        // Get responsibilities - from field or parse from description
        let responsibilities = parseRichTextToArray(row.responsibilities);
        if (responsibilities.length === 0 && row.description) {
          const descText = parseRichTextToString(row.description);
          if (descText && descText.length > 50) {
            responsibilities = splitTextToItems(descText);
          }
        }

        const requirements = parseRichTextToArray(row.requirements);
        const respCount = responsibilities.length;
        const reqCount = requirements.length;

        return (
          <div className="flex items-center gap-2">
            {respCount > 0 && (
              <Badge variant="outline" className="gap-1 text-xs">
                <ClipboardList className="h-3 w-3" />
                {respCount}
              </Badge>
            )}
            {reqCount > 0 && (
              <Badge variant="outline" className="gap-1 text-xs">
                <CheckCircle2 className="h-3 w-3" />
                {reqCount}
              </Badge>
            )}
            {respCount === 0 && reqCount === 0 && (
              <span className="text-xs text-muted-foreground">-</span>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      label: "",
      className: "w-[50px]",
      render: (_: unknown, row: JobTitle) => (
        <Link href={`/organization/job-titles/${row.id}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-accent">
            <Eye className="h-4 w-4" />
          </Button>
        </Link>
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

        {/* View Details Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0">
            {/* Header */}
            <div className="px-6 py-4 border-b bg-muted/30">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <DialogTitle className="text-xl font-semibold">
                    {selectedJobTitle?.name}
                  </DialogTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="font-mono text-xs">
                      {selectedJobTitle?.code}
                    </Badge>
                    {selectedJobTitle && (
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                        {getJobLevelName(selectedJobTitle)}
                      </Badge>
                    )}
                    {selectedJobTitle && (
                      <Badge variant="secondary">
                        {getDepartmentName(selectedJobTitle)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <ScrollArea className="max-h-[55vh]">
              <div className="p-6 space-y-6">
                {/* Responsibilities */}
                {(() => {
                  // Get responsibilities from field or parse from description
                  let responsibilities = parseRichTextToArray(selectedJobTitle?.responsibilities);

                  // If no responsibilities but has description, split description into items
                  if (responsibilities.length === 0 && selectedJobTitle?.description) {
                    const descText = parseRichTextToString(selectedJobTitle.description);
                    if (descText && descText.length > 50) {
                      responsibilities = splitTextToItems(descText);
                    }
                  }

                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <div className="h-6 w-6 rounded-md bg-blue-100 flex items-center justify-center">
                            <ClipboardList className="h-3.5 w-3.5 text-blue-600" />
                          </div>
                          Responsibilities
                        </h4>
                        {responsibilities.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {responsibilities.length} items
                          </span>
                        )}
                      </div>
                      {responsibilities.length > 0 ? (
                        <div className="rounded-lg border bg-card">
                          {responsibilities.map((item, index) => (
                            <div
                              key={index}
                              className={`flex items-start gap-3 px-4 py-3 text-sm ${
                                index !== responsibilities.length - 1 ? "border-b" : ""
                              }`}
                            >
                              <span className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                                {index + 1}
                              </span>
                              <span className="text-muted-foreground leading-relaxed">{item}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed p-4 text-center">
                          <p className="text-sm text-muted-foreground">
                            No responsibilities defined
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Requirements */}
                {(() => {
                  const requirements = parseRichTextToArray(selectedJobTitle?.requirements);
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <div className="h-6 w-6 rounded-md bg-green-100 flex items-center justify-center">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                          </div>
                          Requirements
                        </h4>
                        {requirements.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {requirements.length} items
                          </span>
                        )}
                      </div>
                      {requirements.length > 0 ? (
                        <div className="rounded-lg border bg-card">
                          {requirements.map((item, index) => (
                            <div
                              key={index}
                              className={`flex items-start gap-3 px-4 py-3 text-sm ${
                                index !== requirements.length - 1 ? "border-b" : ""
                              }`}
                            >
                              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                              <span className="text-muted-foreground leading-relaxed">{item}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed p-4 text-center">
                          <p className="text-sm text-muted-foreground">
                            No requirements defined
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Created {formatShortDate(selectedJobTitle?.createdAt)}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    if (selectedJobTitle) handleEditClick(selectedJobTitle);
                  }}
                >
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  Edit
                </Button>
              </div>
            </div>
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
