import { AsyncComponent } from "@/utils/types";
import { bevorAction } from "@/actions";
import React from "react";
import SettingsPageClient from "./settings-page-client";

interface SettingsPageProps {
  params: Promise<{ teamSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const SettingsPage: AsyncComponent<SettingsPageProps> = async ({ params, searchParams }) => {
  const { teamSlug } = await params;
  const { updated } = await searchParams;
  const team = await bevorAction.getTeamBySlug(teamSlug);

  return <SettingsPageClient team={team} isUpdated={!!updated} />;
};

export default SettingsPage;
