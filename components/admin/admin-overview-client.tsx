"use client";

import { adminActions } from "@/actions/bevor";
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

const formatStatDisplay = (value: string | number | null | undefined): string | number => {
  if (value === null || value === undefined) {
    return "—";
  }
  if (typeof value === "number" && !Number.isFinite(value)) {
    return "—";
  }
  return value;
};

const StatCard: React.FC<{
  title: string;
  value: string | number | null;
  loading: boolean;
  description?: string;
}> = ({ title, value, loading, description }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-foreground/70">{title}</CardTitle>
      {description ? (
        <CardDescription className="text-xs text-foreground/70">{description}</CardDescription>
      ) : null}
    </CardHeader>
    <CardContent>
      {loading ? (
        <Skeleton className="h-8 w-20" />
      ) : (
        <p className="text-2xl font-semibold tabular-nums">{formatStatDisplay(value)}</p>
      )}
    </CardContent>
  </Card>
);

export const AdminOverviewClient: React.FC = () => {
  const { data: userCount, isLoading: loadingUsers } = useQuery({
    queryKey: generateQueryKey.adminMetricCountUsers(),
    queryFn: async () =>
      adminActions.adminMetricCountUsers().then((r) => {
        if (!r.ok) throw r;
        const c = r.data?.count;
        return typeof c === "number" && Number.isFinite(c) ? c : null;
      }),
    staleTime: 60_000,
  });

  const { data: teamsActive, isLoading: loadingTeams } = useQuery({
    queryKey: generateQueryKey.adminMetricTeamsActive(),
    queryFn: async () =>
      adminActions.adminMetricCountTeamsActive().then((r) => {
        if (!r.ok) throw r;
        const c = r.data?.count;
        return typeof c === "number" && Number.isFinite(c) ? c : null;
      }),
    staleTime: 60_000,
  });

  const { data: projectsActive, isLoading: loadingProjects } = useQuery({
    queryKey: generateQueryKey.adminMetricProjectsActive(),
    queryFn: async () =>
      adminActions.adminMetricCountProjectsActive().then((r) => {
        if (!r.ok) throw r;
        const c = r.data?.count;
        return typeof c === "number" && Number.isFinite(c) ? c : null;
      }),
    staleTime: 60_000,
  });

  const { data: analysisNodes, isLoading: loadingNodes } = useQuery({
    queryKey: generateQueryKey.adminMetricAnalysisNodes(),
    queryFn: async () =>
      adminActions.adminMetricCountAnalysisNodes().then((r) => {
        if (!r.ok) throw r;
        const c = r.data?.count;
        return typeof c === "number" && Number.isFinite(c) ? c : null;
      }),
    staleTime: 60_000,
  });

  const { data: chatThreads, isLoading: loadingChats } = useQuery({
    queryKey: generateQueryKey.adminMetricChatThreads(),
    queryFn: async () =>
      adminActions.adminMetricCountChatThreads().then((r) => {
        if (!r.ok) throw r;
        const c = r.data?.count;
        return typeof c === "number" && Number.isFinite(c) ? c : null;
      }),
    staleTime: 60_000,
  });

  const { data: signupBounds, isLoading: loadingBounds } = useQuery({
    queryKey: generateQueryKey.adminUserSignupBounds(),
    queryFn: async () =>
      adminActions.adminMetricUserSignupBounds().then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    staleTime: 60_000,
  });

  const signupDays = 30;
  const { data: signupsTs = [], isLoading: loadingSignups } = useQuery({
    queryKey: generateQueryKey.adminTsSignups(signupDays),
    queryFn: async () =>
      adminActions.adminTsSignups({ days: signupDays }).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    staleTime: 60_000,
  });

  const { data: teamsByPlan = [], isLoading: loadingPlans } = useQuery({
    queryKey: generateQueryKey.adminTeamsByPlan(),
    queryFn: async () =>
      adminActions.adminMetricTeamsByPlan().then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    staleTime: 60_000,
  });

  const signupsLastDays = signupsTs.reduce((acc, row) => {
    const n = Number(row.new_users);
    return acc + (Number.isFinite(n) ? n : 0);
  }, 0);

  const statCards = [
    { key: "users", title: "Users", value: userCount, loading: loadingUsers },
    { key: "teams-active", title: "Active teams", value: teamsActive, loading: loadingTeams },
    {
      key: "projects-active",
      title: "Active projects",
      value: projectsActive,
      loading: loadingProjects,
    },
    { key: "analysis-nodes", title: "Analysis nodes", value: analysisNodes, loading: loadingNodes },
    { key: "chat-threads", title: "Chat threads", value: chatThreads, loading: loadingChats },
    {
      key: "signups-window",
      title: `New signups (${signupDays}d)`,
      value: loadingSignups ? null : signupsLastDays,
      loading: loadingSignups,
    },
  ] as const;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-foreground/70">
          Aggregate metrics from the admin API. Data refreshes when you revisit or refocus.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map(({ key, title, value, loading }) => (
          <StatCard key={key} title={title} value={value} loading={loading} />
        ))}
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Signup window</CardTitle>
            <CardDescription className="text-foreground/70">
              Earliest and latest user timestamps in the system.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            {loadingBounds ? (
              <Skeleton className="h-10 w-full" />
            ) : signupBounds ? (
              <dl className="space-y-2">
                <div className="flex justify-between gap-4">
                  <dt className="text-foreground/70">Earliest</dt>
                  <dd className="font-medium tabular-nums">
                    {signupBounds.earliest ? formatDate(signupBounds.earliest) : "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-foreground/70">Latest</dt>
                  <dd className="font-medium tabular-nums">
                    {signupBounds.latest ? formatDate(signupBounds.latest) : "—"}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-foreground/70">No data</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Teams by plan</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingPlans ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Teams</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamsByPlan.map((row, index) => (
                  <TableRow key={`${row.plan_status}-${index}`}>
                    <TableCell className="font-medium">{row.plan_status}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.team_count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily signups</CardTitle>
          <CardDescription className="text-foreground/70">Last {signupDays} days</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingSignups ? (
            <Skeleton className="h-40 w-full" />
          ) : signupsTs.length === 0 ? (
            <p className="text-sm text-foreground/70">No rows</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">New users</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {signupsTs.map((row, index) => (
                  <TableRow key={`${row.date}-${index}`}>
                    <TableCell className="tabular-nums text-foreground/70">{row.date}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatStatDisplay(Number(row.new_users))}
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
