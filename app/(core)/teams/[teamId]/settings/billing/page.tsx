import { teamActions } from "@/actions/bevor";
import { AsyncComponent } from "@/utils/types";
import BillingPageClient from "./billing-page-client";

const BillingPage: AsyncComponent = async () => {
  const team = await teamActions.getTeam();

  return <BillingPageClient team={team} />;
};

export default BillingPage;
