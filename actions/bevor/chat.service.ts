"use server";

import api from "@/lib/api";
import {
  ChatAttributeI,
  ChatMessagesResponseI,
  ChatPagination,
  ChatResponseI,
} from "@/utils/types";

export const initiateChat = async (versionId: string): Promise<ChatResponseI> => {
  return api.post("/chats", { version_mapping_id: versionId }).then((response) => {
    return response.data;
  });
};

export const getChats = async (
  filters: { [key: string]: string } = {},
): Promise<ChatPagination> => {
  const searchParams = new URLSearchParams(filters);
  searchParams.set("page_size", filters.page_size ?? "10");

  return api.get(`/chats?${searchParams.toString()}`).then((response) => {
    return response.data;
  });
};

export const getChat = async (chatId: string): Promise<ChatMessagesResponseI> => {
  return api.get(`/chats/${chatId}`).then((response) => {
    return response.data;
  });
};

export const getChatAttributes = async (chatId: string): Promise<ChatAttributeI[]> => {
  return api.get(`/chats/${chatId}/attributes`).then((response) => {
    return response.data.results;
  });
};
