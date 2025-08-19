"use client";

import Networks from "@/components/Dropdown/networks";
import UserDropdown from "@/components/Dropdown/user";
import * as Dropdown from "@/components/ui/dropdown";
import { Icon } from "@/components/ui/icon";
import * as Tooltip from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getNetworkImage } from "@/utils/helpers";
import { TeamSchemaI } from "@/utils/types";
import { useWallets } from "@privy-io/react-auth";
import { ChevronDown } from "lucide-react";
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

export const Profile: React.FC<{ teams: TeamSchemaI[]; userId?: string }> = ({ teams, userId }) => {
  return (
    <Dropdown.Main
      className="flex flex-row relative cursor-pointer rounded-lg focus-border"
      tabIndex={0}
    >
      <Dropdown.Trigger>
        <div
          className={cn(
            "flex items-center relative cursor-pointer rounded-lg focus-border h-12",
            "hover:bg-slate-700/40 gap-2 text-sm px-2",
          )}
        >
          <Icon size="md" seed={userId} />
        </div>
      </Dropdown.Trigger>
      <Dropdown.Content className="top-full right-0" hasCloseTrigger>
        <UserDropdown teams={teams} />
      </Dropdown.Content>
    </Dropdown.Main>
  );
};
