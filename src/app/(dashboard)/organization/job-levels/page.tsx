"use client";

import * as React from "react";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Award,
  TrendingUp,
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
import { useOrganizationStore } from "@/stores/organization-store";
import { jobLevelService, CreateJobLevelRequest } from "@/services/job-level.service";
import { JobLevel } from "@/types";
import { formatCurrency, formatShortDate } from "@/lib/utils";

interface FormData {
  name: string;
  code: string;
  level: number;
  description: string;
  minSalary: string;
  maxSalary: string;
}

const initialFormData: FormData = {
  name: "",
  code: "",
  level: 1,
  description: "",
  minSalary: "",
  maxSalary: "",
};

export default function JobLevelsPage() {
  const {
    jobLevels,
    setJobLevels,
    addJobLevel,
    updateJobLevel,
    deleteJobLevel,
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
  const [selectedJobLevel, setSelectedJobLevel] = React.useState<JobLevel | null>(null);
  const [formData, setFormData] = React.useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Fetch data on mount
  React.useEffect(() => {
    fetchJobLevels();
  }, []);

  const fetchJobLevels = async () => {
    setLoading(true);
    setError(null);

    const response = await jobLevelService.getAll(1, 100);
    console.log("Job Level API Response:", response);

    if (response.success && response.data) {
      setJobLevels(response.data.data || []);
    } else {
      setError(response.message || "Failed to fetch job levels");
      setJobLevels([]);
    }

    setLoading(false);
  };

  const filteredData = React.useMemo(() => {
    const levelArray = Array.isArray(jobLevels) ? jobLevels : [];
    if (!searchQuery) return levelArray;
    const query = searchQuery.toLowerCase();
    return levelArray.filter(
      (level) =>
        level.name.toLowerCase().includes(query) ||
        level.code.toLowerCase().includes(query)
    );
  }, [searchQuery, jobLevels]);

  const handleAddClick = () => {
    setFormData(initialFormData);
    setIsAddDialogOpen(true);
  };

  const handleEditClick = (level: JobLevel) => {
    setSelectedJobLevel(level);
    setFormData({
      name: level.name,
      code: level.code,
      level: level.level,
      description: level.description || "",
      minSalary: level.minSalary?.toString() || "",
      maxSalary: level.maxSalary?.toString() || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (level: JobLevel) => {
    setSelectedJobLevel(level);
    setIsDeleteDialogOpen(true);
  };

  const handleCreate = async () => {
    setIsSubmitting(true);

    const data: CreateJobLevelRequest = {
      name: formData.name,
      code: formData.code,
      level: formData.level,
      description: formData.description || undefined,
      minSalary: formData.minSalary ? parseFloat(formData.minSalary) : undefined,
      maxSalary: formData.maxSalary ? parseFloat(formData.maxSalary) : undefined,
    };

    const response = await jobLevelService.create(data);

    if (response.success && response.data) {
      addJobLevel(response.data);
      setIsAddDialogOpen(false);
      setFormData(initialFormData);
    } else {
      setError(response.message || "Failed to create job level");
    }

    setIsSubmitting(false);
  };

  const handleUpdate = async () => {
    if (!selectedJobLevel) return;

    setIsSubmitting(true);

    const response = await jobLevelService.update(selectedJobLevel.id, {
      name: formData.name,
      code: formData.code,
      level: formData.level,
      description: formData.description || undefined,
      minSalary: formData.minSalary ? parseFloat(formData.minSalary) : undefined,
      maxSalary: formData.maxSalary ? parseFloat(formData.maxSalary) : undefined,
    });

    if (response.success && response.data) {
      updateJobLevel(selectedJobLevel.id, response.data);
      setIsEditDialogOpen(false);
      setSelectedJobLevel(null);
      setFormData(initialFormData);
    } else {
      setError(response.message || "Failed to update job level");
    }

    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!selectedJobLevel) return;

    setIsSubmitting(true);

    const response = await jobLevelService.delete(selectedJobLevel.id);

    if (response.success) {
      deleteJobLevel(selectedJobLevel.id);
      setIsDeleteDialogOpen(false);
      setSelectedJobLevel(null);
    } else {
      setError(response.message || "Failed to delete job level");
    }

    setIsSubmitting(false);
  };

  const columns = [
    {
      key: "name",
      label: "Level",
      render: (_: unknown, row: JobLevel) => (
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{row.name}</p>
            <Badge variant="secondary" className="text-xs">
              L{row.level}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{row.description}</p>
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
      render: (_: unknown, row: JobLevel) => (
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
      <Header title="Job Levels" />
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
                  <Award className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">
                    {isLoading ? "-" : (jobLevels?.length || 0)}
                  </p>
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
                  <p className="text-2xl font-semibold">
                    {isLoading ? "-" : (jobLevels?.length || 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Career Paths</p>
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
              searchPlaceholder="Search job levels..."
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
              emptyMessage="No job levels found"
              actions={
                <Button size="sm" onClick={handleAddClick}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Job Level
                </Button>
              }
            />
          )}
        </div>

        {/* Add Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter level name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    placeholder="Enter level code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="level">Level Number *</Label>
                <Input
                  id="level"
                  type="number"
                  min="1"
                  placeholder="Enter level number"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="minSalary">Min Salary</Label>
                  <Input
                    id="minSalary"
                    type="number"
                    placeholder="Minimum salary"
                    value={formData.minSalary}
                    onChange={(e) => setFormData({ ...formData, minSalary: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="maxSalary">Max Salary</Label>
                  <Input
                    id="maxSalary"
                    type="number"
                    placeholder="Maximum salary"
                    value={formData.maxSalary}
                    onChange={(e) => setFormData({ ...formData, maxSalary: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                  !formData.code
                }
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Add Job Level"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Job Level</DialogTitle>
              <DialogDescription>
                Update the job level details.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-name">Name *</Label>
                  <Input
                    id="edit-name"
                    placeholder="Enter level name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-code">Code *</Label>
                  <Input
                    id="edit-code"
                    placeholder="Enter level code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-level">Level Number *</Label>
                <Input
                  id="edit-level"
                  type="number"
                  min="1"
                  placeholder="Enter level number"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-minSalary">Min Salary</Label>
                  <Input
                    id="edit-minSalary"
                    type="number"
                    placeholder="Minimum salary"
                    value={formData.minSalary}
                    onChange={(e) => setFormData({ ...formData, minSalary: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-maxSalary">Max Salary</Label>
                  <Input
                    id="edit-maxSalary"
                    type="number"
                    placeholder="Maximum salary"
                    value={formData.maxSalary}
                    onChange={(e) => setFormData({ ...formData, maxSalary: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Enter description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                  !formData.code
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
              <AlertDialogTitle>Delete Job Level</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{selectedJobLevel?.name}&quot;? This
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
