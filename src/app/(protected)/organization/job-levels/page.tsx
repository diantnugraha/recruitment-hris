"use client";

import * as React from "react";
import {
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
      className: "w-1/2",
      render: (row: JobLevel) => (
        <button
          type="button"
          className="font-medium text-accent hover:underline text-left"
          onClick={() => handleDetailClick(row)}
        >
          {row.name}
        </button>
      ),
    },
    {
      key: "category",
      label: "Category",
      className: "w-1/2",
      render: (row: JobLevel) => (
        <Badge variant={row.category === "Structural" ? "default" : "secondary"}>
          {row.category}
        </Badge>
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
      <Header title="Position" />
      <PageContainer>
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Job Levels</h2>
            <p className="text-sm text-muted-foreground">Manage job levels and their categories.</p>
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
            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="text-sm font-medium">{selectedJobLevel?.name || "-"}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="text-sm font-medium">{selectedJobLevel?.category || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Order</p>
                  <p className="text-sm font-medium">{selectedJobLevel?.order != null ? String(selectedJobLevel.order) : "-"}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Can Create Job Title</p>
                  <p className="text-sm font-medium">{selectedJobLevel?.canCreateJobTitle ? "Yes" : "No"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Can Create KPI</p>
                  <p className="text-sm font-medium">{selectedJobLevel?.canCreateKpi ? "Yes" : "No"}</p>
                </div>
              </div>
              {selectedJobLevel?.description && (
                <div className="space-y-1 border-t pt-3">
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="text-sm text-muted-foreground">{selectedJobLevel.description}</p>
                </div>
              )}
            </div>
            <DialogFooter className="flex-row gap-2 sm:justify-end">
              <Button
                variant="ghost"
                className="mr-auto text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => {
                  setIsDetailDialogOpen(false);
                  if (selectedJobLevel) handleDeleteClick(selectedJobLevel);
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsDetailDialogOpen(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setIsDetailDialogOpen(false);
                  if (selectedJobLevel) handleEditClick(selectedJobLevel);
                }}
              >
                <Pencil className="h-4 w-4" />
                Edit
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
