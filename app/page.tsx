"use server";

import { userActions } from "@/actions/bevor";
import { AsyncComponent } from "@/utils/types";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

interface MainProps {
  searchParams: Promise<{ is_signup?: "true" }>;
}

const MainPage: AsyncComponent<MainProps> = async ({ searchParams }) => {
  const { is_signup } = await searchParams;
  const cookieStore = await cookies();
  const recentTeamSlug = cookieStore.get("bevor-recent-team");
  const token = cookieStore.get("bevor-token");

  if (!token) {
    redirect("/sign-in");
  }

  const querySuffix = is_signup === "true" ? "?is_signup=true" : "";

  if (recentTeamSlug?.value) {
    redirect(`/team/${recentTeamSlug.value}${querySuffix}`);
  }

  let defaultTeam;
  try {
    const teams = await userActions.teams().then((r) => {
      if (!r.ok) throw r;
      return r.data;
    });
    defaultTeam = teams.find((team) => team.is_default);
  } catch {
    redirect("/sign-in");
  }

  if (defaultTeam) {
    redirect(`/team/${defaultTeam.slug}${querySuffix}`);
  }

  redirect("/sign-in");
};

export default MainPage;
