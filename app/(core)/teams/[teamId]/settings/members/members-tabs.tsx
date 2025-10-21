"use client";

import { bevorAction } from "@/actions";
import InviteMemberModal from "@/components/Modal/invite-member";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { PlanStatusEnum } from "@/utils/enums";
import { MemberSchema, TeamSchemaI } from "@/utils/types";
import { useQuery } from "@tanstack/react-query";
import { Plus, Users } from "lucide-react";
import React from "react";
import InvitesList from "./invites-list";
import MembersList from "./members-list";

interface MembersTabsProps {
  team: TeamSchemaI;
  curMember: MemberSchema;
}

const MembersTabs: React.FC<MembersTabsProps> = ({ team, curMember }) => {
  const [activeTab, setActiveTab] = React.useState<"members" | "invites">("members");

  const { data: members, isLoading: isLoadingMembers } = useQuery({
    queryKey: ["members", team.id],
    queryFn: async () => bevorAction.getMembers(),
  });

  const { data: invites, isLoading: isLoadingInvites } = useQuery({
    queryKey: ["invites", team.id],
    queryFn: async () => bevorAction.getInvites(),
  });

  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => bevorAction.getSubscription(),
  });

  const totalSeats = (members?.length ?? 0) + (invites?.length ?? 0);
  const isTrial = subscription?.plan_status === PlanStatusEnum.TRIALING;
  const isLoading = isLoadingInvites || isLoadingMembers;

  return (
    <>
      {/* Seat Information */}
      <div className="mb-6 p-4 border border-border rounded-lg bg-neutral-950/50">
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

      {/* Tabs */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => setActiveTab("members")}
            className="nav-item cursor-pointer"
            data-active={activeTab == "members"}
          >
            <span>Members</span>
          </button>
          <button
            onClick={() => setActiveTab("invites")}
            className="nav-item cursor-pointer"
            data-active={activeTab == "invites"}
          >
            <span>Invites</span>
            {(invites?.length ?? 0) > 0 && (
              <span className="w-2 h-2 bg-green-500 rounded-full absolute top-2 right-0" />
            )}
          </button>
        </div>
        {curMember.role === "owner" && (
          <Dialog>
            <DialogTrigger asChild disabled={(isTrial && totalSeats >= 3) || isLoading}>
              <Button>
                <Plus className="size-4 mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <InviteMemberModal teamName={team.name} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === "members" ? (
          <MembersList
            team={team}
            curMember={curMember}
            members={members ?? []}
            isLoading={isLoadingMembers}
          />
        ) : (
          <InvitesList curMember={curMember} invites={invites ?? []} isLoading={isLoadingInvites} />
        )}
      </div>
    </>
  );
};

export default MembersTabs;
