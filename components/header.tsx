"use client";

import { authAction } from "@/actions";
import Breadcrumbs from "@/components/breadcrumbs";
import Networks from "@/components/Dropdown/networks";
import UserDropdown from "@/components/Dropdown/user";
import { Button } from "@/components/ui/button";
import * as Dropdown from "@/components/ui/dropdown";
import { Icon } from "@/components/ui/icon";
import * as Tooltip from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getNetworkImage } from "@/utils/helpers";
import { InitialUserObject, TeamSchemaI } from "@/utils/types";
import { useLogin, usePrivy, useWallets } from "@privy-io/react-auth";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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

const Header: React.FC<{ userObject: InitialUserObject }> = ({ userObject }) => {
  const { authenticated, ready } = usePrivy();
  const router = useRouter();
  const { login } = useLogin({
    onComplete: async (params) => {
      await authAction.login(params.user.id);
      router.refresh();
    },
  });

  const isAuthenticated = (userObject.isAuthenticated && !ready) || authenticated;
  return (
    <header
      className={cn(
        "bg-neutral-950 sticky top-0 z-50 backdrop-blur-sm",
        "px-6 flex items-center justify-between h-16",
      )}
    >
      <div className="flex items-center gap-6">
        <div className="aspect-423/564 relative h-[30px]">
          <Image src="/logo-small.png" alt="BevorAI logo" fill priority />
        </div>
        {isAuthenticated && <Breadcrumbs userObject={userObject} />}
      </div>
      <div className="gap-2 items-center relative flex">
        {isAuthenticated ? (
          <Profile teams={userObject.teams} userId={userObject.userId} />
        ) : (
          <Button onClick={login} variant="bright" disabled={!ready}>
            sign in
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
