import { bevorAction } from "@/actions";
import { AuditGrid } from "@/components/audits/grid";
import { AuditPagination } from "@/components/audits/pagination";
import { AsyncComponent } from "@/utils/types";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

interface VersionAuditsPageProps {
  params: Promise<{ teamSlug: string; projectSlug: string; versionId: string }>;
  searchParams: Promise<{ page?: string }>;
}

const VersionAuditsPage: AsyncComponent<VersionAuditsPageProps> = async ({
  params,
  searchParams,
}) => {
  const { teamSlug, projectSlug, versionId } = await params;
  const { page = "0" } = await searchParams;

  const query = { page, version_id: versionId };

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["audits", query],
    queryFn: () => bevorAction.getAudits(query),
  });

  return (
    <div className="space-y-6">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <AuditPagination
          basePath={`/teams/${teamSlug}/projects/${projectSlug}/versions/${versionId}`}
          page={page}
        />
      </HydrationBoundary>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <AuditGrid teamSlug={teamSlug} query={query} />
      </HydrationBoundary>
    </div>
  );
};

export default VersionAuditsPage;
