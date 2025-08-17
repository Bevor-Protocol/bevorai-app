import { ChatContext } from "@/providers/chat";
import { ModalContext } from "@/providers/modal";
import { ChatContextType, ModalStateI } from "@/utils/types";
import { useContext } from "react";

export const useModal = (): ModalStateI => {
  const modal = useContext(ModalContext);

  const show = (content: React.ReactNode): void => {
    modal.setOpen("modal");
    modal.setContent(content);
  };

  return {
    show,
    hide: () => modal.setOpen("none"),
  };
};

export const useChat = (): ChatContextType => useContext(ChatContext);
