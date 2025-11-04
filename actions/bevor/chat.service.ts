"use server";

import api from "@/lib/api";
import { ChatAttributeI, ChatMessagesResponseI, ChatPaginationI } from "@/utils/types";

export const initiateChat = async (teamId: string, versionId: string): Promise<string> => {
  return api
    .post("/chats", { version_mapping_id: versionId }, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data.id;
    });
};

export const getChats = async (
  teamId: string,
  filters?: { [key: string]: string },
): Promise<ChatPaginationI> => {
  const searchParams = new URLSearchParams(filters);
  searchParams.set("page_size", filters?.page_size ?? "10");

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
): Promise<ChatAttributeI[]> => {
  return api
    .get(`/chats/${chatId}/attributes`, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data.results;
    });
};
