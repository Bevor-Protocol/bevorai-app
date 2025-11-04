"use client";

import { billingActions } from "@/actions/bevor";

import { teamActions } from "@/actions/bevor";
import InviteMemberModal from "@/components/Modal/invite-member";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlanStatusEnum } from "@/utils/enums";
import { MemberRoleEnum } from "@/utils/types";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Plus, Users } from "lucide-react";
import React from "react";
import InvitesList from "./invites-list";
import MembersList from "./members-list";

export const MembersCount: React.FC<{ teamId: string }> = ({ teamId }) => {
  const { data: members, isLoading } = useSuspenseQuery({
    queryKey: ["members", teamId],
    queryFn: async () => teamActions.getMembers(teamId),
  });

  if (isLoading) {
    return <Skeleton className="size-5" />;
  }

  return <Badge variant="secondary">{members.length}</Badge>;
};

export const MemberCreate: React.FC<{ teamId: string }> = ({ teamId }) => {
  const { data: curMember } = useSuspenseQuery({
    queryKey: ["current-member", teamId],
    queryFn: async () => teamActions.getCurrentMember(teamId),
  });

  if (!curMember || curMember.role !== MemberRoleEnum.OWNER) {
    return <></>;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="text-foreground">
          <Plus className="size-4 mr-2" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <InviteMemberModal teamId={teamId} />
      </DialogContent>
    </Dialog>
  );
};

const MembersTabs: React.FC<{ teamId: string }> = ({ teamId }) => {
  const { data: members, isLoading: isLoadingMembers } = useSuspenseQuery({
    queryKey: ["members", teamId],
    queryFn: async () => teamActions.getMembers(teamId),
  });

  const { data: invites, isLoading: isLoadingInvites } = useSuspenseQuery({
    queryKey: ["invites", teamId],
    queryFn: async () => teamActions.getInvites(teamId),
  });

  const { data: subscription } = useSuspenseQuery({
    queryKey: ["subscription", teamId],
    queryFn: () => billingActions.getSubscription(teamId),
  });

  const totalSeats = (members?.length ?? 0) + (invites?.length ?? 0);
  const isTrial = subscription?.plan_status === PlanStatusEnum.TRIALING;

  return (
    <Tabs defaultValue="members">
      <div className="flex flex-row justify-between items-end">
        <TabsList className="h-fit">
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="invites">Invites</TabsTrigger>
        </TabsList>
        <div className="mb-6 p-4 border border-border rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="size-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Team Seats: {totalSeats}
                  {isTrial && " / 3"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isTrial
                    ? "3 seat limit during trial period"
                    : totalSeats > 3
                      ? "Additional seats will be billed at your plan's per-seat rate"
                      : "First 3 seats included, additional seats billed separately"}
                </p>
              </div>
            </div>
            {isTrial && totalSeats >= 3 && (
              <div className="text-xs text-orange-400 bg-orange-500/10 px-2 py-1 rounded">
                Seat limit reached
              </div>
            )}
            {!isTrial && totalSeats > 3 && (
              <div className="text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                Additional billing
              </div>
            )}
          </div>
        </div>
      </div>

      <TabsContent value="members">
        <MembersList teamId={teamId} members={members ?? []} isLoading={isLoadingMembers} />
      </TabsContent>
      <TabsContent value="invites">
        <InvitesList teamId={teamId} invites={invites ?? []} isLoading={isLoadingInvites} />
      </TabsContent>
    </Tabs>
  );
};

export default MembersTabs;
