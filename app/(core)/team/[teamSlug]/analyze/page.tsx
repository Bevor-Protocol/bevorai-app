import Container from "@/components/container";
import TeamSubnav from "@/components/subnav/team";
import { AsyncComponent } from "@/types";
import AnalyzeClient from "./client";

const AnalyzePage: AsyncComponent<{
  params: Promise<{ teamSlug: string }>;
  searchParams: Promise<{ method?: string }>;
}> = async ({ params, searchParams }) => {
  const { teamSlug } = await params;
  const { method } = await searchParams;
  return (
    <Container subnav={<TeamSubnav />}>
      <AnalyzeClient teamSlug={teamSlug} initialMethod={method} />
    </Container>
  );
};

export default AnalyzePage;
