import { teamActions } from "@/actions/bevor";
import { AsyncComponent, MemberRoleEnum } from "@/utils/types";
import { Lock } from "lucide-react";
import BillingPageClient from "./billing-page-client";

interface PageProps {
  params: Promise<{ teamId: string }>;
}

const BillingPage: AsyncComponent<PageProps> = async ({ params }) => {
  const { teamId } = await params;
  const member = await teamActions.getCurrentMember(teamId);

  if (member.role !== MemberRoleEnum.OWNER) {
    return (
      <div className="px-6 py-8 bg-neutral-950 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Access Restricted</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Only team owners can manage billing and subscription settings.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <BillingPageClient teamId={teamId} />;
};

export default BillingPage;
