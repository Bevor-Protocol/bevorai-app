import { chatActions, codeActions, userActions } from "@/actions/bevor";
import Container from "@/components/container";
import CodeVersionSubnav from "@/components/subnav/code-version";
import CodeMetadata from "@/components/views/code/metadata";
import SourcesViewer from "@/components/views/code/sources-viewer";
import { getQueryClient } from "@/lib/config/query";
import { CodeProvider } from "@/providers/code";
import { generateQueryKey } from "@/utils/constants";
import { extractChatsQuery } from "@/utils/query-params";
import { AsyncComponent } from "@/utils/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import CollapsibleChatPanel from "./collapsible-chat-panel";

type ResolvedParams = {
  codeId: string;
  projectSlug: string;
  teamSlug: string;
};

type Props = {
  params: Promise<ResolvedParams>;
  searchParams: Promise<{ source?: string; node?: string; chatId?: string }>;
};

const SourcesPage: AsyncComponent<Props> = async ({ params, searchParams }) => {
  const queryClient = getQueryClient();
  const resolvedParams = await params;
  const { source, node, chatId } = await searchParams;

  const [code, sources, user] = await Promise.all([
    queryClient.fetchQuery({
      queryKey: generateQueryKey.code(resolvedParams.codeId),
      queryFn: () =>
        codeActions.getCodeVersion(resolvedParams.teamSlug, resolvedParams.codeId).then((r) => {
          if (!r.ok) throw r;
          return r.data;
        }),
    }),
    queryClient.fetchQuery({
      queryKey: generateQueryKey.codeSources(resolvedParams.codeId),
      queryFn: () =>
        codeActions.getSources(resolvedParams.teamSlug, resolvedParams.codeId).then((r) => {
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

  const chatQuery = extractChatsQuery({
    project_slug: resolvedParams.projectSlug,
    code_version_id: code.id,
    chat_type: "code",
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

  if (chatId) {
    chatPromises.push(
      queryClient.fetchQuery({
        queryKey: generateQueryKey.chat(chatId),
        queryFn: () =>
          chatActions.getChat(resolvedParams.teamSlug, chatId).then((r) => {
            if (!r.ok) throw r;
            return r.data;
          }),
      }),
    );
  }

  await Promise.all(chatPromises);
  // Prefetch the initial source data so it's available immediately on the client
  let initialSourceId = source ?? null;
  if (initialSourceId) {
    // validate that the query param exists on this code version. If not, unset it, default to first.
    if (!sources.find((s) => s.id == source)) {
      initialSourceId = null;
    }
  }
  if (!initialSourceId) {
    initialSourceId = sources.length ? sources[0].id : null;
  }

  let position: { start: number; end: number } | undefined;
  if (node) {
    const fetchedNode = await queryClient.fetchQuery({
      queryKey: generateQueryKey.codeNode(node),
      queryFn: () =>
        codeActions.getNode(resolvedParams.teamSlug, resolvedParams.codeId, node).then((r) => {
          if (!r.ok) throw r;
          return r.data;
        }),
    });
    position = { start: fetchedNode.src_start_pos, end: fetchedNode.src_end_pos };
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CodeProvider
        initialSourceId={initialSourceId}
        initialPosition={position}
        {...resolvedParams}
      >
        <Container subnav={<CodeVersionSubnav />} contain>
          <CodeMetadata userId={user.id} {...resolvedParams} allowActions />
          <div className="flex flex-1 min-h-0 gap-4">
            <div className="min-h-0 flex-1">
              <SourcesViewer {...resolvedParams} />
            </div>
            <CollapsibleChatPanel {...resolvedParams} />
          </div>
        </Container>
      </CodeProvider>
    </HydrationBoundary>
  );
};

export default SourcesPage;
