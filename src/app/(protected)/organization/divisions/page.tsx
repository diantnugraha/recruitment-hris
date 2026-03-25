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

import { useOrganizationStore } from "@/stores/organization-store";
import { divisionService, CreateDivisionRequest } from "@/services/division.service";
import { obsService } from "@/services/obs.service";
import { showToast } from "@/lib/utils/toast-messages";
import { Division } from "@/types";


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
  const [selectedDivision, setSelectedDivision] = React.useState<Division | null>(null);
  const [formData, setFormData] = React.useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Fetch data on mount and when pagination changes
  React.useEffect(() => {
    fetchDivisions(currentPage, pageSize);
  }, [currentPage, pageSize]);

  React.useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchDivisions = async (page: number, limit: number) => {
    setLoading(true);

    const response = await divisionService.getAll(page, limit);

    if (response.success && response.data) {
      const divData = response.data.data || [];
      setDivisions(divData);
      setTotalItems(response.data.pagination?.total || divData.length);
    } else {
      showToast.fetchError("divisions", response.message);
      setDivisions([]);
    }

    setLoading(false);
  };

  const fetchOrganizations = async () => {
    const response = await obsService.fetchAll();
    if (response.success && response.data) {
      const orgData = Array.isArray(response.data) ? response.data : [];
      setOrganizations(orgData);
    }
  };

  // Client-side search on current page data
  const filteredData = React.useMemo(() => {
    const divArray = Array.isArray(divisions) ? divisions : [];
    if (!searchQuery) return divArray;
    const query = searchQuery.toLowerCase();
    return divArray.filter(
      (div) =>
        div.name.toLowerCase().includes(query) ||
        div.code.toLowerCase().includes(query) ||
        (div.description && div.description.toLowerCase().includes(query))
    );
  }, [searchQuery, divisions]);

  const handleDetailClick = (div: Division) => {
    setSelectedDivision(div);
    setIsDetailDialogOpen(true);
  };

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
      setTotalItems((prev) => prev + 1);

      showToast.created("Division");
    } else {
      showToast.createError("division", response.message);
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
      showToast.updated("Division");
    } else {
      showToast.updateError("division", response.message);
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
      setTotalItems((prev) => prev - 1);

      showToast.deleted("Division");
    } else {
      showToast.deleteError("division", response.message);
    }

    setIsSubmitting(false);
  };

  const columns = [
    {
      key: "name",
      label: "Division",
      className: "w-1/2",
      render: (row: Division) => (
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
      key: "code",
      label: "Code",
      className: "w-1/2",
      render: (row: Division) => (
        <Badge variant="secondary">{row.code}</Badge>
      ),
    },
  ];

  return (
    <>
      <Header title="Organization" />
      <PageContainer>
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Divisions</h2>
            <p className="text-sm text-muted-foreground">Manage divisions within your organization structure.</p>
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
              searchPlaceholder="Search by name, code, or description..."
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
              emptyMessage="No divisions found"
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
              <DialogTitle>New Division</DialogTitle>
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
                disabled={isSubmitting || !formData.name || !formData.code}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Division"
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
                disabled={isSubmitting || !formData.name || !formData.code}
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
              <DialogTitle>Division Detail</DialogTitle>
              <DialogDescription>
                Viewing division information.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="text-sm font-medium">{selectedDivision?.name || "No Data"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Code</p>
                  <p className="text-sm font-medium">{selectedDivision?.code || "No Data"}</p>
                </div>
              </div>
              {selectedDivision?.description && (
                <div className="space-y-1 border-t pt-3">
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="text-sm text-muted-foreground">{selectedDivision.description}</p>
                </div>
              )}
            </div>
            <DialogFooter className="flex-row gap-2 sm:justify-end">
              <Button
                variant="ghost"
                className="mr-auto text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => {
                  setIsDetailDialogOpen(false);
                  if (selectedDivision) handleDeleteClick(selectedDivision);
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
                  if (selectedDivision) handleEditClick(selectedDivision);
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
