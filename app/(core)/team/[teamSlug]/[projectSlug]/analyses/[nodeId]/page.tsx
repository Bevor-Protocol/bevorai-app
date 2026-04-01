import { analysisActions, chatActions, codeActions } from "@/actions/bevor";
import Container from "@/components/container";
import AnalysisSubnav from "@/components/subnav/analysis";
import AnalysisMetadata from "@/components/views/analysis/metadata";
import { getQueryClient } from "@/lib/config/query";
import { ChatProvider } from "@/providers/chat";
import { AsyncComponent } from "@/types";
import { DraftFindingSchema } from "@/types/api/responses/security";
import { generateQueryKey } from "@/utils/constants";
import { extractQueryParams } from "@/utils/query-params";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import AnalysisClient from "./analysis-client";

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

  // Prefetch code files so CodeProvider has them immediately
  await queryClient.prefetchQuery({
    queryKey: generateQueryKey.codeFiles(codeVersionId),
    queryFn: () =>
      codeActions.getFiles(resolvedParams.teamSlug, codeVersionId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  if (resolvedSearchParams.findingId) {
    initialFinding = findings.find((finding) => finding.id == resolvedSearchParams.findingId);
  }

  let initialChatId = resolvedSearchParams.chatId ?? null;

  if (isOwner) {
    const chatQuery = extractQueryParams({
      project_slug: resolvedParams.projectSlug,
      code_version_id: codeVersionId,
      analysis_id: resolvedParams.nodeId,
      chat_type: "analysis",
    });

    const chatPromises = [
      queryClient.fetchQuery({
        queryKey: generateQueryKey.chats(resolvedParams.teamSlug, chatQuery),
        queryFn: () =>
          chatActions.getSecurityChats(resolvedParams.teamSlug, chatQuery).then((r) => {
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
            chatActions
              .getSecurityChat(resolvedParams.teamSlug, resolvedSearchParams.chatId!)
              .then((r) => {
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
          <AnalysisMetadata {...resolvedParams} allowActions isOwner={isOwner} />
          <AnalysisClient
            codeVersionId={codeVersionId}
            teamSlug={resolvedParams.teamSlug}
            projectSlug={resolvedParams.projectSlug}
            nodeId={resolvedParams.nodeId}
            initialFinding={initialFinding}
            isOwner={isOwner}
          />
        </Container>
      </ChatProvider>
    </HydrationBoundary>
  );
};

export default AnalysisPage;
