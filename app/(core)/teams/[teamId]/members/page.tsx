"use server";

import { billingActions, teamActions } from "@/actions/bevor";
import Container from "@/components/container";
import { getQueryClient } from "@/lib/config/query";
import { AsyncComponent } from "@/utils/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import MembersTabs, { MemberCreate, MembersCount } from "./members-tabs";

interface PageProps {
  params: Promise<{ teamId: string }>;
}

const MembersPage: AsyncComponent<PageProps> = async ({ params }) => {
  const queryClient = getQueryClient();
  const { teamId } = await params;

  await Promise.all([
    queryClient.fetchQuery({
      queryKey: ["invites", teamId],
      queryFn: async () => teamActions.getInvites(teamId),
    }),
    queryClient.fetchQuery({
      queryKey: ["members", teamId],
      queryFn: async () => teamActions.getMembers(teamId),
    }),
    queryClient.fetchQuery({
      queryKey: ["current-member", teamId],
      queryFn: async () => teamActions.getCurrentMember(teamId),
    }),
    queryClient.fetchQuery({
      queryKey: ["subscription", teamId],
      queryFn: () => billingActions.getSubscription(teamId),
    }),
  ]);

  return (
    <Container>
      <div className="flex flex-row mb-8 justify-between">
        <div className="flex flex-row items-center gap-4">
          <h3 className="text-foreground">Members</h3>
          <HydrationBoundary state={dehydrate(queryClient)}>
            <MembersCount teamId={teamId} />
          </HydrationBoundary>
        </div>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <MemberCreate teamId={teamId} />
        </HydrationBoundary>
      </div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <MembersTabs teamId={teamId} />
      </HydrationBoundary>
    </Container>
  );
};

export default MembersPage;
