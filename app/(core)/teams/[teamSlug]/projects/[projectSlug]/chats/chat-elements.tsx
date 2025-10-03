import { formatDate } from "@/utils/helpers";
import { navigation } from "@/utils/navigation";
import { ChatResponseI } from "@/utils/types";
import { ChevronRight, Clock, MessageSquare } from "lucide-react";
import Link from "next/link";
import React from "react";

export const ChatElement: React.FC<{
  chat: ChatResponseI;
}> = ({ chat }) => (
  <Link
    href={navigation.chat.overview({
      teamSlug: chat.team_slug,
      projectSlug: chat.project_slug,
      versionId: chat.code_version_mapping_id,
      chatId: chat.id,
    })}
    className="block"
  >
    <div className="border border-neutral-800 rounded-lg p-4 hover:border-neutral-700 transition-all cursor-pointer">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <MessageSquare className="size-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-neutral-100">Chat #{chat.id.slice(-8)}</h3>
            <div className="flex items-center space-x-2 text-xs text-neutral-400">
              <span>{chat.total_messages} messages</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-xs text-neutral-500">
            <Clock className="w-3 h-3" />
            <span>{formatDate(chat.created_at)}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-500" />
        </div>
      </div>
    </div>
  </Link>
);

export const ChatElementLoader: React.FC = () => (
  <div className="border border-neutral-800 rounded-lg p-4 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-lg bg-neutral-800"></div>
        <div className="space-y-2">
          <div className="h-4 bg-neutral-800 rounded w-24"></div>
          <div className="h-3 bg-neutral-800 rounded w-16"></div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <div className="h-3 bg-neutral-800 rounded w-16"></div>
        <div className="w-4 h-4 bg-neutral-800 rounded"></div>
      </div>
    </div>
  </div>
);
