import { breadcrumbActions } from "@/actions/bevor";
import ContainerBreadcrumb from "@/components/breadcrumbs";
import Container from "@/components/container";
import { Button } from "@/components/ui/button";
import { extractAnalysisVersionsQuery } from "@/utils/queries";
import { AsyncComponent } from "@/utils/types";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import AnalysisVersionsData from "./versions-client";

type ResolvedParams = {
  teamId: string;
  analysisId: string;
};

interface PageProps {
  params: Promise<ResolvedParams>;
  searchParams: Promise<{ [key: string]: string }>;
}

const Breadcrumb: AsyncComponent<ResolvedParams> = async (params: ResolvedParams) => {
  const breadcrumb = await breadcrumbActions.getSecurityAnalysisVersionsBreadcrumb(
    params.teamId,
    params.analysisId,
  );

  return <ContainerBreadcrumb breadcrumb={breadcrumb} />;
};

const ProjectAnalysisVersionsPage: AsyncComponent<PageProps> = async ({ params, searchParams }) => {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const query = extractAnalysisVersionsQuery(resolvedParams.analysisId, resolvedSearchParams);

  return (
    <Container
      breadcrumb={
        <Suspense>
          <Breadcrumb {...resolvedParams} />
        </Suspense>
      }
      className="flex flex-col"
    >
      <div className="flex flex-row mb-8 justify-between">
        <div className="flex flex-row items-center gap-4">
          <h3 className="text-foreground">Analyses</h3>
        </div>
        <Button asChild>
          <Link
            href={`/teams/${resolvedParams.teamId}/analyses/${resolvedParams.analysisId}/versions/new`}
          >
            <Plus className="size-4" />
            New Analysis
          </Link>
        </Button>
      </div>
      <AnalysisVersionsData query={query} {...resolvedParams} />
    </Container>
  );
};

export default ProjectAnalysisVersionsPage;
