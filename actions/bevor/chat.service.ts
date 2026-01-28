"use server";

import api from "@/lib/api";
import { generateQueryKey, QUERY_KEYS } from "@/utils/constants";
import { buildSearchParams } from "@/utils/query-params";
import { ApiResponse, ChatFullSchemaI, ChatMessageI, ChatPaginationI } from "@/utils/types";
import { QueryKey } from "@tanstack/react-query";

export const initiateCodeChat = async (
  teamSlug: string,
  data: { code_version_id: string },
): ApiResponse<{
  id: string;
  toInvalidate: QueryKey[];
}> => {
  console.log("SHOULD CALL", data);
  const toInvalidate = [[QUERY_KEYS.CHATS, teamSlug]];
  return api
    .post("/chats/code", data, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      console.log(response);
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: {
          id: response.data.id,
          toInvalidate,
        },
        requestId,
      };
    })
    .catch((error: any) => {
      console.log(error);
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const initiateAnalysisChat = async (
  teamSlug: string,
  data: { analysis_node_id: string },
): ApiResponse<{
  id: string;
  toInvalidate: QueryKey[];
}> => {
  const toInvalidate = [[QUERY_KEYS.CHATS, teamSlug]];
  return api
    .post("/chats/analysis", data, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: {
          id: response.data.id,
          toInvalidate,
        },
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const getChats = async (
  teamSlug: string,
  filters: { [key: string]: string },
): ApiResponse<ChatPaginationI> => {
  const searchParams = buildSearchParams(filters);
  return api
    .get(`/chats?${searchParams}`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data,
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const getChat = async (teamSlug: string, chatId: string): ApiResponse<ChatFullSchemaI> => {
  return api
    .get(`/chats/${chatId}`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data,
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const getChatMessages = async (
  teamSlug: string,
  chatId: string,
): ApiResponse<ChatMessageI[]> => {
  return api
    .get(`/chats/${chatId}/messages`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results,
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const update = async (
  teamSlug: string,
  chatId: string,
  data: { analysis_version_id: string },
): ApiResponse<{ toInvalidate: QueryKey[] }> => {
  // we do NOT allow for changing the code version within a chat. That should spawn a new chat thread
  // what we do allow for is "upgrading" a chat to start pulling in context of an analysis, or just changing the
  // analysis node that it looks like + manipulates.
  const toInvalidate = [generateQueryKey.chat(chatId)];
  return api
    .patch(`/chats/${chatId}`, data, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: { toInvalidate },
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};
