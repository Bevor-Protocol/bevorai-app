"use client";

import { bevorAction } from "@/actions";
import { TeamNavigation } from "@/components/Nav/team";
import { UserNavigation } from "@/components/Nav/user";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import useLocalStorage, { StarredItem } from "@/hooks/useLocalStorage";
import { navigation } from "@/utils/navigation";
import { HrefProps } from "@/utils/types";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  ChevronDown,
  Code,
  Code2,
  DollarSign,
  FileText,
  Home,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import React from "react";

interface AppSidebarProps {
  userId: string;
}

const TeamSidebarItems: React.FC = () => {
  const pathname = usePathname();
  const params = useParams<HrefProps>();
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Team Navigation</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === navigation.team.overview(params)}
              tooltip="Overview"
              size="lg"
            >
              <Link href={navigation.team.overview(params)}>
                <LayoutDashboard />
                <span>Overview</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === navigation.team.projects(params)}
              tooltip="projects"
              size="lg"
            >
              <Link href={navigation.team.projects(params)}>
                <Code />
                <span>Projects</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <Collapsible className="group/collapsible">
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip="settings" size="lg" asChild>
                  <div>
                    <Settings className="shrink-0 size-4 group-data-[collapsible=icon]:ml-2" />
                    <span className="truncate">Settings</span>
                    <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </div>
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname == navigation.team.settings.overview(params)}
                      tooltip="settings - overview"
                      size="lg"
                    >
                      <Link href={navigation.team.settings.overview(params)}>
                        <Home />
                        <span>Overview</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname == navigation.team.settings.billing(params)}
                      tooltip="settings - billing"
                      size="lg"
                    >
                      <Link href={navigation.team.settings.billing(params)}>
                        <DollarSign />
                        <span>Billing</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname == navigation.team.settings.api(params)}
                      tooltip="settings - api"
                      size="lg"
                    >
                      <Link href={navigation.team.settings.api(params)}>
                        <Code />
                        <span>API</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname == navigation.team.settings.invoices(params)}
                      tooltip="settings - invoices"
                      size="lg"
                    >
                      <Link href={navigation.team.settings.invoices(params)}>
                        <FileText />
                        <span>Invoices</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname == navigation.team.settings.members(params)}
                      tooltip="settings - members"
                      size="lg"
                    >
                      <Link href={navigation.team.settings.members(params)}>
                        <Users />
                        <span>Members</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

const ProjectSidebarItems: React.FC = () => {
  const pathname = usePathname();
  const params = useParams<HrefProps>();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Project Navigation</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === navigation.project.overview(params)}
              tooltip="Overview"
              size="lg"
            >
              <Link href={navigation.project.overview(params)}>
                <LayoutDashboard />
                <span>Overview</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === navigation.project.audits(params)}
              tooltip="audits"
              size="lg"
            >
              <Link href={navigation.project.audits(params)}>
                <Shield />
                <span>Audits</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === navigation.project.versions.overview(params)}
              tooltip="versions"
              size="lg"
            >
              <Link href={navigation.project.versions.overview(params)}>
                <Code2 />
                <span>Versions</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === navigation.project.chats(params)}
              tooltip="chats"
              size="lg"
            >
              <Link href={navigation.project.chats(params)}>
                <MessageSquare />
                <span>Chats</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === navigation.project.settings(params)}
              tooltip="chats"
              size="lg"
            >
              <Link href={navigation.project.settings(params)}>
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

const StarredSidebarItems: React.FC = () => {
  const { getItem } = useLocalStorage();
  const pathname = usePathname();

  const starredItems = getItem("bevor:starred");

  if (!starredItems || starredItems.length === 0) {
    return null;
  }

  const getIcon = (item: StarredItem) => {
    if (item.type === "version") {
      return <Code2 />;
    }
    if (item.type === "audit") {
      return <Shield />;
    }
    if (item.type === "chat") {
      return <MessageSquare />;
    }
    return <Code />;
  };

  return (
    <>
      <SidebarSeparator />
      <Collapsible className="group/collapsible">
        <SidebarGroup>
          <SidebarGroupLabel asChild>
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <span>Favorites</span>
              <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
            </CollapsibleTrigger>
          </SidebarGroupLabel>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu>
                {starredItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url}
                      tooltip={item.label}
                      size="lg"
                    >
                      <Link href={item.url}>
                        {getIcon(item)}
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
    </>
  );
};

const UserNavigationItems: React.FC = () => {
  const pathname = usePathname();

  const invites = useQuery({
    queryKey: ["user-invites"],
    queryFn: async () => bevorAction.getUserInvites(),
  });

  const hasInvites = (invites.data ?? []).length > 0;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>User Navigation</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === navigation.user.overview({})}
              tooltip="Overview"
              size="lg"
            >
              <Link href={navigation.user.overview({})}>
                <LayoutDashboard />
                <span>Overview</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === navigation.user.notifications({})}
              tooltip="audits"
              size="lg"
            >
              <Link href={navigation.user.notifications({})} className="relative">
                <Bell />
                {!hasInvites && (
                  <span className="size-2 top-2.5 left-1.5 bg-red-500 rounded-full absolute"></span>
                )}
                <span>Notifications</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === navigation.user.settings({})}
              tooltip="versions"
              size="lg"
            >
              <Link href={navigation.user.settings({})}>
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

const AppSidebar: React.FC<AppSidebarProps> = ({ userId }) => {
  const params = useParams<HrefProps>();

  const isUserPage = !params.teamSlug;
  const isProjectPage = !!params.projectSlug;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <TeamNavigation userId={userId} isUserPage={isUserPage} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {isUserPage && <UserNavigationItems />}
        {!isUserPage && <TeamSidebarItems />}
        {isProjectPage && (
          <>
            <SidebarSeparator />
            <ProjectSidebarItems />
          </>
        )}
        <StarredSidebarItems />
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter>
        <UserNavigation userId={userId} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};

export default AppSidebar;
