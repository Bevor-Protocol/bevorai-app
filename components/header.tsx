"use client";

import Networks from "@/components/Dropdown/networks";
import UserDropdown from "@/components/Dropdown/user";
import ViewInviteModal from "@/components/Modal/view-invite";
import * as Dropdown from "@/components/ui/dropdown";
import { Icon, Social } from "@/components/ui/icon";
import * as Tooltip from "@/components/ui/tooltip";
import { useModal } from "@/hooks/useContexts";
import { cn } from "@/lib/utils";
import { getNetworkImage } from "@/utils/helpers";
import { MemberInviteSchema, TeamSchemaI } from "@/utils/types";
import { useWallets } from "@privy-io/react-auth";
import { Bell, ChevronDown } from "lucide-react";
import React from "react";

export const Web3Network: React.FC = () => {
  const { wallets, ready } = useWallets();
  if (!ready || !wallets.length) {
    return <></>;
  }

  const wallet = wallets[0];
  const { supported, networkImg } = getNetworkImage(wallet.chainId);
  return (
    <Dropdown.Main
      className="flex flex-row relative cursor-pointer rounded-lg focus-border"
      tabIndex={0}
    >
      <Dropdown.Trigger>
        <Tooltip.Reference shouldShow={false}>
          <Tooltip.Trigger>
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
          </Tooltip.Trigger>
          <Tooltip.Content side="left" align="start">
            <div className="bg-black shadow-sm rounded-lg cursor-default min-w-40">
              <div className="px-2 py-1">This is an unsupported network</div>
            </div>
          </Tooltip.Content>
        </Tooltip.Reference>
      </Dropdown.Trigger>
      <Dropdown.Content className="top-full right-0" hasCloseTrigger>
        <Networks />
      </Dropdown.Content>
    </Dropdown.Main>
  );
};

export const Notifications: React.FC<{ invites: MemberInviteSchema[] }> = ({ invites }) => {
  const { show, hide } = useModal();
  const hasInvites = invites.length > 0;

  const handleView = (invite: MemberInviteSchema): void => {
    show(<ViewInviteModal invite={invite} onClose={hide} />);
  };

  return (
    <Dropdown.Main
      className="flex flex-row relative cursor-pointer rounded-lg focus-border"
      tabIndex={0}
    >
      <Dropdown.Trigger>
        <Social
          size="md"
          className={cn(
            "relative flex border border-neutral-800",
            "cursor-pointer hover:opacity-80 transition-opacity",
          )}
        >
          <Bell className="h-4" />
          {hasInvites && (
            <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full flex items-center justify-center" />
          )}
        </Social>
      </Dropdown.Trigger>
      <Dropdown.Content className="top-full right-0">
        <div className="w-[400px] bg-black shadow-sm rounded-lg border border-neutral-400 overflow-hidden">
          {hasInvites ? (
            <div className="space-y-1 divide-y divide-neutral-800">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  onClick={() => handleView(invite)}
                  className={cn(
                    "cursor-pointer",
                    "px-3 py-2 hover:bg-neutral-800 transition-colors flex items-start gap-3",
                  )}
                >
                  <Icon size="sm" seed={invite.team.id} className="text-blue-400 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-neutral-100">
                      You&apos;ve been added to a team: {invite.team.name}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {new Date(invite.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-3 py-4 text-center">
              <p className="text-sm text-neutral-400">No team invites</p>
            </div>
          )}
        </div>
      </Dropdown.Content>
    </Dropdown.Main>
  );
};

export const Profile: React.FC<{ teams: TeamSchemaI[]; userId?: string }> = ({ teams, userId }) => {
  return (
    <Dropdown.Main
      className="flex flex-row relative cursor-pointer rounded-lg focus-border"
      tabIndex={0}
    >
      <Dropdown.Trigger>
        <Icon size="md" seed={userId} className="hover:opacity-80 transition-opacity" />
      </Dropdown.Trigger>
      <Dropdown.Content className="top-full right-0" hasCloseTrigger>
        <UserDropdown teams={teams} />
      </Dropdown.Content>
    </Dropdown.Main>
  );
};
