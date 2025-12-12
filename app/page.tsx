"use server";

import { userActions } from "@/actions/bevor";
import { AsyncComponent } from "@/utils/types";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

interface MainProps {
  searchParams: Promise<{ is_signup?: "true" }>;
}

const MainPage: AsyncComponent<MainProps> = async ({ searchParams }) => {
  console.log("HIT");
  const { is_signup } = await searchParams;
  const cookieStore = await cookies();
  const recentTeamSlug = cookieStore.get("bevor-recent-team");

  const querySuffix = is_signup === "true" ? "?is_signup=true" : "";

  console.log("recent team", recentTeamSlug?.value);

  if (recentTeamSlug?.value) {
    redirect(`/${recentTeamSlug.value}${querySuffix}`);
  }

  const teams = await userActions.teams();
  const defaultTeam = teams.find((team) => team.is_default);

  if (defaultTeam) {
    redirect(`/${defaultTeam.slug}${querySuffix}`);
  }

  redirect("/sign-in");
};

export default MainPage;
