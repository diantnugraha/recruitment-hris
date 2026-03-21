"use client";

import * as React from "react";
import {
  Eye,
  Pencil,
  Trash2,
  Users,
  Loader2,
  MoreHorizontal,
  UserCog,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

import { UserDetailDialog, UserFormDialog } from "@/components/users";
import userService from "@/services/user.service";
import { UserManagement } from "@/types/user-management";
import { USER_ROLE_CONFIG } from "@/lib/constants/user";
import { getInitials, formatShortDate } from "@/lib/utils";
import { showToast } from "@/lib/utils/toast-messages";

export default function UsersPage() {
  // Local state
  const [users, setUsers] = React.useState<UserManagement[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Delete dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<UserManagement | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Detail dialog states
  const [isDetailDialogOpen, setIsDetailDialogOpen] = React.useState(false);
  const [selectedUserId, setSelectedUserId] = React.useState<number | null>(null);

  // Form dialog states
  const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);
  const [editUser, setEditUser] = React.useState<UserManagement | null>(null);

  // Fetch all users
  const fetchUsers = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const response = await userService.fetchAll();

    if (!response.success || !response.data) {
      setError(response.message || "Failed to fetch users");
      setUsers([]);
      setIsLoading(false);
      showToast.fetchError("users", response.message);
      return;
    }

    setUsers(response.data);
    setIsLoading(false);
  }, []);

  // Initial fetch
  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filter and pagination
  const filteredData = React.useMemo(() => {
    let result = users;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (user) =>
          user.displayName?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query) ||
          user.name?.toLowerCase().includes(query) ||
          user.role?.roleName?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [searchQuery, users]);

  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Stats
  const stats = React.useMemo(() => {
    const totalCount = users.length;
    const adminCount = users.filter((u) => u.roleId === 1).length;
    const hrCount = users.filter((u) => u.roleId === 2).length;
    const managerCount = users.filter((u) => u.roleId === 3).length;

    return [
      {
        label: "Total Users",
        value: totalCount,
        icon: Users,
        description: "All system users",
        accent: true,
      },
      {
        label: "Administrators",
        value: adminCount,
        icon: ShieldCheck,
        description: "Full access users",
        accent: false,
      },
      {
        label: "HR Personnel",
        value: hrCount,
        icon: UserCog,
        description: "HR department",
        accent: false,
      },
      {
        label: "Managers",
        value: managerCount,
        icon: UserCheck,
        description: "Manager level",
        accent: false,
      },
    ];
  }, [users]);

  // Delete handler
  const handleDelete = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);

    const response = await userService.delete(selectedUser.id);

    if (response.success) {
      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      showToast.deleted("User");
    } else {
      showToast.deleteError("user", response.message);
    }

    setIsSubmitting(false);
  };

  const handleDeleteClick = (user: UserManagement) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  // View detail handler
  const handleViewDetail = (user: UserManagement) => {
    setSelectedUserId(user.id);
    setIsDetailDialogOpen(true);
  };

  // Edit handler - opens form dialog
  const handleEdit = (user: UserManagement) => {
    setEditUser(user);
    setIsFormDialogOpen(true);
  };

  // Add new user handler
  const handleAddUser = () => {
    setEditUser(null);
    setIsFormDialogOpen(true);
  };

  // Get role badge - use actual role name from database, config only for styling
  const getRoleBadge = (roleId: number, roleName?: string | null) => {
    const config = USER_ROLE_CONFIG[roleId];
    const displayLabel = roleName || config?.label || `Role ${roleId}`;
    const variant = config?.variant || "outline";
    return <Badge variant={variant}>{displayLabel}</Badge>;
  };

  // Table columns
  const columns = [
    {
      key: "user",
      label: "User",
      render: (row: UserManagement) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-border">
            <AvatarFallback className="bg-accent/10 text-xs font-semibold text-accent">
              {getInitials(row.displayName || row.name || row.email)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{row.displayName || row.name || "—"}</p>
            <p className="text-xs text-muted-foreground">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      render: (row: UserManagement) =>
        getRoleBadge(row.roleId, row.role?.roleName),
    },
    {
      key: "employee",
      label: "Linked Employee",
      render: (row: UserManagement) => (
        <span className="text-sm text-muted-foreground">
          {row.employee?.employeeName || "—"}
        </span>
      ),
    },
    {
      key: "emailVerified",
      label: "Email Verified",
      render: (row: UserManagement) => (
        <span className="text-sm">
          {row.emailVerifiedAt ? (
            <Badge variant="success">Verified</Badge>
          ) : (
            <Badge variant="outline">Not Verified</Badge>
          )}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      render: (row: UserManagement) => (
        <span className="text-sm text-muted-foreground">
          {row.created_at ? formatShortDate(row.created_at) : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      className: "w-[50px]",
      render: (row: UserManagement) => (
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
            <DropdownMenuItem onClick={() => handleViewDetail(row)}>
              <Eye className="mr-2 h-4 w-4" />
              View Detail
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEdit(row)}>
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
      <Header title="User Management" />
      <PageContainer>
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                   
                    className="mt-4"
                    onClick={fetchUsers}
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
                searchPlaceholder="Search by name, email, or role..."
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
                emptyMessage="No users found"
                actions={
                  <Button onClick={handleAddUser}>
                    New
                  </Button>
                }
              />
            )}
          </div>
        </div>
      </PageContainer>

      {/* User Detail Dialog */}
      <UserDetailDialog
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        userId={selectedUserId}
        onEdit={handleEdit}
        onDeleted={fetchUsers}
      />

      {/* User Form Dialog (Add/Edit) */}
      <UserFormDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        user={editUser}
        onSuccess={fetchUsers}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {selectedUser?.displayName || selectedUser?.email}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedUser(null);
              }}
              disabled={isSubmitting}
            >
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
    </>
  );
}
