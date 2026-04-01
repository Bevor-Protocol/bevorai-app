"use server";

import { apiRequest, withRequestId } from "@/actions/base";
import { graphApi, securityApi } from "@/lib/api";
import { GraphChatsQueryParams, SecurityChatsQueryParams } from "@/types/api/requests/chat";
import { ChatIndex, ChatMessageSchema } from "@/types/api/responses/chat";
import { ChatFullSchema } from "@/types/api/responses/graph";
import { Pagination } from "@/types/api/responses/shared";
import { generateQueryKey, QUERY_KEYS } from "@/utils/constants";
import { buildSearchParams } from "@/utils/query-params";
import { QueryKey } from "@tanstack/react-query";

export const initiateCodeChat = apiRequest<
  [teamSlug: string, data: { code_version_id: string }],
  { id: string; toInvalidate: QueryKey[] }
>(async (teamSlug, data) => {
  const toInvalidate = [[QUERY_KEYS.CHATS, teamSlug]];
  return graphApi
    .post("/chats/code", data, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) =>
      withRequestId(response, {
        id: response.data.id,
        toInvalidate,
      }),
    );
});

export const initiateAnalysisChat = apiRequest<
  [teamSlug: string, data: { analysis_id: string }],
  { id: string; toInvalidate: QueryKey[] }
>(async (teamSlug, data) => {
  const toInvalidate = [[QUERY_KEYS.CHATS, teamSlug]];
  return securityApi
    .post("/chats/analysis", data, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) =>
      withRequestId(response, {
        id: response.data.id,
        toInvalidate,
      }),
    );
});

export const getCodeChats = apiRequest<
  [teamSlug: string, query: GraphChatsQueryParams],
  Pagination<ChatIndex>
>(async (teamSlug, query) => {
  const searchParams = buildSearchParams(query as { [key: string]: string });
  return graphApi
    .get(`/chats?${searchParams}`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => withRequestId(response, response.data));
});

export const getSecurityChats = apiRequest<
  [teamSlug: string, query: SecurityChatsQueryParams],
  Pagination<ChatIndex>
>(async (teamSlug, query) => {
  const searchParams = buildSearchParams(query as { [key: string]: string });
  return graphApi
    .get(`/chats?${searchParams}`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => withRequestId(response, response.data));
});

export const getCodeChat = apiRequest<[teamSlug: string, chatId: string], ChatFullSchema>(
  async (teamSlug, chatId) =>
    graphApi
      .get(`/chats/${chatId}`, { headers: { "bevor-team-slug": teamSlug } })
      .then((response) => withRequestId(response, response.data)),
);

export const getSecurityChat = apiRequest<[teamSlug: string, chatId: string], ChatFullSchema>(
  async (teamSlug, chatId) =>
    securityApi
      .get(`/chats/${chatId}`, { headers: { "bevor-team-slug": teamSlug } })
      .then((response) => withRequestId(response, response.data)),
);

export const getChatStreamKey = apiRequest<
  [teamSlug: string, chatId: string, service: "graph" | "security"],
  string
>(async (teamSlug, chatId, service) => {
  const client = service === "graph" ? graphApi : securityApi;
  return client
    .post(`/chats/${chatId}/stream-key`, {}, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => withRequestId(response, response.data.stream_key as string));
});

export const getChatMessages = apiRequest<[teamSlug: string, chatId: string], ChatMessageSchema[]>(
  async (teamSlug, chatId) =>
    graphApi
      .get(`/chats/${chatId}/messages`, { headers: { "bevor-team-slug": teamSlug } })
      .then((response) => withRequestId(response, response.data.results)),
);

// we do NOT allow for changing the code version within a chat. That should spawn a new chat thread
// what we do allow for is "upgrading" a chat to start pulling in context of an analysis, or just changing the
// analysis node that it looks like + manipulates.
export const update = apiRequest<
  [teamSlug: string, chatId: string, data: { analysis_version_id: string }],
  { toInvalidate: QueryKey[] }
>(async (teamSlug, chatId, data) => {
  const toInvalidate = [generateQueryKey.chat(chatId)];
  return graphApi
    .patch(`/chats/${chatId}`, data, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => withRequestId(response, { toInvalidate }));
});
