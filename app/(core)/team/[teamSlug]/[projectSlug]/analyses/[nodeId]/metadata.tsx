"use client";

import { analysisActions, chatActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import { generateQueryKey } from "@/utils/constants";
import { formatDate } from "@/utils/helpers";
import { extractChatsQuery } from "@/utils/query-params";
import { AnalysisNodeSchemaI } from "@/utils/types";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  BotMessageSquare,
  Calendar,
  Clock,
  Pencil,
  Shield,
  Users,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import AnalysisVersionMenu from "./menu";

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

const getStatusIndicator = (status: AnalysisNodeSchemaI["status"]): React.ReactNode => {
  switch (status) {
    case "waiting":
      return (
        <div className="flex items-center gap-1">
          <div className="size-2 rounded-full bg-neutral-400 shrink-0 animate-pulse" />
          <span className="capitalize">Waiting</span>
        </div>
      );
    case "processing":
      return (
        <div className="flex items-center gap-1">
          <div className="size-3 rounded-full bg-blue-400 shrink-0 animate-pulse" />
          <span className="capitalize">Processing</span>
        </div>
      );
    case "failed":
      return (
        <div className="flex items-center gap-1">
          <XCircle className="size-3 text-destructive shrink-0" />
          <span className="capitalize">Failed</span>
        </div>
      );
    case "partial":
      return (
        <div className="flex items-center gap-1">
          <AlertCircle className="size-3 text-yellow-400 shrink-0" />
          <span className="capitalize">Partial</span>
        </div>
      );
    default:
      return null;
  }
};

const AnalysisNodeMetadata: React.FC<{
  teamSlug: string;
  projectSlug: string;
  nodeId: string;
  isEditMode: boolean;
  allowEditMode?: boolean;
}> = ({ teamSlug, projectSlug, nodeId, isEditMode, allowEditMode = false }) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: version } = useSuspenseQuery({
    queryKey: generateQueryKey.analysisDetailed(nodeId),
    queryFn: async () => analysisActions.getAnalysisDetailed(teamSlug, nodeId),
  });

  const chatQuery = extractChatsQuery({
    project_slug: projectSlug,
    code_version_id: version.code_version_id,
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
      router.push(`/team/${teamSlug}/${projectSlug}/chats/${id}`);
    },
    onError: () => {
      toast.error("Failed to create chat");
    },
  });

  const handleChatClick = (): void => {
    if (chats && chats.results.length > 0) {
      const firstChatId = chats.results[0].id;
      const chatPath = `/team/${teamSlug}/${projectSlug}/chats/${firstChatId}`;
      router.push(chatPath);
    } else {
      createChatMutation.mutate();
    }
  };

  return (
    <div className="flex items-center justify-end gap-4 text-sm text-muted-foreground">
      {version.status !== "success" && getStatusIndicator(version.status)}
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
      <Button
        variant="outline"
        size="sm"
        onClick={handleChatClick}
        disabled={createChatMutation.isPending}
      >
        <BotMessageSquare className="size-4" />
        {chats && chats.results.length > 0 ? "Continue" : "Start"}
      </Button>
      {allowEditMode && (
        <Button variant="outline" size="sm" asChild>
          <Link
            href={
              isEditMode
                ? `/team/${teamSlug}/${projectSlug}/analyses/${version.id}`
                : `/team/${teamSlug}/${projectSlug}/analyses/${version.id}?mode=edit`
            }
          >
            {isEditMode ? (
              <>
                <X className="size-4" />
                Exit Edit
              </>
            ) : (
              <>
                <Pencil className="size-4" />
                Edit
              </>
            )}
          </Link>
        </Button>
      )}
      <AnalysisVersionMenu teamSlug={teamSlug} projectSlug={projectSlug} nodeId={nodeId} />
    </div>
  );
};

export default AnalysisNodeMetadata;
