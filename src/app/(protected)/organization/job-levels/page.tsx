"use client";

import * as React from "react";
import {
  Eye,
  Pencil,
  Trash2,
  Award,
  Layers,
  Loader2,
  MoreHorizontal,
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
import { Checkbox } from "@/components/ui/checkbox";

import { useOrganizationStore } from "@/stores/organization-store";
import { jobLevelService, CreateJobLevelRequest } from "@/services/job-level.service";
import { showToast } from "@/lib/utils/toast-messages";
import { JobLevel } from "@/types";

const JOB_LEVEL_CATEGORIES = ["Structural", "Functional"] as const;

interface FormData {
  name: string;
  category: string;
  description: string;
  order: string;
  canCreateJobTitle: boolean;
  canCreateKpi: boolean;
}

const initialFormData: FormData = {
  name: "",
  category: "",
  description: "",
  order: "",
  canCreateJobTitle: false,
  canCreateKpi: false,
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
  } = useOrganizationStore();

  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [totalItems, setTotalItems] = React.useState(0);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Dialog states
  const [isDetailDialogOpen, setIsDetailDialogOpen] = React.useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedJobLevel, setSelectedJobLevel] = React.useState<JobLevel | null>(null);
  const [formData, setFormData] = React.useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Fetch data on mount and when pagination changes
  React.useEffect(() => {
    fetchJobLevels(currentPage, pageSize);
  }, [currentPage, pageSize]);

  const fetchJobLevels = async (page: number, limit: number) => {
    setLoading(true);

    const response = await jobLevelService.getAll(page, limit);

    if (response.success && response.data) {
      const levelData = response.data.data || [];
      setJobLevels(levelData);
      setTotalItems(response.data.pagination?.total || levelData.length);
    } else {
      showToast.fetchError("job levels", response.message);
      setJobLevels([]);
    }

    setLoading(false);
  };

  // Client-side search on current page data
  const filteredData = React.useMemo(() => {
    const levelArray = Array.isArray(jobLevels) ? jobLevels : [];
    if (!searchQuery) return levelArray;
    const query = searchQuery.toLowerCase();
    return levelArray.filter(
      (level) =>
        level.name.toLowerCase().includes(query) ||
        level.category.toLowerCase().includes(query) ||
        (level.description && level.description.toLowerCase().includes(query))
    );
  }, [searchQuery, jobLevels]);

  // Count by category
  const categoryStats = React.useMemo(() => {
    const levelArray = Array.isArray(jobLevels) ? jobLevels : [];
    return {
      structural: levelArray.filter((l) => l.category === "Structural").length,
      functional: levelArray.filter((l) => l.category === "Functional").length,
    };
  }, [jobLevels]);

  const handleDetailClick = (level: JobLevel) => {
    setSelectedJobLevel(level);
    setIsDetailDialogOpen(true);
  };

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
      order: level.order != null ? String(level.order) : "",
      canCreateJobTitle: level.canCreateJobTitle ?? false,
      canCreateKpi: level.canCreateKpi ?? false,
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
      order: formData.order ? Number(formData.order) : undefined,
      canCreateJobTitle: formData.canCreateJobTitle,
      canCreateKpi: formData.canCreateKpi,
    };

    const response = await jobLevelService.create(data);

    if (response.success && response.data) {
      addJobLevel(response.data);
      setIsAddDialogOpen(false);
      setFormData(initialFormData);
      setTotalItems((prev) => prev + 1);
      showToast.created("Job Level");
    } else {
      showToast.createError("job level", response.message);
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
      order: formData.order ? Number(formData.order) : undefined,
      canCreateJobTitle: formData.canCreateJobTitle,
      canCreateKpi: formData.canCreateKpi,
    });

    if (response.success && response.data) {
      updateJobLevel(selectedJobLevel.id, response.data);
      setIsEditDialogOpen(false);
      setSelectedJobLevel(null);
      setFormData(initialFormData);
      showToast.updated("Job Level");
    } else {
      showToast.updateError("job level", response.message);
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
      setTotalItems((prev) => prev - 1);
      showToast.deleted("Job Level");
    } else {
      showToast.deleteError("job level", response.message);
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
      key: "actions",
      label: "",
      className: "w-[50px]",
      render: (_: unknown, row: JobLevel) => (
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
            <DropdownMenuItem onClick={() => handleDetailClick(row)}>
              <Eye className="mr-2 h-4 w-4" />
              Detail
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
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const renderFormFields = (prefix: string) => (
    <div className="grid gap-4 py-4">
      <div className="space-y-1.5">
        <Label htmlFor={`${prefix}-name`}>Name *</Label>
        <Input
          id={`${prefix}-name`}
          placeholder="Enter level name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${prefix}-category`}>Category *</Label>
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
        <Label htmlFor={`${prefix}-order`}>Order</Label>
        <Input
          id={`${prefix}-order`}
          type="number"
          placeholder="Enter order number"
          value={formData.order}
          onChange={(e) => setFormData({ ...formData, order: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${prefix}-description`}>Description</Label>
        <Textarea
          id={`${prefix}-description`}
          placeholder="Enter description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id={`${prefix}-canCreateJobTitle`}
          checked={formData.canCreateJobTitle}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, canCreateJobTitle: checked === true })
          }
        />
        <Label htmlFor={`${prefix}-canCreateJobTitle`} className="font-normal">
          Can create job title
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id={`${prefix}-canCreateKpi`}
          checked={formData.canCreateKpi}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, canCreateKpi: checked === true })
          }
        />
        <Label htmlFor={`${prefix}-canCreateKpi`} className="font-normal">
          Can create KPI
        </Label>
      </div>
    </div>
  );

  return (
    <>
      <Header title="Job Levels" />
      <PageContainer>
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
                  <Award className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">
                    {isLoading ? "-" : totalItems || jobLevels?.length || 0}
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
              data={filteredData}
              columns={columns}
              searchable
              searchPlaceholder="Search by name, category, or description..."
              onSearch={(value) => {
                setSearchQuery(value);
                setCurrentPage(1);
              }}
              pagination
              pageSize={pageSize}
              totalItems={totalItems}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              emptyMessage="No job levels found"
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Job Level</DialogTitle>
              <DialogDescription>
                Create a new job level for your organization.
              </DialogDescription>
            </DialogHeader>
            {renderFormFields("add")}
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
                    <Loader2 className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Job Level"
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
            {renderFormFields("edit")}
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
                    <Loader2 className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Job Level Detail</DialogTitle>
              <DialogDescription>
                Viewing job level information.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={selectedJobLevel?.name || ""} disabled />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Input value={selectedJobLevel?.category || ""} disabled />
              </div>
              <div className="space-y-1.5">
                <Label>Order</Label>
                <Input
                  value={selectedJobLevel?.order != null ? String(selectedJobLevel.order) : "-"}
                  disabled
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea value={selectedJobLevel?.description || "-"} disabled />
              </div>
              <div className="space-y-1.5">
                <Label>Can Create Job Title</Label>
                <Input
                  value={selectedJobLevel?.canCreateJobTitle ? "Yes" : "No"}
                  disabled
                />
              </div>
              <div className="space-y-1.5">
                <Label>Can Create KPI</Label>
                <Input
                  value={selectedJobLevel?.canCreateKpi ? "Yes" : "No"}
                  disabled
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDetailDialogOpen(false)}
              >
                Close
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
