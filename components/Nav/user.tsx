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
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { trimAddress } from "@/utils/helpers";
import { navigation } from "@/utils/navigation";
import { UserDetailedSchemaI } from "@/utils/types";
import { useMutation } from "@tanstack/react-query";
import { ChevronsUpDown, ExternalLink, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import React from "react";

export const UserNavigation: React.FC<{
  user: UserDetailedSchemaI | null | undefined;
}> = ({ user }) => {
  const logoutMutation = useMutation({
    mutationFn: async () => authActions.logout(),
  });

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg">
              <div className="flex gap-2 items-center">
                <Icon
                  size="md"
                  shape="block"
                  seed={user?.id}
                  className="group-data-[collapsible=icon]:ml-[3px] shrink-0"
                />
                <div>
                  <span className="block">{user?.username}</span>
                  <span className="block text-muted-foreground text-xs truncate">
                    {user?.email ?? trimAddress(user?.wallet) ?? ""}
                  </span>
                </div>
              </div>
              <ChevronsUpDown className="size-5! text-muted-foreground ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right" className="w-56">
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link
                  href={navigation.user.settings({})}
                  className="w-full flex items-center justify-between"
                >
                  <span>Settings</span>

                  <Settings className="size-4" />
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link
                  href="https://docs.bevor.io"
                  className="w-full flex items-center justify-between"
                >
                  <span>Docs</span>
                  <ExternalLink className="size-4" />
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => logoutMutation.mutate()}>
                <span className="text-destructive">Logout</span>
                <LogOut className="size-4 text-destructive" />
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};
