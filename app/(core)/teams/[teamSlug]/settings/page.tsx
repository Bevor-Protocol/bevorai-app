import { teamActions } from "@/actions/bevor";
import { AsyncComponent } from "@/utils/types";
import SettingsPageClient from "./settings-page-client";

interface PageProps {
  params: Promise<{ teamSlug: string }>;
}

const TeamSettingsPage: AsyncComponent<PageProps> = async ({ params }) => {
  const { teamSlug } = await params;
  const member = await teamActions.getCurrentMember(teamSlug);
  const team = await teamActions.getTeam(teamSlug);

  return <SettingsPageClient team={team} member={member} />;
};

export default TeamSettingsPage;
