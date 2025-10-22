"use client";

import { authActions, userActions } from "@/actions/bevor";
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
import { navigation } from "@/utils/navigation";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import {
  Bell,
  ChevronsUpDown,
  ExternalLink,
  LayoutDashboardIcon,
  LogOut,
  Settings,
} from "lucide-react";
import Link from "next/link";
import React from "react";

export const UserNavigation: React.FC<{
  userId: string;
}> = ({ userId }) => {
  const { data: invites } = useSuspenseQuery({
    queryKey: ["user-invites"],
    queryFn: async () => userActions.getUserInvites(),
  });

  const logoutMutation = useMutation({
    mutationFn: async () => authActions.logout(),
  });

  const hasInvites = (invites?.length ?? 0) == 0;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" asChild>
              <Link href={navigation.user.overview({})}>
                <Icon size="sm" seed={userId} className="group-data-[collapsible=icon]:ml-[3px]" />
                <span>My Account</span>
                {hasInvites && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full flex items-center justify-center" />
                )}
                <ChevronsUpDown className="size-5! text-muted-foreground ml-auto" />
              </Link>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="right" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link
                  href={navigation.user.overview({})}
                  className="w-full flex items-center justify-between"
                >
                  <span>Dashboard</span>
                  <LayoutDashboardIcon className="size-4" />
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={navigation.user.notifications({})}
                  className="w-full flex items-center justify-between relative"
                >
                  <span>Notifications</span>
                  {hasInvites && (
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full flex items-center justify-center" />
                  )}
                  <Bell className="size-4" />
                </Link>
              </DropdownMenuItem>
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
