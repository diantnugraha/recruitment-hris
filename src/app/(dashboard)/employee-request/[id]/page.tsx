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
  Banknote,
  UserCircle,
  PlayCircle,
  ChevronRight,
  Sparkles,
  Send,
  Check,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
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

import { cn, formatShortDate, formatCurrency, getInitials } from "@/lib/utils";
import { showToast } from "@/lib/utils/toast-messages";
import { employeeRequestService } from "@/services/employee-request.service";
import { candidateService, type CandidateWithRelations } from "@/services/candidate.service";
import {
  EMPLOYEE_REQUEST_STATUS_CONFIG,
  EMPLOYMENT_TYPE_LABELS,
  REQUEST_REASON_LABELS,
  EDUCATION_LEVEL_LABELS,
  GENDER_PREFERENCE_LABELS,
  type EmployeeRequestStatus,
  type EmploymentType,
  type RequestReason,
  type EducationLevel,
  type GenderPreference,
} from "@/lib/constants/employeeRequest";
import {
  CANDIDATE_STATUS,
  CANDIDATE_STATUS_CONFIG,
  type CandidateStatus,
} from "@/lib/constants/candidateStatus";
import type { EmployeeRequestWithRelations } from "@/types/employee-request";

// Workflow steps visualization
const WORKFLOW_STEPS = [
  { key: "draft", label: "Draft", icon: Pencil },
  { key: "created", label: "Submitted", icon: Send },
  { key: "reviewed", label: "HR Review", icon: CheckCircle },
  { key: "approved", label: "Approved", icon: Sparkles },
  { key: "in_recruitment", label: "Recruiting", icon: Users },
  { key: "completed", label: "Completed", icon: Check },
];

