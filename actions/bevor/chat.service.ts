"use server";

import api from "@/lib/api";
import { buildSearchParams } from "@/lib/utils";
import { ChatMessagesResponseI, ChatPaginationI, NodeSearchResponseI } from "@/utils/types";

export const initiateChat = async (teamId: string, analysisId: string): Promise<string> => {
  return api
    .post("/chats", { analysis_id: analysisId }, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data.id;
    });
};

export const getChats = async (
  teamId: string,
  filters: { [key: string]: string | undefined },
): Promise<ChatPaginationI> => {
  const searchParams = buildSearchParams(filters);
  return api
    .get(`/chats?${searchParams.toString()}`, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data;
    });
};

export const getChat = async (teamId: string, chatId: string): Promise<ChatMessagesResponseI> => {
  return api.get(`/chats/${chatId}`, { headers: { "bevor-team-id": teamId } }).then((response) => {
    return response.data;
  });
};

export const getChatAttributes = async (
  teamId: string,
  chatId: string,
): Promise<NodeSearchResponseI[]> => {
  return api
    .get(`/chats/${chatId}/attributes`, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data.results;
    });
};
