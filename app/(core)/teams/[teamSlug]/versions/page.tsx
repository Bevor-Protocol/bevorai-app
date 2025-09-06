import { bevorAction } from "@/actions";
import { TeamHeader } from "@/components/team/header";
import { VersionGrid } from "@/components/versions/grid";
import { AsyncComponent } from "@/utils/types";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

interface TeamVersionPageProps {
  params: Promise<{ teamSlug: string }>;
}

const TeamVersionsPage: AsyncComponent<TeamVersionPageProps> = async ({ params }) => {
  const { teamSlug } = await params;

  const query = { page_size: "9" };

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["versions", query],
    queryFn: () => bevorAction.getVersions(query),
  });

  return (
    <div className="max-w-6xl m-auto">
      <TeamHeader title="Versions" subTitle="code versions" />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <VersionGrid teamSlug={teamSlug} query={query} />
      </HydrationBoundary>
    </div>
  );
};

export default TeamVersionsPage;
