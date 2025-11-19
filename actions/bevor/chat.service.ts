"use server";

import api from "@/lib/api";
import { buildSearchParams } from "@/lib/utils";
import { generateQueryKey, QUERY_KEYS } from "@/utils/constants";
import { CreateChatFormValues } from "@/utils/schema";
import {
  ChatMessagesResponseI,
  ChatPaginationI,
  HeadFullSchemaI,
  NodeSearchResponseI,
} from "@/utils/types";
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
  filters: { [key: string]: string | undefined },
): Promise<ChatPaginationI> => {
  const searchParams = buildSearchParams(filters);
  return api
    .get(`/chats?${searchParams.toString()}`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data;
    });
};

export const getChat = async (teamSlug: string, chatId: string): Promise<ChatMessagesResponseI> => {
  return api
    .get(`/chats/${chatId}`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data;
    });
};

export const getChatHead = async (teamSlug: string, chatId: string): Promise<HeadFullSchemaI> => {
  return api
    .get(`/chats/${chatId}/head`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data;
    });
};

export const updateChatHead = async (
  teamSlug: string,
  chatId: string,
  data: { analysis_version_id?: string; code_version_id?: string; is_code_only?: boolean },
): Promise<{ toInvalidate: QueryKey[] }> => {
  const toInvalidate = [generateQueryKey.chatHead(chatId)];
  return api
    .post(`/chats/${chatId}/head`, data, { headers: { "bevor-team-slug": teamSlug } })
    .then(() => {
      return { toInvalidate };
    });
};

export const getChatAttributes = async (
  teamSlug: string,
  chatId: string,
): Promise<NodeSearchResponseI[]> => {
  return api
    .get(`/chats/${chatId}/attributes`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data.results;
    });
};
