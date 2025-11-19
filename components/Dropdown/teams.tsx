"use client";

import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { SearchInput } from "@/components/ui/input";
import { navigation } from "@/utils/navigation";
import { HrefProps, TeamSchemaI } from "@/utils/types";
import { Check, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

interface TeamsDropdownProps {
  teams: TeamSchemaI[];
}

const TeamsDropdown: React.FC<TeamsDropdownProps> = ({ teams }) => {
  const pathname = usePathname();
  const params = useParams<HrefProps>();
  const [teamsShow, setTeamsShow] = useState(teams);
  const [teamFilter, setTeamFilter] = useState("");

  const team = useMemo(() => {
    if (!teams || !params.teamSlug) return;
    return teams.find((team) => team.id === params.teamSlug);
  }, [teams, params.teamSlug]);

  useEffect(() => {
    if (!teamFilter) {
      setTeamsShow(teams);
      return;
    }
    const filteredTeams = teams.filter((team) =>
      team.name.toLowerCase().includes(teamFilter.toLowerCase()),
    );
    setTeamsShow(filteredTeams);
  }, [teams, teamFilter]);

  const newRoute = (teamItem: TeamSchemaI): string => {
    if (!params.teamSlug || params.analysisId || params.chatId || params.codeId) {
      return navigation.team.overview({ teamSlug: teamItem.id });
    }
    return pathname.replace(params.teamSlug, teamItem.id);
  };

  return (
    <div className="w-56">
      <SearchInput
        placeholder="Find Team..."
        value={teamFilter}
        onChange={(e) => setTeamFilter(e.currentTarget.value)}
        className="text-sm border-0 rounded-none focus-visible:border-input focus-visible:ring-transparent focus-visible:ring-0"
      />
      <div className="p-2">
        <div className="max-h-36 overflow-scroll">
          {teamsShow.map((teamItem) => (
            <DropdownMenuItem key={teamItem.id} asChild>
              <Link href={newRoute(teamItem)}>
                <div className="flex items-center gap-3 w-full">
                  <Icon size="sm" seed={teamItem.id} className="size-4 flex-shrink-0" />
                  <span className="truncate text-ellipsis flex-1">{teamItem.name}</span>
                </div>
                {team?.id === teamItem.id && <Check className="size-3" />}
              </Link>
            </DropdownMenuItem>
          ))}
        </div>
        {!teamFilter && (
          <DialogTrigger asChild>
            <Button variant="ghost" className="w-full flex justify-start gap-3 px-2 py-1.5">
              <div className="size-icon-sm flex items-center justify-center">
                <PlusCircle className="size-4 text-blue-400" />
              </div>

              <span className="font-medium">Create Team</span>
            </Button>
          </DialogTrigger>
        )}
      </div>
    </div>
  );
};

export default TeamsDropdown;
