"use client";

import { authActions } from "@/actions/bevor";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { TeamSchemaI } from "@/utils/types";
// Removed Privy wallet dependency
import { ExternalLink, LayoutDashboardIcon, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import React from "react";

export const Profile: React.FC<{ userId: string; teams: TeamSchemaI[] }> = ({ userId, teams }) => {
  const defaultTeam = teams.find((team) => team.is_default);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Icon size="md" seed={userId} className="hover:opacity-80 transition-opacity" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link
              href={`/${defaultTeam?.slug}`}
              className="w-full flex items-center justify-between"
            >
              <span>Dashboard</span>
              <LayoutDashboardIcon className="size-4" />
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/user" className="w-full flex items-center justify-between">
              <span>Settings</span>
              <Settings className="size-4" />
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="https://bevor.io" className="w-full flex items-center justify-between">
              <span>Home Page</span>
              <ExternalLink className="size-4" />
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="https://docs.bevor.io" className="w-full flex items-center justify-between">
              <span>Docs</span>
              <ExternalLink className="size-4" />
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={async (): Promise<void> => {
              await authActions.logout();
            }}
            className="justify-between"
          >
            <span className="text-destructive">Logout</span>
            <LogOut className="size-4 text-destructive" />
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
