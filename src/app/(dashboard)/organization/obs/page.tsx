"use client";

import * as React from "react";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Building2,
  Network,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { obsService, CreateOrganizationRequest, OrganizationStats } from "@/services/obs.service";
import { Organization } from "@/types";

interface OrgCardProps {
  org: Organization;
  onEdit: (org: Organization) => void;
  onDelete: (org: Organization) => void;
}

function OrgCard({ org, onEdit, onDelete }: OrgCardProps) {
  return (
    <div className="group relative flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-secondary/50">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-secondary">
        <Building2 className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <h3 className="font-medium">{org.name}</h3>
        <p className="text-sm text-muted-foreground">{org.description || "No description"}</p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8 opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(org)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => onDelete(org)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

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
    error,
    setError,
  } = useOrganizationStore();

  const [stats, setStats] = React.useState<OrganizationStats>({
    totalUnits: 0,
    totalDivisions: 0,
    totalDepartments: 0,
  });

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedOrg, setSelectedOrg] = React.useState<Organization | null>(null);
  const [formData, setFormData] = React.useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Fetch organizations on mount
  React.useEffect(() => {
    fetchOrganizations();
    fetchStats();
  }, []);

  const fetchOrganizations = async () => {
    setLoading(true);
    setError(null);

    const response = await obsService.getAll();

    if (response.success && response.data) {
      setOrganizations(response.data);
    } else {
      setError(response.message || "Failed to fetch organizations");
    }

    setLoading(false);
  };

  const fetchStats = async () => {
    const response = await obsService.getStats();
    if (response.success && response.data) {
      setStats(response.data);
    }
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
      fetchStats();
    } else {
      setError(response.message || "Failed to create organization");
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
    } else {
      setError(response.message || "Failed to update organization");
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
      fetchStats();
    } else {
      setError(response.message || "Failed to delete organization");
    }

    setIsSubmitting(false);
  };

  return (
    <>
      <Header title="Organization Structure" />
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
                  <Network className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">
                    {isLoading ? "-" : stats.totalUnits || organizations.length}
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

          {/* List View */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-medium">Organization Units</CardTitle>
              <Button size="sm" onClick={handleAddClick}>
                <Plus className="mr-2 h-4 w-4" />
                Add Unit
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : organizations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground">No organizations yet</h3>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Create your first organization unit to get started
                  </p>
                  <Button className="mt-4" onClick={handleAddClick}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Organization
                  </Button>
                </div>
              ) : (
                organizations.map((org) => (
                  <OrgCard
                    key={org.id}
                    org={org}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                  />
                ))
              )}
            </CardContent>
          </Card>
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
