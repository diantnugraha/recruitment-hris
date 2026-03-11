"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  RotateCcw,
  MessageSquare,
  Users,
  Clock,
  Building2,
  Briefcase,
  GraduationCap,
  Calendar,
  MapPin,
  Hash,
  UserCircle,
  PlayCircle,
  ChevronRight,
  Sparkles,
  Send,
  Check,
  FileText,
  Activity,
  User,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { LexicalRenderer, hasLexicalContent } from "@/components/shared/lexical-renderer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import { cn, formatShortDate, getInitials } from "@/lib/utils";
import { showToast } from "@/lib/utils/toast-messages";
import { employeeRequestService } from "@/services/employee-request.service";
import {
  EMPLOYEE_REQUEST_STATUS_CONFIG,
  EMPLOYMENT_TYPE_LABELS,
  REQUEST_REASON_LABELS,
  EDUCATION_LEVEL_LABELS,
  GENDER_PREFERENCE_LABELS,
  WORK_LOCATION_LABELS,
  type EmployeeRequestStatus,
  type EmploymentType,
  type RequestReason,
  type EducationLevel,
  type GenderPreference,
  type WorkLocation,
} from "@/lib/constants/employeeRequest";
import type { EmployeeRequestWithRelations } from "@/types/employee-request";

// Workflow steps visualization
const WORKFLOW_STEPS = [
  { key: "draft", label: "Draft", icon: Pencil },
  { key: "created", label: "Submitted", icon: Send },
  { key: "hod_reviewed", label: "HOD Review", icon: UserCircle },
  { key: "reviewed", label: "HR Review", icon: CheckCircle },
  { key: "approved", label: "Management", icon: Sparkles },
  { key: "in_recruitment", label: "Recruiting", icon: Users },
  { key: "completed", label: "Completed", icon: Check },
];

