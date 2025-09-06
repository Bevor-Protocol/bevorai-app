"use client";

import { bevorAction } from "@/actions";
import Networks from "@/components/Dropdown/networks";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getNetworkImage } from "@/utils/helpers";
import { navigation } from "@/utils/navigation";
import { MemberInviteSchema, TeamSchemaI } from "@/utils/types";
import { useWallets } from "@privy-io/react-auth";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  Bell,
  ChevronDown,
  ExternalLink,
  LayoutDashboardIcon,
  LogOut,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export const Web3Network: React.FC = () => {
  const { wallets, ready } = useWallets();
  if (!ready || !wallets.length) {
    return <></>;
  }

  const wallet = wallets[0];
  const { supported, networkImg } = getNetworkImage(wallet.chainId);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Tooltip>
          <TooltipTrigger>
            <div
              className={cn(
                "flex justify-center items-center gap-2 px-2",
                "h-12 rounded-lg hover:bg-slate-700/40",
              )}
            >
              <Icon
                size="sm"
                image={networkImg}
                className={cn(
                  !supported && "bg-auto!",
                  // for localhost for now.
                  supported && networkImg.includes("unknown") && "bg-auto!",
                )}
              />
              <ChevronDown />
            </div>
          </TooltipTrigger>
          <TooltipContent side="left" align="start">
            <div className="bg-black shadow-sm rounded-lg cursor-default min-w-40">
              <div className="px-2 py-1">This is an unsupported network</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="top-full right-0">
        <Networks />
      </DropdownMenuContent>
    </DropdownMenu>
  );
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
                  <p className="text-sm text-neutral-100">
                    You&apos;ve been added to a team: {invite.team.name}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {new Date(invite.created_at).toLocaleDateString()}
                  </p>
                </div>
              </DropdownMenuItem>
            </DialogTrigger>
          ))}
          {invites.length === 0 && (
            <DropdownMenuItem disabled className="text-sm text-neutral-400 justify-center">
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
              href={navigation.team.overview({ teamSlug: defaultTeam?.slug })}
              className="w-full flex items-center justify-between"
            >
              <span>Dashboard</span>
              <LayoutDashboardIcon className="w-4 h-4" />
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
