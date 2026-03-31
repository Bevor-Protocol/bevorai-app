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
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import React from "react";

export const AdminTeamDetailClient: React.FC<{ teamId: string }> = ({ teamId }) => {
  const teamQuery = useQuery({
    queryKey: generateQueryKey.adminTeam(teamId),
    queryFn: async () =>
      adminActions.adminTeamGet(teamId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  const membersQuery = useQuery({
    queryKey: generateQueryKey.adminTeamMembers(teamId),
    queryFn: async () =>
      adminActions.adminTeamMembers(teamId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    enabled: teamQuery.isSuccess && !!teamQuery.data,
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

  const invitesQuery = useQuery({
    queryKey: generateQueryKey.adminTeamInvites(teamId),
    queryFn: async () =>
      adminActions.adminTeamInvites(teamId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    enabled: teamQuery.isSuccess && !!teamQuery.data,
  });

  const team = teamQuery.data;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/teams"
          className="inline-flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground mb-4"
        >
          <ArrowLeft className="size-4" />
          Teams
        </Link>

        {teamQuery.isLoading ? (
          <Skeleton className="h-10 w-64" />
        ) : teamQuery.isError ? (
          <p className="text-sm text-destructive">Failed to load team.</p>
        ) : !team ? (
          <p className="text-sm text-foreground/70">Team not found.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{team.name}</h1>
              <Badge variant="outline">{team.plan_status}</Badge>
              {team.is_default ? <Badge variant="secondary">default</Badge> : null}
              {team.deleted_at ? (
                <Badge variant="destructive" className="text-xs">
                  deleted
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 font-mono text-xs text-foreground/60">
              /{team.slug} · {team.id}
            </p>
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-foreground/70">Created</dt>
                <dd className="font-medium">
                  {team.created_at ? formatDate(team.created_at) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-foreground/70">Updated</dt>
                <dd className="font-medium">
                  {team.updated_at ? formatDate(team.updated_at) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-foreground/70">Created by user</dt>
                <dd className="font-medium font-mono text-xs">{team.created_by_user_id}</dd>
              </div>
            </dl>
          </>
        )}
      </div>

      {team ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Members</CardTitle>
            </CardHeader>
            <CardContent>
              {membersQuery.isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : (membersQuery.data?.length ?? 0) === 0 ? (
                <p className="text-sm text-foreground/70">No members.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {membersQuery.data!.map((m) => (
                      <TableRow key={m.membership_id}>
                        <TableCell>
                          <Link
                            href={`/admin/users/${encodeURIComponent(m.user.id)}`}
                            className="font-medium underline-offset-4 hover:underline"
                          >
                            {m.user.username}
                          </Link>
                        </TableCell>
                        <TableCell>{m.role}</TableCell>
                        <TableCell className="text-foreground/70 text-sm tabular-nums">
                          {m.joined_at ? formatDate(m.joined_at) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Projects</CardTitle>
            </CardHeader>
            <CardContent>
              {projectsQuery.isLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : (projectsQuery.data?.length ?? 0) === 0 ? (
                <p className="text-sm text-foreground/70">No projects.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectsQuery.data!.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/admin/teams/${encodeURIComponent(teamId)}/projects/${encodeURIComponent(p.id)}`}
                            className="underline-offset-4 hover:underline"
                          >
                            {p.name}
                          </Link>
                          {p.deleted_at ? (
                            <span className="ml-2 text-xs font-normal text-destructive">
                              deleted
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-foreground/70">
                          {p.owner_user_id}
                        </TableCell>
                        <TableCell className="text-sm text-foreground/70 tabular-nums">
                          {p.created_at ? formatDate(p.created_at) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invites</CardTitle>
              <CardDescription className="text-foreground/70">
                Pending or historical invite rows
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invitesQuery.isLoading ? (
                <Skeleton className="h-28 w-full" />
              ) : (invitesQuery.data?.length ?? 0) === 0 ? (
                <p className="text-sm text-foreground/70">No invites.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Email / wallet</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitesQuery.data!.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell>{inv.role}</TableCell>
                        <TableCell className="text-sm text-foreground/70">
                          {inv.email ?? inv.wallet_address ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm tabular-nums">
                          {inv.created_at ? formatDate(inv.created_at) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
};
