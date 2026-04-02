import { TeamAnalyzePageClient } from "@/app/(core)/team/[teamSlug]/team-client";
import Container from "@/components/container";
import TeamSubnav from "@/components/subnav/team";
import { AsyncComponent } from "@/types";

const AnalyzePage: AsyncComponent<{
  params: Promise<{ teamSlug: string }>;
  searchParams: Promise<{ method?: string }>;
}> = async ({ params, searchParams }) => {
  const { teamSlug } = await params;
  const { method } = await searchParams;
  return (
    <Container subnav={<TeamSubnav />}>
      <TeamAnalyzePageClient teamSlug={teamSlug} initialMethod={method} />
    </Container>
  );
};

export default AnalyzePage;
