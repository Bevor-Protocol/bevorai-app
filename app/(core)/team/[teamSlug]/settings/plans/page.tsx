import { teamActions } from "@/actions/bevor";
import { MemberRoleEnum } from "@/utils/enums";
import { AsyncComponent } from "@/utils/types";
import { AccessRestricted, AddonsSection, PlansSection } from "./plans-page-client";

interface PageProps {
  params: Promise<{ teamSlug: string }>;
}

const PlansPage: AsyncComponent<PageProps> = async ({ params }) => {
  const { teamSlug } = await params;
  const team = await teamActions.getTeam(teamSlug);
  const membership = await teamActions.getCurrentMember(teamSlug);

  if (membership.role !== MemberRoleEnum.OWNER) {
    return <AccessRestricted />;
  }

  return (
    <>
      <div className="mb-12">
        <h2 className="text-xl font-semibold  mb-6">Available Plans</h2>
        <PlansSection team={team} />
      </div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold  mb-6">Optional Add-ons</h2>
        <AddonsSection teamSlug={teamSlug} />
      </div>
    </>
  );
};

export default PlansPage;
