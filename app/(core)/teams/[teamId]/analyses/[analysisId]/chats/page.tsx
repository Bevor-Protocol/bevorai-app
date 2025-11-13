import ContainerBreadcrumb from "@/components/breadcrumbs";
import Container from "@/components/container";
import { extractAnalysisChatsQuery } from "@/utils/queries";
import { AsyncComponent } from "@/utils/types";
import ChatsData, { ChatCreate } from "./chats-client";

type ResolvedParams = {
  teamId: string;
  analysisId: string;
};

interface ChatsPageProps {
  params: Promise<ResolvedParams>;
  searchParams: Promise<{ [key: string]: string }>;
}

const ChatsPage: AsyncComponent<ChatsPageProps> = async ({ params, searchParams }) => {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const query = extractAnalysisChatsQuery(resolvedParams.analysisId, resolvedSearchParams);

  return (
    <Container
      breadcrumb={
        <ContainerBreadcrumb
          queryKey={[resolvedParams.analysisId]}
          queryType="analysis-chat"
          teamId={resolvedParams.teamId}
          id={resolvedParams.analysisId}
        />
      }
      className="flex flex-col"
    >
      <div className="flex flex-row mb-8 justify-between">
        <div className="flex flex-row items-center gap-4">
          <h3 className="text-foreground">Chats</h3>
        </div>
        <ChatCreate {...resolvedParams} />
      </div>
      <ChatsData teamId={resolvedParams.teamId} query={query} />
    </Container>
  );
};

export default ChatsPage;
