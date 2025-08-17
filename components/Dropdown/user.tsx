"use client";

import { authAction } from "@/actions";
import { cn } from "@/lib/utils";
import { navigation } from "@/utils/navigation";
import { TeamSchemaI } from "@/utils/types";
import { useLogout } from "@privy-io/react-auth";
import { LayoutDashboardIcon, LogOut, Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

type Props = { teams: TeamSchemaI[]; close?: () => void };

const UserDropdown: React.FC<Props> = ({ teams, close }) => {
  const defaultTeam = teams.find((team) => team.is_default);
  const router = useRouter();
  const { logout } = useLogout({
    onSuccess: async () => {
      await authAction.logout();
      router.refresh();
    },
  });

  return (
    <div className="min-w-56 py-2 bg-black shadow-sm rounded-lg border border-white">
      {/* Header */}
      <div className="px-3 py-2 border-b border-neutral-800">
        <p className="text-sm font-medium text-neutral-100">Account</p>
      </div>

      {/* Menu Items */}
      <div className="py-1">
        <Link
          href={navigation.team.overview({ teamSlug: defaultTeam?.slug })}
          className="w-full"
          onClick={close}
        >
          <div
            className={cn(
              "flex items-center px-3 py-2 w-full gap-3 text-sm text-neutral-300",
              "hover:bg-neutral-800 hover:text-neutral-100 transition-colors cursor-pointer",
            )}
          >
            <LayoutDashboardIcon className="w-4 h-4" />
            <span>Dashboard</span>
          </div>
        </Link>

        <Link href="/user" className="w-full" onClick={close}>
          <div
            className={cn(
              "flex items-center px-3 py-2 w-full gap-3 text-sm text-neutral-300",
              "hover:bg-neutral-800 hover:text-neutral-100 transition-colors cursor-pointer",
            )}
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </div>
        </Link>

        <Link href="https://bevor.io" className="w-full" onClick={close} target="_blank">
          <div
            className={cn(
              "flex items-center px-3 py-2 w-full gap-3 text-sm text-neutral-300",
              "hover:bg-neutral-800 hover:text-neutral-100 transition-colors cursor-pointer",
            )}
          >
            <div className="relative w-4 h-4">
              <Image src="/logo-small.png" alt="BevorAI logo" fill priority />
            </div>
            <span>Home Page</span>
          </div>
        </Link>

        <div
          onClick={(): void => {
            close?.();
            logout();
          }}
          className={cn(
            "flex items-center px-3 py-2 w-full gap-3 text-sm text-neutral-300",
            "hover:bg-neutral-800 hover:text-neutral-100 transition-colors cursor-pointer",
          )}
        >
          <LogOut className="w-4 h-4" />
          <span>Disconnect</span>
        </div>
      </div>
    </div>
  );
};

export default UserDropdown;
