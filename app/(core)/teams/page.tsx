"use server";

import { dashboardActions } from "@/actions/bevor";
import { AsyncComponent } from "@/utils/types";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const TeamsPage: AsyncComponent = async () => {
  const cookieStore = await cookies();
  const recentTeamSlug = cookieStore.get("bevor-recent-team");
  if (recentTeamSlug?.value) {
    redirect(`/teams/${recentTeamSlug.value}`);
  }

  const teams = await dashboardActions.getTeams();
  const defaultTeam = teams.find((team) => team.is_default);

  if (defaultTeam) {
    redirect(`/teams/${defaultTeam.slug}`);
  }

  redirect("/sign-in");
};

export default TeamsPage;
