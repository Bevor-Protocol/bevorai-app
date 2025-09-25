import api from "@/lib/api";
import { ChatMessagesResponseI, ChatPagination, ChatResponseI } from "@/utils/types";

class ChatService {
  async initiateChat(versionId: string): Promise<ChatResponseI> {
    return api.post("/chats", { version_mapping_id: versionId }).then((response) => {
      return response.data;
    });
  }

  async getChats(filters: { [key: string]: string } = {}): Promise<ChatPagination> {
    const searchParams = new URLSearchParams(filters);
    searchParams.set("page_size", filters.page_size ?? "10");

    return api.get(`/chats?${searchParams.toString()}`).then((response) => {
      return response.data;
    });
  }

  async getChat(chatId: string): Promise<ChatMessagesResponseI> {
    return api.get(`/chats/${chatId}`).then((response) => {
      return response.data;
    });
  }
}

const chatService = new ChatService();
export default chatService;
