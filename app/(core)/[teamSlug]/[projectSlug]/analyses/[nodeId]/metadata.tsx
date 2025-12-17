"use client";

import { chatActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import { generateQueryKey } from "@/utils/constants";
import { formatDate } from "@/utils/helpers";
import { extractChatsQuery } from "@/utils/query-params";
import { AnalysisNodeSchemaI } from "@/utils/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Clock, MessageSquare, Shield, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import AnalysisVersionMenu from "./menu";
import Relations from "./relations";

const getTriggerIcon = (trigger: string): React.ReactElement => {
  switch (trigger) {
    case "manual_run":
      return <Users className="size-4" />;
    case "chat":
      return <Shield className="size-4" />;
    case "forked":
      return <Clock className="size-4" />;
    case "manual_edit":
      return <Users className="size-4" />;
    default:
      return <Shield className="size-4" />;
  }
};

const AnalysisNodeMetadata: React.FC<{
  teamSlug: string;
  projectSlug: string;
  version: AnalysisNodeSchemaI;
  isEditMode: boolean;
}> = ({ teamSlug, projectSlug, version, isEditMode }) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const chatQuery = extractChatsQuery({
    project_slug: projectSlug,
    code_mapping_id: version.id,
    analysis_node_id: version.id,
    chat_type: "analysis",
  });

  const { data: chats } = useQuery({
    queryKey: generateQueryKey.chats(teamSlug, chatQuery),
    queryFn: () => chatActions.getChats(teamSlug, chatQuery),
  });

  const createChatMutation = useMutation({
    mutationFn: async () =>
      chatActions.initiateChat(teamSlug, {
        chat_type: "analysis",
        code_version_id: version.code_version_id,
        analysis_node_id: version.id,
      }),
    onSuccess: ({ id, toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      router.push(`/${teamSlug}/${projectSlug}/chats/${id}`);
    },
    onError: () => {
      toast.error("Failed to create chat");
    },
  });

  const handleChatClick = (): void => {
    if (chats && chats.results.length > 0) {
      const firstChatId = chats.results[0].id;
      const chatPath = `/${teamSlug}/${projectSlug}/chats/${firstChatId}`;
      router.push(chatPath);
    } else {
      createChatMutation.mutate();
    }
  };

  return (
    <div className="flex items-center justify-end gap-4 text-sm text-muted-foreground">
      <div className="flex items-center gap-1">
        {getTriggerIcon(version.trigger)}
        <span className="capitalize">{version.trigger.replace("_", " ")}</span>
      </div>
      <div className="flex items-center gap-1">
        <Shield className="size-3 text-purple-400" />
        <span>{version.n_scopes} scopes</span>
      </div>
      <div className="flex items-center gap-1">
        <Shield className="size-3 text-orange-400" />
        <span>{version.n_findings} findings</span>
      </div>
      <div className="flex items-center gap-1">
        <Calendar className="size-3" />
        <span>{formatDate(version.created_at)}</span>
      </div>
      <Relations analysisVersion={version} teamSlug={teamSlug} projectSlug={projectSlug} />
      <Button
        variant="outline"
        size="sm"
        onClick={handleChatClick}
        disabled={createChatMutation.isPending}
      >
        <MessageSquare className="size-4" />
        {chats && chats.results.length > 0 ? "Continue" : "Start"}
      </Button>
      <Button variant="outline" asChild>
        <Link
          href={
            isEditMode
              ? `/${teamSlug}/${projectSlug}/analyses/${version.id}`
              : `/${teamSlug}/${projectSlug}/analyses/${version.id}?mode=edit`
          }
        >
          {isEditMode ? "Exit Edit Mode" : "Edit Mode"}
        </Link>
      </Button>
      <AnalysisVersionMenu teamSlug={teamSlug} projectSlug={projectSlug} version={version} />
    </div>
  );
};

export default AnalysisNodeMetadata;
