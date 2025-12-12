"use client";

import { githubActions, projectActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateQueryKey } from "@/utils/constants";
import { GithubInstallationsSchemaI } from "@/utils/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, GitFork, Github, Loader2, Lock, Plus, PlusCircle, Star } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface GitHubIntegrationClientProps {
  installations: GithubInstallationsSchemaI;
  defaultInstallationId: number | null;
  teamSlug?: string;
}

export const GitHubIntegrationClient: React.FC<GitHubIntegrationClientProps> = ({
  installations,
  defaultInstallationId,
  teamSlug,
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedInstallationId, setSelectedInstallationId] = useState<number | null>(
    defaultInstallationId,
  );

  const { data: repositories, isLoading: isLoadingRepositories } = useQuery({
    queryKey: generateQueryKey.githubRepositories(selectedInstallationId ?? 0),
    queryFn: () => {
      if (!selectedInstallationId) return null;
      return githubActions.getRepositories(selectedInstallationId, teamSlug);
    },
    enabled: !!selectedInstallationId,
  });

  const connectGithubOauthMutation = useMutation({
    mutationFn: () =>
      githubActions
        .getOauthUrl({
          redirect_uri: window.location.origin + "/api/github/callback/oauth",
        })
        .then((url) => window.location.replace(url)),
    onError: () => {
      toast.error("Failed to connect you to Github. Please try again.");
    },
  });

  const connectGitHubAppMutation = useMutation({
    mutationFn: () =>
      githubActions
        .getInstallationUrl({
          redirect_uri: window.location.origin + "/api/github/callback/install",
        })
        .then((url) => window.open(url, "_blank")),
    onError: () => {
      toast.error("Failed to get GitHub installation URL. Please try again.");
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (repo_id: number) => {
      if (!teamSlug) throw new Error("Team slug is required");
      return projectActions.createProject(teamSlug, {
        github_repo_id: repo_id,
      });
    },
    onSuccess: ({ project, toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      toast.success("Project created successfully");
      if (teamSlug) {
        router.push(`/${teamSlug}/${project.slug}`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create project. Please try again.");
    },
  });

  if (!installations?.is_authenticated) {
    return (
      <div className="p-4 border border-yellow-500/20 bg-yellow-500/10 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="size-5 text-yellow-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium mb-1">GitHub OAuth Required</p>
            <p className="text-xs text-muted-foreground mb-3">
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

  const installationsList = installations?.installation_info?.installations || [];

  return (
    <div className="space-y-4">
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
                    <span className="text-sm">Add Github Account</span>
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
                <div className="space-y-2">
                  {repositories.repository_info.repositories.map((repo) => (
                    <div
                      key={repo.id}
                      className="block p-4 border rounded-lg hover:border-foreground/20 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <Github className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <a
                              href={repo.html_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-sm truncate hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {repo.full_name}
                            </a>
                            {repo.private && (
                              <Lock className="size-3 text-muted-foreground shrink-0" />
                            )}
                            {repo.archived && (
                              <span className="text-xs text-muted-foreground shrink-0">
                                Archived
                              </span>
                            )}
                          </div>
                          {repo.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                              {repo.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                            {repo.language && (
                              <div className="flex items-center gap-1">
                                <div className="size-2 rounded-full" />
                                <span>{repo.language}</span>
                              </div>
                            )}
                            {repo.stargazers_count !== null &&
                              repo.stargazers_count !== undefined && (
                                <div className="flex items-center gap-1">
                                  <Star className="size-3" />
                                  <span>{repo.stargazers_count}</span>
                                </div>
                              )}
                            {repo.forks_count !== null && repo.forks_count !== undefined && (
                              <div className="flex items-center gap-1">
                                <GitFork className="size-3" />
                                <span>{repo.forks_count}</span>
                              </div>
                            )}
                            {repo.created_at && (
                              <span>
                                Created{" "}
                                {new Date(repo.created_at).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year:
                                    new Date(repo.created_at).getFullYear() !==
                                    new Date().getFullYear()
                                      ? "numeric"
                                      : undefined,
                                })}
                              </span>
                            )}
                            {repo.updated_at && (
                              <span>
                                Updated{" "}
                                {new Date(repo.updated_at).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year:
                                    new Date(repo.updated_at).getFullYear() !==
                                    new Date().getFullYear()
                                      ? "numeric"
                                      : undefined,
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                        {teamSlug && !repo.disabled && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              createProjectMutation.mutate(repo.id);
                            }}
                            disabled={createProjectMutation.isPending}
                            className="shrink-0"
                          >
                            {createProjectMutation.isPending &&
                            createProjectMutation.variables === repo.id ? (
                              <>
                                <Loader2 className="size-3 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              <>
                                <Plus className="size-3" />
                                Create Project
                              </>
                            )}
                          </Button>
                        )}
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
