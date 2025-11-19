"use server";

import { billingActions, teamActions } from "@/actions/bevor";
import ContainerBreadcrumb from "@/components/breadcrumbs";
import Container from "@/components/container";
import { getQueryClient } from "@/lib/config/query";
import { generateQueryKey } from "@/utils/constants";
import { AsyncComponent } from "@/utils/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import MembersTabs, { MemberCreate, MembersCount } from "./members-tabs";

interface PageProps {
  params: Promise<{ teamSlug: string }>;
}

const MembersPage: AsyncComponent<PageProps> = async ({ params }) => {
  const queryClient = getQueryClient();
  const { teamSlug } = await params;

  await Promise.all([
    queryClient.fetchQuery({
      queryKey: generateQueryKey.invites(teamSlug),
      queryFn: async () => teamActions.getInvites(teamSlug),
    }),
    queryClient.fetchQuery({
      queryKey: generateQueryKey.members(teamSlug),
      queryFn: async () => teamActions.getMembers(teamSlug),
    }),
    queryClient.fetchQuery({
      queryKey: generateQueryKey.currentMember(teamSlug),
      queryFn: async () => teamActions.getCurrentMember(teamSlug),
    }),
    queryClient.fetchQuery({
      queryKey: generateQueryKey.subscription(teamSlug),
      queryFn: () => billingActions.getSubscription(teamSlug),
    }),
  ]);

  return (
    <Container
      breadcrumb={
        <ContainerBreadcrumb
          queryKey={[teamSlug]}
          queryType="team-settings"
          teamSlug={teamSlug}
          id=""
        />
      }
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <div className="max-w-5xl m-auto mt-8 lg:mt-16">
          <div className="flex flex-row mb-8 justify-between">
            <div className="flex flex-row items-center gap-4">
              <h3 className="text-foreground">Members</h3>
              <MembersCount teamSlug={teamSlug} />
            </div>
            <MemberCreate teamSlug={teamSlug} />
          </div>
          <MembersTabs teamSlug={teamSlug} />
        </div>
      </HydrationBoundary>
    </Container>
  );
};

export default MembersPage;
