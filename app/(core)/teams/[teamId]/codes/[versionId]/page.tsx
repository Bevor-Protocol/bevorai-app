"use server";

import { versionActions } from "@/actions/bevor";
import ContainerBreadcrumb from "@/components/breadcrumbs";
import Container from "@/components/container";
import { CodeProvider } from "@/providers/code";
import { AsyncComponent } from "@/utils/types";
import CodeClient from "./code-client";

type ResolvedParams = {
  versionId: string;
  teamId: string;
};

type Props = {
  params: Promise<ResolvedParams>;
};

const SourcesPage: AsyncComponent<Props> = async ({ params }) => {
  const resolvedParams = await params;

  const [version, sources] = await Promise.all([
    versionActions.getCodeVersion(resolvedParams.teamId, resolvedParams.versionId),
    versionActions.getCodeVersionSources(resolvedParams.teamId, resolvedParams.versionId),
  ]);

  return (
    <CodeProvider initialSourceId={sources.length ? sources[0].id : null} {...resolvedParams}>
      <Container
        breadcrumb={
          <ContainerBreadcrumb
            queryKey={[resolvedParams.versionId]}
            queryType="code-version"
            teamId={resolvedParams.teamId}
            id={resolvedParams.versionId}
          />
        }
        className="pt-0"
      >
        <CodeClient {...resolvedParams} version={version} sources={sources} />
      </Container>
    </CodeProvider>
  );
};

export default SourcesPage;
