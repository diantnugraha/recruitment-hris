"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Trash2,
  Loader2,
  Shield,
  Users,
  Search,
  AlertCircle,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { TuvBadge } from "@/components/shared/tuv-badge";

import roleService from "@/services/role.service";
import { Role } from "@/types/role";
import { showToast } from "@/lib/utils/toast-messages";
import { useIsHr } from "@/hooks/useIsHr";

/* TUV button styles */
const btnPrimary = {
  backgroundColor: "var(--hsd-ui-background-color-primary)",
  borderColor: "var(--hsd-ui-border-color-primary)",
  color: "var(--hsd-ui-text-color-primary)",
  borderRadius: "4px",
  height: "38px",
  padding: "0 16px",
  fontSize: "0.875rem",
  fontWeight: 500,
} as const;

const btnSecondary = {
  borderRadius: "4px",
  height: "38px",
  padding: "0 16px",
  fontSize: "0.875rem",
  fontWeight: 500,
  borderColor: "rgba(120,134,127,0.2)",
} as const;

const btnDanger = {
  backgroundColor: "rgba(250, 55, 70, 1)",
  borderColor: "rgba(250, 55, 70, 1)",
  color: "#fff",
  borderRadius: "4px",
  height: "38px",
  padding: "0 16px",
  fontSize: "0.875rem",
  fontWeight: 500,
} as const;

