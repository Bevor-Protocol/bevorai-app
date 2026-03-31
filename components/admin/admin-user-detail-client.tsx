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

export const AdminUserDetailClient: React.FC<{ userId: string }> = ({ userId }) => {
  const userQuery = useQuery({
    queryKey: generateQueryKey.adminUser(userId),
    queryFn: async () =>
      adminActions.adminUserGet(userId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  const membershipsQuery = useQuery({
    queryKey: generateQueryKey.adminUserMemberships(userId),
    queryFn: async () =>
      adminActions.adminUserTeamMemberships(userId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    enabled: userQuery.isSuccess && !!userQuery.data,
  });

  const oauthQuery = useQuery({
    queryKey: generateQueryKey.adminUserOauth(userId),
    queryFn: async () =>
      adminActions.adminUserOauth(userId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    enabled: userQuery.isSuccess && !!userQuery.data,
  });

  const user = userQuery.data;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground mb-4"
        >
          <ArrowLeft className="size-4" />
          Users
        </Link>

        {userQuery.isLoading ? (
          <Skeleton className="h-10 w-64" />
        ) : userQuery.isError ? (
          <p className="text-sm text-destructive">Failed to load user.</p>
        ) : !user ? (
          <p className="text-sm text-foreground/70">User not found.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{user.username}</h1>
              {user.is_admin ? <Badge variant="secondary">admin</Badge> : null}
            </div>
            <p className="mt-1 font-mono text-xs text-foreground/60">{user.id}</p>
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-foreground/70">Created</dt>
                <dd className="font-medium">
                  {user.created_at ? formatDate(user.created_at) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-foreground/70">Updated</dt>
                <dd className="font-medium">
                  {user.updated_at ? formatDate(user.updated_at) : "—"}
                </dd>
              </div>
            </dl>
          </>
        )}
      </div>

      {user ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Team memberships</CardTitle>
              <CardDescription className="text-foreground/70">
                Teams this user belongs to
              </CardDescription>
            </CardHeader>
            <CardContent>
              {membershipsQuery.isLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : (membershipsQuery.data?.length ?? 0) === 0 ? (
                <p className="text-sm text-foreground/70">No memberships.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {membershipsQuery.data!.map((m) => (
                      <TableRow key={m.membership_id}>
                        <TableCell>
                          <Link
                            href={`/admin/teams/${encodeURIComponent(m.team.id)}`}
                            className="font-medium underline-offset-4 hover:underline"
                          >
                            {m.team.name}
                          </Link>
                          <p className="font-mono text-xs text-foreground/60">/{m.team.slug}</p>
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
              <CardTitle className="text-base">OAuth connections</CardTitle>
            </CardHeader>
            <CardContent>
              {oauthQuery.isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : (oauthQuery.data?.length ?? 0) === 0 ? (
                <p className="text-sm text-foreground/70">No OAuth rows.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Expires</TableHead>
                      <TableHead>Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {oauthQuery.data!.map((o, i) => (
                      <TableRow key={`oauth-${i}`}>
                        <TableCell className="text-sm text-foreground/70 tabular-nums">
                          {o.expires_at ? formatDate(o.expires_at) : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-foreground/70 tabular-nums">
                          {o.updated_at ? formatDate(o.updated_at) : "—"}
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
