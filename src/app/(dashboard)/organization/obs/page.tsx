"use client";

import * as React from "react";
import {
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Building2,
  ChevronRight,
  Network,
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { organizations, divisions, departments } from "@/data/mock-data";
import { cn } from "@/lib/utils";

interface OrgNodeProps {
  org: (typeof organizations)[0];
  level: number;
  children?: React.ReactNode;
}

function OrgNode({ org, level, children }: OrgNodeProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const hasChildren = React.Children.count(children) > 0;

  return (
    <div className="relative">
      <div
        className={cn(
          "group relative flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-secondary/50",
          level > 0 && "ml-8"
        )}
      >
        {level > 0 && (
          <div className="absolute -left-8 top-1/2 h-px w-8 bg-border" />
        )}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-secondary">
          <Building2 className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{org.name}</h3>
            <Badge variant="outline" className="text-xs">
              {org.code}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{org.description}</p>
        </div>
        {hasChildren && (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <ChevronRight
              className={cn(
                "h-4 w-4 transition-transform",
                isExpanded && "rotate-90"
              )}
            />
          </Button>
        )}
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
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Plus className="mr-2 h-4 w-4" />
              Add Child
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {hasChildren && isExpanded && (
        <div className="relative mt-2 space-y-2">
          <div className="absolute left-4 top-0 h-full w-px bg-border" />
          {children}
        </div>
      )}
    </div>
  );
}

export default function OBSPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);

  const renderOrgTree = (parentId?: string, level: number = 0): React.ReactNode => {
    const orgs = organizations.filter((org) =>
      parentId ? org.parentId === parentId : !org.parentId
    );

    return orgs.map((org) => (
      <OrgNode key={org.id} org={org} level={level}>
        {renderOrgTree(org.id, level + 1)}
      </OrgNode>
    ));
  };

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
                  <p className="text-2xl font-semibold">{organizations.length}</p>
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
                  <p className="text-2xl font-semibold">{divisions.length}</p>
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
                  <p className="text-2xl font-semibold">{departments.length}</p>
                  <p className="text-sm text-muted-foreground">Departments</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tree View */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-medium">Organization Hierarchy</CardTitle>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Unit
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Organization Unit</DialogTitle>
                    <DialogDescription>
                      Create a new organization unit in the hierarchy.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" placeholder="Enter unit name" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="code">Code</Label>
                      <Input id="code" placeholder="Enter unit code" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="parent">Parent Unit</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select parent unit (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Parent (Root)</SelectItem>
                          {organizations.map((org) => (
                            <SelectItem key={org.id} value={org.id}>
                              {org.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Enter description"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={() => setIsAddDialogOpen(false)}>
                      Add Unit
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-2">{renderOrgTree()}</CardContent>
          </Card>
        </div>
      </PageContainer>
    </>
  );
}
