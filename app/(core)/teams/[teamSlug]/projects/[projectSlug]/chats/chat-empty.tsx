import { MessageSquare } from "lucide-react";
import React from "react";

export const ChatEmpty: React.FC<{ centered?: boolean }> = ({ centered = false }) => {
  if (!centered) {
    return (
      <div className="flex flex-col py-6 gap-2">
        <div className="flex flex-row gap-2 items-center">
          <MessageSquare className="size-6 text-neutral-600" />
          <h4 className="text-base font-medium text-neutral-300">No chats yet</h4>
        </div>
        <p className="text-sm text-neutral-500 pl-8">
          Start a conversation to get help with your code analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col py-12 justify-center items-center">
      <MessageSquare className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-neutral-300 mb-2">No chats yet</h3>
      <p className="text-sm text-neutral-500 mb-6 text-center">
        Start a conversation to get help with your code analysis.
      </p>
    </div>
  );
};
