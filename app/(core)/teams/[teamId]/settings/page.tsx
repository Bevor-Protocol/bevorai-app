import { bevorAction } from "@/actions";
import { AsyncComponent } from "@/utils/types";
import SettingsPageClient from "./settings-page-client";

interface SettingsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const SettingsPage: AsyncComponent<SettingsPageProps> = async ({ searchParams }) => {
  const { updated } = await searchParams;
  const team = await bevorAction.getTeam();

  return <SettingsPageClient team={team} isUpdated={!!updated} />;
};

export default SettingsPage;
