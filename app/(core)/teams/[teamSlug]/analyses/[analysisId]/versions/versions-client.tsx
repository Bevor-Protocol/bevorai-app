"use client";

import { analysisActions } from "@/actions/bevor";
import { Pagination } from "@/components/pagination";
import { Badge } from "@/components/ui/badge";
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
import { generateQueryKey } from "@/utils/constants";
import { formatDateLong } from "@/utils/helpers";
import { AnalysisVersionPaginationI } from "@/utils/types";
import { DropdownMenu } from "@radix-ui/react-dropdown-menu";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BotMessageSquare,
  Eye,
  GitBranch,
  GitMerge,
  MoreHorizontal,
  PencilRuler,
  Play,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";

const getTriggerIcon = (
  trigger: "manual_run" | "chat" | "manual_edit" | "fork" | "merge",
): React.ReactElement => {
  switch (trigger) {
    case "manual_run":
      return <Play />;
    case "fork":
      return <GitBranch />;
    case "chat":
      return <BotMessageSquare />;
    case "manual_edit":
      return <PencilRuler />;
    case "merge":
      return <GitMerge />;
  }
};

const getTriggerCopy = (
  trigger: "manual_run" | "chat" | "manual_edit" | "fork" | "merge",
): string => {
  switch (trigger) {
    case "manual_run":
      return "manual run";
    case "fork":
      return "fork";
    case "chat":
      return "chat";
    case "manual_edit":
      return "edit";
    case "merge":
      return "merge";
  }
};

const AnalysisVersionsData: React.FC<{
  query: { [key: string]: string | undefined };
  teamSlug: string;
}> = ({ query, teamSlug }) => {
  const [filters, setFilters] = useState(query);

  const versionsQuery = useQuery({
    queryKey: generateQueryKey.analysisVersions(teamSlug, filters),
    queryFn: () => analysisActions.getAnalysisVersions(teamSlug, filters),
  });

  return (
    <div className="grow flex flex-col">
      <AnalysisVersionsDisplay data={versionsQuery.data} teamSlug={teamSlug} />
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
  teamSlug: string;
  data?: AnalysisVersionPaginationI;
}> = ({ teamSlug, data }) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const forkSecurityMutation = useMutation({
    mutationFn: async (analysisVersionId: string) =>
      analysisActions.forkAnalysis(teamSlug, analysisVersionId),
    onSuccess: ({ id, toInvalidate }) => {
      toast.success("Version was forked", {
        description: "A new analysis was created for you",
        action: {
          label: "View",
          onClick: () => router.push(`/teams/${teamSlug}/analyses/${id}`),
        },
        icon: <GitBranch className="size-4" />,
      });
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
    },
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Version</TableHead>
          <TableHead>Active</TableHead>
          <TableHead># Functions in Scope</TableHead>
          <TableHead># Findings</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Created</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody
        aria-disabled={forkSecurityMutation.isPending}
        className={cn(forkSecurityMutation.isPending && "opacity-75 pointer-events-none")}
      >
        {data?.results.map((version) => (
          <TableRow key={version.id}>
            <TableCell className="font-medium">{version.name}</TableCell>
            <TableCell>
              {version.is_active ? (
                <Badge variant="green">active</Badge>
              ) : (
                <Badge variant="outline">inactive</Badge>
              )}
            </TableCell>
            <TableCell>{version.version.n_scopes}</TableCell>
            <TableCell>{version.version.n_findings}</TableCell>
            <TableCell>
              <div className="[&>svg]:size-4 flex gap-2 items-center">
                {getTriggerIcon(version.trigger)}
                {getTriggerCopy(version.trigger)}
              </div>
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
                    <Link href={`/teams/${teamSlug}/analysis-versions/${version.id}`}>
                      <Eye />
                      View
                    </Link>
                  </DropdownMenuItem>
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
