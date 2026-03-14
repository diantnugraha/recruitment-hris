"use client";

import * as React from "react";
import {
  Eye,
  Pencil,
  Trash2,
  Building,
  Users,
  Loader2,
  MoreHorizontal,
  Layers,
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
import {
  departmentService,
  CreateDepartmentRequest,
  DepartmentStats,
} from "@/services/department.service";
import { divisionService } from "@/services/division.service";
import { obsService } from "@/services/obs.service";
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
    organizations,
    setOrganizations,
    isLoading,
    setLoading,
  } = useOrganizationStore();

  const [stats, setStats] = React.useState<DepartmentStats>({
    totalDepartments: 0,
    totalEmployees: 0,
  });

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
    fetchOrganizations();
    fetchStats();
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

  const fetchOrganizations = async () => {
    const response = await obsService.fetchAll();
    if (response.success && response.data) {
      const orgData = Array.isArray(response.data) ? response.data : [];
      setOrganizations(orgData);
    }
  };

  const fetchStats = async () => {
    const response = await departmentService.getStats();
    if (response.success && response.data) {
      setStats(response.data);
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
      fetchStats();
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
      fetchStats();
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
      render: (_: unknown, row: Department) => (
        <Badge variant="outline">{row.code}</Badge>
      ),
    },
    {
      key: "name",
      label: "Department",
      render: (_: unknown, row: Department) => (
        <p className="font-medium">{row.name}</p>
      ),
    },
    {
      key: "category",
      label: "Category",
      render: (_: unknown, row: Department) => {
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
      render: (_: unknown, row: Department) => (
        <span className="text-sm">{getDivisionName(row.divisionId)}</span>
      ),
    },
    {
      key: "actions",
      label: "",
      className: "w-[50px]",
      render: (_: unknown, row: Department) => (
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

  return (
    <>
      <Header title="Departments" />
      <PageContainer>
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
                  <Building className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">
                    {isLoading
                      ? "-"
                      : stats.totalDepartments || totalItems}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total Departments
                  </p>
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
                    {isLoading ? "-" : stats.totalEmployees}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total Employees
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
                  <Layers className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">
                    {isLoading ? "-" : divisions.length}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total Divisions
                  </p>
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
                <Label htmlFor="obs">OBS *</Label>
                <Select
                  value={formData.obsId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, obsId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select OBS" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
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
                  !formData.obsId ||
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
                <Label htmlFor="edit-obs">OBS *</Label>
                <Select
                  value={formData.obsId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, obsId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select OBS" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
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
                  !formData.obsId ||
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
            <div className="grid gap-4 py-4">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={selectedDepartment?.name || ""} disabled />
              </div>
              <div className="space-y-1.5">
                <Label>Code</Label>
                <Input value={selectedDepartment?.code || ""} disabled />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Input value={selectedDepartment ? formatCategory(selectedDepartment.category) : ""} disabled />
              </div>
              <div className="space-y-1.5">
                <Label>OBS</Label>
                <Input
                  value={
                    organizations.find(
                      (org) => org.id === selectedDepartment?.obsId
                    )?.name || "-"
                  }
                  disabled
                />
              </div>
              <div className="space-y-1.5">
                <Label>Division</Label>
                <Input
                  value={getDivisionName(selectedDepartment?.divisionId)}
                  disabled
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  value={selectedDepartment?.description || "-"}
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
