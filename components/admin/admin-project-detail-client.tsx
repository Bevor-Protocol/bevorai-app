"use client";

import { adminActions } from "@/actions/bevor";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { generateQueryKey } from "@/utils/constants";
import { formatDate } from "@/utils/helpers";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import React, { useMemo } from "react";

const ANALYSIS_HISTORY_LIMIT = 500;

export const AdminProjectDetailClient: React.FC<{
  teamId: string;
  projectId: string;
}> = ({ teamId, projectId }) => {
  const teamQuery = useQuery({
    queryKey: generateQueryKey.adminTeam(teamId),
    queryFn: async () =>
      adminActions.adminTeamGet(teamId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  const projectsQuery = useQuery({
    queryKey: generateQueryKey.adminTeamProjects(teamId),
    queryFn: async () =>
      adminActions.adminTeamProjects(teamId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    enabled: teamQuery.isSuccess && !!teamQuery.data,
  });

  const project = useMemo(
    () => projectsQuery.data?.find((p) => p.id === projectId) ?? null,
    [projectsQuery.data, projectId],
  );

  const analysisQuery = useQuery({
    queryKey: generateQueryKey.adminTeamProjectAnalysisNodes(teamId, projectId),
    queryFn: async () =>
      adminActions
        .adminTeamRecentAnalysisNodes(teamId, {
          limit: ANALYSIS_HISTORY_LIMIT,
          project_id: projectId,
        })
        .then((r) => {
          if (!r.ok) throw r;
          return r.data;
        }),
    enabled: !!project,
    select: (rows) => rows.filter((row) => row.project_id === projectId),
  });

  const team = teamQuery.data;
  const teamBackHref = `/admin/teams/${encodeURIComponent(teamId)}`;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={teamBackHref}
          className="mb-4 inline-flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {teamQuery.isLoading ? "Team" : (team?.name ?? "Team")}
        </Link>

        {teamQuery.isLoading || projectsQuery.isLoading ? (
          <Skeleton className="h-10 w-64" />
        ) : teamQuery.isError || projectsQuery.isError ? (
          <p className="text-sm text-destructive">Failed to load project.</p>
        ) : !team ? (
          <p className="text-sm text-foreground/70">Team not found.</p>
        ) : !project ? (
          <p className="text-sm text-foreground/70">Project not found on this team.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
              {project.deleted_at ? (
                <Badge variant="destructive" className="text-xs">
                  deleted
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 font-mono text-xs text-foreground/60">
              /{project.slug} · {project.id}
            </p>
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-foreground/70">Created</dt>
                <dd className="font-medium">
                  {project.created_at ? formatDate(project.created_at) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-foreground/70">GitHub repo id</dt>
                <dd className="font-medium tabular-nums">
                  {project.github_repo_id !== null ? String(project.github_repo_id) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-foreground/70">Owner user</dt>
                <dd className="font-medium">
                  <Link
                    href={`/admin/users/${encodeURIComponent(project.owner_user_id)}`}
                    className="font-mono text-xs underline-offset-4 hover:underline"
                  >
                    {project.owner_user_id}
                  </Link>
                </dd>
              </div>
            </dl>
          </>
        )}
      </div>

      {project && team ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Analysis history</CardTitle>
            <CardDescription className="text-foreground/70">
              Recent analysis nodes for this project (up to {ANALYSIS_HISTORY_LIMIT} rows from the
              team feed; filtered by project).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analysisQuery.isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : analysisQuery.isError ? (
              <p className="text-sm text-destructive">Failed to load analysis history.</p>
            ) : (analysisQuery.data?.length ?? 0) === 0 ? (
              <p className="text-sm text-foreground/70">No analysis nodes in this window.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Node</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Flags</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysisQuery.data!.map((row) => {
                    const appHref = `/team/${encodeURIComponent(team.slug)}/${encodeURIComponent(project.slug)}/analyses/${encodeURIComponent(row.id)}`;
                    return (
                      <TableRow key={row.id}>
                        <TableCell className="max-w-[200px]">
                          <p className="truncate font-mono text-xs text-foreground/80">{row.id}</p>
                          <Link
                            href={appHref}
                            className="mt-1 inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
                          >
                            Open in app
                            <ExternalLink className="size-3" />
                          </Link>
                        </TableCell>
                        <TableCell>{row.status}</TableCell>
                        <TableCell className="text-foreground/80">{row.trigger}</TableCell>
                        <TableCell className="text-xs text-foreground/70">
                          {row.is_leaf ? "leaf" : "branch"}
                          {row.is_public ? " · public" : ""}
                        </TableCell>
                        <TableCell className="tabular-nums text-sm text-foreground/70">
                          {row.created_at ? formatDate(row.created_at) : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};
