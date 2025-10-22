import { userActions } from "@/actions/bevor";
import TeamDisplay from "@/app/(core)/user/team-component";
import Container from "@/components/container";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/utils/helpers";
import { AsyncComponent } from "@/utils/types";
import { Suspense } from "react";
import { CreditSync } from "./settings/linked-accounts-client";

const Loading: React.FC = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Skeleton className="rounded-lg h-14" />
      <Skeleton className="rounded-lg h-14" />
      <Skeleton className="rounded-lg h-14" />
      <Skeleton className="rounded-lg h-14" />
    </div>
  );
};

const HeaderContent: AsyncComponent = async () => {
  const userInfo = await userActions.getUserInfo();
  const teams = userInfo.teams;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="text-center p-4 border border-border rounded-lg">
        <div className="text-2xl font-bold text-foreground mb-1">{teams.length}</div>
        <div className="text-sm text-muted-foreground">Teams</div>
      </div>

      <div className="text-center p-4 border border-border rounded-lg">
        <div className="text-2xl font-bold text-foreground mb-1">
          {teams.filter((team) => team.role === "owner").length}
        </div>
        <div className="text-sm text-muted-foreground">Teams Owned</div>
      </div>

      <div className="text-center p-4 border border-border rounded-lg">
        <div className="text-2xl font-bold text-foreground mb-1">
          {formatDate(userInfo.created_at)}
        </div>
        <div className="text-sm text-muted-foreground">Joined</div>
      </div>

      <CreditSync credits={userInfo.available_credits} />
    </div>
  );
};

const OtherContent: AsyncComponent = async () => {
  const userInfo = await userActions.getUserInfo();
  const teams = userInfo.teams;
  return (
    <div className="border border-border rounded-lg p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">Teams</h2>
      <div className="space-y-3">
        {teams.map((team) => (
          <TeamDisplay team={team} key={team.id} />
        ))}
      </div>
    </div>
  );
};

const UserPage: AsyncComponent = async () => {
  return (
    <Container>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">User Profile</h1>
        <p className="text-muted-foreground">Manage your account and linked services</p>
        <div className="flex flex-col gap-6">
          <Suspense fallback={<Loading />}>
            <HeaderContent />
          </Suspense>
          <OtherContent />
        </div>
      </div>
    </Container>
  );
};

export default UserPage;
