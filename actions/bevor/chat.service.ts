"use server";

import { graphApi, securityApi } from "@/lib/api";
import { ApiResponse } from "@/types/api";
import { ChatIndex, ChatMessageSchema } from "@/types/api/responses/chat";
import { ChatFullSchema } from "@/types/api/responses/graph";
import { Pagination } from "@/types/api/responses/shared";
import { generateQueryKey, QUERY_KEYS } from "@/utils/constants";
import { buildSearchParams } from "@/utils/query-params";
import { QueryKey } from "@tanstack/react-query";

export const initiateCodeChat = async (
  teamSlug: string,
  data: { code_version_id: string },
): ApiResponse<{
  id: string;
  toInvalidate: QueryKey[];
}> => {
  const toInvalidate = [[QUERY_KEYS.CHATS, teamSlug]];
  return graphApi
    .post("/chats/code", data, { headers: { "bevor-team-slug": teamSlug } })
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

export const initiateAnalysisChat = async (
  teamSlug: string,
  data: { analysis_node_id: string },
): ApiResponse<{
  id: string;
  toInvalidate: QueryKey[];
}> => {
  const toInvalidate = [[QUERY_KEYS.CHATS, teamSlug]];
  return securityApi
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

export const getCodeChats = async (
  teamSlug: string,
  filters: { [key: string]: string },
): ApiResponse<Pagination<ChatIndex>> => {
  const searchParams = buildSearchParams(filters);
  return graphApi
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

export const getSecurityChats = async (
  teamSlug: string,
  filters: { [key: string]: string },
): ApiResponse<Pagination<ChatIndex>> => {
  const searchParams = buildSearchParams(filters);
  return graphApi
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

export const getCodeChat = async (
  teamSlug: string,
  chatId: string,
): ApiResponse<ChatFullSchema> => {
  return graphApi
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

export const getSecurityChat = async (
  teamSlug: string,
  chatId: string,
): ApiResponse<ChatFullSchema> => {
  return securityApi
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
): ApiResponse<ChatMessageSchema[]> => {
  return graphApi
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
  return graphApi
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
