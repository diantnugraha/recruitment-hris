"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { OnboardingContent } from "@/components/onboarding/OnboardingContent";

export default function OnboardingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = params.candidateId as string;

  return (
    <>
      <Header title="Onboarding Detail" />
      <PageContainer>
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>
        <OnboardingContent candidateId={candidateId} mode="edit" />
      </PageContainer>
    </>
  );
}
