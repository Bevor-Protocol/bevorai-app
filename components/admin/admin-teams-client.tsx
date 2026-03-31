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

export const AdminTeamsClient: React.FC = () => {
  const [search, setSearch] = useState("");
  const { debouncedState: debouncedSearch, isWaiting } = useDebouncedState(search, {
    duration: 350,
  });
  const trimmed = debouncedSearch.trim();
  const hasSearch = trimmed.length > 0;

  const teamsQuery = useQuery({
    queryKey: generateQueryKey.adminTeamsSearch(trimmed),
    queryFn: async () =>
      adminActions.adminTeamsSearch(trimmed ? { q: trimmed } : undefined).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Teams</h1>
        <p className="text-sm text-foreground/70">
          Default list from search; filter by name or slug below.
        </p>
      </div>

      <div className="max-w-xl">
        <SearchInput
          placeholder="Filter teams…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Filter teams"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{hasSearch ? "Matching teams" : "Teams"}</CardTitle>
          <CardDescription className="text-foreground/70">
            {hasSearch
              ? `“${trimmed}”${isWaiting || teamsQuery.isFetching ? " · loading…" : ""}`
              : "Server default sort and limit."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teamsQuery.isLoading || teamsQuery.isFetching ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : (teamsQuery.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-foreground/70">
              {hasSearch ? "No teams match this filter." : "No teams returned."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamsQuery.data!.map((t, index) => (
                  <TableRow key={`${t.id}-${index}`}>
                    <TableCell>
                      <Link
                        href={`/admin/teams/${encodeURIComponent(t.id)}`}
                        className="font-medium text-foreground underline-offset-4 hover:underline"
                      >
                        {t.name}
                      </Link>
                      <p className="font-mono text-xs text-foreground/60">/{t.slug}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {t.plan_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {t.is_default ? <Badge variant="secondary">default</Badge> : "—"}
                    </TableCell>
                    <TableCell className="tabular-nums text-foreground/70 text-sm">
                      {t.created_at ? formatDate(t.created_at) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
