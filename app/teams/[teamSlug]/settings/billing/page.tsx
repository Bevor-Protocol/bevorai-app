import { bevorAction } from "@/actions";
import { AsyncComponent } from "@/utils/types";
import BillingPageClient from "./billing-page-client";

interface BillingPageProps {
  params: Promise<{ teamSlug: string }>;
}

const BillingPage: AsyncComponent<BillingPageProps> = async ({ params }) => {
  const { teamSlug } = await params;

  const team = await bevorAction.getTeam();

  return <BillingPageClient team={team} />;
};

export default BillingPage;
