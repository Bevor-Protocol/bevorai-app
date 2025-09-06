import { ChatContext } from "@/providers/chat";
import { ChatContextType } from "@/utils/types";
import { useContext } from "react";

export const useChat = (): ChatContextType => useContext(ChatContext);
