"use client";

import { bevorAction } from "@/actions";
import TeamsDropdown from "@/components/Dropdown/teams";
import CreateTeamModal from "@/components/Modal/create-team";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { HrefProps } from "@/utils/types";
import { useQuery } from "@tanstack/react-query";
import { ChevronsUpDown } from "lucide-react";
import { useParams } from "next/navigation";
import React, { useMemo } from "react";

export const TeamNavigation: React.FC<{
  isUserPage: boolean;
  userId: string;
}> = ({ isUserPage, userId }) => {
  const params = useParams<HrefProps>();

  const { data: teams } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => bevorAction.getTeams(),
  });

  const team = useMemo(() => {
    if (!teams || !params.teamSlug) return;
    return teams.find((team) => team.slug === params.teamSlug);
  }, [teams, params.teamSlug]);

  return (
    <Dialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton size="lg">
            <div className="flex flex-row gap-2 items-center">
              {isUserPage && (
                <Icon
                  size="md"
                  seed={userId}
                  className="rounded-lg group-data-[collapsible=icon]:ml-[1px]"
                />
              )}
              {!isUserPage && (
                <Icon
                  size="md"
                  seed={team?.id}
                  className="rounded-lg group-data-[collapsible=icon]:ml-[1px]"
                />
              )}
              <div>
                <span className="block uppercase text-muted-foreground text-xs">
                  {isUserPage ? "my account" : "team"}
                </span>
                {!isUserPage &&
                  (team?.name ? (
                    <span className="block">{team.name}</span>
                  ) : (
                    <Skeleton className="h-4 w-24" />
                  ))}
              </div>
            </div>
            <ChevronsUpDown className="size-5! text-muted-foreground ml-auto" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="right">
          <TeamsDropdown teams={teams ?? []} />
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent>
        <CreateTeamModal />
      </DialogContent>
    </Dialog>
  );
};