export default function EmployeeRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // State
  const [request, setRequest] = React.useState<EmployeeRequestWithRelations | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Dialog states
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [showActionDialog, setShowActionDialog] = React.useState(false);
  const [actionType, setActionType] = React.useState<"hod_review" | "hr_review" | "approve" | "reject" | "revise" | null>(null);
  const [actionComment, setActionComment] = React.useState("");
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Fetch data
  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await employeeRequestService.getById(id);

        if (response.success && response.data) {
          setRequest(response.data);
        } else {
          setError(response.message || "Request not found");
        }
      } catch (err) {
        setError("Failed to load request details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Handlers
  const handleAction = async () => {
    if (!request || !actionType) return;

    setIsProcessing(true);

    try {
      let newStatus: EmployeeRequestStatus = request.status;
      let message = "";

      switch (actionType) {
        case "hod_review":
          newStatus = "hod_reviewed";
          message = "Request reviewed by HOD, forwarded to HR";
          break;
        case "hr_review":
          newStatus = "reviewed";
          message = "Request reviewed by HR, forwarded to Management";
          break;
        case "approve":
          newStatus = "approved";
          message = "Request approved by Management";
          break;
        case "reject":
          newStatus = "rejected";
          message = "Request rejected";
          break;
        case "revise":
          newStatus = "revise";
          message = "Request returned for revision";
          break;
      }

      const response = await employeeRequestService.updateStatus(id, {
        status: newStatus,
        comment: actionComment || undefined,
      });

      if (response.success && response.data) {
        setRequest(response.data);
        showToast.success(message);
      } else {
        showToast.error(response.message || "Failed to update status");
      }
    } catch (err) {
      showToast.error("Failed to update status");
    } finally {
      setIsProcessing(false);
      setShowActionDialog(false);
      setActionComment("");
      setActionType(null);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await employeeRequestService.delete(id);
      if (response.success) {
        showToast.deleted("Employee Request");
        router.push("/employee-request");
      } else {
        showToast.error(response.message || "Failed to delete");
      }
    } catch (err) {
      showToast.error("Failed to delete");
    }
  };

  const handleStartRecruitment = async () => {
    if (!request) return;

    setIsProcessing(true);
    try {
      const response = await employeeRequestService.updateStatus(id, {
        status: "in_recruitment",
      });

      if (response.success && response.data) {
        setRequest(response.data);
        showToast.success("Recruitment process started");
      } else {
        showToast.error(response.message || "Failed to start recruitment");
      }
    } catch (err) {
      showToast.error("Failed to start recruitment");
    } finally {
      setIsProcessing(false);
    }
  };

  const openActionDialog = (type: typeof actionType) => {
    setActionType(type);
    setShowActionDialog(true);
  };

  const getStatusBadge = (status: EmployeeRequestStatus) => {
    const config = EMPLOYEE_REQUEST_STATUS_CONFIG[status];
    return (
      <Badge variant={config?.variant || "secondary"} className="text-xs font-medium">
        {config?.label || status}
      </Badge>
    );
  };

  const getActionDialogContent = () => {
    switch (actionType) {
      case "hod_review":
        return {
          title: "HOD Review",
          description: "Mark this request as reviewed by HOD and forward to HR for review.",
          buttonText: "Approve & Forward to HR",
          buttonVariant: "default" as const,
        };
      case "hr_review":
        return {
          title: "HR Review",
          description: "Mark this request as reviewed by HR and forward to Management for approval.",
          buttonText: "Approve & Forward to Management",
          buttonVariant: "default" as const,
        };
      case "approve":
        return {
          title: "Management Approval",
          description: "Approve this employee request. Recruitment can begin after approval.",
          buttonText: "Approve",
          buttonVariant: "default" as const,
        };
      case "reject":
        return {
          title: "Reject Request",
          description: "Reject this employee request. Please provide a reason for rejection.",
          buttonText: "Reject",
          buttonVariant: "destructive" as const,
        };
      case "revise":
        return {
          title: "Request Revision",
          description: "Return this request for revision. Please specify what needs to be changed.",
          buttonText: "Request Revision",
          buttonVariant: "outline" as const,
        };
      default:
        return { title: "", description: "", buttonText: "", buttonVariant: "default" as const };
    }
  };

  const getCurrentStepIndex = (status: EmployeeRequestStatus) => {
    if (status === "rejected") return -1;
    if (status === "revise") return 0;
    return WORKFLOW_STEPS.findIndex(s => s.key === status);
  };

  if (isLoading) {
    return (
      <>
        <Header title="Employee Request" />
        <PageContainer>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </PageContainer>
      </>
    );
  }

  if (error || !request) {
    return (
      <>
        <Header title="Employee Request" />
        <PageContainer>
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-muted-foreground">{error || "Request not found"}</p>
            <Button onClick={() => router.push("/employee-request")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to List
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  const statusConfig = EMPLOYEE_REQUEST_STATUS_CONFIG[request.status];
  const dialogContent = getActionDialogContent();
  const currentStepIndex = getCurrentStepIndex(request.status);

  return (
    <>
      <Header title="Employee Request" />
      <PageContainer>
        <div className="space-y-6">
          {/* Back button and actions */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => router.push("/employee-request")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Requests
            </Button>
            <div className="flex items-center gap-2">
              {/* HOD Review - status: created */}
              {request.status === "created" && (
                <>
                  <Button variant="outline" onClick={() => openActionDialog("revise")}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Request Revision
                  </Button>
                  <Button onClick={() => openActionDialog("hod_review")}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    HOD Approve
                  </Button>
                </>
              )}
              {/* HR Review - status: hod_reviewed */}
              {request.status === "hod_reviewed" && (
                <>
                  <Button variant="outline" onClick={() => openActionDialog("revise")}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Request Revision
                  </Button>
                  <Button onClick={() => openActionDialog("hr_review")}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    HR Approve
                  </Button>
                </>
              )}
              {/* Management Approval - status: reviewed */}
              {request.status === "reviewed" && (
                <>
                  <Button variant="destructive" onClick={() => openActionDialog("reject")}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                  <Button onClick={() => openActionDialog("approve")}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Management Approve
                  </Button>
                </>
              )}
              {request.status === "approved" && (
                <Button onClick={handleStartRecruitment} disabled={isProcessing}>
                  {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
                  Start Recruitment
                </Button>
              )}
              {["draft", "revise"].includes(request.status) && (
                <>
                  <Button variant="outline" onClick={() => router.push(`/employee-request/${id}/edit`)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Workflow Progress */}
          {request.status !== "rejected" && (
            <Card className="overflow-hidden border-accent/10 bg-gradient-to-br from-accent/5 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  {WORKFLOW_STEPS.map((step, index) => {
                    const StepIcon = step.icon;
                    const isActive = index === currentStepIndex;
                    const isCompleted = index < currentStepIndex;
                    const isPending = index > currentStepIndex;

                    return (
                      <React.Fragment key={step.key}>
                        <div className="flex flex-col items-center gap-2">
                          <div
                            className={cn(
                              "h-9 w-9 rounded-full flex items-center justify-center transition-all duration-500",
                              isActive && "bg-accent text-accent-foreground ring-4 ring-accent/20",
                              isCompleted && "bg-accent/20 text-accent",
                              isPending && "bg-secondary text-muted-foreground"
                            )}
                          >
                            {isCompleted ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                          </div>
                          <span
                            className={cn(
                              "text-xs font-medium text-center transition-colors",
                              isActive && "text-accent",
                              isCompleted && "text-accent/80",
                              isPending && "text-muted-foreground"
                            )}
                          >
                            {step.label}
                          </span>
                        </div>
                        {index < WORKFLOW_STEPS.length - 1 && (
                          <div
                            className={cn(
                              "flex-1 h-0.5 mx-2 transition-colors duration-500",
                              index < currentStepIndex ? "bg-accent" : "bg-secondary"
                            )}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rejected Banner */}
          {request.status === "rejected" && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-9 w-9 rounded-full bg-destructive/10 flex items-center justify-center">
                    <XCircle className="h-4 w-4 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-destructive">Request Rejected</h3>
                    <p className="text-sm text-muted-foreground">
                      This employee request has been rejected by management.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main content */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header card */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold tracking-tight">{request.code}</h2>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="mt-1.5 text-sm text-foreground/80">{request.jobTitle?.name}</p>
                      <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-4 w-4" />
                          {request.department?.name}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4" />
                          {request.quantity} {request.quantity > 1 ? "positions" : "position"}
                        </div>
                        {request.employmentType && (
                          <div className="flex items-center gap-1.5">
                            <Briefcase className="h-4 w-4" />
                            {EMPLOYMENT_TYPE_LABELS[request.employmentType as EmploymentType]}
                          </div>
                        )}
                      </div>
                    </div>
                    {request.recruitmentCode && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Recruitment Code</p>
                        <p className="font-semibold text-accent mt-1">{request.recruitmentCode}</p>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="rounded-lg border bg-secondary/30 p-4">
                    <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                      Purpose / Justification
                    </h4>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{request.purpose}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Requirements */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950">
                      <Sparkles className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Requirements</CardTitle>
                      <CardDescription>Qualifications and preferences for this position</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                      <GraduationCap className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Education</p>
                        <p className="text-sm font-medium">{EDUCATION_LEVEL_LABELS[request.education as EducationLevel]}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                      <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Experience</p>
                        <p className="text-sm font-medium">{request.experience}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                      <UserCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Gender</p>
                        <p className="text-sm font-medium">{GENDER_PREFERENCE_LABELS[request.genderPreference as GenderPreference]}</p>
                      </div>
                    </div>
                    {(request.ageMin || request.ageMax) && (
                      <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                        <Users className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Age Range</p>
                          <p className="text-sm font-medium">
                            {request.ageMin && request.ageMax
                              ? `${request.ageMin} - ${request.ageMax} years`
                              : request.ageMin
                              ? `Min ${request.ageMin} years`
                              : `Max ${request.ageMax} years`}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Job Description */}
              {(hasLexicalContent(request.generalJobPurpose) || hasLexicalContent(request.jobDescription) || hasLexicalContent(request.jobRequirement)) && (
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Job Description</CardTitle>
                        <CardDescription>Responsibilities and requirements for the role</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {hasLexicalContent(request.generalJobPurpose) && (
                      <div>
                        <p className="text-base font-semibold text-foreground mb-2">General Job Purpose</p>
                        <LexicalRenderer value={request.generalJobPurpose} />
                      </div>
                    )}
                    {hasLexicalContent(request.jobDescription) && (
                      <div>
                        <p className="text-base font-semibold text-foreground mb-2">Job Description</p>
                        <LexicalRenderer value={request.jobDescription} />
                      </div>
                    )}
                    {hasLexicalContent(request.jobRequirement) && (
                      <div>
                        <p className="text-base font-semibold text-foreground mb-2">Job Requirement</p>
                        <LexicalRenderer value={request.jobRequirement} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* History */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950">
                      <Activity className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Activity History</CardTitle>
                      <CardDescription>Status changes and comments on this request</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {request.comments && request.comments.length > 0 ? (
                    <div className="space-y-6">
                      {request.comments.map((comment, index) => (
                        <div key={comment.id} className={cn("flex gap-4", index !== 0 && "pt-6 border-t")}>
                          <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                            <UserCircle className="h-4 w-4 text-accent" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{comment.userName}</span>
                                {comment.userRole && (
                                  <Badge variant="outline" className="text-xs">{comment.userRole}</Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                {formatShortDate(comment.createdAt)}
                              </span>
                            </div>
                            {comment.newStatus && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Status changed to{" "}
                                <Badge variant="secondary" className="ml-1">
                                  {EMPLOYEE_REQUEST_STATUS_CONFIG[comment.newStatus]?.label || comment.newStatus}
                                </Badge>
                              </p>
                            )}
                            {comment.comment && (
                              <p className="text-sm mt-2 text-foreground/80">{comment.comment}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No activity history yet</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Status card */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    </div>
                    <CardTitle className="text-base">Status</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    {getStatusBadge(request.status)}
                    <p className="mt-3 text-sm text-muted-foreground">{statusConfig?.description}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Headcount & Timeline */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <CardTitle className="text-base">Headcount & Timeline</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                    <Hash className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Headcount</p>
                      <p className="text-sm font-medium">{request.headcount} {request.headcount > 1 ? "people" : "person"}</p>
                    </div>
                  </div>
                  {request.expectedOnboardDate && (
                    <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Expected Onboard</p>
                        <p className="text-sm font-medium">{formatShortDate(request.expectedOnboardDate)}</p>
                      </div>
                    </div>
                  )}
                  {request.jobPlacement && (
                    <div className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Work Location</p>
                        <p className="text-sm font-medium">{WORK_LOCATION_LABELS[request.jobPlacement as WorkLocation] || request.jobPlacement}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Requester Info */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950">
                      <User className="h-5 w-5 text-purple-600" />
                    </div>
                    <CardTitle className="text-base">Requester</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border">
                      <AvatarFallback className="bg-accent/10 text-accent font-medium">
                        {getInitials(request.requestedByName || "U")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{request.requestedByName}</p>
                      <p className="text-sm text-muted-foreground">{request.department?.name}</p>
                    </div>
                  </div>
                  <div className="rounded-lg border bg-secondary/30 p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reason</span>
                      <span className="font-medium">{REQUEST_REASON_LABELS[request.reason as RequestReason]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created</span>
                      <span>{formatShortDate(request.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Updated</span>
                      <span>{formatShortDate(request.updatedAt)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </PageContainer>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete request {request.code}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogContent.title}</DialogTitle>
            <DialogDescription>{dialogContent.description}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="comment">Comment {actionType === "reject" || actionType === "revise" ? "(required)" : "(optional)"}</Label>
            <Textarea
              id="comment"
              placeholder="Add a comment..."
              value={actionComment}
              onChange={(e) => setActionComment(e.target.value)}
              rows={3}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setShowActionDialog(false); setActionComment(""); setActionType(null); }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant={dialogContent.buttonVariant}
              onClick={handleAction}
              disabled={isProcessing || ((actionType === "reject" || actionType === "revise") && !actionComment)}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {dialogContent.buttonText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  );
}
