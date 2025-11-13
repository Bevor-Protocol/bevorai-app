import { teamActions } from "@/actions/bevor";
import ContainerBreadcrumb from "@/components/breadcrumbs";
import Container from "@/components/container";
import { Icon } from "@/components/ui/icon";
import { formatDate } from "@/utils/helpers";
import { AsyncComponent } from "@/utils/types";
import { Calendar } from "lucide-react";
import {
  AnalysesPreview,
  ProjectsSection,
  TeamActivities,
  TeamMembers,
  TeamToggle,
} from "./team-client";

interface TeamPageProps {
  params: Promise<{ teamId: string }>;
}

const TeamPage: AsyncComponent<TeamPageProps> = async ({ params }) => {
  const { teamId } = await params;

  const team = await teamActions.getTeam(teamId);

  return (
    <Container
      breadcrumb={
        <ContainerBreadcrumb
          queryKey={[teamId]}
          queryType="team"
          teamId={teamId}
          id=""
          toggle={<TeamToggle teamId={teamId} />}
        />
      }
    >
      <div className="max-w-5xl m-auto mt-8 lg:mt-16">
        <div className="flex flex-col gap-6">
          <h1>{team.name}</h1>
          <div className="flex flex-row gap-10 items-center">
            <div className="flex flex-row gap-2 items-center">
              <div className="text-muted-foreground">Owner:</div>
              <Icon size="sm" seed={team.created_by_user.id} />
              <div>{team.created_by_user.username}</div>
            </div>
            <div className="flex flex-row gap-2 items-center">
              <div className="text-muted-foreground">Members:</div>
              <TeamMembers team={team} />
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
            <div className="flex items-center gap-1">
              <Calendar className="size-4" />
              <span>{formatDate(team.created_at)}</span>
            </div>
          </div>

          <div className="flex flex-row justify-between gap-10">
            <div className="basis-1/2">
              <div>
                <h3 className="my-6">Recent Projects</h3>
                <ProjectsSection teamId={teamId} />
              </div>
              <div>
                <h3 className="my-6">Recent Analyses</h3>
                <AnalysesPreview teamId={teamId} />
              </div>
            </div>
            <div className="basis-1/2 my-6">
              <TeamActivities teamId={teamId} />
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default TeamPage;
