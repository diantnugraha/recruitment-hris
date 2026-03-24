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
import { obsService, CreateOrganizationRequest } from "@/services/obs.service";
import { showToast } from "@/lib/utils/toast-messages";
import { Organization } from "@/types";


interface FormData {
  name: string;
  cluster: string;
  description: string;
}

const initialFormData: FormData = {
  name: "",
  cluster: "",
  description: "",
};

export default function OBSPage() {
  const {
    organizations,
    setOrganizations,
    addOrganization,
    updateOrganization,
    deleteOrganization,
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
  const [selectedOrg, setSelectedOrg] = React.useState<Organization | null>(null);
  const [formData, setFormData] = React.useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Fetch data on mount and when pagination changes
  React.useEffect(() => {
    fetchOrganizations(currentPage, pageSize);
  }, [currentPage, pageSize]);

  const fetchOrganizations = async (page: number, limit: number) => {
    setLoading(true);

    const response = await obsService.getAll(page, limit);

    if (response.success && response.data) {
      const orgData = response.data.data || [];
      setOrganizations(orgData);
      setTotalItems(response.data.pagination?.total || orgData.length);
    } else {
      showToast.fetchError("organizations", response.message);
      setOrganizations([]);
    }

    setLoading(false);
  };

  // Client-side search on current page data
  const filteredData = React.useMemo(() => {
    const orgArray = Array.isArray(organizations) ? organizations : [];
    if (!searchQuery) return orgArray;
    const query = searchQuery.toLowerCase();
    return orgArray.filter(
      (org) =>
        org.name.toLowerCase().includes(query) ||
        (org.cluster && org.cluster.toLowerCase().includes(query)) ||
        (org.description && org.description.toLowerCase().includes(query))
    );
  }, [searchQuery, organizations]);

  const handleDetailClick = (org: Organization) => {
    setSelectedOrg(org);
    setIsDetailDialogOpen(true);
  };

  const handleAddClick = () => {
    setFormData(initialFormData);
    setIsAddDialogOpen(true);
  };

  const handleEditClick = (org: Organization) => {
    setSelectedOrg(org);
    setFormData({
      name: org.name,
      cluster: org.cluster || "",
      description: org.description || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (org: Organization) => {
    setSelectedOrg(org);
    setIsDeleteDialogOpen(true);
  };

  const handleCreate = async () => {
    setIsSubmitting(true);

    const data: CreateOrganizationRequest = {
      name: formData.name,
      cluster: formData.cluster || undefined,
      description: formData.description || undefined,
    };

    const response = await obsService.create(data);

    if (response.success && response.data) {
      addOrganization(response.data);
      setIsAddDialogOpen(false);
      setFormData(initialFormData);
      setTotalItems((prev) => prev + 1);

      showToast.created("Organization");
    } else {
      showToast.createError("organization", response.message);
    }

    setIsSubmitting(false);
  };

  const handleUpdate = async () => {
    if (!selectedOrg) return;

    setIsSubmitting(true);

    const response = await obsService.update(selectedOrg.id, {
      name: formData.name,
      cluster: formData.cluster || undefined,
      description: formData.description || undefined,
    });

    if (response.success && response.data) {
      updateOrganization(selectedOrg.id, response.data);
      setIsEditDialogOpen(false);
      setSelectedOrg(null);
      setFormData(initialFormData);
      showToast.updated("Organization");
    } else {
      showToast.updateError("organization", response.message);
    }

    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!selectedOrg) return;

    setIsSubmitting(true);

    const response = await obsService.delete(selectedOrg.id);

    if (response.success) {
      deleteOrganization(selectedOrg.id);
      setIsDeleteDialogOpen(false);
      setSelectedOrg(null);
      setTotalItems((prev) => prev - 1);

      showToast.deleted("Organization");
    } else {
      showToast.deleteError("organization", response.message);
    }

    setIsSubmitting(false);
  };

  const columns = [
    {
      key: "name",
      label: "Name",
      className: "w-1/2",
      render: (row: Organization) => (
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
      key: "cluster",
      label: "Cluster",
      className: "w-1/2",
      render: (row: Organization) => (
        <Badge variant="secondary">{row.cluster || "No Data"}</Badge>
      ),
    },
  ];

  return (
    <>
      <Header title="Organization" />
      <PageContainer>
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Organization Breakdown Structure (OBS)</h2>
            <p className="text-sm text-muted-foreground">Manage business units and their cluster groupings.</p>
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
              searchPlaceholder="Search by name, cluster, or description..."
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
              emptyMessage="No organizations found"
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
              <DialogTitle>New Organization Unit</DialogTitle>
              <DialogDescription>
                Create a new organization unit.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter unit name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cluster">Cluster *</Label>
                <Input
                  id="cluster"
                  placeholder="Enter cluster"
                  value={formData.cluster}
                  onChange={(e) => setFormData({ ...formData, cluster: e.target.value })}
                />
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
                disabled={isSubmitting || !formData.name}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Unit"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Organization Unit</DialogTitle>
              <DialogDescription>
                Update the organization unit details.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  placeholder="Enter unit name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-cluster">Cluster *</Label>
                <Input
                  id="edit-cluster"
                  placeholder="Enter cluster"
                  value={formData.cluster}
                  onChange={(e) => setFormData({ ...formData, cluster: e.target.value })}
                />
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
                disabled={isSubmitting || !formData.name}
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
              <DialogTitle>Organization Detail</DialogTitle>
              <DialogDescription>
                Viewing organization unit information.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="text-sm font-medium">{selectedOrg?.name || "No Data"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Cluster</p>
                  <p className="text-sm font-medium">{selectedOrg?.cluster || "No Data"}</p>
                </div>
              </div>
              {selectedOrg?.description && (
                <div className="space-y-1 border-t pt-3">
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="text-sm text-muted-foreground">{selectedOrg.description}</p>
                </div>
              )}
            </div>
            <DialogFooter className="flex-row gap-2 sm:justify-end">
              <Button
                variant="ghost"
                className="mr-auto text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => {
                  setIsDetailDialogOpen(false);
                  if (selectedOrg) handleDeleteClick(selectedOrg);
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
                  if (selectedOrg) handleEditClick(selectedOrg);
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
              <AlertDialogTitle>Delete Organization Unit</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{selectedOrg?.name}&quot;? This action cannot be undone.
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
