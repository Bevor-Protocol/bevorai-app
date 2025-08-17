import { bevorAction } from "@/actions";
import { getLastVisitedTeam } from "@/actions/cookies";
import { AsyncComponent } from "@/utils/types";
import { redirect } from "next/navigation";

const TeamBasePage: AsyncComponent = async () => {
  const lastVisitedTeamId = await getLastVisitedTeam();

  if (lastVisitedTeamId) {
    redirect(`/teams/${lastVisitedTeamId}`);
  }

  const teams = await bevorAction.getTeams();

  const defaultTeam = teams.find((team) => team.is_default);
  if (defaultTeam) {
    redirect(`/teams/${defaultTeam.slug}`);
  }

  redirect(`/teams/${teams[0].slug}`);
};

export default TeamBasePage;
