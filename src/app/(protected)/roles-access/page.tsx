"use client";

import * as React from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  MoreHorizontal,
  Shield,
  Users,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

import roleService from "@/services/role.service";
import { Role } from "@/types/role";
import { showToast } from "@/lib/utils/toast-messages";

export default function RolesAccessPage() {
  // Local state
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Form dialog states
  const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);
  const [editingRole, setEditingRole] = React.useState<Role | null>(null);
  const [roleName, setRoleName] = React.useState("");
  const [formError, setFormError] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Delete dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedRole, setSelectedRole] = React.useState<Role | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Fetch all roles
  const fetchRoles = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const response = await roleService.fetchAll();

    if (!response.success || !response.data) {
      setError(response.message || "Failed to fetch roles");
      setRoles([]);
      setIsLoading(false);
      showToast.fetchError("roles", response.message);
      return;
    }

    setRoles(response.data);
    setIsLoading(false);
  }, []);

  // Initial fetch
  React.useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Filter and pagination
  const filteredData = React.useMemo(() => {
    let result = roles;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((role) =>
        role.roleName?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [searchQuery, roles]);

  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Stats
  const stats = React.useMemo(() => {
    const totalCount = roles.length;

    return [
      {
        label: "Total Roles",
        value: totalCount,
        icon: Shield,
        description: "All system roles",
        accent: true,
      },
      {
        label: "Active Roles",
        value: totalCount,
        icon: Users,
        description: "Currently in use",
        accent: false,
      },
    ];
  }, [roles]);

  // Form handlers
  const handleOpenCreate = () => {
    setEditingRole(null);
    setRoleName("");
    setFormError("");
    setIsFormDialogOpen(true);
  };

  const handleOpenEdit = (role: Role) => {
    setEditingRole(role);
    setRoleName(role.roleName || "");
    setFormError("");
    setIsFormDialogOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormDialogOpen(false);
    setEditingRole(null);
    setRoleName("");
    setFormError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!roleName.trim()) {
      setFormError("Role name is required");
      return;
    }

    setIsSubmitting(true);

    if (editingRole) {
      // Update
      const res = await roleService.update(editingRole.roleId, {
        roleName: roleName.trim(),
      });

      if (res.success && res.data) {
        setRoles((prev) =>
          prev.map((r) => (r.roleId === editingRole.roleId ? res.data! : r))
        );
        showToast.updated("Role");
        handleCloseForm();
      } else {
        showToast.updateError("role", res.message);
      }
    } else {
      // Create
      const res = await roleService.create({
        roleName: roleName.trim(),
      });

      if (res.success && res.data) {
        setRoles((prev) => [...prev, res.data!]);
        showToast.created("Role");
        handleCloseForm();
      } else {
        showToast.createError("role", res.message);
      }
    }

    setIsSubmitting(false);
  };

  // Delete handler
  const handleDelete = async () => {
    if (!selectedRole) return;
    setIsDeleting(true);

    const response = await roleService.delete(selectedRole.roleId);

    if (response.success) {
      setRoles((prev) => prev.filter((r) => r.roleId !== selectedRole.roleId));
      setIsDeleteDialogOpen(false);
      setSelectedRole(null);
      showToast.deleted("Role");
    } else {
      showToast.deleteError("role", response.message);
    }

    setIsDeleting(false);
  };

  const handleDeleteClick = (role: Role) => {
    setSelectedRole(role);
    setIsDeleteDialogOpen(true);
  };

  // Table columns
  const columns = [
    {
      key: "roleId",
      label: "ID",
      className: "w-[80px]",
      render: (_: unknown, row: Role) => (
        <span className="text-sm font-medium text-muted-foreground">
          #{row.roleId}
        </span>
      ),
    },
    {
      key: "roleName",
      label: "Role Name",
      render: (_: unknown, row: Role) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
            <Shield className="h-4 w-4 text-accent" />
          </div>
          <span className="font-medium">{row.roleName || "—"}</span>
        </div>
      ),
    },
    {
      key: "actions",
      label: "",
      className: "w-[50px]",
      render: (_: unknown, row: Role) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleOpenEdit(row)}>
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
      <Header title="Roles Access" />
      <PageContainer>
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2">
            {stats.map((stat) => (
              <Card
                key={stat.label}
                className={stat.accent ? "border-accent/20 bg-accent/5" : ""}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        {stat.label}
                      </p>
                      <p
                        className={`mt-1 text-3xl font-semibold ${
                          stat.accent ? "text-accent" : ""
                        }`}
                      >
                        {isLoading ? "-" : stat.value}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {stat.description}
                      </p>
                    </div>
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                        stat.accent ? "bg-accent/10" : "bg-secondary"
                      }`}
                    >
                      <stat.icon
                        className={`h-5 w-5 ${
                          stat.accent ? "text-accent" : "text-muted-foreground"
                        }`}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Table */}
          <div className="animate-fade-in stagger-3">
            {isLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
              </Card>
            ) : error ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={fetchRoles}
                  >
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <DataTable
                data={paginatedData}
                columns={columns}
                searchable
                searchPlaceholder="Search by role name..."
                onSearch={(value) => {
                  setSearchQuery(value);
                  setCurrentPage(1);
                }}
                pagination
                pageSize={pageSize}
                totalItems={filteredData.length}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                emptyMessage="No roles found"
                actions={
                  <Button size="sm" onClick={handleOpenCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Role
                  </Button>
                }
              />
            )}
          </div>
        </div>
      </PageContainer>

      {/* Form Dialog (Create/Edit) */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? "Edit Role" : "Add New Role"}
            </DialogTitle>
            <DialogDescription>
              {editingRole
                ? "Update the role information below."
                : "Enter the role name to create a new role."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="roleName">
                  Role Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="roleName"
                  value={roleName}
                  onChange={(e) => {
                    setRoleName(e.target.value);
                    if (formError) setFormError("");
                  }}
                  placeholder="Enter role name"
                  className={formError ? "border-destructive" : ""}
                  disabled={isSubmitting}
                />
                {formError && (
                  <p className="text-xs text-destructive">{formError}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseForm}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingRole ? "Saving..." : "Creating..."}
                  </>
                ) : editingRole ? (
                  "Save Changes"
                ) : (
                  "Create Role"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{selectedRole?.roleName}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedRole(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
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
    </>
  );
}
