"use client";

import { adminActions } from "@/actions/bevor";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebouncedState } from "@/hooks/useDebouncedState";
import { generateQueryKey } from "@/utils/constants";
import { formatDate } from "@/utils/helpers";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import React, { useState } from "react";

const UserTable: React.FC<{
  rows: {
    id: string;
    username: string;
    is_admin?: boolean | null;
    created_at?: string;
  }[];
  loading: boolean;
  emptyLabel: string;
}> = ({ rows, loading, emptyLabel }) => {
  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (rows.length === 0) {
    return <p className="text-sm text-foreground/70">{emptyLabel}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Admin</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((u, index) => {
          const href = `/admin/users/${encodeURIComponent(u.id)}`;
          return (
            <TableRow key={`${u.id}-${index}`}>
              <TableCell>
                <Link
                  href={href}
                  className="block rounded-md py-0.5 font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {u.username}
                </Link>
                <p className="max-w-[200px] truncate font-mono text-xs text-foreground/60">
                  {u.id}
                </p>
              </TableCell>
              <TableCell>
                {u.is_admin ? (
                  <Badge variant="secondary" className="text-xs">
                    admin
                  </Badge>
                ) : (
                  <span className="text-foreground/70">—</span>
                )}
              </TableCell>
              <TableCell className="tabular-nums text-foreground/70 text-sm">
                <Link href={href} tabIndex={-1} className="hover:text-foreground hover:underline">
                  {u.created_at ? formatDate(u.created_at) : "—"}
                </Link>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export const AdminUsersClient: React.FC = () => {
  const [search, setSearch] = useState("");
  const { debouncedState: debouncedSearch, isWaiting } = useDebouncedState(search, {
    duration: 350,
  });
  const trimmed = debouncedSearch.trim();

  const usersQuery = useQuery({
    queryKey: generateQueryKey.adminUsersSearch(trimmed),
    queryFn: async () =>
      adminActions.adminUsersSearch(trimmed ? { search: trimmed } : undefined).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  const adminsQuery = useQuery({
    queryKey: generateQueryKey.adminUsersAdmins(),
    queryFn: async () =>
      adminActions.adminUsersAdmins().then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  const hasSearch = trimmed.length > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-foreground/70">
          Default list from search; narrow results with the field below.
        </p>
      </div>

      <div className="max-w-xl">
        <SearchInput
          placeholder="Filter by username or id…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Filter users"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{hasSearch ? "Matching users" : "Users"}</CardTitle>
            <CardDescription className="text-foreground/70">
              {hasSearch
                ? `“${trimmed}”${isWaiting || usersQuery.isFetching ? " · loading…" : ""}`
                : "Server default sort and limit."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserTable
              rows={usersQuery.data ?? []}
              loading={usersQuery.isLoading || usersQuery.isFetching}
              emptyLabel={hasSearch ? "No users match this filter." : "No users returned."}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Admin accounts</CardTitle>
          </CardHeader>
          <CardContent>
            {adminsQuery.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (adminsQuery.data?.length ?? 0) === 0 ? (
              <p className="text-sm text-foreground/70">No admins returned.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {adminsQuery.data!.map((a, index) => (
                  <li key={`${a.id}-${index}`}>
                    <Link
                      href={`/admin/users/${encodeURIComponent(a.id)}`}
                      className="group block rounded-md px-2 py-2 text-foreground transition-colors hover:bg-accent/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="font-medium text-primary underline-offset-4 group-hover:underline">
                        {a.username}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
