"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  RotateCcw,
  Users,
  Pencil,
  PlayCircle,
  Sparkles,
  Send,
  Check,
  Mail,
  UserPlus,
  Search,
  ChevronRight,
  UserCircle,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { cn, formatShortDate } from "@/lib/utils";
import { showToast } from "@/lib/utils/toast-messages";
import { hasBiodataSubmitted } from "@/lib/utils/recruitmentHelpers";
import { employeeRequestService } from "@/services/employee-request.service";
import { candidateService, type CandidateWithRelations } from "@/services/candidate.service";
import {
  EMPLOYEE_REQUEST_STATUS_CONFIG,
  EMPLOYMENT_TYPE_LABELS,
  WORK_LOCATION_LABELS,
  type EmployeeRequestStatus,
  type EmploymentType,
  type WorkLocation,
} from "@/lib/constants/employeeRequest";
import {
  CANDIDATE_STATUS,
  CANDIDATE_STATUS_CONFIG,
  type CandidateStatus,
} from "@/lib/constants/candidateStatus";
import type { EmployeeRequestWithRelations } from "@/types/employee-request";

// Workflow steps for the timeline
const WORKFLOW_STEPS = [
  { key: "draft", label: "Draft", icon: Pencil },
  { key: "created", label: "Submitted", icon: Send },
  { key: "hod_review", label: "HOD Review", icon: UserCircle },
  { key: "reviewed", label: "HR Review", icon: CheckCircle },
  { key: "approved", label: "Approved", icon: Sparkles },
  { key: "in_recruitment", label: "Recruiting", icon: Users },
  { key: "completed", label: "Completed", icon: Check },
] as const;

function getCurrentStepIndex(status: EmployeeRequestStatus): number {
  if (status === "rejected" || status === "revise") return 0;
  return WORKFLOW_STEPS.findIndex((s) => s.key === status);
}

