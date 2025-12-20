import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatDate, truncateId } from "@/utils/helpers";
import { ChatSchemaI } from "@/utils/types";
import { Clock, MessageSquare, MoreHorizontal, User } from "lucide-react";
import Link from "next/link";
import React from "react";

type ChatElementProps = {
  chat: ChatSchemaI & { n: number };
  teamSlug: string;
  projectSlug: string;
  isDisabled?: boolean;
};

const ChatElementMenu: React.FC<{
  chat: ChatSchemaI;
  teamSlug: string;
  projectSlug: string;
}> = ({ chat, teamSlug, projectSlug }) => {
  const handleViewClick = (e: React.MouseEvent): void => {
    e.stopPropagation();
  };

  const handleArchiveClick = (e: React.MouseEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    // TODO: Add archive functionality
  };

  const viewPath =
    chat.chat_type === "analysis"
      ? `/team/${teamSlug}/${projectSlug}/analyses/${chat.analysis_node_id}`
      : `/team/${teamSlug}/${projectSlug}/codes/${chat.code_version_id}`;

  const viewLabel = chat.chat_type === "analysis" ? "View analysis" : "View code";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        asChild
        onClick={(e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <Button
          variant="ghost"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <MoreHorizontal className="size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem asChild>
          <Link href={viewPath} onClick={handleViewClick}>
            {viewLabel}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleArchiveClick}>Archive chat</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const ChatElementBare: React.FC<
  {
    chat: ChatSchemaI;
    teamSlug: string;
    projectSlug: string;
  } & React.ComponentProps<"div">
> = ({ chat, teamSlug, projectSlug, className, ...props }) => {
  const getChatTypeBadgeVariant = (
    chatType: "code" | "analysis" | undefined,
  ): "blue" | "purple" => {
    if (chatType === "analysis") return "purple";
    return "blue";
  };

  const mappingId = chat.analysis_node_id || chat.code_version_id;

  return (
    <div
      className={cn(
        "grid grid-cols-[24px_1fr_140px_120px_140px_160px_40px] items-center gap-4 py-3 px-4 border rounded-lg group-hover:border-foreground/30 transition-colors",
        className,
      )}
      {...props}
    >
      <div className="flex justify-center">
        <MessageSquare className="size-4 text-blue-400" />
      </div>
      <div className="min-w-0 flex items-center gap-2">
        <h3 className="text-sm font-medium truncate">Chat #{chat.id.slice(-6)}</h3>
        {chat.chat_type && (
          <Badge variant={getChatTypeBadgeVariant(chat.chat_type)} size="sm">
            {chat.chat_type}
          </Badge>
        )}
      </div>
      <div className="min-w-0">
        <code className="text-xs font-mono text-muted-foreground truncate block">
          {truncateId(mappingId)}...
        </code>
      </div>
      <div className="text-xs text-muted-foreground whitespace-nowrap text-right">
        {chat.total_messages
          ? `${chat.total_messages} message${chat.total_messages !== "1" ? "s" : ""}`
          : ""}
      </div>
      <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
        <User className="size-3" />
        <span>{chat.user.username}</span>
      </div>
      <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
        <Clock className="size-3" />
        <span>{formatDate(chat.created_at)}</span>
      </div>
      <ChatElementMenu chat={chat} teamSlug={teamSlug} projectSlug={projectSlug} />
    </div>
  );
};

export const ChatElement: React.FC<ChatElementProps> = ({
  chat,
  teamSlug,
  projectSlug,
  isDisabled = false,
}) => {
  const chatPath = `/team/${teamSlug}/${projectSlug}/chats/${chat.id}`;

  return (
    <Link
      href={isDisabled ? "#" : chatPath}
      onClick={(e) => {
        if (isDisabled) {
          e.preventDefault();
        }
      }}
      aria-disabled={isDisabled}
      className={cn("block group", isDisabled ? "cursor-default opacity-50" : "cursor-pointer")}
    >
      <ChatElementBare chat={chat} teamSlug={teamSlug} projectSlug={projectSlug} />
    </Link>
  );
};
