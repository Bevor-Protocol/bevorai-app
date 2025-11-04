import { breadcrumbActions } from "@/actions/bevor";
import ContainerBreadcrumb from "@/components/breadcrumbs";
import Container from "@/components/container";
import { QUERY_KEYS } from "@/utils/constants";
import { extractAnalysesQuery } from "@/utils/queries";
import { AsyncComponent } from "@/utils/types";
import { QueryClient } from "@tanstack/react-query";
import AnalysesData, { AnalysisCreate } from "./analyses-client";

type ResolvedParams = {
  teamId: string;
  projectId: string;
};

interface PageProps {
  params: Promise<ResolvedParams>;
  searchParams: Promise<{ [key: string]: string }>;
}

const ProjectAnalysesPage: AsyncComponent<PageProps> = async ({ params, searchParams }) => {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const query = extractAnalysesQuery(resolvedParams.projectId, resolvedSearchParams);

  const queryClient = new QueryClient();

  const breadcrumb = await queryClient.fetchQuery({
    queryKey: [QUERY_KEYS.SECURITY_VERSIONS, resolvedParams.teamId, query],
    queryFn: () =>
      breadcrumbActions.getProjectAnalysesBreadcrumb(
        resolvedParams.teamId,
        resolvedParams.projectId,
      ),
  });

  return (
    <Container
      breadcrumb={<ContainerBreadcrumb breadcrumb={breadcrumb} />}
      className="flex flex-col"
    >
      <div className="flex flex-row mb-8 justify-between">
        <div className="flex flex-row items-center gap-4">
          <h3 className="text-foreground">Analyses</h3>
        </div>
        <AnalysisCreate {...resolvedParams} />
      </div>
      <AnalysesData query={query} {...resolvedParams} />
    </Container>
  );
};

export default ProjectAnalysesPage;
