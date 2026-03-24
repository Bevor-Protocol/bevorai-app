import { teamActions, userActions } from "@/actions/bevor";
import Container from "@/components/container";
import { OnboardingChecklist } from "@/components/onboarding/checklist";
import { OnboardingQuestionnaire } from "@/components/onboarding/questionnaire";
import TeamSubnav from "@/components/subnav/team";
import { Icon } from "@/components/ui/icon";
import { OnboardingPersona } from "@/hooks/useOnboarding";
import { getQueryClient } from "@/lib/config/query";
import { generateQueryKey } from "@/utils/constants";
import { formatDate } from "@/utils/helpers";
import { AsyncComponent } from "@/utils/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Calendar } from "lucide-react";
import { CreateProjectButton, ProjectsSection, TeamActivities, TeamMembers } from "./team-client";

interface TeamPageProps {
  params: Promise<{ teamSlug: string }>;
}

const TeamPage: AsyncComponent<TeamPageProps> = async ({ params }) => {
  const queryClient = getQueryClient();
  const { teamSlug } = await params;

  const [team, user] = await Promise.all([
    queryClient.fetchQuery({
      queryKey: generateQueryKey.team(teamSlug),
      queryFn: () =>
        teamActions.getTeam(teamSlug).then((r) => {
          if (!r.ok) throw r;
          return r.data;
        }),
    }),
    queryClient.fetchQuery({
      queryKey: generateQueryKey.currentUser(),
      queryFn: () =>
        userActions.get().then((r) => {
          if (!r.ok) throw r;
          return r.data;
        }),
    }),
  ]);

  const persona = (user.onboarding_persona as OnboardingPersona | null | undefined) ?? null;

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OnboardingQuestionnaire />
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
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Projects</h3>
                <CreateProjectButton teamSlug={teamSlug} />
              </div>
              <div className="space-y-4">
                <OnboardingChecklist teamSlug={teamSlug} persona={persona} />
                <ProjectsSection teamSlug={teamSlug} />
              </div>
            </div>
            <div className="min-w-0">
              <TeamActivities teamSlug={teamSlug} />
            </div>
          </div>
        </div>
      </Container>
    </HydrationBoundary>
  );
};

export default TeamPage;
