"use client";

import * as React from "react";
import {
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Briefcase,
  Users,
  Clock,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { jobPostings, applications, departments, jobLevels } from "@/data/mock-data";
import { formatCurrency, formatShortDate, getInitials } from "@/lib/utils";

const stats = [
  {
    label: "Open Positions",
    value: jobPostings.filter((j) => j.status === "open").length,
    icon: Briefcase,
    highlight: true,
  },
  {
    label: "Total Applications",
    value: applications.length,
    icon: Users,
    highlight: false,
  },
  {
    label: "Avg. Days to Hire",
    value: 18,
    icon: Clock,
    highlight: false,
  },
];

const pipelineStages = [
  { label: "Applied", count: 245, color: "bg-accent" },
  { label: "Screening", count: 128, color: "bg-foreground/80" },
  { label: "Interview", count: 67, color: "bg-foreground/60" },
  { label: "Assessment", count: 32, color: "bg-foreground/40" },
  { label: "Offer", count: 18, color: "bg-foreground/25" },
  { label: "Hired", count: 12, color: "bg-accent" },
];

export default function RecruitmentPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("jobs");

  const getDepartmentName = (deptId: string) => {
    return departments.find((d) => d.id === deptId)?.name || "—";
  };

  const getApplicationCount = (jobId: string) => {
    return applications.filter((a) => a.jobPostingId === jobId).length;
  };

  return (
    <>
      <Header title="Recruitment" />
      <PageContainer>
        <div className="space-y-8">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            {stats.map((stat, index) => (
              <div key={stat.label} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                <Card className={stat.highlight ? "border-accent/20 bg-accent/5" : ""}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                        <p className={`mt-1 font-semibold text-3xl font-medium ${stat.highlight ? "text-accent" : ""}`}>
                          {stat.value}
                        </p>
                      </div>
                      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.highlight ? "bg-accent/10" : "bg-secondary"}`}>
                        <stat.icon className={`h-5 w-5 ${stat.highlight ? "text-accent" : "text-muted-foreground"}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* Pipeline */}
          <div className="animate-fade-in stagger-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Overview</p>
                  <CardTitle className="mt-1 font-semibold text-xl">Recruitment Pipeline</CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  View Details
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  {pipelineStages.map((stage, i) => (
                    <div key={stage.label} className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">{stage.label}</span>
                        <span className="text-sm font-medium">{stage.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${stage.color}`}
                          style={{ width: `${(stage.count / 245) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between">
              <TabsList className="bg-secondary/50">
                <TabsTrigger value="jobs">Open Positions</TabsTrigger>
                <TabsTrigger value="applications">Applications</TabsTrigger>
              </TabsList>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    New Position
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-semibold text-xl">Create Job Posting</DialogTitle>
                    <DialogDescription>
                      Add a new position to your recruitment pipeline.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Job Title</Label>
                      <Input placeholder="e.g., Senior Software Engineer" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Department</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((d) => (
                              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Level</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            {jobLevels.map((l) => (
                              <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea placeholder="Describe the role and responsibilities..." rows={4} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setIsAddDialogOpen(false)}>
                      Create Position
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <TabsContent value="jobs" className="mt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {jobPostings.map((job, index) => (
                  <div
                    key={job.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <Card className="group hover-lift">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium">{job.title}</h3>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {getDepartmentName(job.departmentId)}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
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
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          <Badge variant="outline" className="text-xs gap-1">
                            <MapPin className="h-3 w-3" />
                            {job.locationType}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {job.employmentType.replace("_", " ")}
                          </Badge>
                        </div>
                        {job.salaryMin && (
                          <p className="text-sm text-muted-foreground mt-3 font-mono">
                            {formatCurrency(job.salaryMin)} – {formatCurrency(job.salaryMax || 0)}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                          <span className="text-sm text-muted-foreground">
                            {getApplicationCount(job.id)} applicants
                          </span>
                          <Badge variant={job.status === "open" ? "success" : "secondary"}>
                            {job.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="applications" className="mt-6">
              <Card>
                <CardContent className="p-0 divide-y divide-border">
                  {applications.map((app, index) => (
                    <div
                      key={app.id}
                      className="group flex items-center justify-between p-4 transition-colors hover:bg-secondary/30"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 border border-border">
                          <AvatarFallback className="bg-accent/10 font-semibold text-sm text-accent">
                            {app.candidate ? getInitials(`${app.candidate.firstName} ${app.candidate.lastName}`) : "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {app.candidate?.firstName} {app.candidate?.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{app.jobPosting?.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {formatShortDate(app.appliedDate)}
                        </span>
                        <Badge variant="secondary">{app.status}</Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Pencil className="mr-2 h-4 w-4" />
                              Update Status
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </PageContainer>
    </>
  );
}
