import { teamActions } from "@/actions/bevor";
import ContainerBreadcrumb from "@/components/breadcrumbs";
import Container from "@/components/container";
import { AsyncComponent } from "@/utils/types";
import SettingsPageClient from "./settings-page-client";

interface PageProps {
  params: Promise<{ teamSlug: string }>;
}

const TeamSettingsPage: AsyncComponent<PageProps> = async ({ params }) => {
  const { teamSlug } = await params;
  const member = await teamActions.getCurrentMember(teamSlug);
  const team = await teamActions.getTeam(teamSlug);

  return (
    <Container
      breadcrumb={
        <ContainerBreadcrumb
          queryKey={[teamSlug]}
          queryType="team-settings"
          teamSlug={teamSlug}
          id=""
        />
      }
    >
      <div className="max-w-5xl m-auto mt-8 lg:mt-16">
        <SettingsPageClient team={team} member={member} />
      </div>
    </Container>
  );
};

export default TeamSettingsPage;
