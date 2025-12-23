"use client";

import { chatActions, codeActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { generateQueryKey } from "@/utils/constants";
import { SourceTypeEnum } from "@/utils/enums";
import { explorerUrl, formatDateShort, truncateId, truncateVersion } from "@/utils/helpers";
import { extractChatsQuery } from "@/utils/query-params";
import { CodeMappingSchemaI } from "@/utils/types";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { BotMessageSquare, GitCommit, Network, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import CodeVersionMenu from "./code-version-menu";

const getStatusIndicator = (status: CodeMappingSchemaI["status"]): React.ReactNode => {
  switch (status) {
    case "waiting":
      return (
        <div className="flex items-center gap-1">
          <div className="size-2 rounded-full bg-neutral-400 shrink-0 animate-pulse" />
          <span className="capitalize">Waiting</span>
        </div>
      );
    case "embedding":
    case "parsing":
    case "parsed":
      return (
        <div className="flex items-center gap-1">
          <div className="size-3 rounded-full bg-blue-400 shrink-0 animate-pulse" />
          <span className="capitalize">Post-Processing</span>
        </div>
      );
    case "failed_parsing":
    case "failed_embedding":
      return (
        <div className="flex items-center gap-1">
          <XCircle className="size-3 text-destructive shrink-0" />
          <span className="capitalize">Failed</span>
        </div>
      );
    default:
      return null;
  }
};

const VersionDisplay: React.FC<{ version: CodeMappingSchemaI }> = ({ version }) => {
  if (
    [SourceTypeEnum.PASTE, SourceTypeEnum.UPLOAD_FILE, SourceTypeEnum.UPLOAD_FOLDER].includes(
      version.source_type,
    )
  ) {
    return null;
  }

  if (version.source_type === SourceTypeEnum.SCAN && version.network) {
    const url = explorerUrl(version.network, version.version_identifier);

    return (
      <Button asChild variant="ghost" className="text-xs  font-mono">
        <a href={url} target="_blank" referrerPolicy="no-referrer">
          <span>{truncateVersion(version.version_identifier)}</span>
          <span className="mx-1">|</span>
          <Network className="size-4" />
          <span>{version.network}</span>
        </a>
      </Button>
    );
  }

  if (version.source_type === SourceTypeEnum.REPOSITORY && version.repository) {
    const url = version.repository.url + "/commit/" + version.commit?.sha;
    return (
      <Button asChild variant="ghost" className="text-xs font-mono">
        <a href={url} target="_blank" referrerPolicy="no-referrer">
          <span>{version.commit?.branch}</span>
          <GitCommit className="size-3" />
          <span>{truncateId(version.version_identifier)}</span>
        </a>
      </Button>
    );
  }
};

const CodeMetadata: React.FC<{
  teamSlug: string;
  projectSlug: string;
  userId: string;
  codeId: string;
  allowActions?: boolean;
}> = ({ teamSlug, projectSlug, codeId, userId, allowActions }) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: version } = useSuspenseQuery({
    queryKey: generateQueryKey.code(codeId),
    queryFn: () => codeActions.getCodeVersion(teamSlug, codeId),
  });

  const chatQuery = extractChatsQuery({
    project_slug: projectSlug,
    code_version_id: version.id,
    chat_type: "code",
  });

  const { data: chats } = useQuery({
    queryKey: generateQueryKey.chats(teamSlug, chatQuery),
    queryFn: () => chatActions.getChats(teamSlug, chatQuery),
  });

  const createChatMutation = useMutation({
    mutationFn: async () =>
      chatActions.initiateChat(teamSlug, {
        chat_type: "code",
        code_version_id: version.id,
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
    if (version.status !== "success") return;
    if (chats && chats.results.length > 0) {
      const firstChatId = chats.results[0].id;
      const chatPath = `/team/${teamSlug}/${projectSlug}/chats/${firstChatId}`;
      router.push(chatPath);
    } else {
      createChatMutation.mutate();
    }
  };

  return (
    <div className="grid pb-4 lg:pt-4 px-2" style={{ gridTemplateColumns: "250px 1fr" }}>
      <h3>{version.inferred_name}</h3>
      <div className="flex justify-between gap-10">
        <div className="flex items-center justify-end w-full gap-3 text-sm text-muted-foreground">
          {getStatusIndicator(version.status)}
          <VersionDisplay version={version} />
          <div className="flex items-center gap-1.5">
            <Icon size="xs" seed={version.user.id} className="shrink-0" />
            <span className="truncate">{version.user.username}</span>
            <span>·</span>
            <span>{formatDateShort(version.commit?.timestamp ?? version.created_at)}</span>
          </div>
          {allowActions && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleChatClick}
              disabled={createChatMutation.isPending || version.status !== "success"}
            >
              <BotMessageSquare className="size-4" />
              {chats && chats.results.length > 0 ? "Continue Chat" : "Start Chat"}
            </Button>
          )}
          {allowActions ? (
            <CodeVersionMenu
              version={version}
              teamSlug={teamSlug}
              projectSlug={projectSlug}
              userId={userId}
            />
          ) : (
            <Button variant="outline" asChild>
              <Link href={`/team/${teamSlug}/${projectSlug}/codes/${codeId}`}>Go To Source</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeMetadata;