export default function RecruitmentRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // State
  const [request, setRequest] = React.useState<EmployeeRequestWithRelations | null>(null);
  const [candidates, setCandidates] = React.useState<CandidateWithRelations[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [candidateSearch, setCandidateSearch] = React.useState("");

  // Dialog states
  const [showActionDialog, setShowActionDialog] = React.useState(false);
  const [actionType, setActionType] = React.useState<"review" | "approve" | "reject" | "revise" | "start_recruitment" | null>(null);
  const [actionComment, setActionComment] = React.useState("");
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Send Invitation dialog state
  const [showInviteDialog, setShowInviteDialog] = React.useState(false);
  const [inviteFullName, setInviteFullName] = React.useState("");
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [isSendingInvite, setIsSendingInvite] = React.useState(false);

  // Fetch data
  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await employeeRequestService.getById(id);

      if (response.success && response.data) {
        setRequest(response.data);

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
          console.warn("Failed to fetch candidates:", candidateErr);
        }
      } else {
        setError(response.message || "Request not found");
      }
    } catch (err) {
      setError("Failed to load request details");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Action handlers
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

  // Send Invitation handler
  const handleSendInvitation = async () => {
    if (!request || !inviteFullName.trim() || !inviteEmail.trim()) {
      showToast.error("Please fill in all required fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      showToast.error("Please enter a valid email address");
      return;
    }

    setIsSendingInvite(true);

    try {
      const createRes = await candidateService.create({
        fullname: inviteFullName.trim(),
        email: inviteEmail.trim(),
        employee_request_id: Number(request.id),
        job_title_id: Number(request.jobTitleId),
      });

      if (!createRes.success || !createRes.data) {
        showToast.error(createRes.message || "Failed to create candidate");
        return;
      }

      const newCandidate = createRes.data;
      const inviteRes = await candidateService.sendInvitation(newCandidate.id);

      if (inviteRes.success) {
        showToast.success(`Invitation sent to ${inviteEmail}`);
      } else {
        showToast.error(inviteRes.message || "Candidate created but failed to send invitation");
      }

      setCandidates(prev => [...prev, newCandidate]);
      setInviteFullName("");
      setInviteEmail("");
      setShowInviteDialog(false);
    } catch (err) {
      showToast.error("Failed to send invitation");
    } finally {
      setIsSendingInvite(false);
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

  const getCandidateStatusBadge = (status: CandidateStatus) => {
    const config = CANDIDATE_STATUS_CONFIG[status];
    return (
      <Badge variant={config?.variant || "secondary"} className="text-xs">
        {config?.label || status}
      </Badge>
    );
  };

  const deriveCandidateStatus = (candidate: CandidateWithRelations): CandidateStatus => {
    // If candidate hasn't submitted biodata yet
    if (!hasBiodataSubmitted(candidate)) return CANDIDATE_STATUS.WAITING_BIODATA;

    const assessment = candidate.assessment;

    // If no assessment, show SCREENING (ready for interview)
    if (!assessment) return CANDIDATE_STATUS.SCREENING;

    // Check if any interview has progressed beyond PENDING
    const interview1Started = assessment.interview1Status && assessment.interview1Status !== "PENDING";
    const interview2Started = assessment.interview2Status && assessment.interview2Status !== "PENDING";
    const mcuStarted = assessment.mcuStatus && assessment.mcuStatus !== "PENDING";

    // MCU completed
    if (assessment.mcuStatus === "PASSED") {
      // If onboarding accepted, show ONBOARDING instead of HIRED
      if (candidate.onboardingAcceptedAt) return CANDIDATE_STATUS.ONBOARDING;
      return CANDIDATE_STATUS.HIRED;
    }
    if (assessment.mcuStatus === "FAILED") return CANDIDATE_STATUS.REJECTED;
    if (mcuStarted) return CANDIDATE_STATUS.MCU;

    // Interview 2 completed
    if (assessment.interview2Status === "PASSED") return CANDIDATE_STATUS.MCU;
    if (assessment.interview2Status === "FAILED") return CANDIDATE_STATUS.REJECTED;
    if (interview2Started) return CANDIDATE_STATUS.INTERVIEW_2;

    // Interview 1 completed
    if (assessment.interview1Status === "PASSED") return CANDIDATE_STATUS.INTERVIEW_2;
    if (assessment.interview1Status === "FAILED") return CANDIDATE_STATUS.REJECTED;
    if (interview1Started) return CANDIDATE_STATUS.INTERVIEW_1;

    // Assessment exists but all statuses are PENDING — interview process was started
    return CANDIDATE_STATUS.INTERVIEW_1;
  };

  const getActionDialogContent = () => {
    switch (actionType) {
      case "review":
        return { title: "Review Request", description: "Mark this request as reviewed and forward to management for approval.", buttonText: "Mark as Reviewed", buttonVariant: "default" as const };
      case "approve":
        return { title: "Approve Request", description: "Approve this employee request. Recruitment can begin after approval.", buttonText: "Approve", buttonVariant: "default" as const };
      case "reject":
        return { title: "Reject Request", description: "Reject this employee request. Please provide a reason for rejection.", buttonText: "Reject", buttonVariant: "destructive" as const };
      case "revise":
        return { title: "Request Revision", description: "Return this request for revision. Please specify what needs to be changed.", buttonText: "Request Revision", buttonVariant: "outline" as const };
      case "start_recruitment":
        return { title: "Start Recruitment", description: "Start the recruitment process. You can then invite candidates to apply.", buttonText: "Start Recruitment", buttonVariant: "default" as const };
      default:
        return { title: "", description: "", buttonText: "", buttonVariant: "default" as const };
    }
  };

  // Filtered candidates by search
  const filteredCandidates = React.useMemo(() => {
    if (candidateSearch.length < 2) return candidates;
    const q = candidateSearch.toLowerCase();
    return candidates.filter(
      (c) =>
        c.fullname.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.detail?.candidateCode?.toLowerCase().includes(q)
    );
  }, [candidates, candidateSearch]);

  const canInviteCandidates = request ? ["approved", "in_recruitment"].includes(request.status) : false;

  // Loading state
  if (isLoading) {
    return (
      <>
        <Header title="Recruitment" />
        <PageContainer>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </PageContainer>
      </>
    );
  }

  // Error state
  if (error || !request) {
    return (
      <>
        <Header title="Recruitment" />
        <PageContainer>
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-muted-foreground">{error || "Request not found"}</p>
            <Button onClick={() => router.push("/recruitment")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Recruitment
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  const dialogContent = getActionDialogContent();

  return (
    <>
      <Header title="Recruitment" />
      <PageContainer>
        <div className="space-y-6">
          {/* Top bar: Back + Title + Actions */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Button variant="ghost" size="sm" onClick={() => router.push("/recruitment")} className="shrink-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-semibold text-accent text-lg leading-none">
                    {request.recruitmentCode
                      ? request.recruitmentCode.replace("REC-", "RC.").replace(/-/g, "")
                      : request.code}
                  </h1>
                  {getStatusBadge(request.status)}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5 truncate">
                  {request.jobTitle?.name}
                  {request.department?.name ? ` · ${request.department.name}` : ""}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {request.status === "created" && (
                <>
                  <Button variant="outline" size="sm" onClick={() => openActionDialog("revise")}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Request Revision
                  </Button>
                  <Button size="sm" onClick={() => openActionDialog("review")}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Reviewed
                  </Button>
                </>
              )}
              {request.status === "reviewed" && (
                <>
                  <Button variant="destructive" size="sm" onClick={() => openActionDialog("reject")}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                  <Button size="sm" onClick={() => openActionDialog("approve")}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                </>
              )}
              {request.status === "approved" && (
                <Button size="sm" onClick={() => openActionDialog("start_recruitment")}>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Start Recruitment
                </Button>
              )}
            </div>
          </div>

          {/* Rejected Banner */}
          {request.status === "rejected" && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-destructive/10 flex items-center justify-center">
                    <XCircle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="font-semibold text-destructive text-sm">Request Rejected</p>
                    <p className="text-xs text-muted-foreground">This employee request has been rejected by management.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Workflow Timeline */}
          {request.status !== "rejected" && (() => {
            const currentStep = getCurrentStepIndex(request.status);
            return (
              <Card className="overflow-hidden border-accent/10 bg-gradient-to-br from-accent/5 to-transparent">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    {WORKFLOW_STEPS.map((step, index) => {
                      const StepIcon = step.icon;
                      const isActive = index === currentStep;
                      const isCompleted = index < currentStep;
                      const isPending = index > currentStep;

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
                                index < currentStep ? "bg-accent" : "bg-secondary"
                              )}
                            />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Job Details - Horizontal Card */}
          <Card className="bg-gradient-to-r from-card to-secondary/20">
            <CardContent className="py-4 px-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-0 lg:divide-x divide-border">
                <div className="lg:px-4 first:lg:pl-0 last:lg:pr-0">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Position</p>
                  <p className="text-sm font-semibold truncate">{request.jobTitle?.name || "—"}</p>
                  <button
                    onClick={() => router.push(`/employee-request/${request.id}`)}
                    className="text-xs text-accent hover:underline mt-0.5"
                  >
                    {request.code}
                  </button>
                </div>
                <div className="lg:px-4">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Department</p>
                  <p className="text-sm font-semibold truncate">{request.department?.name || "—"}</p>
                </div>
                <div className="lg:px-4">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Type</p>
                  <p className="text-sm font-semibold">{request.employmentType ? EMPLOYMENT_TYPE_LABELS[request.employmentType as EmploymentType] : "—"}</p>
                </div>
                <div className="lg:px-4">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Location</p>
                  <p className="text-sm font-semibold truncate">{request.jobPlacement ? (WORK_LOCATION_LABELS[request.jobPlacement as WorkLocation] || request.jobPlacement) : "—"}</p>
                </div>
                <div className="lg:px-4">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Openings</p>
                  <p className="text-sm font-semibold">{request.quantity}</p>
                </div>
                <div className="lg:px-4 last:lg:pr-0">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Target Onboard</p>
                  <p className="text-sm font-semibold">{request.expectedOnboardDate ? formatShortDate(request.expectedOnboardDate) : "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Candidates Section */}
          <div className="space-y-4">
            {/* Header with Search and Invite */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold">Candidates</h2>
                {candidates.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {candidates.length}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {candidates.length > 0 && (
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={candidateSearch}
                      onChange={(e) => setCandidateSearch(e.target.value)}
                      className="pl-8 h-8 text-sm w-[160px]"
                    />
                  </div>
                )}
                {canInviteCandidates && (
                  <Button size="sm" onClick={() => setShowInviteDialog(true)}>
                    <Mail className="mr-1.5 h-3.5 w-3.5" />
                    Invite
                  </Button>
                )}
              </div>
            </div>

            {/* Table Card */}
            <Card>
              <CardContent className="p-0">
                {candidates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <p className="text-sm text-muted-foreground mb-3">
                      No candidates yet
                    </p>
                    {canInviteCandidates && (
                      <Button variant="outline" size="sm" onClick={() => setShowInviteDialog(true)}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Invite Candidate
                      </Button>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="pl-6 w-[140px]">Code</TableHead>
                        <TableHead className="w-[100px]">Status</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="w-[120px]">Applied</TableHead>
                        <TableHead className="w-10 pr-6"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCandidates.map((candidate) => (
                        <TableRow
                          key={candidate.id}
                          className="group cursor-pointer"
                          onClick={() => router.push(`/recruitment/${candidate.id}`)}
                        >
                          <TableCell className="pl-6 py-4">
                            <span className="text-sm text-accent font-medium">
                              {candidate.detail?.candidateCode || `CND-${candidate.id}`}
                            </span>
                          </TableCell>
                          <TableCell className="py-4">
                            {getCandidateStatusBadge(deriveCandidateStatus(candidate))}
                          </TableCell>
                          <TableCell className="py-4">
                            <p className="text-sm font-medium">{candidate.fullname}</p>
                            <p className="text-xs text-muted-foreground">{candidate.email}</p>
                          </TableCell>
                          <TableCell className="py-4 text-sm text-muted-foreground">
                            {candidate.createdAt ? formatShortDate(candidate.createdAt) : "—"}
                          </TableCell>
                          <TableCell className="pr-6 py-4">
                            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogContent.title}</DialogTitle>
            <DialogDescription>{dialogContent.description}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="comment">
              Comment {actionType === "reject" || actionType === "revise" ? "(required)" : "(optional)"}
            </Label>
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

      {/* Send Invitation Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Send Invitation
            </DialogTitle>
            <DialogDescription>
              Enter the candidate&apos;s details to send them an invitation email for the {request?.jobTitle?.name} position.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fullname">Full Name <span className="text-destructive">*</span></Label>
              <Input
                id="fullname"
                placeholder="Enter candidate's full name"
                value={inviteFullName}
                onChange={(e) => setInviteFullName(e.target.value)}
                disabled={isSendingInvite}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter candidate's email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={isSendingInvite}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setShowInviteDialog(false); setInviteFullName(""); setInviteEmail(""); }}
              disabled={isSendingInvite}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendInvitation}
              disabled={isSendingInvite || !inviteFullName.trim() || !inviteEmail.trim()}
            >
              {isSendingInvite ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
