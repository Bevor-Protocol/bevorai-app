import { bevorAction } from "@/actions";
import { AuditGrid } from "@/components/audits/grid";
import { AuditPagination } from "@/components/audits/pagination";
import Container from "@/components/container";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { navigation } from "@/utils/navigation";
import { AsyncComponent } from "@/utils/types";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

type ResolvedParams = {
  teamSlug: string;
  projectSlug: string;
};

interface ProjectAuditsPageProps {
  params: Promise<ResolvedParams>;
  searchParams: Promise<{ page?: string }>;
}

const AuditBreadCrumb = (params: ResolvedParams) => {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href={navigation.team.overview(params)}>{params.teamSlug}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href={navigation.project.overview(params)}>
            {params.projectSlug}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink href={navigation.project.audits(params)}>Audits</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
      </BreadcrumbList>
    </Breadcrumb>
  );
};

const ProjectAuditsPage: AsyncComponent<ProjectAuditsPageProps> = async ({
  params,
  searchParams,
}) => {
  const { teamSlug, projectSlug } = await params;
  const { page = "0" } = await searchParams;

  const project = await bevorAction.getProjectBySlug(projectSlug);

  const query = { page, project_id: project.id };

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["audits", query],
    queryFn: () => bevorAction.getAudits(query),
  });

  return (
    <Container breadcrumb={<AuditBreadCrumb teamSlug={teamSlug} projectSlug={projectSlug} />}>
      <h1>Audits</h1>
      <div className="space-y-6">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <AuditPagination
            basePath={`/teams/${teamSlug}/projects/${projectSlug}/audits`}
            page={page}
          />
        </HydrationBoundary>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <AuditGrid teamSlug={teamSlug} query={query} />
        </HydrationBoundary>
      </div>
    </Container>
  );
};

export default ProjectAuditsPage;
