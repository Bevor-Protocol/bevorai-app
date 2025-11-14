import { teamActions } from "@/actions/bevor";
import ContainerBreadcrumb from "@/components/breadcrumbs";
import Container from "@/components/container";
import { AsyncComponent, MemberRoleEnum } from "@/utils/types";
import { AccessRestricted, AddonsSection, PlansSection } from "./plans-page-client";

interface PageProps {
  params: Promise<{ teamId: string }>;
}

const PlansPage: AsyncComponent<PageProps> = async ({ params }) => {
  const { teamId } = await params;
  const team = await teamActions.getTeam(teamId);
  const membership = await teamActions.getCurrentMember(teamId);

  return (
    <Container
      breadcrumb={
        <ContainerBreadcrumb queryKey={[teamId]} queryType="team-settings" teamId={teamId} id="" />
      }
    >
      <div className="max-w-5xl m-auto mt-8 lg:mt-16">
        {membership.role !== MemberRoleEnum.OWNER ? (
          <AccessRestricted />
        ) : (
          <>
            <div className="mb-12">
              <h2 className="text-xl font-semibold text-foreground mb-6">Available Plans</h2>
              <PlansSection team={team} />
            </div>
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-6">Optional Add-ons</h2>
              <AddonsSection teamId={team.id} />
            </div>
          </>
        )}
      </div>
    </Container>
  );
};

export default PlansPage;
