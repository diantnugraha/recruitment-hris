"use client";

import * as React from "react";
import Link from "next/link";
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  Award,
  Layers,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useOrganizationStore } from "@/stores/organization-store";
import { jobLevelService, CreateJobLevelRequest } from "@/services/job-level.service";
import { JobLevel } from "@/types";
import { formatShortDate } from "@/lib/utils";

const JOB_LEVEL_CATEGORIES = ["Structural", "Functional"] as const;

interface FormData {
  name: string;
  category: string;
  description: string;
}

const initialFormData: FormData = {
  name: "",
  category: "",
  description: "",
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
        level.category.toLowerCase().includes(query)
    );
  }, [searchQuery, jobLevels]);

  // Paginated data for current page
  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, pageSize]);

  // Count by category
  const categoryStats = React.useMemo(() => {
    const levelArray = Array.isArray(jobLevels) ? jobLevels : [];
    return {
      structural: levelArray.filter((l) => l.category === "Structural").length,
      functional: levelArray.filter((l) => l.category === "Functional").length,
    };
  }, [jobLevels]);

  const handleAddClick = () => {
    setFormData(initialFormData);
    setIsAddDialogOpen(true);
  };

  const handleEditClick = (level: JobLevel) => {
    setSelectedJobLevel(level);
    setFormData({
      name: level.name,
      category: level.category,
      description: level.description || "",
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
      category: formData.category,
      description: formData.description || undefined,
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
      category: formData.category,
      description: formData.description || undefined,
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
      label: "Name",
      render: (_: unknown, row: JobLevel) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-xs text-muted-foreground line-clamp-1">{row.description}</p>
        </div>
      ),
    },
    {
      key: "category",
      label: "Category",
      render: (_: unknown, row: JobLevel) => (
        <Badge variant={row.category === "Structural" ? "default" : "secondary"}>
          {row.category}
        </Badge>
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
        <Link href={`/organization/job-levels/${row.id}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-accent">
            <Eye className="h-4 w-4" />
          </Button>
        </Link>
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
          <div className="grid gap-4 sm:grid-cols-3">
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
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-100">
                  <Layers className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">
                    {isLoading ? "-" : categoryStats.structural}
                  </p>
                  <p className="text-sm text-muted-foreground">Structural</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-green-100">
                  <Layers className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">
                    {isLoading ? "-" : categoryStats.functional}
                  </p>
                  <p className="text-sm text-muted-foreground">Functional</p>
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
              searchPlaceholder="Search job levels..."
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
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_LEVEL_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
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
                  !formData.category
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
                <Label htmlFor="edit-category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_LEVEL_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  !formData.category
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
