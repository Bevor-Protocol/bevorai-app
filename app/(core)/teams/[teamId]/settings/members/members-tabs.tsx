"use client";

import { billingActions } from "@/actions/bevor";

import { teamActions } from "@/actions/bevor";
import InviteMemberModal from "@/components/Modal/invite-member";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlanStatusEnum } from "@/utils/enums";
import { MemberSchema, TeamSchemaI } from "@/utils/types";
import { useQuery } from "@tanstack/react-query";
import { Plus, Users } from "lucide-react";
import React from "react";
import InvitesList from "./invites-list";
import MembersList from "./members-list";

export const MemberCreate: React.FC<{ team: TeamSchemaI }> = ({ team }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="text-foreground">
          <Plus className="size-4 mr-2" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <InviteMemberModal teamName={team.name} />
      </DialogContent>
    </Dialog>
  );
};

interface MembersTabsProps {
  team: TeamSchemaI;
  curMember: MemberSchema;
}

const MembersTabs: React.FC<MembersTabsProps> = ({ team, curMember }) => {
  const { data: members, isLoading: isLoadingMembers } = useQuery({
    queryKey: ["members", team.id],
    queryFn: async () => teamActions.getMembers(),
  });

  const { data: invites, isLoading: isLoadingInvites } = useQuery({
    queryKey: ["invites", team.id],
    queryFn: async () => teamActions.getInvites(),
  });

  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => billingActions.getSubscription(),
  });

  const totalSeats = (members?.length ?? 0) + (invites?.length ?? 0);
  const isTrial = subscription?.plan_status === PlanStatusEnum.TRIALING;
  const isLoading = isLoadingInvites || isLoadingMembers;

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
        <MembersList
          team={team}
          curMember={curMember}
          members={members ?? []}
          isLoading={isLoading}
        />
      </TabsContent>
      <TabsContent value="invites">
        <InvitesList curMember={curMember} invites={invites ?? []} isLoading={isLoading} />
      </TabsContent>
    </Tabs>
  );
};

export default MembersTabs;
