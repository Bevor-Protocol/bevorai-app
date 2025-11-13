import { teamActions } from "@/actions/bevor";
import { AsyncComponent, MemberRoleEnum } from "@/utils/types";
import PlansPageClient, { AccessRestricted } from "./plans-page-client";

interface PageProps {
  params: Promise<{ teamId: string }>;
}

const PlansPage: AsyncComponent<PageProps> = async ({ params }) => {
  const { teamId } = await params;
  const team = await teamActions.getTeam(teamId);
  const membership = await teamActions.getCurrentMember(teamId);

  if (membership.role !== MemberRoleEnum.OWNER) {
    return <AccessRestricted />;
  }

  return <PlansPageClient team={team} />;
};

export default PlansPage;
