"use server";

import { analysisActions } from "@/actions/bevor";
import Container from "@/components/container";
import LucideIcon from "@/components/lucide-icon";
import AnalysisThreadSubnav from "@/components/subnav/analysis-thread";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { getQueryClient } from "@/lib/config/query";
import { generateQueryKey } from "@/utils/constants";
import { formatDate } from "@/utils/helpers";
import { AsyncComponent } from "@/utils/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Calendar, GitBranch } from "lucide-react";
import Link from "next/link";
import { AnalysisUnlock, RecentAnalysisVersion } from "./analysis-client";

interface ResolvedParams {
  teamSlug: string;
  projectSlug: string;
  threadId: string;
}

interface PageProps {
  params: Promise<ResolvedParams>;
}

const AnalysisPage: AsyncComponent<PageProps> = async ({ params }) => {
  const queryClient = getQueryClient();
  const resolvedParams = await params;
  const { teamSlug, projectSlug, threadId } = resolvedParams;

  const analysis = await queryClient.fetchQuery({
    queryKey: generateQueryKey.analysis(threadId),
    queryFn: () => analysisActions.getAnalysis(teamSlug, threadId),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Container subnav={<AnalysisThreadSubnav />}>
        <div className="flex flex-col gap-4 max-w-5xl m-auto">
          <div className="flex flex-row items-center gap-2 justify-end">
            <AnalysisUnlock teamSlug={teamSlug} threadId={threadId} />
          </div>
        </div>
        <div className="max-w-5xl m-auto mt-8 lg:mt-16">
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex justify-between items-start">
              <h1>{analysis.name}</h1>
              <Button asChild>
                <Link href={`/${teamSlug}/${projectSlug}/analysis-threads/${threadId}/chat`}>
                  <LucideIcon assetType="chat" />
                  Chat
                </Link>
              </Button>
            </div>
            <div className="flex flex-row gap-2 items-center">
              <div className="text-muted-foreground">Owner:</div>
              <Icon size="sm" seed={analysis.user.id} />
              <div>{analysis.user.username}</div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              <div className="flex items-center gap-1">
                <Calendar className="size-4" />
                <span>{formatDate(analysis.created_at)}</span>
              </div>
              <div className="flex items-center gap-1">
                <GitBranch className="size-4" />
                <span>{analysis.n_versions} versions</span>
              </div>
            </div>
            {analysis.description && (
              <div className="my-2">
                <p className="text-lg leading-relaxed">{analysis.description}</p>
              </div>
            )}
          </div>
          <RecentAnalysisVersion {...resolvedParams} />
        </div>
      </Container>
    </HydrationBoundary>
  );
};

export default AnalysisPage;
