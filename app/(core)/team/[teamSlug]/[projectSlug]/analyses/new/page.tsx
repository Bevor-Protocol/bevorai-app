import { analysisActions, codeActions } from "@/actions/bevor";
import Container from "@/components/container";
import { CodeProvider } from "@/providers/code";
import {
  AnalysisNodeSchemaI,
  AsyncComponent,
  CodeMappingSchemaI,
  ScopeSchemaI,
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

const AnalysisPage: AsyncComponent<Props> = async ({ params, searchParams }) => {
  const resolvedParams = await params;
  const { codeVersionId, parentVersionId } = await searchParams;

  if (!codeVersionId && !parentVersionId) {
    // if we don't know a parent, and we don't know a code version, we shouldn't make assumptions
    redirect(`/team/${resolvedParams.teamSlug}/${resolvedParams.projectSlug}/analyses`);
  }

  let defaultCodeVersion: CodeMappingSchemaI;
  let defaultParentVersion: AnalysisNodeSchemaI | undefined;
  let parentScopes: ScopeSchemaI[] | undefined;

  if (parentVersionId && !codeVersionId) {
    defaultParentVersion = await analysisActions
      .getAnalysis(resolvedParams.teamSlug, parentVersionId)
      .then((r) => {
        if (!r.ok) throw r;
        return r.data;
      });
    defaultCodeVersion = await codeActions
      .getCodeVersion(resolvedParams.teamSlug, defaultParentVersion!.code_version_id)
      .then((r) => {
        if (!r.ok) throw r;
        return r.data;
      });
    parentScopes = await analysisActions
      .getScopes(resolvedParams.teamSlug, parentVersionId)
      .then((r) => {
        if (!r.ok) throw r;
        return r.data;
      });
  } else if (parentVersionId && codeVersionId) {
    defaultParentVersion = await analysisActions
      .getAnalysis(resolvedParams.teamSlug, parentVersionId)
      .then((r) => {
        if (!r.ok) throw r;
        return r.data;
      });
    defaultCodeVersion = await codeActions
      .getCodeVersion(resolvedParams.teamSlug, codeVersionId!)
      .then((r) => {
        if (!r.ok) throw r;
        return r.data;
      });
    parentScopes = await analysisActions
      .getScopes(resolvedParams.teamSlug, parentVersionId)
      .then((r) => {
        if (!r.ok) throw r;
        return r.data;
      });
  } else {
    defaultCodeVersion = await codeActions
      .getCodeVersion(resolvedParams.teamSlug, codeVersionId!)
      .then((r) => {
        if (!r.ok) throw r;
        return r.data;
      });
  }

  const sources = await codeActions
    .getSources(resolvedParams.teamSlug, defaultCodeVersion.id)
    .then((r) => {
      if (!r.ok) throw r;
      return r.data;
    });

  const initialSourceId = sources.length ? sources[0].id : null;

  return (
    <CodeProvider
      initialSourceId={initialSourceId}
      teamSlug={resolvedParams.teamSlug}
      codeId={defaultCodeVersion?.id ?? null}
    >
      <Container>
        <NewVersionClient
          {...resolvedParams}
          sources={sources}
          parentScopes={parentScopes ?? []}
          defaultParentVersion={defaultParentVersion}
          defaultCodeVersion={defaultCodeVersion}
          allowCodeVersionChange={!codeVersionId}
        />
      </Container>
    </CodeProvider>
  );
};

export default AnalysisPage;
