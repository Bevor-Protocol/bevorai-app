import ContainerBreadcrumb from "@/components/breadcrumbs";
import Container from "@/components/container";
import { Button } from "@/components/ui/button";
import { extractAnalysisVersionsQuery } from "@/utils/queries";
import { AsyncComponent } from "@/utils/types";
import { Plus } from "lucide-react";
import Link from "next/link";
import AnalysisVersionsData from "./versions-client";

type ResolvedParams = {
  teamSlug: string;
  analysisId: string;
};

interface PageProps {
  params: Promise<ResolvedParams>;
  searchParams: Promise<{ [key: string]: string }>;
}

const ProjectAnalysisVersionsPage: AsyncComponent<PageProps> = async ({ params, searchParams }) => {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const query = extractAnalysisVersionsQuery(resolvedParams.analysisId, resolvedSearchParams);

  return (
    <Container
      breadcrumb={
        <ContainerBreadcrumb
          queryKey={[resolvedParams.analysisId]}
          queryType="analysis-versions"
          teamSlug={resolvedParams.teamSlug}
          id={resolvedParams.analysisId}
        />
      }
      className="flex flex-col"
    >
      <div className="flex flex-row mb-8 justify-between">
        <div className="flex flex-row items-center gap-4">
          <h3 className="text-foreground">Analysis Versions</h3>
        </div>
        <Button asChild>
          <Link
            href={`/teams/${resolvedParams.teamSlug}/analyses/${resolvedParams.analysisId}/versions/new`}
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
