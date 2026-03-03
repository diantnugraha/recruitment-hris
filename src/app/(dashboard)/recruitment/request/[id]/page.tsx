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
  ChevronDown,
  Sparkles,
  Send,
  Check,
  Mail,
  UserPlus,
  FileText,
  Search,
  ChevronRight,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { PipelineProgressCell } from "@/components/recruitment/RecruitmentPipelineIndicator";
import { calculatePipelineStats } from "@/lib/utils/recruitmentHelpers";

// Workflow steps for the timeline
const WORKFLOW_STEPS = [
  { key: "draft", label: "Draft", icon: Clock },
  { key: "created", label: "Submitted", icon: Send },
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
    const assessment = candidate.assessment;
    if (!assessment) return CANDIDATE_STATUS.APPLIED;

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

  // Pipeline stats
  const pipelineStats = React.useMemo(() => calculatePipelineStats(candidates), [candidates]);

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
                  <h1 className="font-mono font-semibold text-accent text-lg leading-none">
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
                <CardContent className="p-6">
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
                                "h-12 w-12 rounded-full flex items-center justify-center transition-all duration-500",
                                isActive && "bg-accent text-accent-foreground ring-4 ring-accent/20 scale-110",
                                isCompleted && "bg-accent/20 text-accent",
                                isPending && "bg-secondary text-muted-foreground"
                              )}
                            >
                              {isCompleted
                                ? <Check className="h-5 w-5" />
                                : <StepIcon className="h-5 w-5" />
                              }
                            </div>
                            <span
                              className={cn(
                                "text-xs font-medium whitespace-nowrap text-center transition-colors",
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
                                "flex-1 h-0.5 mx-2 mb-6 transition-colors duration-500",
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

          {/* Main Grid: Candidates (left) + Sidebar (right) */}
          <div className="grid gap-6 lg:grid-cols-5">
            {/* ── Left: Candidates (focus area) ── */}
            <div className="lg:col-span-3 space-y-6">
              {/* Candidates Card */}
              <Card className="border-accent/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-4 w-4 text-accent" />
                        Candidates
                      </CardTitle>
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
                            placeholder="Search candidates..."
                            value={candidateSearch}
                            onChange={(e) => setCandidateSearch(e.target.value)}
                            className="pl-8 h-8 text-sm w-[180px]"
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
                </CardHeader>
                <CardContent className="pt-0">
                  {/* Pipeline Progress */}
                  {candidates.length > 0 && (
                    <div className="mb-4 px-0">
                      <PipelineProgressCell
                        stats={pipelineStats}
                        positionsNeeded={request.quantity}
                      />
                    </div>
                  )}

                  {/* Candidate Table */}
                  {candidates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-3">
                        <Users className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        No candidates for this request yet
                      </p>
                      {canInviteCandidates && (
                        <Button variant="outline" size="sm" onClick={() => setShowInviteDialog(true)}>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Invite Candidate
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="-mx-6">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[150px]">Candidate Code</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead className="w-[120px]">Applied</TableHead>
                            <TableHead className="w-[130px]">Status</TableHead>
                            <TableHead className="w-[40px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredCandidates.map((candidate) => (
                            <TableRow
                              key={candidate.id}
                              className="group cursor-pointer"
                              onClick={() => router.push(`/recruitment/${candidate.id}`)}
                            >
                              <TableCell>
                                <span className="font-mono text-sm font-semibold text-accent hover:underline">
                                  {candidate.detail?.candidateCode || `CND-${candidate.id}`}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium text-sm">{candidate.fullname}</p>
                                  <p className="text-xs text-muted-foreground">{candidate.email}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-xs text-muted-foreground">
                                  {candidate.createdAt ? formatShortDate(candidate.createdAt) : "—"}
                                </span>
                              </TableCell>
                              <TableCell>
                                {getCandidateStatusBadge(deriveCandidateStatus(candidate))}
                              </TableCell>
                              <TableCell>
                                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              </TableCell>
                            </TableRow>
                          ))}
                          {candidates.length > filteredCandidates.length && (
                            <TableRow className="hover:bg-transparent">
                              <TableCell colSpan={5} className="text-center py-2">
                                <button
                                  className="text-xs text-muted-foreground hover:text-accent transition-colors"
                                  onClick={(e) => { e.stopPropagation(); setCandidateSearch(""); }}
                                >
                                  Show all {candidates.length} candidates
                                </button>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Requirements — Collapsible */}
              <Collapsible defaultOpen={false}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-accent/5 transition-colors py-4">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          Requirements
                        </span>
                        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-5 pt-0">
                      <Separator />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Education</p>
                          <p className="mt-1 text-sm font-medium">{EDUCATION_LEVEL_LABELS[request.education as EducationLevel]}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Experience</p>
                          <p className="mt-1 text-sm font-medium">{request.experience}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Gender</p>
                          <p className="mt-1 text-sm font-medium">{GENDER_PREFERENCE_LABELS[request.genderPreference as GenderPreference]}</p>
                        </div>
                        {(request.ageMin || request.ageMax) && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Age Range</p>
                            <p className="mt-1 text-sm font-medium">
                              {request.ageMin && request.ageMax
                                ? `${request.ageMin} – ${request.ageMax} years`
                                : request.ageMin
                                ? `Min ${request.ageMin} years`
                                : `Max ${request.ageMax} years`}
                            </p>
                          </div>
                        )}
                      </div>
                      {request.skills && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Skills</p>
                          <p className="text-sm">{request.skills}</p>
                        </div>
                      )}
                      {request.certification && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Certification</p>
                          <p className="text-sm">{request.certification}</p>
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Job Description — Collapsible */}
              {(request.jobDescription || request.jobRequirement) && (
                <Collapsible defaultOpen={false}>
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-accent/5 transition-colors py-4">
                        <CardTitle className="text-sm flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Job Description
                          </span>
                          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="space-y-5 pt-0">
                        <Separator />
                        {request.jobDescription && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Description</p>
                            <div
                              className="text-sm leading-relaxed prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: request.jobDescription }}
                            />
                          </div>
                        )}
                        {request.jobRequirement && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Additional Requirements</p>
                            <div
                              className="text-sm leading-relaxed prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: request.jobRequirement }}
                            />
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}

              {/* Activity History */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Activity History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {request.comments && request.comments.length > 0 ? (
                    <div className="space-y-5">
                      {request.comments.map((comment, index) => (
                        <div key={comment.id} className={cn("flex gap-3", index !== 0 && "pt-5 border-t")}>
                          <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                            <UserCircle className="h-4 w-4 text-accent" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{comment.userName}</span>
                                {comment.userRole && (
                                  <Badge variant="outline" className="text-xs py-0">{comment.userRole}</Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground shrink-0">
                                {formatShortDate(comment.createdAt)}
                              </span>
                            </div>
                            {comment.newStatus && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Status →{" "}
                                <Badge variant="secondary" className="text-xs py-0 ml-0.5">
                                  {EMPLOYEE_REQUEST_STATUS_CONFIG[comment.newStatus]?.label || comment.newStatus}
                                </Badge>
                              </p>
                            )}
                            {comment.comment && (
                              <p className="text-sm mt-1.5 text-foreground/80">{comment.comment}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm text-center py-6">No activity history yet</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ── Right Sidebar ── */}
            <div className="lg:col-span-2 space-y-4">
              {/* Job Details */}
              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm">Job Details</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Position</p>
                      <p className="text-sm font-medium">{request.jobTitle?.name || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Department</p>
                      <p className="text-sm font-medium">{request.department?.name || "—"}</p>
                    </div>
                  </div>
                  {request.employmentType && (
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Employment Type</p>
                        <p className="text-sm font-medium">{EMPLOYMENT_TYPE_LABELS[request.employmentType as EmploymentType]}</p>
                      </div>
                    </div>
                  )}
                  {request.jobPlacement && (
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Location</p>
                        <p className="text-sm font-medium">{request.jobPlacement}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Positions Open</p>
                      <p className="text-sm font-medium">{request.quantity} {request.quantity > 1 ? "positions" : "position"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline & Budget */}
              {(request.expectedOnboardDate || request.budgetMin || request.budgetMax) && (
                <Card>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm">Timeline & Budget</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-3">
                    {request.expectedOnboardDate && (
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Expected Onboard</p>
                          <p className="text-sm font-medium">{formatShortDate(request.expectedOnboardDate)}</p>
                        </div>
                      </div>
                    )}
                    {(request.budgetMin || request.budgetMax) && (
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                          <Banknote className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Budget Range</p>
                          <p className="text-sm font-medium">
                            {request.budgetMin && request.budgetMax
                              ? `${formatCurrency(request.budgetMin)} – ${formatCurrency(request.budgetMax)}`
                              : request.budgetMin
                              ? `Min ${formatCurrency(request.budgetMin)}`
                              : `Max ${formatCurrency(request.budgetMax!)}`}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Requester */}
              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm">Requester</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border">
                      <AvatarFallback className="bg-accent/10 text-accent text-sm font-medium">
                        {getInitials(request.requestedByName || "U")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{request.requestedByName}</p>
                      <p className="text-xs text-muted-foreground">{request.department?.name}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Reason</span>
                      <span className="text-xs font-medium">{REQUEST_REASON_LABELS[request.reason as RequestReason]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Created</span>
                      <span className="text-xs">{formatShortDate(request.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Updated</span>
                      <span className="text-xs">{formatShortDate(request.updatedAt)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Justification */}
              <Card className="border-accent/20 bg-gradient-to-br from-accent/8 to-accent/3">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm flex items-center gap-2 text-accent">
                    <Sparkles className="h-4 w-4" />
                    Purpose / Justification
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
                    {request.purpose}
                  </p>
                </CardContent>
              </Card>
            </div>
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
