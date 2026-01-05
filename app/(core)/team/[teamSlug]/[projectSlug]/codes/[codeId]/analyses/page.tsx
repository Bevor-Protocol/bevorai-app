import { userActions } from "@/actions/bevor";
import Container from "@/components/container";
import { AnalysisNodesView } from "@/components/screens/nodes";
import CodeVersionSubnav from "@/components/subnav/code-version";
import { DefaultAnalysisNodesQuery, extractAnalysisNodesQuery } from "@/utils/query-params";
import { AsyncComponent } from "@/utils/types";

type ResolvedParams = {
  teamSlug: string;
  projectSlug: string;
  codeId: string;
};

interface PageProps {
  params: Promise<ResolvedParams>;
  searchParams: Promise<Partial<typeof DefaultAnalysisNodesQuery> & { user?: string }>;
}

const AnalysisNodesPage: AsyncComponent<PageProps> = async ({ params, searchParams }) => {
  const resolvedParams = await params;
  const { user, ...resolvedSearchParams } = await searchParams;

  const initialQuery = extractAnalysisNodesQuery({
    ...resolvedSearchParams,
    project_slug: resolvedParams.projectSlug,
    code_version_id: resolvedParams.codeId,
  });

  if (user !== "unset") {
    const currentUser = await userActions.get().then((r) => {
      if (!r.ok) throw r;
      return r.data;
    });
    initialQuery.user_id = currentUser.id;
  }

  const defaultQuery = {
    ...DefaultAnalysisNodesQuery,
    project_slug: resolvedParams.projectSlug,
    code_version_id: resolvedParams.codeId,
  };

  return (
    <Container subnav={<CodeVersionSubnav />}>
      <div className="max-w-7xl mx-auto">
        <div className="border-b">
          <div className="py-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold mb-1">Analyses</h1>
              <p className="text-sm text-muted-foreground">
                Security analyses for this code version
              </p>
            </div>
            {/* <AnalysisCreate {...resolvedParams} /> */}
          </div>
        </div>
        <div className="py-6">
          <AnalysisNodesView
            initialQuery={initialQuery}
            defaultQuery={defaultQuery}
            {...resolvedParams}
          />
        </div>
      </div>
    </Container>
  );
};

export default AnalysisNodesPage;
