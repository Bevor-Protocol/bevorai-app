import { teamActions, userActions } from "@/actions/bevor";
import { AsyncComponent } from "@/utils/types";
import SettingsPageClient from "./settings-page-client";

interface PageProps {
  params: Promise<{ teamSlug: string }>;
}

const TeamSettingsPage: AsyncComponent<PageProps> = async ({ params }) => {
  const { teamSlug } = await params;

  const [member, team, user] = await Promise.all([
    teamActions.getCurrentMember(teamSlug),
    teamActions.getTeam(teamSlug),
    userActions.get(),
  ]);

  return <SettingsPageClient team={team} member={member} user={user} />;
};

export default TeamSettingsPage;
