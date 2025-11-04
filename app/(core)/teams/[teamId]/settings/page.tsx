import { teamActions } from "@/actions/bevor";
import { AsyncComponent } from "@/utils/types";
import SettingsPageClient from "./settings-page-client";

interface PageProps {
  params: Promise<{ teamId: string }>;
}

const TeamSettingsPage: AsyncComponent<PageProps> = async ({ params }) => {
  const { teamId } = await params;
  const member = await teamActions.getCurrentMember(teamId);
  const team = await teamActions.getTeam(teamId);

  return <SettingsPageClient team={team} member={member} />;
};

export default TeamSettingsPage;
