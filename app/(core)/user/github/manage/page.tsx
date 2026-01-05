import { githubActions } from "@/actions/bevor";
import { GitHubIntegrationClient } from "@/app/(core)/user/github/manage/github-integration-client";
import Container from "@/components/container";
import { AsyncComponent } from "@/utils/types";

interface PageProps {
  searchParams: Promise<{ teamSlug?: string }>;
}

const GitHubManagePage: AsyncComponent<PageProps> = async ({ searchParams }) => {
  const { teamSlug } = await searchParams;

  const installations = await githubActions.getInstallations().then((r) => {
    if (!r.ok) throw r;
    return r.data;
  });
  const installationsList = installations?.installation_info?.installations || [];
  const defaultInstallationId = installationsList.length > 0 ? installationsList[0].id : null;

  return (
    <Container>
      <div className="max-w-5xl mx-auto mt-8 lg:mt-16">
        <div className="border-b pb-6 mb-8">
          <h1 className="text-2xl font-semibold mb-1">GitHub Integration</h1>
          <p className="text-sm text-muted-foreground">
            Manage your GitHub OAuth connection and app installations
          </p>
        </div>
        <GitHubIntegrationClient
          installations={installations}
          defaultInstallationId={defaultInstallationId}
          teamSlug={teamSlug}
        />
      </div>
    </Container>
  );
};

export default GitHubManagePage;
