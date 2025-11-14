import { teamActions } from "@/actions/bevor";
import ContainerBreadcrumb from "@/components/breadcrumbs";
import Container from "@/components/container";
import { AsyncComponent } from "@/utils/types";
import SettingsPageClient from "./settings-page-client";

interface PageProps {
  params: Promise<{ teamId: string }>;
}

const TeamSettingsPage: AsyncComponent<PageProps> = async ({ params }) => {
  const { teamId } = await params;
  const member = await teamActions.getCurrentMember(teamId);
  const team = await teamActions.getTeam(teamId);

  return (
    <Container
      breadcrumb={
        <ContainerBreadcrumb queryKey={[teamId]} queryType="team-settings" teamId={teamId} id="" />
      }
    >
      <div className="max-w-5xl m-auto mt-8 lg:mt-16">
        <SettingsPageClient team={team} member={member} />
      </div>
    </Container>
  );
};

export default TeamSettingsPage;
