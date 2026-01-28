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
    // still need to prefetch the analysisDetailed for the AnalysisMetadata component.
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
        queryFn: async () =>
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

  const isOwner = analysis.is_owner;
  const codeVersionId = analysis.code_version_id;

  if (resolvedSearchParams.findingId) {
    initialFinding = analysis.findings.find(
      (finding) => finding.id == resolvedSearchParams.findingId,
    );
  }

  let initialChatId = resolvedSearchParams.chatId ?? null;

  if (isOwner) {
    const chatQuery = extractChatsQuery({
      project_slug: resolvedParams.projectSlug,
      code_version_id: codeVersionId,
      analysis_node_id: resolvedParams.nodeId,
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

  if (isEditMode && !isOwner) {
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
        codeId={codeVersionId}
        analysisNodeId={resolvedParams.nodeId}
      >
        <Container subnav={<AnalysisSubnav />} contain>
          <AnalysisMetadata
            {...resolvedParams}
            isEditMode={isEditMode}
            allowEditMode={isOwner}
            allowActions
            isOwner={isOwner}
          />
          {isEditMode ? (
            <EditClient
              teamSlug={resolvedParams.teamSlug}
              nodeId={resolvedParams.nodeId}
              projectSlug={resolvedParams.projectSlug}
            />
          ) : (
            <AnalysisClient
              teamSlug={resolvedParams.teamSlug}
              projectSlug={resolvedParams.projectSlug}
              nodeId={resolvedParams.nodeId}
              initialFinding={initialFinding}
              isOwner={isOwner}
            />
          )}
        </Container>
      </ChatProvider>
    </HydrationBoundary>
  );
};

export default AnalysisPage;
