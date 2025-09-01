import { bevorAction } from "@/actions";
import { AsyncComponent } from "@/utils/types";
import MembersTabs from "./members-tabs";

const MembersPage: AsyncComponent = async () => {
  // don't care to stream this.
  const team = await bevorAction.getTeam();
  const curMember = await bevorAction.getCurrentMember();

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-4">
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-neutral-100">Team Members</h3>
          <p className="text-neutral-400">Manage members and invites</p>
        </div>
        <MembersTabs team={team} curMember={curMember} />
      </div>
    </div>
  );
};

export default MembersPage;