export default function EmployeeRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // State
  const [request, setRequest] = React.useState<EmployeeRequestWithRelations | null>(null);
  const [candidates, setCandidates] = React.useState<CandidateWithRelations[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Dialog states
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [showActionDialog, setShowActionDialog] = React.useState(false);
  const [actionType, setActionType] = React.useState<"review" | "approve" | "reject" | "revise" | "start_recruitment" | null>(null);
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

          // If in recruitment, fetch candidates for this request
          if (["approved", "in_recruitment", "completed"].includes(response.data.status)) {
            try {
              const candidatesRes = await candidateService.getByEmployeeRequest(
                Number(response.data.id),
                1,
                100
              );
              if (candidatesRes.success && candidatesRes.data) {
                setCandidates(candidatesRes.data.data);
              }
            } catch (candidateErr) {
              // Silently fail - candidates section will just show empty state
              console.warn("Failed to fetch candidates:", candidateErr);
            }
          }
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
        case "review":
          newStatus = "reviewed";
          message = "Request reviewed and forwarded for approval";
          break;
        case "approve":
          newStatus = "approved";
          message = "Request approved successfully";
          break;
        case "reject":
          newStatus = "rejected";
          message = "Request rejected";
          break;
        case "revise":
          newStatus = "revise";
          message = "Request returned for revision";
          break;
        case "start_recruitment":
          newStatus = "in_recruitment";
          message = "Recruitment process started";
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

  const openActionDialog = (type: typeof actionType) => {
    setActionType(type);
    setShowActionDialog(true);
  };

  const getStatusBadge = (status: EmployeeRequestStatus) => {
    const config = EMPLOYEE_REQUEST_STATUS_CONFIG[status];
    return (
      <Badge variant={config?.variant || "secondary"} className="text-sm font-medium">
        {config?.label || status}
      </Badge>
    );
  };

  const getCandidateStatusBadge = (status: CandidateStatus) => {
    const config = CANDIDATE_STATUS_CONFIG[status];
    return (
      <Badge variant={config?.variant || "secondary"} className="text-xs">
        {config?.label || status}
      </Badge>
    );
  };

  // Derive candidate pipeline status from assessment data
  const deriveCandidateStatus = (candidate: CandidateWithRelations): CandidateStatus => {
    const assessment = candidate.assessment;
    if (!assessment) return CANDIDATE_STATUS.APPLIED;

    // Check from latest stage backwards
    if (assessment.mcuStatus === "PASSED") return CANDIDATE_STATUS.HIRED;
    if (assessment.mcuStatus === "FAILED") return CANDIDATE_STATUS.REJECTED;
    if (assessment.mcuStatus && assessment.mcuStatus !== "PENDING") return CANDIDATE_STATUS.MCU;

    if (assessment.interview2Status === "PASSED") return CANDIDATE_STATUS.MCU;
    if (assessment.interview2Status === "FAILED") return CANDIDATE_STATUS.REJECTED;
    if (assessment.interview2Status && assessment.interview2Status !== "PENDING") return CANDIDATE_STATUS.INTERVIEW_2;

    if (assessment.interview1Status === "PASSED") return CANDIDATE_STATUS.INTERVIEW_2;
    if (assessment.interview1Status === "FAILED") return CANDIDATE_STATUS.REJECTED;
    if (assessment.interview1Status && assessment.interview1Status !== "PENDING") return CANDIDATE_STATUS.INTERVIEW_1;

    return CANDIDATE_STATUS.SCREENING;
  };

  const getActionDialogContent = () => {
    switch (actionType) {
      case "review":
        return {
          title: "Review Request",
          description: "Mark this request as reviewed and forward to management for approval.",
          buttonText: "Mark as Reviewed",
          buttonVariant: "default" as const,
        };
      case "approve":
        return {
          title: "Approve Request",
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
      case "start_recruitment":
        return {
          title: "Start Recruitment",
          description: "Start the recruitment process. You can then invite candidates to apply.",
          buttonText: "Start Recruitment",
          buttonVariant: "default" as const,
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
  const isApprovedOrRecruitment = ["approved", "in_recruitment"].includes(request.status);

  return (
    <>
      <Header title="Employee Request" />
      <PageContainer>
        <div className="space-y-8">
          {/* Back button and actions */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => router.push("/employee-request")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Requests
            </Button>
            <div className="flex items-center gap-2">
              {request.status === "created" && (
                <>
                  <Button variant="outline" onClick={() => openActionDialog("revise")}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Request Revision
                  </Button>
                  <Button onClick={() => openActionDialog("review")}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Reviewed
                  </Button>
                </>
              )}
              {request.status === "reviewed" && (
                <>
                  <Button variant="destructive" onClick={() => openActionDialog("reject")}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                  <Button onClick={() => openActionDialog("approve")}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                </>
              )}
              {request.status === "approved" && (
                <Button onClick={() => openActionDialog("start_recruitment")}>
                  <PlayCircle className="mr-2 h-4 w-4" />
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
              <CardContent className="p-6">
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
                              "h-12 w-12 rounded-full flex items-center justify-center transition-all duration-500",
                              isActive && "bg-accent text-accent-foreground ring-4 ring-accent/20 scale-110",
                              isCompleted && "bg-accent/20 text-accent",
                              isPending && "bg-secondary text-muted-foreground"
                            )}
                          >
                            {isCompleted ? <Check className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
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
                  <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                    <XCircle className="h-6 w-6 text-destructive" />
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
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-semibold tracking-tight">{request.code}</h2>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="mt-2 text-xl text-foreground/80">{request.jobTitle?.name}</p>
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
                        <p className="font-mono font-semibold text-accent mt-1">{request.recruitmentCode}</p>
                      </div>
                    )}
                  </div>

                  <Separator className="my-6" />

                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                      Purpose / Justification
                    </h4>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{request.purpose}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Candidates Section */}
              {isApprovedOrRecruitment && (
                <Card className="border-accent/20">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-accent" />
                      Candidates
                      {candidates.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {candidates.length}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {candidates.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center mb-4">
                          <Users className="h-10 w-10 text-muted-foreground/50" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          No candidates for this request yet
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border -mx-6">
                        {candidates.map((candidate) => (
                          <div
                            key={candidate.id}
                            className="flex items-center justify-between py-4 px-6 group cursor-pointer hover:bg-accent/5 transition-colors"
                            onClick={() => router.push(`/recruitment/${candidate.id}`)}
                          >
                            <div className="flex items-center gap-4">
                              <Avatar className="h-11 w-11 border-2 border-background shadow-sm">
                                <AvatarFallback className="bg-accent/10 text-accent font-semibold">
                                  {getInitials(candidate.fullname)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{candidate.fullname}</p>
                                <p className="text-sm text-muted-foreground">{candidate.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              {getCandidateStatusBadge(deriveCandidateStatus(candidate))}
                              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Requirements */}
              <Card>
                <CardHeader>
                  <CardTitle>Requirements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Education</p>
                        <p className="font-medium mt-1">{EDUCATION_LEVEL_LABELS[request.education as EducationLevel]}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Experience</p>
                        <p className="font-medium mt-1">{request.experience}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                        <UserCircle className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Gender</p>
                        <p className="font-medium mt-1">{GENDER_PREFERENCE_LABELS[request.genderPreference as GenderPreference]}</p>
                      </div>
                    </div>
                    {(request.ageMin || request.ageMax) && (
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                          <Users className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Age Range</p>
                          <p className="font-medium mt-1">
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

                  {request.skills && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Skills</p>
                      <p className="text-sm">{request.skills}</p>
                    </div>
                  )}

                  {request.certification && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Certification</p>
                      <p className="text-sm">{request.certification}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Job Description */}
              {(request.jobDescription || request.jobRequirement) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Job Description</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {request.jobDescription && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Description</p>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{request.jobDescription}</p>
                      </div>
                    )}
                    {request.jobRequirement && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Additional Requirements</p>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{request.jobRequirement}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Activity History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {request.comments && request.comments.length > 0 ? (
                    <div className="space-y-6">
                      {request.comments.map((comment, index) => (
                        <div key={comment.id} className={cn("flex gap-4", index !== 0 && "pt-6 border-t")}>
                          <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                            <UserCircle className="h-5 w-5 text-accent" />
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
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    {getStatusBadge(request.status)}
                    <p className="mt-3 text-sm text-muted-foreground">{statusConfig?.description}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Budget & Timeline */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Budget & Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(request.budgetMin || request.budgetMax) && (
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center">
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Budget Range</p>
                        <p className="font-medium">
                          {request.budgetMin && request.budgetMax
                            ? `${formatCurrency(request.budgetMin)} - ${formatCurrency(request.budgetMax)}`
                            : request.budgetMin
                            ? `Min ${formatCurrency(request.budgetMin)}`
                            : `Max ${formatCurrency(request.budgetMax)}`}
                        </p>
                      </div>
                    </div>
                  )}
                  {request.expectedOnboardDate && (
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Expected Onboard</p>
                        <p className="font-medium">{formatShortDate(request.expectedOnboardDate)}</p>
                      </div>
                    </div>
                  )}
                  {request.jobPlacement && (
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Work Location</p>
                        <p className="font-medium">{request.jobPlacement}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Requester Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Requester</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border">
                      <AvatarFallback className="bg-accent/10 text-accent font-medium">
                        {getInitials(request.requestedByName || "U")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{request.requestedByName}</p>
                      <p className="text-sm text-muted-foreground">{request.department?.name}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2 text-sm">
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
