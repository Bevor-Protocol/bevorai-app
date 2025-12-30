import { projectActions } from "@/actions/bevor";
import Container from "@/components/container";
import ProjectSubnav from "@/components/subnav/project";
import { getQueryClient } from "@/lib/config/query";
import { generateQueryKey } from "@/utils/constants";
import { AsyncComponent } from "@/utils/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import GithubRepoStep from "./github-repo";
import Steps from "./new-page-client";

interface ResolvedParams {
  teamSlug: string;
  projectSlug: string;
}

interface VersionPageProps {
  params: Promise<ResolvedParams>;
  searchParams: Promise<{ parentId?: string }>;
}

const NewVersionPage: AsyncComponent<VersionPageProps> = async ({ params, searchParams }) => {
  const queryClient = getQueryClient();
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const project = await queryClient.fetchQuery({
    queryKey: generateQueryKey.project(resolvedParams.projectSlug),
    queryFn: async () =>
      projectActions.getProject(resolvedParams.teamSlug, resolvedParams.projectSlug),
  });

  if (project.github_repo_id) {
    return (
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Container subnav={<ProjectSubnav />}>
          <GithubRepoStep {...resolvedParams} {...resolvedSearchParams} />
        </Container>
      </HydrationBoundary>
    );
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Container subnav={<ProjectSubnav />}>
        <Steps project={project} {...resolvedSearchParams} />
      </Container>
    </HydrationBoundary>
  );
};

export default NewVersionPage;
