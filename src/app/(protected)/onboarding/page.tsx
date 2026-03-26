"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserCheck,
  ClipboardList,
  Loader2,
  AlertCircle,
  ChevronRight,
  Calendar,
  Building2,
  Briefcase,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { candidateService, type CandidateWithRelations } from "@/services/candidate.service";
import { formatShortDate, getInitials } from "@/lib/utils";
import {
  ONBOARDING_STATUS,
  DEFAULT_CHECKLIST_ITEMS,
  type OnboardingStatus,
} from "@/lib/constants/onboarding";

type DerivedStatus = "offer" | "hired";

function deriveCandidateOnboardingStatus(candidate: CandidateWithRelations): DerivedStatus | null {
  const assessment = candidate.assessment;
  if (!assessment) return null;

  // MCU must be passed to be in onboarding flow
  if (assessment.mcuStatus !== "PASSED") return null;

  // If onboarding accepted, they're hired
  if (candidate.onboardingAcceptedAt) return "hired";

  // MCU passed but not yet accepted = offer stage
  return "offer";
}

const STATUS_LABELS: Record<DerivedStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" }> = {
  offer: { label: "Offer", variant: "secondary" },
  hired: { label: "Hired", variant: "success" },
};

const getOnboardingProgress = (status: DerivedStatus): { progress: number; status: OnboardingStatus } => {
  switch (status) {
    case "offer":
      return { progress: 25, status: ONBOARDING_STATUS.IN_PROGRESS };
    case "hired":
      return { progress: 100, status: ONBOARDING_STATUS.COMPLETED };
  }
};

export default function OnboardingPage() {
  const router = useRouter();

  // State
  type CandidateWithDerivedStatus = CandidateWithRelations & { derivedStatus: DerivedStatus };
  const [candidates, setCandidates] = React.useState<CandidateWithDerivedStatus[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  // Fetch candidates in offer or hired status
  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await candidateService.getAll(1, 100);

      if (response.success && response.data) {
        // Derive status from assessment data and filter for onboarding-relevant candidates
        const onboardingCandidates = response.data.data
          .map((c) => ({ ...c, derivedStatus: deriveCandidateOnboardingStatus(c) }))
          .filter((c): c is CandidateWithDerivedStatus => c.derivedStatus !== null);
        setCandidates(onboardingCandidates);
      } else {
        setError(response.message || "Failed to load onboarding data");
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("Failed to load onboarding data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Computed values
  const filteredCandidates = React.useMemo(() => {
    if (statusFilter === "all") return candidates;
    return candidates.filter((c) => c.derivedStatus === statusFilter);
  }, [candidates, statusFilter]);

  const offerCount = candidates.filter((c) => c.derivedStatus === "offer").length;
  const hiredCount = candidates.filter((c) => c.derivedStatus === "hired").length;
  const totalChecklist = DEFAULT_CHECKLIST_ITEMS.length;

  // Loading state
  if (isLoading) {
    return (
      <>
        <Header title="Onboarding" />
        <PageContainer>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </PageContainer>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <Header title="Onboarding" />
        <PageContainer>
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={fetchData}>Try Again</Button>
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Header title="Onboarding" />
      <PageContainer>
        <div className="space-y-8">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="animate-fade-in">
              <Card className="border-accent/20 bg-accent/5">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        Total Onboarding
                      </p>
                      <p className="mt-1 font-semibold text-3xl text-accent">
                        {candidates.length}
                      </p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10">
                      <ClipboardList className="h-5 w-5 text-accent" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: "50ms" }}>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        Pending Offer
                      </p>
                      <p className="mt-1 font-semibold text-3xl">{offerCount}</p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: "100ms" }}>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        Completed
                      </p>
                      <p className="mt-1 font-semibold text-3xl">{hiredCount}</p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
                      <UserCheck className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Filter and List */}
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold">Candidates in Onboarding</h2>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="offer">Pending Offer</SelectItem>
                  <SelectItem value="hired">Hired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredCandidates.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <ClipboardList className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-lg font-medium">No candidates in onboarding</p>
                  <p className="text-muted-foreground">
                    Candidates with "Offer" or "Hired" status will appear here.
                  </p>
                  <Button
                    className="mt-4"
                    variant="outline"
                    onClick={() => router.push("/recruitment")}
                  >
                    Go to Recruitment
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredCandidates.map((candidate) => {
                  const { progress } = getOnboardingProgress(candidate.derivedStatus);
                  const statusLabel = STATUS_LABELS[candidate.derivedStatus];

                  return (
                    <Card
                      key={candidate.id}
                      className="group cursor-pointer transition-all hover:shadow-md hover:border-accent/50"
                      onClick={() => router.push(`/onboarding/${candidate.id}`)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 border border-border">
                              <AvatarFallback className="bg-accent/10 font-semibold text-accent">
                                {getInitials(candidate.fullname)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {candidate.fullname}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {candidate.email}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>

                        <div className="mt-4 space-y-3">
                          {/* Job Info */}
                          <div className="flex items-center gap-4 text-sm">
                            {candidate.jobTitle && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Briefcase className="h-3.5 w-3.5" />
                                <span>{candidate.jobTitle.name}</span>
                              </div>
                            )}
                            {candidate.employeeRequest?.jobPlacement && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Building2 className="h-3.5 w-3.5" />
                                <span>{candidate.employeeRequest.jobPlacement}</span>
                              </div>
                            )}
                          </div>

                          {/* Progress */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>

                          {/* Status and Date */}
                          <div className="flex items-center justify-between pt-2">
                            <Badge variant={statusLabel.variant}>
                              {statusLabel.label}
                            </Badge>
                            {candidate.createdAt && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>{formatShortDate(candidate.createdAt)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Checklist Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Standard Onboarding Checklist</CardTitle>
              <CardDescription>
                Default checklist items for new employees ({totalChecklist} items)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {DEFAULT_CHECKLIST_ITEMS.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 text-sm p-2 rounded-md bg-secondary/50"
                  >
                    <div
                      className={`h-2 w-2 rounded-full ${
                        item.required ? "bg-accent" : "bg-muted-foreground/50"
                      }`}
                    />
                    <span className={item.required ? "" : "text-muted-foreground"}>
                      {item.label}
                    </span>
                    {item.required && (
                      <span className="text-xs text-destructive ml-auto">*</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </>
  );
}
