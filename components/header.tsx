"use client";

import { bevorAction } from "@/actions";
import ViewInviteModal from "@/components/Modal/view-invite";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
import { navigation } from "@/utils/navigation";
import { MemberInviteSchema, TeamSchemaI } from "@/utils/types";
// Removed Privy wallet dependency
import { DialogTrigger } from "@radix-ui/react-dialog";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Bell, ExternalLink, LayoutDashboardIcon, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export const Web3Network: React.FC = () => {
  // Wallet functionality removed - using Stytch for authentication only
  return <></>;
};

export const Notifications: React.FC = () => {
  const [inviteUse, setInviteUse] = useState<MemberInviteSchema | null>(null);

  const { data: invites } = useSuspenseQuery({
    queryKey: ["user-invites"],
    queryFn: async () => bevorAction.getUserInvites(),
  });

  const hasInvites = (invites?.length ?? 0) > 0;

  return (
    <Dialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <Bell className="h-4" />
            {hasInvites && (
              <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full flex items-center justify-center" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {invites?.map((invite) => (
            <DialogTrigger key={invite.id} asChild>
              <DropdownMenuItem onClick={() => setInviteUse(invite)}>
                <Icon size="sm" seed={invite.team.id} className="text-blue-400 mt-1" />
                <div className="flex-1">
                  <p className="text-sm text-foreground">
                    You&apos;ve been added to a team: {invite.team.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(invite.created_at).toLocaleDateString()}
                  </p>
                </div>
              </DropdownMenuItem>
            </DialogTrigger>
          ))}
          {invites.length === 0 && (
            <DropdownMenuItem disabled className="text-sm text-muted-foreground justify-center">
              No team invites
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {!!inviteUse && (
        <DialogContent>
          <ViewInviteModal invite={inviteUse} />
        </DialogContent>
      )}
    </Dialog>
  );
};

export const Profile: React.FC<{ userId: string; teams: TeamSchemaI[] }> = ({ userId, teams }) => {
  const defaultTeam = teams.find((team) => team.is_default);
  const router = useRouter();

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
              href={navigation.team.overview({ teamId: defaultTeam?.id })}
              className="w-full flex items-center justify-between"
            >
              <span>Dashboard</span>
              <LayoutDashboardIcon className="size-4" />
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href={navigation.user.overview({})}
              className="w-full flex items-center justify-between"
            >
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
            onClick={(): void => {
              router.push("/logout");
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
