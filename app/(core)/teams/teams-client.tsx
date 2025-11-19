"use client";

import { dashboardActions } from "@/actions/bevor";
import CreateTeamModal from "@/components/Modal/create-team";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { generateQueryKey } from "@/utils/constants";
import { navigation } from "@/utils/navigation";
import { MemberRoleEnum, TeamOverviewSchemaI } from "@/utils/types";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export const TeamsCount: React.FC = () => {
  const { data: teams = [], isLoading } = useQuery({
    queryKey: generateQueryKey.teams(),
    queryFn: () => dashboardActions.getTeamsOverview(),
  });

  if (isLoading) {
    return <Skeleton className="h-7 w-6" />;
  }

  return (
    <Badge variant="outline" size="round">
      {teams.length}
    </Badge>
  );
};

export const TeamCreate: React.FC = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="text-foreground">
          <Plus className="size-4 mr-2" />
          Create Team
        </Button>
      </DialogTrigger>
      <DialogContent>
        <CreateTeamModal />
      </DialogContent>
    </Dialog>
  );
};

export const TeamsTable: React.FC = () => {
  const router = useRouter();
  const { data: teams = [], isLoading } = useQuery({
    queryKey: generateQueryKey.teamsOverview(),
    queryFn: () => dashboardActions.getTeamsOverview(),
  });

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getCreatedByUser = (team: TeamOverviewSchemaI): string => {
    return team.users.find((user) => user.id === team.created_by_user.id)?.username || "Unknown";
  };

  return (
    <ScrollArea className="w-full pb-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-icon-sm" />
            <TableHead className="w-[50%]">Name</TableHead>
            <TableHead className="w-[15%]">Role</TableHead>
            <TableHead className="w-[10%]">Created By</TableHead>
            <TableHead className="w-[10%]">Members</TableHead>
            <TableHead className="w-[10%]">Created At</TableHead>
            <TableHead className="w-[10%]">Projects</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading &&
            [0, 1, 2].map((ind) => (
              <TableRow key={ind}>
                <TableCell>
                  <Skeleton className="size-icon-sm rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8" />
                </TableCell>
              </TableRow>
            ))}
          {teams.map((team) => (
            <TableRow
              key={team.id}
              onClick={() => router.push(navigation.team.overview({ teamSlug: team.slug }))}
            >
              <TableCell>
                <Icon size="sm" seed={team.id} />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">{team.name}</div>
              </TableCell>
              <TableCell>
                <Badge variant={team.role === MemberRoleEnum.OWNER ? "blue" : "secondary"}>
                  {team.role}
                </Badge>
              </TableCell>
              <TableCell>{getCreatedByUser(team)}</TableCell>
              <TableCell>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex -space-x-2 w-fit">
                      {team.users.slice(0, 3).map((user) => (
                        <Icon size="sm" seed={user.id} key={user.id} />
                      ))}
                      {team.users.length > 3 && (
                        <div className="relative inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted border-2 border-background text-xs text-muted-foreground">
                          +{team.users.length - 3}
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent align="start" side="top">
                    <div className="flex flex-col gap-1 min-w-40">
                      {team.users.map((user) => (
                        <div key={user.id} className="text-muted-foreground flex flex-row gap-2">
                          <Icon size="sm" seed={user.id} key={user.id} />
                          {user.username}
                        </div>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TableCell>
              <TableCell>{formatDate(team.created_at)}</TableCell>
              <TableCell>{team.n_projects}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};
