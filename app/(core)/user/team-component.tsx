"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/helpers";
import { navigation } from "@/utils/navigation";
import { TeamSchemaI } from "@/utils/types";
import { Ellipsis } from "lucide-react";
import Link from "next/link";

const TeamDisplay: React.FC<{ team: TeamSchemaI }> = ({ team }) => {
  return (
    <div
      className={cn(
        "flex items-center justify-between",
        "p-2 border-b border-border last:border-b-0 rounded-md",
      )}
    >
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-3">
          <Icon size="sm" seed={team.id} className="size-4" />
          <span className="font-medium">{team.name}</span>
        </div>
        <p className="text-sm text-muted-foreground">{formatDate(team.created_at)}</p>
      </div>
      <div className="flex items-center space-x-2">
        <span
          className={`px-2 py-1 text-xs rounded ${
            team.role === "owner"
              ? "bg-purple-500/20 text-purple-400"
              : "bg-blue-500/20 text-blue-400"
          }`}
        >
          {team.role}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <div className="p-3 text-muted-foreground">
              <Ellipsis />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start">
            <DropdownMenuItem asChild>
              <Link href={navigation.team.overview({ teamSlug: team.slug })}>View</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={navigation.team.settings.overview({ teamSlug: team.slug })}>Manage</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default TeamDisplay;
