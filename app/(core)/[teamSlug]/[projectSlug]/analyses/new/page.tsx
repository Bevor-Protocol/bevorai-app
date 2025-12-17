import { analysisActions, codeActions } from "@/actions/bevor";
import Container from "@/components/container";
import AnalysisThreadSubnav from "@/components/subnav/analysis-thread";
import { CodeProvider } from "@/providers/code";
import {
  AnalysisNodeSchemaI,
  AnalysisStatusSchemaI,
  AsyncComponent,
  CodeMappingSchemaI,
} from "@/utils/types";
import { redirect } from "next/navigation";
import NewVersionClient from "./new-version-client";

type ResolvedParams = {
  teamSlug: string;
  projectSlug: string;
};

type Props = {
  params: Promise<ResolvedParams>;
  searchParams: Promise<{
    codeVersionId?: string;
    parentVersionId?: string;
  }>;
};

/*
Multiple ways to enter this page, to create a better UX:
1. from the analysis thread.
2. from an existing analysis version.
3. from a code version (we'll require they select an analysis thread prior to navigation).

To create an analysis version, we need 2 things:
1. the code version
2. the parent analysis version (nullable)

Now consider:
1. Neither query param is passed
-> use most recent analysis version as the default parent. Use its associated code version as the default
code version. If no recent analysis version exists, then leave parent blank, and use most recent code
version as the default code version. If no recent code version exists, add a CTA to create one.
2. Both query params are passed
-> validate that both are valid
3. code version only
-> validate it. Use the most recent analysis version as the default parent
4. parent only
-> validate it. Use the associated code version as the default code version.

*/

const AnalysisPage: AsyncComponent<Props> = async ({ params, searchParams }) => {
  const resolvedParams = await params;
  const { codeVersionId, parentVersionId } = await searchParams;

  if (!codeVersionId && !parentVersionId) {
    // if we don't know a parent, and we don't know a code version, we shouldn't make assumptions
    redirect(`/${resolvedParams.teamSlug}/${resolvedParams.projectSlug}/analyses`);
  }

  let defaultCodeVersion: CodeMappingSchemaI;
  let defaultParentVersion: AnalysisNodeSchemaI | undefined;
  let scope: AnalysisStatusSchemaI | undefined;

  if (parentVersionId) {
    defaultParentVersion = await analysisActions.getAnalysisVersion(
      resolvedParams.teamSlug,
      parentVersionId,
    );
    defaultCodeVersion = await codeActions.getCodeVersion(
      resolvedParams.teamSlug,
      defaultParentVersion.code_version_id,
    );
    scope = await analysisActions.getScope(resolvedParams.teamSlug, parentVersionId);
  } else {
    defaultCodeVersion = await codeActions.getCodeVersion(resolvedParams.teamSlug, codeVersionId!);
  }

  const tree = await codeActions.getTree(resolvedParams.teamSlug, defaultCodeVersion.id);

  const initialSourceId = tree.length ? tree[0].id : null;

  return (
    <CodeProvider
      initialSourceId={initialSourceId}
      teamSlug={resolvedParams.teamSlug}
      codeId={defaultCodeVersion?.id ?? null}
    >
      <Container subnav={<AnalysisThreadSubnav />}>
        <NewVersionClient
          {...resolvedParams}
          tree={tree}
          scope={scope}
          defaultParentVersion={defaultParentVersion}
          defaultCodeVersion={defaultCodeVersion}
          allowCodeVersionChange={!codeVersionId}
        />
      </Container>
    </CodeProvider>
  );
};

export default AnalysisPage;
