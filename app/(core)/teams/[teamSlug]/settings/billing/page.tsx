import { teamActions } from "@/actions/bevor";
import ContainerBreadcrumb from "@/components/breadcrumbs";
import Container from "@/components/container";
import { AsyncComponent, MemberRoleEnum } from "@/utils/types";
import { Lock } from "lucide-react";
import BillingPageClient from "./billing-page-client";

interface PageProps {
  params: Promise<{ teamSlug: string }>;
}

const BillingPage: AsyncComponent<PageProps> = async ({ params }) => {
  const { teamSlug } = await params;
  const member = await teamActions.getCurrentMember(teamSlug);

  return (
    <Container
      breadcrumb={
        <ContainerBreadcrumb
          queryKey={[teamSlug]}
          queryType="team-settings"
          teamSlug={teamSlug}
          id=""
        />
      }
    >
      <div className="max-w-5xl m-auto mt-8 lg:mt-16">
        {member.role !== MemberRoleEnum.OWNER ? (
          <div className="text-center py-12">
            <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Access Restricted</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Only team owners can manage billing and subscription settings.
            </p>
          </div>
        ) : (
          <BillingPageClient teamSlug={teamSlug} />
        )}
      </div>
    </Container>
  );
};

export default BillingPage;
