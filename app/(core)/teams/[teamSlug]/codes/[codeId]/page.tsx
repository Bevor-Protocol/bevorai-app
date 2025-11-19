"use server";

import { codeActions, dashboardActions } from "@/actions/bevor";
import ContainerBreadcrumb from "@/components/breadcrumbs";
import Container from "@/components/container";
import { CodeProvider } from "@/providers/code";
import { AsyncComponent } from "@/utils/types";
import CodeClient from "./code-client";

type ResolvedParams = {
  codeId: string;
  teamSlug: string;
};

type Props = {
  params: Promise<ResolvedParams>;
};

const SourcesPage: AsyncComponent<Props> = async ({ params }) => {
  const resolvedParams = await params;

  const [version, sources, user] = await Promise.all([
    codeActions.getCodeVersion(resolvedParams.teamSlug, resolvedParams.codeId),
    codeActions.getCodeVersionSources(resolvedParams.teamSlug, resolvedParams.codeId),
    dashboardActions.getUser(),
  ]);

  return (
    <CodeProvider initialSourceId={sources.length ? sources[0].id : null} {...resolvedParams}>
      <Container
        breadcrumb={
          <ContainerBreadcrumb
            queryKey={[resolvedParams.codeId]}
            queryType="code-version"
            teamSlug={resolvedParams.teamSlug}
            id={resolvedParams.codeId}
          />
        }
        className="pt-0"
      >
        <CodeClient {...resolvedParams} version={version} sources={sources} user={user} />
      </Container>
    </CodeProvider>
  );
};

export default SourcesPage;
