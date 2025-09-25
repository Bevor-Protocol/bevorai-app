"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
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
        "p-2 border-b border-neutral-800 last:border-b-0 rounded-md",
      )}
    >
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-3">
          <Icon size="sm" seed={team.id} className="size-4" />
          <span className="font-medium">{team.name}</span>
        </div>
        <p className="text-sm text-neutral-400">{formatDate(team.created_at)}</p>
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
            <div className="p-3 text-neutral-400">
              <Ellipsis />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="top-full right-0">
            <div className="p-2 bg-black shadow-sm rounded-lg border border-neutral-800">
              <Link
                href={navigation.team.overview({ teamSlug: team.slug })}
                className="rounded-md block px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100 transition-colors"
              >
                View
              </Link>
              <Link
                href={navigation.team.settings.overview({ teamSlug: team.slug })}
                className="rounded-md block px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100 transition-colors"
              >
                Manage
              </Link>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default TeamDisplay;
