import api from "@/lib/api";
import { ChatMessagesResponseI, ChatResponseI, ChatWithAuditResponseI } from "@/utils/types";

class ChatService {
  async initiateChat(auditId: string): Promise<ChatResponseI> {
    return api.post(`/chat/initiate/${auditId}`, {}).then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data;
    });
  }

  async getChats(): Promise<ChatWithAuditResponseI[]> {
    return api.get("/chat/list").then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data.results;
    });
  }

  async getChat(chatId: string): Promise<ChatMessagesResponseI> {
    return api.get(`/chat/${chatId}`).then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data;
    });
  }
}

const chatService = new ChatService();
export default chatService;
