"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Trash2, Loader2, Mail, User, Shield, Calendar, Building } from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
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

import userService from "@/services/user.service";
import { UserManagement } from "@/types/user-management";
import { USER_ROLE_CONFIG } from "@/lib/constants/user";
import { formatShortDate, getInitials } from "@/lib/utils";
import { showToast } from "@/lib/utils/toast-messages";

function DetailField({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-start gap-3">
      {Icon && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <div className="space-y-0.5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className={`text-sm font-medium ${!value ? "text-muted-foreground" : ""}`}>
          {value || "No data"}
        </p>
      </div>
    </div>
  );
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [user, setUser] = React.useState<UserManagement | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const res = await userService.getById(id);

    if (res.success && res.data) {
      setUser(res.data);
    } else {
      setError(res.message || "Failed to fetch user");
    }

    setIsLoading(false);
  }, [id]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (!user) return;
    setIsDeleting(true);
    const res = await userService.delete(user.id);
    if (res.success) {
      showToast.deleted("User");
      router.push("/users");
    } else {
      showToast.deleteError("user", res.message);
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // Get role badge - use actual role name from database, config only for styling
  const getRoleBadge = (roleId: number, roleName?: string | null) => {
    const config = USER_ROLE_CONFIG[roleId];
    const displayLabel = roleName || config?.label || `Role ${roleId}`;
    const variant = config?.variant || "outline";
    return <Badge variant={variant}>{displayLabel}</Badge>;
  };

  // Loading state
  if (isLoading) {
    return (
      <>
        <Header title="User Details" />
        <PageContainer>
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </PageContainer>
      </>
    );
  }

  // Error state
  if (error || !user) {
    return (
      <>
        <Header title="User Details" />
        <PageContainer>
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <p className="text-sm text-muted-foreground">{error || "User not found"}</p>
            <Button variant="outline" size="sm" onClick={fetchData}>
              Try Again
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  const displayName = user.displayName || user.name || user.email;
  const initials = getInitials(displayName);

  return (
    <>
      <Header title="User Details" />
      <PageContainer>
        <div className="space-y-4">
          {/* Top Bar: Back + Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/users")}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Users</span>
            </button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/users/${user.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>

          {/* User Profile Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <Avatar className="h-20 w-20 border-2 border-border">
                  <AvatarFallback className="bg-accent/10 text-xl font-semibold text-accent">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold">{displayName}</h2>
                    {getRoleBadge(user.roleId, user.role?.roleName)}
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <div className="flex items-center gap-4 pt-2">
                    {user.emailVerifiedAt ? (
                      <Badge variant="success">Email Verified</Badge>
                    ) : (
                      <Badge variant="outline">Email Not Verified</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Account Information */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <DetailField
                  label="Display Name"
                  value={user.displayName}
                  icon={User}
                />
                <Separator />
                <DetailField
                  label="Username"
                  value={user.name || ""}
                  icon={User}
                />
                <Separator />
                <DetailField
                  label="Email"
                  value={user.email}
                  icon={Mail}
                />
                <Separator />
                <DetailField
                  label="Role"
                  value={user.role?.roleName || USER_ROLE_CONFIG[user.roleId]?.label || `Role ${user.roleId}`}
                  icon={Shield}
                />
              </CardContent>
            </Card>

            {/* Related Information */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Related Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <DetailField
                  label="Linked Employee"
                  value={user.employee?.employeeName || "Not linked"}
                  icon={Building}
                />
                <Separator />
                <DetailField
                  label="Employee Email"
                  value={user.employee?.employeeEmail || "—"}
                  icon={Mail}
                />
                <Separator />
                <DetailField
                  label="Email Verified At"
                  value={user.emailVerifiedAt ? formatShortDate(user.emailVerifiedAt) : "Not verified"}
                  icon={Calendar}
                />
                <Separator />
                <DetailField
                  label="Created At"
                  value={user.created_at ? formatShortDate(user.created_at) : ""}
                  icon={Calendar}
                />
                <Separator />
                <DetailField
                  label="Updated At"
                  value={user.updated_at ? formatShortDate(user.updated_at) : ""}
                  icon={Calendar}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{displayName}</span>? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
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
