import { bevorAction } from "@/actions";
import { AsyncComponent } from "@/utils/types";
import PlansPageClient from "./plans-page-client";

const PlansPage: AsyncComponent = async () => {
  const team = await bevorAction.getTeam();

  return <PlansPageClient team={team} />;
};

export default PlansPage;
