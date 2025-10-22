import { teamActions } from "@/actions/bevor";
import Container from "@/components/container";
import { AsyncComponent } from "@/utils/types";
import MembersTabs, { MemberCreate } from "./members-tabs";

const MembersPage: AsyncComponent = async () => {
  // don't care to stream this.
  const team = await teamActions.getTeam();
  const curMember = await teamActions.getCurrentMember();

  return (
    <Container>
      <div className="flex flex-row mb-8 justify-between">
        <h3 className="text-foreground">Team Members</h3>
        {curMember.role === "owner" && <MemberCreate team={team} />}
      </div>
      <MembersTabs team={team} curMember={curMember} />
    </Container>
  );
};

export default MembersPage;
