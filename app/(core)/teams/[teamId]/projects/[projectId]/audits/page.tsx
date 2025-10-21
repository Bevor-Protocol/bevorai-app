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
import React from "react";

type ResolvedParams = {
  teamId: string;
  projectId: string;
};

interface ProjectAuditsPageProps {
  params: Promise<ResolvedParams>;
  searchParams: Promise<{ page?: string }>;
}

const AuditBreadCrumb: React.FC<ResolvedParams> = (params) => {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href={navigation.team.overview(params)}>{params.teamId}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href={navigation.project.overview(params)}>
            {params.projectId}
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
  const { teamId, projectId } = await params;
  const { page = "0" } = await searchParams;

  const project = await bevorAction.getProject(projectId);

  const query = { page, project_id: project.id };

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["audits", query],
    queryFn: () => bevorAction.getSecurityAnalyses(query),
  });

  return (
    <Container breadcrumb={<AuditBreadCrumb teamId={teamId} projectId={projectId} />}>
      <h1>Audits</h1>
      <div className="space-y-6">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <AuditPagination basePath={`/teams/${teamId}/projects/${projectId}/audits`} page={page} />
        </HydrationBoundary>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <AuditGrid teamId={teamId} query={query} />
        </HydrationBoundary>
      </div>
    </Container>
  );
};

export default ProjectAuditsPage;
