"use client";

import * as React from "react";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Building,
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
import { departmentService, CreateDepartmentRequest } from "@/services/department.service";
import { divisionService } from "@/services/division.service";
import { Department } from "@/types";
import { formatShortDate } from "@/lib/utils";

interface FormData {
  name: string;
  code: string;
  description: string;
  divisionId: string;
}

const initialFormData: FormData = {
  name: "",
  code: "",
  description: "",
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
    error,
    setError,
  } = useOrganizationStore();

  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [totalItems, setTotalItems] = React.useState(0);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedDepartment, setSelectedDepartment] = React.useState<Department | null>(null);
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
    setError(null);

    const response = await departmentService.getAll(page, limit);
    console.log("Department Page - Response:", response);
    console.log("Department Page - Success:", response.success);
    console.log("Department Page - Data:", response.data);

    if (response.success && response.data) {
      const deptData = response.data.data || [];
      console.log("Department Page - Setting departments:", deptData);
      console.log("Department Page - Departments length:", deptData.length);
      setDepartments(deptData);
      setTotalItems(response.data.pagination?.total || deptData.length);
    } else {
      console.log("Department Page - Failed:", response.message);
      setError(response.message || "Failed to fetch departments");
      setDepartments([]);
    }

    setLoading(false);
  };

  const fetchDivisions = async () => {
    const response = await divisionService.getAll(1, 100);
    if (response.success && response.data) {
      const divData = Array.isArray(response.data.data) ? response.data.data : [];
      setDivisions(divData);
    }
  };

  // Filter for search (client-side search on current page data)
  const filteredData = React.useMemo(() => {
    const deptArray = Array.isArray(departments) ? departments : [];
    if (!searchQuery) return deptArray;
    const query = searchQuery.toLowerCase();
    return deptArray.filter(
      (dept) =>
        dept.name.toLowerCase().includes(query) ||
        dept.code.toLowerCase().includes(query)
    );
  }, [searchQuery, departments]);

  const getDivisionName = (divId: string) => {
    return divisions.find((div) => div.id === divId)?.name || "-";
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
      description: dept.description || "",
      divisionId: dept.divisionId,
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
      description: formData.description || undefined,
      divisionId: formData.divisionId,
    };

    const response = await departmentService.create(data);

    if (response.success && response.data) {
      addDepartment(response.data);
      setIsAddDialogOpen(false);
      setFormData(initialFormData);
    } else {
      setError(response.message || "Failed to create department");
    }

    setIsSubmitting(false);
  };

  const handleUpdate = async () => {
    if (!selectedDepartment) return;

    setIsSubmitting(true);

    const response = await departmentService.update(selectedDepartment.id, {
      name: formData.name,
      code: formData.code,
      description: formData.description || undefined,
      divisionId: formData.divisionId,
    });

    if (response.success && response.data) {
      updateDepartment(selectedDepartment.id, response.data);
      setIsEditDialogOpen(false);
      setSelectedDepartment(null);
      setFormData(initialFormData);
    } else {
      setError(response.message || "Failed to update department");
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
    } else {
      setError(response.message || "Failed to delete department");
    }

    setIsSubmitting(false);
  };

  const columns = [
    {
      key: "name",
      label: "Department",
      render: (_: unknown, row: Department) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary">
            <Building className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">{row.name}</p>
          </div>
        </div>
      ),
    },
    {
      key: "code",
      label: "Code",
      render: (_: unknown, row: Department) => (
        <Badge variant="outline">{row.code}</Badge>
      ),
    },
    {
      key: "category",
      label: "Category",
      render: (_: unknown, row: Department & { category?: string }) => (
        <span className="text-sm">{row.category || "-"}</span>
      ),
    },
    {
      key: "division",
      label: "Division",
      render: (_: unknown, row: Department) => (
        <span className="text-sm">{getDivisionName(row.divisionId)}</span>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      render: (_: unknown, row: Department) => (
        <span className="text-sm text-muted-foreground">
          {formatShortDate(row.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      className: "w-[50px]",
      render: (_: unknown, row: Department) => (
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
      <Header title="Departments" />
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
                  <Building className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">
                    {isLoading ? "-" : (departments?.length || 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Departments</p>
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
                    {isLoading ? "-" : (divisions?.length || 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Divisions</p>
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
              searchPlaceholder="Search departments..."
              onSearch={setSearchQuery}
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
                <Button size="sm" onClick={handleAddClick}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Department
                </Button>
              }
            />
          )}
        </div>

        {/* Add Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Department</DialogTitle>
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
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  placeholder="Enter department code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="division">Division *</Label>
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
                  !formData.divisionId
                }
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Add Department"
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
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-code">Code *</Label>
                <Input
                  id="edit-code"
                  placeholder="Enter department code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-division">Division *</Label>
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
                  !formData.divisionId
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
              <AlertDialogTitle>Delete Department</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{selectedDepartment?.name}&quot;? This
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
