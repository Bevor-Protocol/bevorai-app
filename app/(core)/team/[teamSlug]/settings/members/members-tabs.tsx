"use client";

import { billingActions } from "@/actions/bevor";

import { teamActions } from "@/actions/bevor";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Subnav, SubnavButton } from "@/components/ui/subnav";
import { generateQueryKey } from "@/utils/constants";
import { PlanStatusEnum } from "@/utils/enums";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import React, { useState } from "react";
import InvitesList from "./invites-list";
import MembersList from "./members-list";

export const MembersCount: React.FC<{ teamSlug: string }> = ({ teamSlug }) => {
  const { data: members, isLoading } = useSuspenseQuery({
    queryKey: generateQueryKey.members(teamSlug),
    queryFn: async () =>
      teamActions.getMembers(teamSlug).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  if (isLoading) {
    return <Skeleton className="size-5" />;
  }

  return (
    <Badge variant="outline" size="sm">
      {members.length}
    </Badge>
  );
};

export const TeamSeats: React.FC<{ teamSlug: string }> = ({ teamSlug }) => {
  const { data: members } = useSuspenseQuery({
    queryKey: generateQueryKey.members(teamSlug),
    queryFn: async () =>
      teamActions.getMembers(teamSlug).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  const { data: invites } = useSuspenseQuery({
    queryKey: generateQueryKey.invites(teamSlug),
    queryFn: async () =>
      teamActions.getInvites(teamSlug).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  const { data: subscription } = useSuspenseQuery({
    queryKey: generateQueryKey.subscription(teamSlug),
    queryFn: () =>
      billingActions.getSubscription(teamSlug).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  const totalSeats = (members?.length ?? 0) + (invites?.length ?? 0);
  const isTrial = subscription?.plan_status === PlanStatusEnum.TRIALING;

  return (
    <div className="p-4 border border-border rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="size-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium ">
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
  );
};

const MembersTabs: React.FC<{ teamSlug: string }> = ({ teamSlug }) => {
  const [activeTab, setActiveTab] = useState<"members" | "invites">("members");

  const { data: members, isLoading: isLoadingMembers } = useSuspenseQuery({
    queryKey: generateQueryKey.members(teamSlug),
    queryFn: async () =>
      teamActions.getMembers(teamSlug).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  const { data: invites, isLoading: isLoadingInvites } = useSuspenseQuery({
    queryKey: generateQueryKey.invites(teamSlug),
    queryFn: async () =>
      teamActions.getInvites(teamSlug).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  return (
    <>
      <Subnav className="mb-6 w-fit px-0">
        <SubnavButton
          isActive={activeTab === "members"}
          onClick={() => setActiveTab("members")}
          shouldHighlight
        >
          Members
        </SubnavButton>
        <SubnavButton
          isActive={activeTab === "invites"}
          onClick={() => setActiveTab("invites")}
          shouldHighlight
        >
          Invites
        </SubnavButton>
      </Subnav>

      {activeTab === "members" && (
        <MembersList teamSlug={teamSlug} members={members ?? []} isLoading={isLoadingMembers} />
      )}
      {activeTab === "invites" && (
        <InvitesList teamSlug={teamSlug} invites={invites ?? []} isLoading={isLoadingInvites} />
      )}
    </>
  );
};

export default MembersTabs;
