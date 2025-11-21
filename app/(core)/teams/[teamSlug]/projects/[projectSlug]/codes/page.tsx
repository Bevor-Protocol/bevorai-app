import { dashboardActions } from "@/actions/bevor";
import Container from "@/components/container";
import { CodeVersionsView } from "@/components/screens/code-versions";
import ProjectSubnav from "@/components/subnav/project";
import { DefaultCodesQuery, extractCodesQuery } from "@/utils/query-params";
import { AsyncComponent } from "@/utils/types";
import { CodesToggle } from "./codes-client";

interface ResolvedParams {
  teamSlug: string;
  projectSlug: string;
}

interface ProjectPageProps {
  params: Promise<ResolvedParams>;
  searchParams: Promise<{ [key: string]: string }>;
}

const ProjectVersionsPage: AsyncComponent<ProjectPageProps> = async ({ params, searchParams }) => {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const currentUser = await dashboardActions.getUser();

  const initialQuery = extractCodesQuery({
    ...resolvedSearchParams,
    project_slug: resolvedParams.projectSlug,
    user_id: currentUser?.id ?? "",
  });

  const defaultQuery = { ...DefaultCodesQuery, project_slug: resolvedParams.projectSlug };

  return (
    <Container subnav={<ProjectSubnav />}>
      <div className="max-w-7xl mx-auto">
        <div className="border-b">
          <div className="px-6 py-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold mb-1">Code Versions</h1>
              <p className="text-sm text-muted-foreground">
                Uploaded code versions for analysis and auditing
              </p>
            </div>
            <CodesToggle {...resolvedParams} />
          </div>
        </div>
        <div className="px-6 py-6">
          <CodeVersionsView
            {...resolvedParams}
            initialQuery={initialQuery}
            defaultQuery={defaultQuery}
          />
        </div>
      </div>
    </Container>
  );
};

export default ProjectVersionsPage;
