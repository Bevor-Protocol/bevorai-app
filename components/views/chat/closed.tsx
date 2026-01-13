import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { useChat } from "@/providers/chat";
import { MessageSquare } from "lucide-react";
import React from "react";

const ChatClosed: React.FC = () => {
  const { toggleExpanded } = useChat();

  return (
    <aside
      className="flex flex-col items-center justify-center min-h-0 bg-background border rounded-lg"
      style={{ width: "3rem" }}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleExpanded}
        title="Expand chat"
        className="size-full flex flex-col gap-2"
      >
        <MessageSquare className="size-4 text-muted-foreground" />
        <KbdGroup>
          <Kbd>⌘ + L</Kbd>
        </KbdGroup>
      </Button>
    </aside>
  );
};

export default ChatClosed;
