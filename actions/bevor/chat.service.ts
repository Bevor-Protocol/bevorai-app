"use server";

import api from "@/lib/api";
import { generateQueryKey, QUERY_KEYS } from "@/utils/constants";
import { buildSearchParams } from "@/utils/query-params";
import { CreateChatFormValues } from "@/utils/schema";
import { ChatFullSchemaI, ChatMessageI, ChatPaginationI } from "@/utils/types";
import { QueryKey } from "@tanstack/react-query";

export const initiateChat = async (
  teamSlug: string,
  data: CreateChatFormValues,
): Promise<{
  id: string;
  toInvalidate: QueryKey[];
}> => {
  const toInvalidate = [[QUERY_KEYS.CHATS, teamSlug]];
  return api.post("/chats", data, { headers: { "bevor-team-slug": teamSlug } }).then((response) => {
    return {
      id: response.data.id,
      toInvalidate,
    };
  });
};

export const getChats = async (
  teamSlug: string,
  filters: { [key: string]: string },
): Promise<ChatPaginationI> => {
  const searchParams = buildSearchParams(filters);
  return api
    .get(`/chats?${searchParams}`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data;
    });
};

export const getChat = async (teamSlug: string, chatId: string): Promise<ChatFullSchemaI> => {
  return api
    .get(`/chats/${chatId}`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data;
    });
};

export const getChatMessages = async (
  teamSlug: string,
  chatId: string,
): Promise<ChatMessageI[]> => {
  return api
    .get(`/chats/${chatId}/messages`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data.results;
    });
};

export const update = async (
  teamSlug: string,
  chatId: string,
  data: { analysis_version_id: string },
): Promise<{ toInvalidate: QueryKey[] }> => {
  // we do NOT allow for changing the code version within a chat. That should spawn a new chat thread
  // what we do allow for is "upgrading" a chat to start pulling in context of an analysis, or just changing the
  // analysis node that it looks like + manipulates.
  const toInvalidate = [generateQueryKey.chat(chatId)];
  return api
    .patch(`/chats/${chatId}`, data, { headers: { "bevor-team-slug": teamSlug } })
    .then(() => {
      return { toInvalidate };
    });
};
