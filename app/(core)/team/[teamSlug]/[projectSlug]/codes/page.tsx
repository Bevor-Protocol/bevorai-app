import Container from "@/components/container";
import { CodeVersionsView } from "@/components/screens/code-versions";
import ProjectSubnav from "@/components/subnav/project";
import { Button } from "@/components/ui/button";
import { AsyncComponent } from "@/types";
import type { QueryParamsRecord } from "@/utils/query-params";
import { extractQueryParams } from "@/utils/query-params";
import { Plus } from "lucide-react";
import Link from "next/link";

interface ResolvedParams {
  teamSlug: string;
  projectSlug: string;
}

interface ProjectPageProps {
  params: Promise<ResolvedParams>;
  searchParams: Promise<QueryParamsRecord>;
}

const ProjectVersionsPage: AsyncComponent<ProjectPageProps> = async ({ params, searchParams }) => {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const initialQuery = extractQueryParams({
    ...resolvedSearchParams,
    project_slug: resolvedParams.projectSlug,
  });

  const defaultQuery = { project_slug: resolvedParams.projectSlug };

  return (
    <Container subnav={<ProjectSubnav />}>
      <div className="max-w-7xl mx-auto">
        <div className="border-b">
          <div className="py-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold mb-1">Code Versions</h1>
            </div>
            <Button asChild>
              <Link
                href={`/team/${resolvedParams.teamSlug}/${resolvedParams.projectSlug}/codes/new`}
              >
                <Plus className="size-4" />
                Upload Code
              </Link>
            </Button>
          </div>
        </div>
        <CodeVersionsView
          {...resolvedParams}
          initialQuery={initialQuery}
          defaultQuery={defaultQuery}
        />
      </div>
    </Container>
  );
};

export default ProjectVersionsPage;
