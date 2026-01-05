"use client";

import { authActions, teamActions, userActions } from "@/actions/bevor";
import ContainerBreadcrumb from "@/components/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { generateQueryKey } from "@/utils/constants";
import { trimAddress } from "@/utils/helpers";
import { MemberInviteSchema, UserDetailedSchemaI } from "@/utils/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Calendar, ExternalLink, LogOut, Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";

const InviteItem: React.FC<{
  invite: MemberInviteSchema;
  onClick: () => void;
}> = ({ invite, onClick }) => {
  return (
    <DropdownMenuItem
      className="flex flex-col items-start gap-2 p-3 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-2 w-full">
        <Icon size="sm" seed={invite.team.id} className="text-blue-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{invite.team.name}</p>
          <p className="text-xs text-muted-foreground truncate">Team invitation</p>
        </div>
        <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
      </div>
    </DropdownMenuItem>
  );
};

const NotificationsDropdown: React.FC<{ invites: MemberInviteSchema[] }> = ({ invites }) => {
  const queryClient = useQueryClient();
  const [selectedInvite, setSelectedInvite] = useState<MemberInviteSchema | null>(null);

  const acceptInviteMutation = useMutation({
    mutationFn: async (inviteId: string) =>
      teamActions.acceptInvite(inviteId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    onSuccess: ({ toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
    },
  });

  const rejectInviteMutation = useMutation({
    mutationFn: async (data: { teamSlug: string; inviteId: string }) =>
      teamActions.removeInvite(data.teamSlug, data.inviteId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    onSuccess: ({ toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
    },
  });

  const handleAccept = (): void => {
    if (selectedInvite) {
      setSelectedInvite(null);
      acceptInviteMutation.mutate(selectedInvite.id);
    }
  };

  const handleReject = (): void => {
    if (selectedInvite) {
      setSelectedInvite(null);
      rejectInviteMutation.mutate({
        teamSlug: selectedInvite.team.slug,
        inviteId: selectedInvite.id,
      });
    }
  };

  const isPending = acceptInviteMutation.isPending || rejectInviteMutation.isPending;
  const isSuccess = acceptInviteMutation.isSuccess || rejectInviteMutation.isSuccess;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="relative border rounded-full size-icon-md flex items-center justify-center"
          >
            <Bell className="size-4" />
            {invites.length > 0 && (
              <Badge
                variant="green"
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {invites.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel>
            <div className="flex items-center gap-2">
              <Bell className="size-4" />
              <span>Notifications</span>
              {invites.length > 0 && (
                <Badge variant="green" size="sm" className="ml-auto">
                  {invites.length}
                </Badge>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {invites.length === 0 ? (
            <div className="py-8 px-4 text-center">
              <div className="p-4 bg-muted rounded-full mb-4 inline-flex">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium mb-1">No notifications</p>
              <p className="text-xs text-muted-foreground">
                You&apos;re all caught up! When you receive team invitations, they&apos;ll appear
                here.
              </p>
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              {invites.map((invite) => (
                <InviteItem
                  key={invite.id}
                  invite={invite}
                  onClick={() => setSelectedInvite(invite)}
                />
              ))}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {selectedInvite && (
        <Dialog
          open={selectedInvite !== null}
          onOpenChange={(open) => !open && setSelectedInvite(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Team Invite</DialogTitle>
              <DialogDescription>Want to join this team?</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-4">
                <div className="flex flex-row gap-2 items-center">
                  <Icon size="sm" seed={selectedInvite!.team.id} />
                  <span>{selectedInvite!.team.name}</span>
                </div>
                <p>
                  You were invited to join a team. You&apos;ll be able to collaborate on your
                  auditing processes together.
                </p>
              </div>

              {acceptInviteMutation.error && (
                <p className="text-sm text-destructive">{acceptInviteMutation.error.message}</p>
              )}
              {acceptInviteMutation.isSuccess && (
                <p className="text-sm text-green-400">Successfully joined the team</p>
              )}
              {rejectInviteMutation.error && (
                <p className="text-sm text-destructive">{rejectInviteMutation.error.message}</p>
              )}
              {rejectInviteMutation.isSuccess && (
                <p className="text-sm text-green-400">Rejected the invite</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleReject}
                disabled={isPending || isSuccess}
              >
                Reject
              </Button>
              <Button
                type="button"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isPending || isSuccess}
                onClick={handleAccept}
              >
                {isPending ? "Joining..." : "Accept"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

const UserDropdown: React.FC<{
  user: UserDetailedSchemaI | null | undefined;
}> = ({ user }) => {
  const logoutMutation = useMutation({
    mutationFn: async () =>
      authActions.logout().then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Icon size="md" shape="block" seed={user?.id} className="shrink-0 hover:opacity-75" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Icon size="sm" shape="block" seed={user?.id} className="shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user?.username}</div>
              <div className="text-xs text-muted-foreground truncate">
                {user?.email ?? trimAddress(user?.wallet) ?? ""}
              </div>
            </div>
          </div>
        </div>
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/user" className="w-full flex items-center justify-between">
              <span>Settings</span>
              <Settings className="size-4" />
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="https://docs.bevor.io" className="w-full flex items-center justify-between">
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
  );
};

const AppNav: React.FC = () => {
  const { data: user } = useQuery({
    queryKey: generateQueryKey.currentUser(),
    queryFn: () =>
      userActions.get().then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  const { data: invites = [] } = useQuery({
    queryKey: generateQueryKey.userInvites(),
    queryFn: async () =>
      userActions.invites().then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  return (
    <nav className="w-full bg-background flex items-center justify-between px-6 h-header">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center">
          <div className="h-6 relative">
            <Image
              src="/logo-small.png"
              alt="company logo"
              width={611}
              height={133}
              className="h-full w-auto object-contain"
              priority
            />
          </div>
        </Link>
        <ContainerBreadcrumb />
      </div>
      <div className="flex items-center gap-4">
        <NotificationsDropdown invites={invites} />
        <UserDropdown user={user} />
      </div>
    </nav>
  );
};

export default AppNav;
