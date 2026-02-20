"use client";

import * as React from "react";
import Link from "next/link";
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  Layers,
  Users,
  Loader2,
  AlertCircle,
  Building2,
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
import { divisionService, CreateDivisionRequest } from "@/services/division.service";
import { obsService } from "@/services/obs.service";
import { Division } from "@/types";
import { formatShortDate } from "@/lib/utils";

interface FormData {
  name: string;
  code: string;
  description: string;
}

const initialFormData: FormData = {
  name: "",
  code: "",
  description: "",
};

export default function DivisionsPage() {
  const {
    divisions,
    setDivisions,
    addDivision,
    updateDivision,
    deleteDivision,
    organizations,
    setOrganizations,
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
  const [selectedDivision, setSelectedDivision] = React.useState<Division | null>(null);
  const [formData, setFormData] = React.useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Stats
  const [totalEmployees] = React.useState(0);
  const [totalDepartments] = React.useState(0);

  // Fetch data on mount
  React.useEffect(() => {
    fetchDivisions();
    fetchOrganizations();
  }, []);

  const fetchDivisions = async () => {
    setLoading(true);
    setError(null);

    const response = await divisionService.getAll(1, 100);
    console.log("Division API Response:", response);

    if (response.success && response.data) {
      setDivisions(response.data.data || []);
    } else {
      setError(response.message || "Failed to fetch divisions");
      setDivisions([]);
    }

    setLoading(false);
  };

  const fetchOrganizations = async () => {
    const response = await obsService.getAll();
    if (response.success && response.data) {
      // OBS returns array directly
      const orgData = Array.isArray(response.data) ? response.data : [];
      setOrganizations(orgData);
    }
  };

  const filteredData = React.useMemo(() => {
    const divArray = Array.isArray(divisions) ? divisions : [];
    if (!searchQuery) return divArray;
    const query = searchQuery.toLowerCase();
    return divArray.filter(
      (div) =>
        div.name.toLowerCase().includes(query) ||
        div.code.toLowerCase().includes(query)
    );
  }, [searchQuery, divisions]);

  const handleAddClick = () => {
    setFormData(initialFormData);
    setIsAddDialogOpen(true);
  };

  const handleEditClick = (div: Division) => {
    setSelectedDivision(div);
    setFormData({
      name: div.name,
      code: div.code,
      description: div.description || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (div: Division) => {
    setSelectedDivision(div);
    setIsDeleteDialogOpen(true);
  };

  const handleCreate = async () => {
    setIsSubmitting(true);

    const data: CreateDivisionRequest = {
      name: formData.name,
      code: formData.code,
      description: formData.description || undefined,
      organizationId: organizations[0]?.id || "",
    };

    const response = await divisionService.create(data);

    if (response.success && response.data) {
      addDivision(response.data);
      setIsAddDialogOpen(false);
      setFormData(initialFormData);
    } else {
      setError(response.message || "Failed to create division");
    }

    setIsSubmitting(false);
  };

  const handleUpdate = async () => {
    if (!selectedDivision) return;

    setIsSubmitting(true);

    const response = await divisionService.update(selectedDivision.id, {
      name: formData.name,
      code: formData.code,
      description: formData.description || undefined,
      organizationId: selectedDivision.organizationId,
    });

    if (response.success && response.data) {
      updateDivision(selectedDivision.id, response.data);
      setIsEditDialogOpen(false);
      setSelectedDivision(null);
      setFormData(initialFormData);
    } else {
      setError(response.message || "Failed to update division");
    }

    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!selectedDivision) return;

    setIsSubmitting(true);

    const response = await divisionService.delete(selectedDivision.id);

    if (response.success) {
      deleteDivision(selectedDivision.id);
      setIsDeleteDialogOpen(false);
      setSelectedDivision(null);
    } else {
      setError(response.message || "Failed to delete division");
    }

    setIsSubmitting(false);
  };

  const columns = [
    {
      key: "name",
      label: "Division",
      render: (_: unknown, row: Division) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-xs text-muted-foreground">{row.description}</p>
        </div>
      ),
    },
    {
      key: "code",
      label: "Code",
      render: (_: unknown, row: Division) => (
        <Badge variant="outline">{row.code}</Badge>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      render: (_: unknown, row: Division) => (
        <span className="text-sm text-muted-foreground">
          {formatShortDate(row.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      className: "w-[50px]",
      render: (_: unknown, row: Division) => (
        <Link href={`/organization/divisions/${row.id}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-accent">
            <Eye className="h-4 w-4" />
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <>
      <Header title="Divisions" />
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
                  <Layers className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">
                    {isLoading ? "-" : (divisions?.length || 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Divisions</p>
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
                    {isLoading ? "-" : totalEmployees}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Employees</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">
                    {isLoading ? "-" : totalDepartments}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Departments</p>
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
              searchPlaceholder="Search divisions..."
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
              emptyMessage="No divisions found"
              actions={
                <Button size="sm" onClick={handleAddClick}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Division
                </Button>
              }
            />
          )}
        </div>

        {/* Add Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Division</DialogTitle>
              <DialogDescription>
                Create a new division in your organization.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter division name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  placeholder="Enter division code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
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
                  !formData.code
                }
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Add Division"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Division</DialogTitle>
              <DialogDescription>
                Update the division details.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  placeholder="Enter division name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-code">Code *</Label>
                <Input
                  id="edit-code"
                  placeholder="Enter division code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
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
              <AlertDialogTitle>Delete Division</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{selectedDivision?.name}&quot;? This
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
