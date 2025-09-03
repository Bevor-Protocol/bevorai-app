import { bevorAction } from "@/actions";
import { AuditGrid } from "@/components/audits/grid";
import { AuditPagination } from "@/components/audits/pagination";
import { TeamHeader } from "@/components/team/header";
import { getQueryClient } from "@/lib/config/query";
import { AsyncComponent } from "@/utils/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

interface ProjectAuditsPageProps {
  params: Promise<{ teamSlug: string }>;
  searchParams: Promise<{ page?: string }>;
}

const ProjectAuditsPage: AsyncComponent<ProjectAuditsPageProps> = async ({
  params,
  searchParams,
}) => {
  const { teamSlug } = await params;
  const { page = "0" } = await searchParams;

  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["audits", { page }],
    queryFn: () => bevorAction.getAudits({ page }),
  });

  return (
    <div className="px-6 py-8 fill-remaining-height">
      <TeamHeader title="Audits" subTitle="security analyses" />
      <div className="max-w-7xl mx-auto space-y-6">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <AuditPagination teamSlug={teamSlug} page={page} />
        </HydrationBoundary>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <AuditGrid teamSlug={teamSlug} page={page} />
        </HydrationBoundary>
      </div>
    </div>
  );
};

export default ProjectAuditsPage;
