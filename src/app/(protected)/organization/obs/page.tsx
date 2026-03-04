"use client";

import * as React from "react";
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  Network,
  Building2,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useOrganizationStore } from "@/stores/organization-store";
import { obsService, CreateOrganizationRequest, OrganizationStats } from "@/services/obs.service";
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

  const [stats, setStats] = React.useState<OrganizationStats>({
    totalUnits: 0,
    totalDivisions: 0,
    totalDepartments: 0,
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
  const [selectedOrg, setSelectedOrg] = React.useState<Organization | null>(null);
  const [formData, setFormData] = React.useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Fetch data on mount and when pagination changes
  React.useEffect(() => {
    fetchOrganizations(currentPage, pageSize);
  }, [currentPage, pageSize]);

  React.useEffect(() => {
    fetchStats();
  }, []);

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

  const fetchStats = async () => {
    const response = await obsService.getStats();
    if (response.success && response.data) {
      setStats(response.data);
    }
  };

  // Client-side search on current page data
  const filteredData = React.useMemo(() => {
    const orgArray = Array.isArray(organizations) ? organizations : [];
    if (!searchQuery) return orgArray;
    const query = searchQuery.toLowerCase();
    return orgArray.filter(
      (org) =>
        org.name.toLowerCase().includes(query) ||
        org.cluster.toLowerCase().includes(query) ||
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
      cluster: org.cluster,
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
      cluster: formData.cluster,
      description: formData.description || undefined,
    };

    const response = await obsService.create(data);

    if (response.success && response.data) {
      addOrganization(response.data);
      setIsAddDialogOpen(false);
      setFormData(initialFormData);
      setTotalItems((prev) => prev + 1);
      fetchStats();
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
      cluster: formData.cluster,
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
      fetchStats();
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
      render: (_: unknown, row: Organization) => (
        <p className="font-medium">{row.name}</p>
      ),
    },
    {
      key: "cluster",
      label: "Cluster",
      render: (_: unknown, row: Organization) => (
        <Badge variant="secondary">{row.cluster}</Badge>
      ),
    },
    {
      key: "description",
      label: "Description",
      render: (_: unknown, row: Organization) => (
        <span className="text-sm text-muted-foreground line-clamp-2">
          {row.description || "-"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      className: "w-[50px]",
      render: (_: unknown, row: Organization) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <MoreHorizontal className="h-4 w-4" />
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
      <Header title="Organization Structure" />
      <PageContainer>
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
                  <Network className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">
                    {isLoading ? "-" : stats.totalUnits || totalItems}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Units</p>
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
                    {isLoading ? "-" : stats.totalDivisions}
                  </p>
                  <p className="text-sm text-muted-foreground">Divisions</p>
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
                    {isLoading ? "-" : stats.totalDepartments}
                  </p>
                  <p className="text-sm text-muted-foreground">Departments</p>
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
                  <Plus className="mr-2 h-4 w-4" />
                  Add Unit
                </Button>
              }
            />
          )}
        </div>

        {/* Add Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Organization Unit</DialogTitle>
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
                disabled={isSubmitting || !formData.name || !formData.cluster}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Add Unit"
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
                disabled={isSubmitting || !formData.name || !formData.cluster}
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

        {/* Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Organization Detail</DialogTitle>
              <DialogDescription>
                Viewing organization unit information.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={selectedOrg?.name || ""} disabled />
              </div>
              <div className="space-y-1.5">
                <Label>Cluster</Label>
                <Input value={selectedOrg?.cluster || ""} disabled />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea value={selectedOrg?.description || "-"} disabled />
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
