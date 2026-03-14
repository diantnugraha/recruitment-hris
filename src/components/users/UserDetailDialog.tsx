"use client";

import * as React from "react";
import { Loader2, Mail, User, Shield, Calendar, Building, Pencil, Trash2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

// --- Props ---

interface UserDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number | null;
  onEdit: (user: UserManagement) => void;
  onDeleted: () => void;
}

// --- Helper Component ---

function DetailField({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-start gap-3">
      {Icon && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
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

// --- Component ---

export function UserDetailDialog({
  open,
  onOpenChange,
  userId,
  onEdit,
  onDeleted,
}: UserDetailDialogProps) {
  const [user, setUser] = React.useState<UserManagement | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Fetch user data when dialog opens
  React.useEffect(() => {
    if (open && userId) {
      const fetchUser = async () => {
        setIsLoading(true);
        setError(null);

        const res = await userService.getById(userId);

        if (res.success && res.data) {
          setUser(res.data);
        } else {
          setError(res.message || "Failed to fetch user");
        }

        setIsLoading(false);
      };

      fetchUser();
    } else if (!open) {
      // Reset state when dialog closes
      setUser(null);
      setError(null);
    }
  }, [open, userId]);

  const handleDelete = async () => {
    if (!user) return;
    setIsDeleting(true);

    const res = await userService.delete(user.id);

    if (res.success) {
      showToast.deleted("User");
      setIsDeleteDialogOpen(false);
      onOpenChange(false);
      onDeleted();
    } else {
      showToast.deleteError("user", res.message);
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // Get role badge - use actual role name from database
  const getRoleBadge = (roleId: number, roleName?: string | null) => {
    const config = USER_ROLE_CONFIG[roleId];
    const displayLabel = roleName || config?.label || `Role ${roleId}`;
    const variant = config?.variant || "outline";
    return <Badge variant={variant}>{displayLabel}</Badge>;
  };

  const displayName = user?.displayName || user?.name || user?.email || "";
  const initials = getInitials(displayName);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error || !user ? (
            <div className="flex h-48 flex-col items-center justify-center gap-3">
              <p className="text-sm text-muted-foreground">{error || "User not found"}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* User Profile Header */}
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16 border-2 border-border">
                  <AvatarFallback className="bg-accent/10 text-lg font-semibold text-accent">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{displayName}</h3>
                    {getRoleBadge(user.roleId, user.role?.roleName)}
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <div className="pt-1">
                    {user.emailVerifiedAt ? (
                      <Badge variant="success">Email Verified</Badge>
                    ) : (
                      <Badge variant="outline">Email Not Verified</Badge>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Account Information */}
              <div className="space-y-3">
                <h4 className="text-base font-medium">Account Information</h4>
                <div className="grid gap-3">
                  <DetailField label="Display Name" value={user.displayName} icon={User} />
                  <DetailField label="Username" value={user.name || ""} icon={User} />
                  <DetailField label="Email" value={user.email} icon={Mail} />
                  <DetailField
                    label="Role"
                    value={user.role?.roleName || USER_ROLE_CONFIG[user.roleId]?.label || `Role ${user.roleId}`}
                    icon={Shield}
                  />
                </div>
              </div>

              <Separator />

              {/* Related Information */}
              <div className="space-y-3">
                <h4 className="text-base font-medium">Related Information</h4>
                <div className="grid gap-3">
                  <DetailField
                    label="Linked Employee"
                    value={user.employee?.employeeName || "Not linked"}
                    icon={Building}
                  />
                  <DetailField
                    label="Created At"
                    value={user.created_at ? formatShortDate(user.created_at) : ""}
                    icon={Calendar}
                  />
                  <DetailField
                    label="Updated At"
                    value={user.updated_at ? formatShortDate(user.updated_at) : ""}
                    icon={Calendar}
                  />
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                 
                  onClick={() => {
                    onOpenChange(false);
                    onEdit(user);
                  }}
                >
                  <Pencil />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                 
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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

export default UserDetailDialog;
