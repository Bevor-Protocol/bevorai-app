import { teamActions } from "@/actions/bevor";
import Container from "@/components/container";
import TeamSubnav from "@/components/subnav/team";
import { Icon } from "@/components/ui/icon";
import { formatDate } from "@/utils/helpers";
import { AsyncComponent } from "@/utils/types";
import { Calendar } from "lucide-react";
import { AnalysesPreview, ProjectsSection, TeamActivities, TeamMembers } from "./team-client";

interface TeamPageProps {
  params: Promise<{ teamSlug: string }>;
}

const TeamPage: AsyncComponent<TeamPageProps> = async ({ params }) => {
  const { teamSlug } = await params;

  const team = await teamActions.getTeam(teamSlug);

  return (
    <Container subnav={<TeamSubnav />}>
      <div className="max-w-7xl mx-auto py-8">
        <div className="border-b pb-6">
          <h1 className="text-2xl font-semibold mb-2">{team.name}</h1>
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Owner:</span>
              <Icon size="sm" seed={team.created_by_user.id} />
              <span>{team.created_by_user.username}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Members:</span>
              <TeamMembers team={team} />
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="size-4" />
              <span>{formatDate(team.created_at)}</span>
            </div>
          </div>
        </div>
        <div className="py-6 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-10">
          <div className="min-w-0 space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Projects</h3>
              <ProjectsSection teamSlug={teamSlug} />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Recent Analysis Threads</h3>
              <AnalysesPreview teamSlug={teamSlug} />
            </div>
          </div>
          <div className="min-w-0">
            <TeamActivities teamSlug={teamSlug} />
          </div>
        </div>
      </div>
    </Container>
  );
};

export default TeamPage;
