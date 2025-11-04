import { teamActions } from "@/actions/bevor";
import { AsyncComponent } from "@/utils/types";
import PlansPageClient from "./plans-page-client";

interface PageProps {
  params: Promise<{ teamId: string }>;
}

const PlansPage: AsyncComponent<PageProps> = async ({ params }) => {
  const { teamId } = await params;
  const team = await teamActions.getTeam(teamId);

  return <PlansPageClient team={team} />;
};

export default PlansPage;
