"use client";

import { dashboardActions } from "@/actions/bevor";
import { Pointer } from "@/assets/icons";
import LucideIcon from "@/components/lucide-icon";
import { UserNavigation } from "@/components/Nav/user";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useSSE } from "@/hooks/useSSE";
import { useLocalStorageState } from "@/providers/localStore";
import { generateQueryKey } from "@/utils/constants";
import { navigation } from "@/utils/navigation";
import { HrefProps } from "@/utils/types";
import { DropdownMenu, DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { Code, DollarSign, File, Files, Inbox, MoreHorizontal, Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

const StarredSidebarItems: React.FC = () => {
  const { state: starredItems } = useLocalStorageState("bevor:starred");

  return (
    <Collapsible className="group/favorites">
      <SidebarGroup>
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger asChild>
            <SidebarGroupLabel>
              Favorites
              <Pointer className="ml-2 transition-transform will-change-transform group-data-[state=open]/favorites:rotate-90" />
            </SidebarGroupLabel>
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {starredItems?.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton asChild tooltip={item.label}>
                    <Link href={item.url}>
                      <LucideIcon assetType={item.type} />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
};

const AppSidebar: React.FC = () => {
  const pathname = usePathname();
  const params = useParams<HrefProps>();
  const isMobile = useIsMobile();
  const [openTeams, setOpenTeams] = useState<Record<string, boolean>>({});

  const { data: teams = [] } = useQuery({
    queryKey: generateQueryKey.teams(),
    queryFn: async () => dashboardActions.getTeams(),
  });

  const { data: invites = [], refetch } = useQuery({
    queryKey: generateQueryKey.userInvites(),
    queryFn: async () => dashboardActions.getInvites(),
  });

  const { data: user } = useQuery({
    queryKey: generateQueryKey.currentUser(),
    queryFn: () => dashboardActions.getUser(),
  });

  useSSE({
    url: "/user",
    autoConnect: true,
    eventTypes: ["invites"],
    onMessage: (message) => {
      console.log(message);
      refetch();
    },
    onOpen: () => console.log("OPEN"),
  });

  // Auto-open team when URL matches
  useEffect(() => {
    if (params.teamSlug) {
      setOpenTeams((prev) => ({
        ...prev,
        [params.teamSlug as string]: true,
      }));
    }
  }, [params.teamSlug]);

  const handleTeamToggle = (teamSlug: string): void => {
    setOpenTeams((prev) => ({
      ...prev,
      [teamSlug]: !prev[teamSlug],
    }));
  };

  return (
    <Sidebar
      collapsible={isMobile ? "offcanvas" : "none"}
      className="[&_svg]:text-muted-foreground"
    >
      <SidebarHeader className="[&_svg]:text-muted-foreground py-4">
        <UserNavigation user={user} />
      </SidebarHeader>
      <SidebarContent className="[&_svg]:text-muted-foreground">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === navigation.teams.overview({})}
                  tooltip="Teams"
                >
                  <Link href={navigation.teams.overview({})}>
                    <LucideIcon assetType="team" />
                    <span>Teams</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === navigation.projects.overview({})}
                  tooltip="Projects"
                >
                  <Link href={navigation.projects.overview({})}>
                    <LucideIcon assetType="project" />
                    <span>Projects</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === navigation.user.notifications({})}
                  tooltip="Inbox"
                >
                  <Link href={navigation.user.notifications({})}>
                    <Inbox />
                    <span>Inbox</span>
                    <Badge variant="green" className="ml-auto" size="sm">
                      {invites.length}
                    </Badge>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <Collapsible className="group/teams" defaultOpen>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel>
                Your Teams
                <Pointer className="ml-2 transition-transform will-change-transform group-data-[state=open]/teams:rotate-90" />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {teams.map((team) => (
                    <Collapsible
                      key={team.id}
                      className="group/collapsible-team"
                      open={openTeams[team.id] || false}
                      onOpenChange={() => handleTeamToggle(team.id)}
                    >
                      <SidebarMenuItem>
                        <DropdownMenu>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton tooltip={team.name}>
                              <Icon seed={team.id} size="sm" />
                              <span className="truncate">{team.name}</span>
                              <Pointer className="ml-2 transition-transform will-change-transform group-data-[state=open]/collapsible-team:rotate-90" />
                              <DropdownMenuTrigger asChild>
                                <MoreHorizontal className="ml-auto text-muted-foreground/50! hover:text-muted-foreground! transition-colors" />
                              </DropdownMenuTrigger>
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <DropdownMenuContent align="start" side="right" className="w-56">
                            <DropdownMenuLabel>Settings</DropdownMenuLabel>
                            <DropdownMenuGroup>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={navigation.team.settings.overview({ teamSlug: team.id })}
                                  className="w-full flex relative"
                                >
                                  <Settings />
                                  <span>Team Settings</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={navigation.team.settings.api({ teamSlug: team.id })}
                                  className="w-full flex relative"
                                >
                                  <Code />
                                  <span>API</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={navigation.team.settings.billing({ teamSlug: team.id })}
                                  className="w-full flex relative"
                                >
                                  <DollarSign />
                                  <span>Billing</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={navigation.team.settings.plans({ teamSlug: team.id })}
                                  className="w-full flex relative"
                                >
                                  <Files />
                                  <span>Plans</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={navigation.team.settings.invoices({ teamSlug: team.id })}
                                  className="w-full flex relative"
                                >
                                  <File />
                                  <span>Invoices</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={navigation.team.settings.members({ teamSlug: team.id })}
                                  className="w-full flex relative"
                                >
                                  <LucideIcon assetType="member" />
                                  <span>Members</span>
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            <SidebarMenuSubItem>
                              <SidebarMenuButton
                                asChild
                                isActive={
                                  pathname === navigation.team.projects({ teamSlug: team.id })
                                }
                                tooltip="Projects"
                              >
                                <Link href={navigation.team.projects({ teamSlug: team.id })}>
                                  <LucideIcon assetType="project" />
                                  <span>Projects</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuButton
                                asChild
                                isActive={
                                  pathname === navigation.team.analyses({ teamSlug: team.id })
                                }
                                tooltip="Analysis Threads"
                              >
                                <Link href={navigation.team.analyses({ teamSlug: team.id })}>
                                  <LucideIcon assetType="analysis" />
                                  <span>Analysis Threads</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuButton
                                asChild
                                isActive={pathname === navigation.team.chats({ teamSlug: team.id })}
                                tooltip="Chats"
                              >
                                <Link href={navigation.team.chats({ teamSlug: team.id })}>
                                  <LucideIcon assetType="chat" />
                                  <span>Chats</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuSubItem>
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
        <SidebarGroup>
          <StarredSidebarItems />
        </SidebarGroup>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="[&_svg]:text-muted-foreground">
        <div className="h-8 relative">
          <Image
            src="/logo.png"
            alt="company logo"
            width={611}
            height={133}
            className="h-full w-auto object-contain"
            priority
          />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
