import { analysisActions, chatActions } from "@/actions/bevor";
import Container from "@/components/container";
import AnalysisSubnav from "@/components/subnav/analysis";
import AnalysisMetadata from "@/components/views/analysis/metadata";
import { getQueryClient } from "@/lib/config/query";
import { ChatProvider } from "@/providers/chat";
import { generateQueryKey } from "@/utils/constants";
import { extractChatsQuery } from "@/utils/query-params";
import { AnalysisNodeSchemaI, AsyncComponent, FindingSchemaI } from "@/utils/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import AnalysisClient from "./analysis-client";
import { EditClient } from "./edit-mode";

type ResolvedParams = {
  nodeId: string;
  teamSlug: string;
  projectSlug: string;
};

type Props = {
  params: Promise<ResolvedParams>;
  searchParams: Promise<{ mode?: string; findingId?: string; chatId?: string }>;
};

const AnalysisPage: AsyncComponent<Props> = async ({ params, searchParams }) => {
  const queryClient = getQueryClient();
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const isEditMode = resolvedSearchParams.mode === "edit";
  let analysis: AnalysisNodeSchemaI;
  let initialFinding: FindingSchemaI | undefined;

  if (isEditMode) {
    [, analysis] = await Promise.all([
      queryClient.fetchQuery({
        queryKey: generateQueryKey.analysisDraft(resolvedParams.nodeId),
        queryFn: () =>
          analysisActions.getDraft(resolvedParams.teamSlug, resolvedParams.nodeId).then((r) => {
            if (!r.ok) throw r;
            return r.data;
          }),
      }),
      queryClient.fetchQuery({
        queryKey: generateQueryKey.analysisDetailed(resolvedParams.nodeId),
        queryFn: () =>
          analysisActions
            .getAnalysisDetailed(resolvedParams.teamSlug, resolvedParams.nodeId)
            .then((r) => {
              if (!r.ok) throw r;
              return r.data;
            }),
      }),
    ]);
  } else {
    analysis = await queryClient.fetchQuery({
      queryKey: generateQueryKey.analysisDetailed(resolvedParams.nodeId),
      queryFn: async () =>
        analysisActions
          .getAnalysisDetailed(resolvedParams.teamSlug, resolvedParams.nodeId)
          .then((r) => {
            if (!r.ok) throw r;
            return r.data;
          }),
    });
  }

  if (!isEditMode && resolvedSearchParams.findingId) {
    initialFinding = analysis.findings.find(
      (finding) => finding.id === resolvedSearchParams.findingId,
    );
  }

  let initialChatId = resolvedSearchParams.chatId ?? null;

  if (analysis.is_owner) {
    const chatQuery = extractChatsQuery({
      project_slug: resolvedParams.projectSlug,
      code_version_id: analysis.code_version_id,
      analysis_node_id: analysis.id,
      chat_type: "analysis",
    });

    const chatPromises = [
      queryClient.fetchQuery({
        queryKey: generateQueryKey.chats(resolvedParams.teamSlug, chatQuery),
        queryFn: () =>
          chatActions.getChats(resolvedParams.teamSlug, chatQuery).then((r) => {
            if (!r.ok) throw r;
            return r.data;
          }),
      }),
    ];

    if (resolvedSearchParams.chatId) {
      chatPromises.push(
        queryClient.fetchQuery({
          queryKey: generateQueryKey.chat(resolvedSearchParams.chatId),
          queryFn: () =>
            chatActions.getChat(resolvedParams.teamSlug, resolvedSearchParams.chatId!).then((r) => {
              if (!r.ok) throw r;
              return r.data;
            }),
        }),
      );
    }

    const chatResults = await Promise.all(chatPromises);
    if (!initialChatId) {
      const chats = chatResults[0];
      initialChatId = chats && chats.results.length ? chats.results[0].id : null;
    }
  }

  if (isEditMode && !analysis.is_owner) {
    // non-owners should not be allowed to edit, strip out the query param.
    let url = `/team/${resolvedParams.teamSlug}/${resolvedParams.projectSlug}/analyses/${resolvedParams.nodeId}`;
    if (resolvedSearchParams.findingId) {
      url += `?findingId=${resolvedSearchParams.findingId}`;
    }
    redirect(url);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ChatProvider
        {...resolvedParams}
        chatType="analysis"
        initialChatId={initialChatId}
        codeId={analysis.code_version_id}
        analysisNodeId={analysis.id}
      >
        <Container subnav={<AnalysisSubnav />} contain>
          <AnalysisMetadata
            {...resolvedParams}
            isEditMode={isEditMode}
            allowChat={analysis.is_owner}
            allowEditMode={analysis.is_owner}
            allowActions
            isOwner={analysis.is_owner}
          />
          {isEditMode ? (
            <div className="flex flex-1 min-h-0 gap-4">
              <div className="min-h-0 min-w-0 flex-1">
                <EditClient
                  teamSlug={resolvedParams.teamSlug}
                  nodeId={resolvedParams.nodeId}
                  projectSlug={resolvedParams.projectSlug}
                />
              </div>
            </div>
          ) : (
            <AnalysisClient
              teamSlug={resolvedParams.teamSlug}
              projectSlug={resolvedParams.projectSlug}
              nodeId={resolvedParams.nodeId}
              initialFinding={initialFinding}
              isOwner={analysis.is_owner}
            />
          )}
        </Container>
      </ChatProvider>
    </HydrationBoundary>
  );
};

export default AnalysisPage;
