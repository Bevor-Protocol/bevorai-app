import { teamActions, userActions } from "@/actions/bevor";
import { AsyncComponent } from "@/utils/types";
import SettingsPageClient from "./settings-page-client";

interface PageProps {
  params: Promise<{ teamSlug: string }>;
}

const TeamSettingsPage: AsyncComponent<PageProps> = async ({ params }) => {
  const { teamSlug } = await params;

  const [member, team, user] = await Promise.all([
    teamActions.getCurrentMember(teamSlug).then((r) => {
      if (!r.ok) throw r;
      return r.data;
    }),
    teamActions.getTeam(teamSlug).then((r) => {
      if (!r.ok) throw r;
      return r.data;
    }),
    userActions.get().then((r) => {
      if (!r.ok) throw r;
      return r.data;
    }),
  ]);

  return <SettingsPageClient team={team} member={member} user={user} />;
};

export default TeamSettingsPage;
