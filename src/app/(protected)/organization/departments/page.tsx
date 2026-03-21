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
import {
  departmentService,
  CreateDepartmentRequest,
} from "@/services/department.service";
import { divisionService } from "@/services/division.service";
import { showToast } from "@/lib/utils/toast-messages";
import { Department } from "@/types";

const DEPARTMENT_CATEGORIES = ["Profit Center", "Non Profit Center"] as const;

// Format category from API (e.g., "Non_Profit_Center" -> "Non Profit Center")
const formatCategory = (category: string): string => {
  return category.replace(/_/g, " ");
};

interface FormData {
  name: string;
  code: string;
  category: "Profit Center" | "Non Profit Center";
  description: string;
  obsId: string;
  divisionId: string;
}

const initialFormData: FormData = {
  name: "",
  code: "",
  category: "Profit Center",
  description: "",
  obsId: "",
  divisionId: "",
};

export default function DepartmentsPage() {
  const {
    departments,
    setDepartments,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    divisions,
    setDivisions,
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
  const [selectedDepartment, setSelectedDepartment] =
    React.useState<Department | null>(null);
  const [formData, setFormData] = React.useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Fetch data on mount and when pagination changes
  React.useEffect(() => {
    fetchDepartments(currentPage, pageSize);
  }, [currentPage, pageSize]);

  React.useEffect(() => {
    fetchDivisions();
  }, []);

  const fetchDepartments = async (page: number, limit: number) => {
    setLoading(true);

    const response = await departmentService.getAll(page, limit);

    if (response.success && response.data) {
      const deptData = response.data.data || [];
      setDepartments(deptData);
      setTotalItems(response.data.pagination?.total || deptData.length);
    } else {
      showToast.fetchError("departments", response.message);
      setDepartments([]);
    }

    setLoading(false);
  };

  const fetchDivisions = async () => {
    const response = await divisionService.fetchAll();
    if (response.success && response.data) {
      const divData = Array.isArray(response.data) ? response.data : [];
      setDivisions(divData);
    }
  };

  // Client-side search on current page data
  const filteredData = React.useMemo(() => {
    const deptArray = Array.isArray(departments) ? departments : [];
    if (!searchQuery) return deptArray;
    const query = searchQuery.toLowerCase();
    return deptArray.filter(
      (dept) =>
        dept.name.toLowerCase().includes(query) ||
        dept.code.toLowerCase().includes(query) ||
        (dept.description && dept.description.toLowerCase().includes(query)) ||
        dept.category.toLowerCase().includes(query)
    );
  }, [searchQuery, departments]);

  const getDivisionName = (divId?: string) => {
    if (!divId) return "-";
    return divisions.find((div) => div.id === divId)?.name || "-";
  };

  const handleDetailClick = (dept: Department) => {
    setSelectedDepartment(dept);
    setIsDetailDialogOpen(true);
  };

  const handleAddClick = () => {
    setFormData(initialFormData);
    setIsAddDialogOpen(true);
  };

  const handleEditClick = (dept: Department) => {
    setSelectedDepartment(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      category: dept.category,
      description: dept.description || "",
      obsId: dept.obsId,
      divisionId: dept.divisionId || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (dept: Department) => {
    setSelectedDepartment(dept);
    setIsDeleteDialogOpen(true);
  };

  const handleCreate = async () => {
    setIsSubmitting(true);

    const data: CreateDepartmentRequest = {
      name: formData.name,
      code: formData.code,
      category: formData.category,
      description: formData.description || undefined,
      obsId: formData.obsId,
      divisionId: formData.divisionId || undefined,
    };

    const response = await departmentService.create(data);

    if (response.success && response.data) {
      addDepartment(response.data);
      setIsAddDialogOpen(false);
      setFormData(initialFormData);
      setTotalItems((prev) => prev + 1);

      showToast.created("Department");
    } else {
      showToast.createError("department", response.message);
    }

    setIsSubmitting(false);
  };

  const handleUpdate = async () => {
    if (!selectedDepartment) return;

    setIsSubmitting(true);

    const response = await departmentService.update(selectedDepartment.id, {
      name: formData.name,
      code: formData.code,
      category: formData.category,
      description: formData.description || undefined,
      obsId: formData.obsId,
      divisionId: formData.divisionId || undefined,
    });

    if (response.success && response.data) {
      updateDepartment(selectedDepartment.id, response.data);
      setIsEditDialogOpen(false);
      setSelectedDepartment(null);
      setFormData(initialFormData);
      showToast.updated("Department");
    } else {
      showToast.updateError("department", response.message);
    }

    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!selectedDepartment) return;

    setIsSubmitting(true);

    const response = await departmentService.delete(selectedDepartment.id);

    if (response.success) {
      deleteDepartment(selectedDepartment.id);
      setIsDeleteDialogOpen(false);
      setSelectedDepartment(null);
      setTotalItems((prev) => prev - 1);

      showToast.deleted("Department");
    } else {
      showToast.deleteError("department", response.message);
    }

    setIsSubmitting(false);
  };

  const columns = [
    {
      key: "code",
      label: "Code",
      render: (row: Department) => (
        <Badge variant="secondary">{row.code}</Badge>
      ),
    },
    {
      key: "name",
      label: "Department",
      render: (row: Department) => (
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
      render: (row: Department) => {
        const displayCategory = formatCategory(row.category);
        return (
          <Badge
            variant={
              displayCategory === "Profit Center" ? "default" : "secondary"
            }
          >
            {displayCategory}
          </Badge>
        );
      },
    },
    {
      key: "division",
      label: "Division",
      render: (row: Department) => (
        <span className="text-sm">{getDivisionName(row.divisionId)}</span>
      ),
    },
  ];

  return (
    <>
      <Header title="Organization" />
      <PageContainer>
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Departments</h2>
            <p className="text-sm text-muted-foreground">Manage departments, categories, and their division assignments.</p>
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
              searchPlaceholder="Search by name, code, or category..."
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
              emptyMessage="No departments found"
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
              <DialogTitle>New Department</DialogTitle>
              <DialogDescription>
                Create a new department in your organization.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter department name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  placeholder="Enter department code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      category: value as FormData["category"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
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
                    <SelectValue placeholder="Select division (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {divisions.map((div) => (
                      <SelectItem key={div.id} value={div.id}>
                        {div.name}
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
                  !formData.category
                }
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Department"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Department</DialogTitle>
              <DialogDescription>
                Update the department details.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  placeholder="Enter department name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-code">Code *</Label>
                <Input
                  id="edit-code"
                  placeholder="Enter department code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      category: value as FormData["category"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-division">Division</Label>
                <Select
                  value={formData.divisionId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, divisionId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select division (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {divisions.map((div) => (
                      <SelectItem key={div.id} value={div.id}>
                        {div.name}
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
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
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
              <DialogTitle>Department Detail</DialogTitle>
              <DialogDescription>
                Viewing department information.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="text-sm font-medium">{selectedDepartment?.name || "-"}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Code</p>
                  <p className="text-sm font-medium">{selectedDepartment?.code || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="text-sm font-medium">{selectedDepartment ? formatCategory(selectedDepartment.category) : "-"}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Division</p>
                <p className="text-sm font-medium">{getDivisionName(selectedDepartment?.divisionId)}</p>
              </div>
              {selectedDepartment?.description && (
                <div className="space-y-1 border-t pt-3">
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="text-sm text-muted-foreground">{selectedDepartment.description}</p>
                </div>
              )}
            </div>
            <DialogFooter className="flex-row gap-2 sm:justify-end">
              <Button
                variant="ghost"
                className="mr-auto text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => {
                  setIsDetailDialogOpen(false);
                  if (selectedDepartment) handleDeleteClick(selectedDepartment);
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
                  if (selectedDepartment) handleEditClick(selectedDepartment);
                }}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Department</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;
                {selectedDepartment?.name}&quot;? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting}>
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
      </PageContainer>
    </>
  );
}
