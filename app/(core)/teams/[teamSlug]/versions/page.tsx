import { bevorAction } from "@/actions";
import { TeamHeader } from "@/components/team/header";
import { VersionGrid } from "@/components/versions/grid";
import { getQueryClient } from "@/lib/config/query";
import { AsyncComponent } from "@/utils/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

interface TeamVersionPageProps {
  params: Promise<{ teamSlug: string }>;
}

const TeamVersionsPage: AsyncComponent<TeamVersionPageProps> = async ({ params }) => {
  const { teamSlug } = await params;

  const queryClient = getQueryClient();
  queryClient.prefetchQuery({
    queryKey: ["versions"],
    queryFn: () => bevorAction.getVersions({ page_size: "9" }),
  });

  return (
    <div className="px-6 py-8 fill-remaining-height">
      <TeamHeader title="Versions" subTitle="code versions" />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <VersionGrid teamSlug={teamSlug} pageSize="9" />
      </HydrationBoundary>
    </div>
  );
};

export default TeamVersionsPage;
