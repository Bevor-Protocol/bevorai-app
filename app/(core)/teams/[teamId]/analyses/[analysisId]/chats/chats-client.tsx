"use client";

import { chatActions } from "@/actions/bevor";
import LucideIcon from "@/components/lucide-icon";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { QUERY_KEYS } from "@/utils/constants";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ChatGrid } from "./chat-grid";

export const ChatCreate: React.FC<{ teamId: string; analysisId: string }> = ({
  teamId,
  analysisId,
}) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const chatCreateMutation = useMutation({
    mutationFn: () => chatActions.initiateChat(teamId, analysisId),
    onSuccess: (data) => {
      toast.success("New chat created", {
        description: "Get started!",
        action: {
          label: "View",
          onClick: () => router.push(`/teams/${teamId}/chats/${data}`),
        },
        icon: <LucideIcon assetType="chat" />,
      });
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === QUERY_KEYS.CHATS && query.queryKey[1] === teamId,
      });
    },
  });

  return (
    <Button onClick={() => chatCreateMutation.mutate()} disabled={chatCreateMutation.isPending}>
      <Plus className="size-4" />
      New Chat
    </Button>
  );
};

const ChatsData: React.FC<{
  query: { [key: string]: string | undefined };
  teamId: string;
}> = ({ query, teamId }) => {
  const [filters, setFilters] = useState(query);

  const chatsQuery = useQuery({
    queryKey: [QUERY_KEYS.CHATS, teamId, filters],
    queryFn: () => chatActions.getChats(teamId, filters),
  });

  return (
    <div className="grow flex flex-col">
      <ChatGrid data={chatsQuery.data} isLoading={chatsQuery.isLoading} />
      <Pagination
        filters={filters}
        setFilters={setFilters}
        results={chatsQuery.data ?? { more: false, total_pages: 0 }}
        className="mt-auto"
      />
    </div>
  );
};

export default ChatsData;
