import { analysisActions, codeActions } from "@/actions/bevor";
import Container from "@/components/container";
import AnalysisSubnav from "@/components/subnav/analysis";
import AnalysisMetadata from "@/components/views/analysis/metadata";
import GlobalChatPanel from "@/components/views/chat/global-panel";
import { CHAT_PANEL_COOKIE_NAME, getChatPanelStateFromCookie } from "@/lib/chat-panel-cookie";
import { getQueryClient } from "@/lib/config/query";
import { ChatProvider } from "@/providers/chat";
import { AsyncComponent } from "@/types";
import type { DraftFindingSchema } from "@/types/api/responses/security";
import { generateQueryKey } from "@/utils/constants";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { cookies } from "next/headers";
import AnalysisWorkspaceClient from "./analysis-workspace-client";

type ResolvedParams = {
  nodeId: string;
  teamSlug: string;
  projectSlug: string;
};

type Props = {
  params: Promise<ResolvedParams>;
  searchParams: Promise<{ findingId?: string; chatId?: string }>;
};

const AnalysisPage: AsyncComponent<Props> = async ({ params, searchParams }) => {
  const queryClient = getQueryClient();
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const cookieStore = await cookies();
  const chatPanelCookie = getChatPanelStateFromCookie(
    cookieStore.get(CHAT_PANEL_COOKIE_NAME)?.value,
  );

  let initialFinding: DraftFindingSchema | undefined;

  const [analysis, findings] = await Promise.all([
    queryClient.fetchQuery({
      queryKey: generateQueryKey.analysis(resolvedParams.nodeId),
      queryFn: () =>
        analysisActions.getAnalysis(resolvedParams.teamSlug, resolvedParams.nodeId).then((r) => {
          if (!r.ok) throw r;
          return r.data;
        }),
    }),
    queryClient.fetchQuery({
      queryKey: generateQueryKey.analysisFindings(resolvedParams.nodeId),
      queryFn: () =>
        analysisActions
          .getAnalysisFindings(resolvedParams.teamSlug, resolvedParams.nodeId)
          .then((r) => {
            if (!r.ok) throw r;
            return r.data;
          }),
    }),
  ]);

  const isOwner = analysis.is_owner;
  const codeVersionId = analysis.code_version_id;

  if (analysis.status === "waiting" || analysis.status === "processing") {
    await Promise.all([
      queryClient.fetchQuery({
        queryKey: generateQueryKey.code(codeVersionId),
        queryFn: () =>
          codeActions.getCodeVersion(resolvedParams.teamSlug, codeVersionId).then((r) => {
            if (!r.ok) throw r;
            return r.data;
          }),
      }),
      queryClient.fetchQuery({
        queryKey: generateQueryKey.analysisScopes(resolvedParams.nodeId),
        queryFn: () =>
          analysisActions.getScopes(resolvedParams.teamSlug, resolvedParams.nodeId).then((r) => {
            if (!r.ok) throw r;
            return r.data;
          }),
      }),
    ]);
  } else {
    await queryClient.fetchQuery({
      queryKey: generateQueryKey.codeFiles(codeVersionId),
      queryFn: () =>
        codeActions.getFiles(resolvedParams.teamSlug, codeVersionId).then((r) => {
          if (!r.ok) throw r;
          return r.data;
        }),
    });
  }

  if (resolvedSearchParams.findingId) {
    initialFinding = findings.find((finding) => finding.id == resolvedSearchParams.findingId);
  }

  return (
    <ChatProvider
      key={`${resolvedParams.nodeId}-analysis`}
      teamSlug={resolvedParams.teamSlug}
      projectSlug={resolvedParams.projectSlug}
      analysisId={resolvedParams.nodeId}
      initialChatId={resolvedSearchParams.chatId}
      open={chatPanelCookie.isExpanded || !!resolvedSearchParams.chatId}
      maximized={chatPanelCookie.isMaximized}
    >
      <div className="flex min-h-0 min-w-0 flex-1">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <HydrationBoundary state={dehydrate(queryClient)}>
            <Container subnav={<AnalysisSubnav />} contain>
              <AnalysisMetadata {...resolvedParams} allowActions isOwner={isOwner} />
              <AnalysisWorkspaceClient
                codeVersionId={codeVersionId}
                teamSlug={resolvedParams.teamSlug}
                projectSlug={resolvedParams.projectSlug}
                nodeId={resolvedParams.nodeId}
                initialFinding={initialFinding}
                isOwner={isOwner}
              />
            </Container>
          </HydrationBoundary>
        </div>
        <GlobalChatPanel />
      </div>
    </ChatProvider>
  );
};

export default AnalysisPage;
