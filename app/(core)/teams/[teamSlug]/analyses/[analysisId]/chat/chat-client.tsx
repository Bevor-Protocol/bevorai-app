"use client";

import { chatActions } from "@/actions/bevor";
import { CreateChatFormValues } from "@/utils/schema";
import { ChatSchemaI } from "@/utils/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ChatMessages } from "./chat-messages";
import { Configuration } from "./configuration";
import { Sidebar } from "./sidebar";

interface ChatClientProps {
  teamSlug: string;
  analysisId: string;
  projectSlug: string;
  defaultChat: ChatSchemaI | null;
}

const ChatClient: React.FC<ChatClientProps> = ({
  teamSlug,
  analysisId,
  projectSlug,
  defaultChat,
}) => {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(defaultChat?.id ?? null);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (params: CreateChatFormValues) => chatActions.initiateChat(teamSlug, params),
    onSuccess: ({ id, toInvalidate }) => {
      toast.success("New chat created");
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      setSelectedChatId(id);
    },
    onError: () => {
      toast.error("Unable to create chat");
    },
  });

  return (
    <div className="flex gap-6 size-full">
      <div className="flex flex-col bg-background max-w-3xl m-auto grow min-h-0 size-full relative">
        {selectedChatId ? (
          <ChatMessages teamSlug={teamSlug} chatId={selectedChatId} />
        ) : (
          <>
            <div className="flex-1" />
            <Configuration
              teamSlug={teamSlug}
              analysisId={analysisId}
              projectSlug={projectSlug}
              createMutation={createMutation}
            />
          </>
        )}
      </div>
      <Sidebar
        teamSlug={teamSlug}
        analysisId={analysisId}
        projectSlug={projectSlug}
        selectedChatId={selectedChatId}
        onChatSelect={setSelectedChatId}
        onNewChat={() => setSelectedChatId(null)}
        isCreatingChat={createMutation.isPending}
        canCreateChat={true}
      />
    </div>
  );
};

export default ChatClient;
