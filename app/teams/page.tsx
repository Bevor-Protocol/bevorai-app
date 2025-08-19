import { bevorAction } from "@/actions";
import { AsyncComponent } from "@/utils/types";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const TeamBasePage: AsyncComponent = async () => {
  // cannot SET cookies in this context. can only GET them.
  const cookieStore = await cookies();
  const recentTeamSlug = cookieStore.get("bevor-recent-team")?.value;

  if (recentTeamSlug) {
    console.log("redirecting, recent team found", recentTeamSlug);
    redirect(`/teams/${recentTeamSlug}`);
  }

  const teams = await bevorAction.getTeams();

  const defaultTeam = teams.find((team) => team.is_default);
  if (defaultTeam) {
    redirect(`/teams/${defaultTeam.slug}`);
  }
  redirect(`/teams/${teams[0].slug}`);
};

export default TeamBasePage;
