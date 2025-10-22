import { teamActions } from "@/actions/bevor";
import { AsyncComponent } from "@/utils/types";
import PlansPageClient from "./plans-page-client";

const PlansPage: AsyncComponent = async () => {
  const team = await teamActions.getTeam();

  return <PlansPageClient team={team} />;
};

export default PlansPage;
