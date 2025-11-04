"use client";

import { securityAnalysisActions } from "@/actions/bevor";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { QUERY_KEYS } from "@/utils/constants";
import { formatDateLong } from "@/utils/helpers";
import { AnalysisVersionPaginationI } from "@/utils/types";
import { DropdownMenu } from "@radix-ui/react-dropdown-menu";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BotMessageSquare,
  Eye,
  GitBranch,
  MoreHorizontal,
  PencilRuler,
  Pin,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";

const getTriggerIcon = (
  trigger: "manual_run" | "forked" | "chat" | "manual_edit",
): React.ReactElement => {
  switch (trigger) {
    case "manual_run":
      return <User />;
    case "forked":
      return <GitBranch />;
    case "chat":
      return <BotMessageSquare />;
    case "manual_edit":
      return <PencilRuler />;
  }
};

const getTriggerCopy = (trigger: "manual_run" | "forked" | "chat" | "manual_edit"): string => {
  switch (trigger) {
    case "manual_run":
      return "manual run";
    case "forked":
      return "fork";
    case "chat":
      return "chat";
    case "manual_edit":
      return "edit";
  }
};

const AnalysisVersionsData: React.FC<{
  query: { [key: string]: string | undefined };
  teamId: string;
  analysisId: string;
}> = ({ query, teamId, analysisId }) => {
  const [filters, setFilters] = useState(query);

  const versionsQuery = useQuery({
    queryKey: [QUERY_KEYS.SECURITY_VERSIONS, teamId, filters],
    queryFn: () => securityAnalysisActions.getSecurityVersions(teamId, filters),
  });

  return (
    <div className="grow flex flex-col">
      <AnalysisVersionsDisplay data={versionsQuery.data} teamId={teamId} analysisId={analysisId} />
      <Pagination
        filters={filters}
        setFilters={setFilters}
        results={versionsQuery.data ?? { more: false, total_pages: 0 }}
        className="mt-auto"
      />
    </div>
  );
};

const AnalysisVersionsDisplay: React.FC<{
  teamId: string;
  analysisId: string;
  data?: AnalysisVersionPaginationI;
}> = ({ teamId, analysisId, data }) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const updateSecurityHeadMutation = useMutation({
    mutationFn: async (securityVersionId: string) =>
      securityAnalysisActions.updateAnalysisHeads(teamId, analysisId, {
        security_analysis_version_id: securityVersionId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SECURITY_VERSIONS, teamId] });
      toast.success("Pinned", {
        description: "This version was set as your default version",
        icon: <Pin className="size-4" />,
      });
    },
  });

  const forkSecurityMutation = useMutation({
    mutationFn: async (securityVersionId: string) =>
      securityAnalysisActions.forkAnalysis(teamId, securityVersionId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SECURITY_VERSIONS, teamId] });
      toast.success("Version was forked", {
        description: "A new analysis was created for you",
        action: {
          label: "View",
          onClick: () => router.push(`/teams/${teamId}/analyses/${data}`),
        },
        icon: <GitBranch className="size-4" />,
      });
    },
  });

  const isPendingMutation = updateSecurityHeadMutation.isPending || forkSecurityMutation.isPending;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Version</TableHead>
          <TableHead>Is Active</TableHead>
          <TableHead># Functions in Scope</TableHead>
          <TableHead># Findings</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Created</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody
        aria-disabled={isPendingMutation}
        className={cn(isPendingMutation && "opacity-75 pointer-events-none")}
      >
        {data?.results.map((version) => (
          <TableRow key={version.id}>
            <TableCell className="font-medium">{version.version_number}</TableCell>
            <TableCell>{String(version.is_active_version)}</TableCell>
            <TableCell>{version.n_scopes}</TableCell>
            <TableCell>{version.n_findings}</TableCell>
            <TableCell className="[&>svg]:size-4 flex gap-2 items-center">
              {getTriggerIcon(version.trigger)}
              {getTriggerCopy(version.trigger)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDateLong(version.created_at)}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/teams/${teamId}/analysis-versions/${version.id}`}>
                      <Eye />
                      View
                    </Link>
                  </DropdownMenuItem>
                  {version.is_owner && !version.is_active_version && (
                    <DropdownMenuItem onClick={() => updateSecurityHeadMutation.mutate(version.id)}>
                      <Pin />
                      Set as Current Version
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => forkSecurityMutation.mutate(version.id)}>
                    <GitBranch />
                    Fork
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default AnalysisVersionsData;
