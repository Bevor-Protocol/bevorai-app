"use server";

import { billingActions, teamActions } from "@/actions/bevor";
import { getQueryClient } from "@/lib/config/query";
import { generateQueryKey } from "@/utils/constants";
import { AsyncComponent } from "@/utils/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import InviteForm from "./invite-form";
import MembersTabs, { MembersCount, TeamSeats } from "./members-tabs";

interface PageProps {
  params: Promise<{ teamSlug: string }>;
}

const MembersPage: AsyncComponent<PageProps> = async ({ params }) => {
  const queryClient = getQueryClient();
  const { teamSlug } = await params;

  const [currentMember] = await Promise.all([
    queryClient.fetchQuery({
      queryKey: generateQueryKey.currentMember(teamSlug),
      queryFn: async () =>
        teamActions.getCurrentMember(teamSlug).then((r) => {
          if (!r.ok) throw r;
          return r.data;
        }),
    }),
    queryClient.fetchQuery({
      queryKey: generateQueryKey.invites(teamSlug),
      queryFn: async () =>
        teamActions.getInvites(teamSlug).then((r) => {
          if (!r.ok) throw r;
          return r.data;
        }),
    }),
    queryClient.fetchQuery({
      queryKey: generateQueryKey.members(teamSlug),
      queryFn: async () =>
        teamActions.getMembers(teamSlug).then((r) => {
          if (!r.ok) throw r;
          return r.data;
        }),
    }),
    queryClient.fetchQuery({
      queryKey: generateQueryKey.subscription(teamSlug),
      queryFn: () =>
        billingActions.getSubscription(teamSlug).then((r) => {
          if (!r.ok) throw r;
          return r.data;
        }),
    }),
  ]);

  const isOwner = currentMember.role === "owner";

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="mb-8">
        <div className="flex flex-row mb-6 justify-between items-start">
          <div className="flex flex-row items-center gap-4">
            <h3>Members</h3>
            <MembersCount teamSlug={teamSlug} />
          </div>
          <TeamSeats teamSlug={teamSlug} />
        </div>
        {isOwner && (
          <div className="border-b pb-6 mb-6">
            <h4 className="text-sm font-semibold mb-3">Invite Members</h4>
            <InviteForm teamSlug={teamSlug} />
          </div>
        )}
      </div>
      <MembersTabs teamSlug={teamSlug} />
    </HydrationBoundary>
  );
};

export default MembersPage;
