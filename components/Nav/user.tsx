"use client";

import { authActions, dashboardActions } from "@/actions/bevor";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { QUERY_KEYS } from "@/utils/constants";
import { navigation } from "@/utils/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronsUpDown, ExternalLink, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import React from "react";

export const UserNavigation: React.FC<{
  userId: string;
}> = ({ userId }) => {
  const { data: user } = useQuery({
    queryKey: [QUERY_KEYS.USERS],
    queryFn: () => dashboardActions.getUser(),
  });

  const logoutMutation = useMutation({
    mutationFn: async () => authActions.logout(),
  });

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg">
              <Icon
                size="md"
                shape="block"
                seed={userId}
                className="group-data-[collapsible=icon]:ml-[3px]"
              />
              <span>{user?.username}</span>
              <ChevronsUpDown className="size-5! text-muted-foreground ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right" className="w-56">
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
            <DropdownMenuSeparator />
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
