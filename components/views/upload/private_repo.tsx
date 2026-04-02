"use client";

import { githubActions } from "@/actions/bevor";
import { GitHubIntegrationClient } from "@/app/(core)/user/github/manage/github-integration-client";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { generateQueryKey } from "@/utils/constants";
import { useQuery } from "@tanstack/react-query";
import { GitBranch } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

const GitHubReposStep: React.FC<{
  teamSlug: string;
  /** After navigating to the new project / analysis (e.g. close parent dialog). */
  onProjectCreated?: () => void;
}> = ({ teamSlug, onProjectCreated }) => {
  const router = useRouter();

  const {
    data: installations,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: generateQueryKey.githubInstallations(),
    queryFn: () =>
      githubActions.getInstallations().then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const installationsList = installations?.installation_info?.installations ?? [];
  const defaultInstallationId = installationsList.length > 0 ? installationsList[0].id : null;

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-3">
          <GitBranch className="size-5 shrink-0 text-foreground" aria-hidden />
          <DialogTitle>GitHub repositories</DialogTitle>
        </div>
        <DialogDescription>
          Create a project from a repository your GitHub App can access. We import the default
          branch and start an analysis, same as other upload flows. Connect GitHub OAuth below if
          needed. After you&apos;re connected, use{" "}
          <span className="font-medium text-foreground">Manage connection</span> for installations
          and the full settings page.
        </DialogDescription>
      </DialogHeader>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {isLoading && (
          <div className="space-y-3 py-2">
            <Skeleton className="h-14 w-full max-w-md" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}
        {isError && (
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : "Failed to load GitHub connection."}
          </p>
        )}
        {!isLoading && !isError && installations && (
          <GitHubIntegrationClient
            installations={installations}
            defaultInstallationId={defaultInstallationId}
            teamSlug={teamSlug}
            onProjectCreated={(project, analysisId) => {
              router.push(`/team/${teamSlug}/${project.slug}/analyses/${analysisId}`);
              onProjectCreated?.();
            }}
          />
        )}
      </div>
    </>
  );
};

export default GitHubReposStep;