export default function RolesAccessPage() {
  const router = useRouter();
  const isHr = useIsHr();
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [searchQuery, setSearchQuery] = React.useState("");

  const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);
  const [editingRole, setEditingRole] = React.useState<Role | null>(null);
  const [roleName, setRoleName] = React.useState("");
  const [formError, setFormError] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedRole, setSelectedRole] = React.useState<Role | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

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

  React.useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const filteredData = React.useMemo(() => {
    if (!searchQuery) return roles;
    const query = searchQuery.toLowerCase();
    return roles.filter((role) => role.roleName?.toLowerCase().includes(query));
  }, [searchQuery, roles]);

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

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
      const res = await roleService.update(editingRole.roleId, { roleName: roleName.trim() });
      if (res.success && res.data) {
        setRoles((prev) => prev.map((r) => (r.roleId === editingRole.roleId ? res.data! : r)));
        showToast.updated("Role");
        handleCloseForm();
      } else {
        showToast.updateError("role", res.message);
      }
    } else {
      const res = await roleService.create({ roleName: roleName.trim() });
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

  const handleDeleteClick = (role: Role) => {
    setSelectedRole(role);
    setIsDeleteDialogOpen(true);
  };

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

  // Pagination builder
  const buildPageItems = (): (number | "dots")[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const middle = Array.from({ length: Math.min(3, totalPages - 2) }, (_, i) => Math.max(2, currentPage - 1) + i).filter((n) => n >= 2 && n <= totalPages - 1);
    return [1, ...(middle[0] > 2 ? ["dots" as const] : []), ...middle, ...(middle[middle.length - 1] < totalPages - 1 ? ["dots" as const] : []), totalPages];
  };

  return (
    <>
      <Header />
      <PageContainer>
        {/* Title row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--hsd-ui-color-gray-900)", margin: 0 }}>
                Roles Access
              </h1>
              <TuvBadge text={String(roles.length)} variant="info" size="xs" border />
            </div>
            <p style={{ fontSize: "0.875rem", fontWeight: 300, color: "var(--hsd-ui-color-gray-500)", margin: "4px 0 0" }}>
              Manage roles and access permissions.
            </p>
          </div>
          {isHr && (
            <Button onClick={handleOpenCreate} style={btnPrimary}>
              Create Role
            </Button>
          )}
        </div>

        {/* Stats cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", marginBottom: "24px" }}>
          {[
            { label: "Total Roles", value: isLoading ? "-" : String(roles.length), icon: <Shield style={{ width: "18px", height: "18px" }} />, iconColor: "var(--hsd-ui-color-navy-500)", iconBg: "var(--hsd-ui-color-navy-50)" },
            { label: "Active Roles", value: isLoading ? "-" : String(roles.length), icon: <Users style={{ width: "18px", height: "18px" }} />, iconColor: "var(--hsd-ui-color-blue-600)", iconBg: "var(--hsd-ui-color-blue-50)" },
          ].map((stat) => (
            <div key={stat.label} style={{ backgroundColor: "#fff", borderRadius: "8px", border: "1px solid rgba(120, 134, 127, 0.2)", padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ fontSize: "0.8125rem", fontWeight: 400, color: "var(--hsd-ui-color-gray-500)" }}>{stat.label}</span>
                <div style={{ width: "32px", height: "32px", borderRadius: "6px", backgroundColor: stat.iconBg, display: "flex", alignItems: "center", justifyContent: "center", color: stat.iconColor }}>{stat.icon}</div>
              </div>
              <p style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--hsd-ui-color-gray-900)", margin: 0 }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* White card wrapper */}
        <div style={{ backgroundColor: "#fff", borderRadius: "8px", padding: "16px", border: "1px solid rgba(120, 134, 127, 0.2)" }}>
          {/* Search */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
            <div className="relative" style={{ width: "280px" }}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2" style={{ width: "16px", height: "16px", color: "var(--hsd-ui-color-gray-400)" }} />
              <Input
                placeholder="Search roles..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-9"
                style={{ borderColor: "rgba(120, 134, 127, 0.2)", borderRadius: "4px", backgroundColor: "#fff", fontSize: "0.875rem" }}
              />
            </div>
          </div>

          {/* Inner table card */}
          <div style={{ border: "1px solid rgba(120, 134, 127, 0.2)", borderRadius: "8px", overflow: "hidden" }}>
            {isLoading ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "48px 0" }}>
                <Loader2 className="animate-spin" style={{ width: "24px", height: "24px", color: "var(--hsd-ui-color-navy-500)" }} />
              </div>
            ) : error ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 0", gap: "12px" }}>
                <AlertCircle style={{ width: "24px", height: "24px", color: "var(--hsd-ui-color-gray-400)" }} />
                <p style={{ fontSize: "0.875rem", color: "var(--hsd-ui-color-gray-500)" }}>{error}</p>
                <Button variant="outline" onClick={fetchRoles} style={btnSecondary}>Try Again</Button>
              </div>
            ) : paginatedData.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "var(--hsd-ui-color-gray-500)", fontSize: "0.875rem" }}>
                No roles found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow onMouseOver={undefined} onMouseOut={undefined} style={{ backgroundColor: "#F8F9FB", borderBottom: "1px solid rgba(120, 134, 127, 0.2)" }}>
                    <TableHead style={{ width: "80px" }}>ID</TableHead>
                    <TableHead>Role Name</TableHead>
                    {isHr && <TableHead style={{ width: "80px" }} />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((role) => (
                    <TableRow key={role.roleId}>
                      <TableCell>
                        <span style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--hsd-ui-color-gray-500)" }}>
                          #{role.roleId}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "6px", backgroundColor: "var(--hsd-ui-color-navy-50)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Shield style={{ width: "16px", height: "16px", color: "var(--hsd-ui-color-navy-500)" }} />
                          </div>
                          <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--hsd-ui-color-gray-900)" }}>
                            {role.roleName || "No Data"}
                          </span>
                        </div>
                      </TableCell>
                      {isHr && (
                        <TableCell>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                            <button
                              onClick={() => handleOpenEdit(role)}
                              title="Edit"
                              style={{ background: "none", border: "none", cursor: "pointer", padding: "6px", borderRadius: "4px", color: "var(--hsd-ui-color-gray-500)", display: "flex", alignItems: "center", justifyContent: "center" }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--hsd-ui-color-gray-100)")}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                            >
                              <Pencil style={{ width: "15px", height: "15px" }} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(role)}
                              title="Delete"
                              style={{ background: "none", border: "none", cursor: "pointer", padding: "6px", borderRadius: "4px", color: "var(--hsd-ui-color-red-600)", display: "flex", alignItems: "center", justifyContent: "center" }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(250, 55, 70, 0.08)")}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                            >
                              <Trash2 style={{ width: "15px", height: "15px" }} />
                            </button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Pagination */}
          {totalItems > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0 0", marginTop: "16px", borderTop: "1px solid rgba(120, 134, 127, 0.2)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                <span style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--hsd-ui-color-gray-400)" }}>{startItem} - {endItem} of {totalItems}</span>
                <div style={{ width: "1px", height: "32px", backgroundColor: "rgba(120, 134, 127, 0.15)" }} />
                <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
                  <SelectTrigger style={{ width: "auto", minWidth: "145px", height: "38px", border: "1px solid rgba(120, 134, 127, 0.2)", borderRadius: "4px", fontSize: "0.875rem", fontWeight: 400, color: "var(--hsd-ui-color-gray-700)", padding: "0 12px", gap: "8px", backgroundColor: "#fff" }}>
                    <SelectValue placeholder="10 Per row" />
                  </SelectTrigger>
                  <SelectContent side="top" style={{ minWidth: "145px", borderRadius: "4px", fontSize: "0.875rem" }}>
                    {[5, 10, 20, 50].map((size) => (
                      <SelectItem key={size} value={String(size)} style={{ fontSize: "0.875rem", padding: "8px 12px" }}>{size} Per row</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
                <button onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)} disabled={currentPage === 1} style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "none", cursor: currentPage === 1 ? "default" : "pointer", color: currentPage === 1 ? "var(--hsd-ui-color-gray-300)" : "var(--hsd-ui-color-gray-700)", fontSize: "1.25rem" }}>‹</button>
                {buildPageItems().map((item, idx) =>
                  item === "dots" ? (
                    <span key={`dots-${idx}`} style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem", color: "var(--hsd-ui-color-gray-700)" }}>…</span>
                  ) : (
                    <button key={item} onClick={() => setCurrentPage(item)} style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "0.875rem", fontWeight: currentPage === item ? 600 : 400, backgroundColor: currentPage === item ? "var(--hsd-ui-color-navy-500)" : "transparent", color: currentPage === item ? "#fff" : "var(--hsd-ui-color-gray-900)" }}>{item}</button>
                  )
                )}
                <button onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "none", cursor: currentPage === totalPages ? "default" : "pointer", color: currentPage === totalPages ? "var(--hsd-ui-color-gray-300)" : "var(--hsd-ui-color-gray-700)", fontSize: "1.25rem" }}>›</button>
              </div>
            </div>
          )}
        </div>
      </PageContainer>

      {/* Form Dialog (Create/Edit) */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit Role" : "New Role"}</DialogTitle>
            <DialogDescription>{editingRole ? "Update the role information below." : "Enter the role name to create a new role."}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="roleName" style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--hsd-ui-color-gray-700)" }}>
                  Role Name *
                </Label>
                <Input
                  id="roleName"
                  value={roleName}
                  onChange={(e) => { setRoleName(e.target.value); if (formError) setFormError(""); }}
                  placeholder="Enter role name"
                  style={formError ? { borderColor: "var(--hsd-ui-color-red-600)" } : {}}
                  disabled={isSubmitting}
                />
                {formError && <p style={{ fontSize: "0.75rem", color: "var(--hsd-ui-color-red-600)", margin: 0 }}>{formError}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseForm} disabled={isSubmitting} style={btnSecondary}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} style={btnPrimary}>
                {isSubmitting ? (<><Loader2 className="animate-spin" style={{ width: "16px", height: "16px", marginRight: "6px" }} />{editingRole ? "Saving..." : "Creating..."}</>) : editingRole ? "Save Changes" : "Create Role"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedRole?.roleName}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setIsDeleteDialogOpen(false); setSelectedRole(null); }} disabled={isDeleting} style={btnSecondary}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} style={btnDanger}>
              {isDeleting ? (<><Loader2 className="animate-spin" style={{ width: "16px", height: "16px", marginRight: "6px" }} />Deleting...</>) : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
