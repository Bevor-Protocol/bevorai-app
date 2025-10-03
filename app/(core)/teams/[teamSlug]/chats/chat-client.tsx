"use client";

import { bevorAction } from "@/actions";
import { Button } from "@/components/ui/button";
import { navigation } from "@/utils/navigation";
import { useMutation } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import React, { useEffect } from "react";

interface NewChatButtonProps {
  versionId: string;
  teamSlug: string;
  projectSlug: string;
}

export const NewChatButton: React.FC<NewChatButtonProps> = ({
  versionId,
  teamSlug,
  projectSlug,
}) => {
  const chatMutation = useMutation({
    mutationFn: () => bevorAction.initiateChat(versionId),
    onError: (error) => {
      console.log("failed to create chat", error);
    },
  });

  useEffect(() => {
    if (!chatMutation.isSuccess) return;
    window.location.href = navigation.chat.overview({
      teamSlug,
      projectSlug,
      versionId,
      chatId: chatMutation.data.id,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatMutation.isSuccess, chatMutation.data]);

  return (
    <Button onClick={() => chatMutation.mutate()} disabled={chatMutation.isPending}>
      <MessageSquare className="w-4 h-4 mr-2" />
      {chatMutation.isPending ? "Creating..." : "New Chat"}
    </Button>
  );
};
