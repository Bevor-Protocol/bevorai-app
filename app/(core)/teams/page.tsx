import { bevorAction } from "@/actions";
import { AsyncComponent } from "@/utils/types";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const TeamBasePage: AsyncComponent = async () => {
  // cannot SET cookies in this context. can only GET them.
  const cookieStore = await cookies();
  const recentTeamId = cookieStore.get("bevor-recent-team")?.value;

  if (recentTeamId) {
    redirect(`/teams/${recentTeamId}`);
  }

  const teams = await bevorAction.getTeams();

  const defaultTeam = teams.find((team) => team.is_default);
  if (defaultTeam) {
    redirect(`/teams/${defaultTeam.id}`);
  }
  redirect(`/teams/${teams[0].id}`);
};

export default TeamBasePage;
