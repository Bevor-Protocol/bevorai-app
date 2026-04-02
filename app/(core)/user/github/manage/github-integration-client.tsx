"use client";

import { codeActions, githubActions, projectActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProjectDetailedSchema } from "@/types/api/responses/business";
import { GithubUserInstallationsSchema } from "@/types/api/responses/github";
import { generateQueryKey } from "@/utils/constants";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ExternalLink,
  GitFork,
  Github,
  Loader2,
  Lock,
  Plus,
  PlusCircle,
  Star,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface GitHubIntegrationClientProps {
  installations: GithubUserInstallationsSchema;
  defaultInstallationId: number | null;
  teamSlug?: string;
  /** When set, called instead of default navigation. */
  onProjectCreated?: (project: ProjectDetailedSchema, analysisId: string) => void;
}

export const GitHubIntegrationClient: React.FC<GitHubIntegrationClientProps> = ({
  installations,
  defaultInstallationId,
  teamSlug,
  onProjectCreated,
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedInstallationId, setSelectedInstallationId] = useState<number | null>(
    defaultInstallationId,
  );

  const { data: repositories, isLoading: isLoadingRepositories } = useQuery({
    queryKey: generateQueryKey.githubRepositories(selectedInstallationId ?? 0, teamSlug),
    queryFn: () => {
      if (!selectedInstallationId) return null;
      return githubActions.getRepositories(selectedInstallationId, teamSlug).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      });
    },
    enabled: !!selectedInstallationId,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  });

  const connectGithubOauthMutation = useMutation({
    mutationFn: () =>
      githubActions
        .getOauthUrl(teamSlug)
        .then((r) => {
          if (!r.ok) throw r;
          return r.data;
        })
        .then((url) => window.location.replace(url)),
    onError: () => {
      toast.error("Failed to connect you to Github. Please try again.");
    },
  });

  const connectGitHubAppMutation = useMutation({
    mutationFn: () =>
      githubActions
        .getInstallationUrl(teamSlug)
        .then((r) => {
          if (!r.ok) throw r;
          return r.data;
        })
        .then((url) => window.open(url, "_blank")),
    onError: () => {
      toast.error("Failed to get GitHub installation URL. Please try again.");
    },
  });

  const importToastId = useRef<string | number | undefined>(undefined);

  const importRepoMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!teamSlug) throw new Error("Team slug is required");
      const created = await projectActions
        .createProject(teamSlug, { github_repo_id: id })
        .then((r) => {
          if (!r.ok) throw r;
          return r.data;
        });
      const codeRes = await codeActions
        .createCodeConnectedGithub(created.project.team.slug, created.project.id, {
          analyze: true,
        })
        .then((r) => {
          if (!r.ok) throw r;
          return r.data;
        });
      const analysisId = codeRes.analysis_id;
      if (!analysisId) {
        throw new Error("Code import did not return an analysis id.");
      }
      return {
        project: created.project,
        analysisId,
        code: codeRes,
        projectToInvalidate: created.toInvalidate,
      };
    },
    onMutate: () => {
      importToastId.current = toast.loading("Creating project and importing code...");
    },
    onSuccess: ({ project, analysisId, code, projectToInvalidate }) => {
      projectToInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      code.toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      toast.success("Repository imported successfully", {
        id: importToastId.current,
      });
      importToastId.current = undefined;
      if (onProjectCreated) {
        onProjectCreated(project, analysisId);
      } else if (teamSlug) {
        router.push(`/team/${teamSlug}/${project.slug}/analyses/${analysisId}`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to import repository. Please try again.", {
        id: importToastId.current,
      });
      importToastId.current = undefined;
    },
  });

  if (!installations?.is_authenticated) {
    return (
      <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-yellow-600" />
          <div className="flex-1">
            <p className="mb-1 text-sm font-medium">GitHub OAuth Required</p>
            <p className="mb-3 text-xs text-muted-foreground">
              You need to connect your GitHub OAuth account to view and manage GitHub App
              installations.
            </p>
            <Button
              onClick={() => connectGithubOauthMutation.mutate()}
              disabled={connectGithubOauthMutation.isPending}
              size="sm"
            >
              {connectGithubOauthMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Github className="size-4" />
                  Connect GitHub OAuth
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const manageHref = teamSlug
    ? `/user/github/manage?teamSlug=${encodeURIComponent(teamSlug)}`
    : "/user/github/manage";

  const installationsList = installations?.installation_info?.installations || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" className="gap-2" asChild>
          <Link href={manageHref}>
            <ExternalLink className="size-4" />
            Manage connection
          </Link>
        </Button>
      </div>
      {installationsList.length === 0 ? (
        <div className="p-4 border rounded-lg text-center">
          <p className="text-sm text-muted-foreground mb-3">No GitHub App installations found.</p>
          <Button
            onClick={() => connectGitHubAppMutation.mutate()}
            disabled={connectGitHubAppMutation.isPending}
          >
            <Github className="size-4" />
            {connectGitHubAppMutation.isPending ? "Connecting..." : "Install GitHub App"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Select
              value={selectedInstallationId?.toString() || ""}
              onValueChange={(value) => {
                if (value === "configure") {
                  connectGitHubAppMutation.mutate();
                } else {
                  setSelectedInstallationId(Number(value));
                }
              }}
            >
              <SelectTrigger className="w-full max-w-md h-14!">
                <SelectValue placeholder="Select an installation" />
              </SelectTrigger>
              <SelectContent>
                {installationsList.map((installation) => (
                  <SelectItem
                    key={installation.id}
                    value={installation.id.toString()}
                    className="px-3 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative size-8 shrink-0">
                        <Image
                          src={installation.account.avatar_url}
                          alt={installation.account.login}
                          fill
                          className="rounded-full object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-sm">{installation.account.login}</p>
                        <p className="text-xs text-muted-foreground">
                          {installation.account.type}
                          {installation.repository_selection === "selected" && " • Selected repos"}
                          {installation.repository_selection === "all" && " • All repositories"}
                        </p>
                      </div>
                    </div>
                  </SelectItem>
                ))}
                <SelectItem value="configure" className="px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="relative size-8 shrink-0 flex items-center justify-center">
                      <PlusCircle />
                    </div>
                    <span className="text-sm">Manage Github Integration</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedInstallationId && (
            <div>
              {isLoadingRepositories ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : repositories?.repository_info?.repositories &&
                repositories.repository_info.repositories.length > 0 ? (
                <div className="space-y-1">
                  {repositories.repository_info.repositories.map((repo) => (
                    <div
                      key={repo.id}
                      className="flex items-center gap-2 rounded-md border border-border/60 px-2.5 py-1.5"
                    >
                      <Github className="size-3.5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <p className="truncate text-sm font-medium leading-tight">
                            {repo.full_name}
                          </p>
                          {repo.private && (
                            <Lock className="size-3 shrink-0 text-muted-foreground" aria-hidden />
                          )}
                          {repo.archived && (
                            <span className="shrink-0 text-[10px] text-muted-foreground">
                              Archived
                            </span>
                          )}
                        </div>
                        {repo.description && (
                          <p className="line-clamp-1 text-[11px] leading-snug text-muted-foreground">
                            {repo.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0 text-[11px] text-muted-foreground">
                          {repo.language && (
                            <span className="inline-flex items-center gap-1">
                              <span className="size-1.5 rounded-full bg-muted-foreground/60" />
                              {repo.language}
                            </span>
                          )}
                          {repo.stargazers_count !== null &&
                            repo.stargazers_count !== undefined && (
                              <span className="inline-flex items-center gap-0.5">
                                <Star className="size-3" />
                                {repo.stargazers_count}
                              </span>
                            )}
                          {repo.forks_count !== null && repo.forks_count !== undefined && (
                            <span className="inline-flex items-center gap-0.5">
                              <GitFork className="size-3" />
                              {repo.forks_count}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5">
                        {teamSlug && !repo.disabled && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              importRepoMutation.mutate(repo.id);
                            }}
                            disabled={importRepoMutation.isPending}
                            className="h-7 gap-1 px-2 text-xs"
                          >
                            {importRepoMutation.isPending &&
                            importRepoMutation.variables === repo.id ? (
                              <>
                                <Loader2 className="size-3 animate-spin" />
                                <span className="hidden min-[380px]:inline">Creating…</span>
                              </>
                            ) : (
                              <>
                                <Plus className="size-3" />
                                Create
                              </>
                            )}
                          </Button>
                        )}
                        <Button asChild variant="ghost" size="icon" className="size-7 shrink-0">
                          <a
                            href={repo.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`View ${repo.full_name} on GitHub`}
                          >
                            <ExternalLink className="size-3.5" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No repositories found for this installation.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
