import { teamActions } from "@/actions/bevor";
import { AsyncComponent, MemberRoleEnum } from "@/utils/types";
import { Lock } from "lucide-react";
import BillingPageClient from "./billing-page-client";

interface PageProps {
  params: Promise<{ teamSlug: string }>;
}

const BillingPage: AsyncComponent<PageProps> = async ({ params }) => {
  const { teamSlug } = await params;
  const member = await teamActions.getCurrentMember(teamSlug);

  if (member.role !== MemberRoleEnum.OWNER) {
    return (
      <div className="text-center py-12">
        <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold  mb-2">Access Restricted</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Only team owners can manage billing and subscription settings.
        </p>
      </div>
    );
  }

  return <BillingPageClient teamSlug={teamSlug} />;
};

export default BillingPage;
