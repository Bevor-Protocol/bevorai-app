import { bevorAction } from "@/actions";
import { AsyncComponent } from "@/utils/types";
import BillingPageClient from "./billing-page-client";

const BillingPage: AsyncComponent = async () => {
  const team = await bevorAction.getTeam();

  return <BillingPageClient team={team} />;
};

export default BillingPage;
