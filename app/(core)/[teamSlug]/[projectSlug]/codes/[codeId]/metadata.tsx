"use client";

import { chatActions, codeActions } from "@/actions/bevor";
import NodeSearch from "@/app/(core)/[teamSlug]/[projectSlug]/codes/[codeId]/search";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CodeVersionElementCompact } from "@/components/versions/element";
import { useCode } from "@/providers/code";
import { generateQueryKey } from "@/utils/constants";
import { formatDate, truncateVersion } from "@/utils/helpers";
import { DefaultAnalysisThreadsQuery, extractChatsQuery } from "@/utils/query-params";
import { CodeMappingSchemaI } from "@/utils/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, GitBranch, MessageSquare, Network } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import CodeVersionMenu from "./code-version-menu";
import Relations from "./relations";

const CodeMetadata: React.FC<{
  teamSlug: string;
  projectSlug: string;
  version: CodeMappingSchemaI;
  analysisQuery: typeof DefaultAnalysisThreadsQuery;
}> = ({ teamSlug, projectSlug, version, analysisQuery }) => {
  const { isSticky } = useCode();
  const queryClient = useQueryClient();
  const router = useRouter();

  const chatQuery = extractChatsQuery({
    project_slug: projectSlug,
    code_mapping_id: version.id,
    chat_type: "code",
  });

  const { data: chats } = useQuery({
    queryKey: generateQueryKey.chats(teamSlug, chatQuery),
    queryFn: () => chatActions.getChats(teamSlug, chatQuery),
  });

  const { data: similarVersions } = useQuery({
    queryKey: generateQueryKey.codeSimilarity(version.id),
    queryFn: () => codeActions.getCodeVersionSimilar(teamSlug, version.id),
    enabled: !version.parent_id,
  });

  const updateParentMutation = useMutation({
    mutationFn: async (parentId: string) =>
      codeActions.updateCodeVersionParent(teamSlug, version.id, parentId),
    onSuccess: ({ toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      toast.success("Parent version updated");
    },
    onError: () => {
      toast.error("Failed to update parent version");
    },
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

  const showSimilarPrompt = !version.parent_id && similarVersions && similarVersions.length > 0;

  return (
    <div className="grid pb-4 lg:pt-4 px-2" style={{ gridTemplateColumns: "250px 1fr" }}>
      <h3>{version.inferred_name}</h3>
      <div className="flex justify-between gap-10">
        {!isSticky && (
          <NodeSearch
            teamSlug={teamSlug}
            codeId={version.id}
            className="flex-1 justify-start basis-1/2"
          />
        )}
        <div className="flex items-center justify-end w-full gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1 whitespace-nowrap">
            <span>Method: {version.version.source_type}</span>
          </div>
          {version.version.network && (
            <div className="flex items-center gap-1 whitespace-nowrap">
              <Network className="size-4" />
              <span>{version.version.network}</span>
            </div>
          )}
          {version.version.solc_version && (
            <div className="flex items-center gap-1 whitespace-nowrap">
              {truncateVersion({
                versionMethod: version.version.version_method,
                versionIdentifier: version.version.version_identifier,
              })}
            </div>
          )}
          <div className="flex items-center gap-1 whitespace-nowrap">
            <Calendar className="size-4" />
            <span>{formatDate(version.created_at)}</span>
          </div>

          <Relations version={version} teamSlug={teamSlug} />
          <Button
            variant="outline"
            size="sm"
            onClick={handleChatClick}
            disabled={createChatMutation.isPending}
          >
            <MessageSquare className="size-4" />
            {chats && chats.results.length > 0 ? "Continue" : "Start"}
          </Button>
          {showSimilarPrompt && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="relative">
                  <GitBranch className="size-4" />
                  {similarVersions.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-blue-500 text-[10px] text-white">
                      {similarVersions.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[500px]">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm">Similar versions found</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      This version doesn&apos;t have a parent. Consider linking it to one of these:
                    </p>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {similarVersions.map(({ version: similarVersion, score }) => (
                      <div
                        key={similarVersion.id}
                        className="flex items-center justify-between gap-2 p-2 rounded border"
                      >
                        <Link
                          href={`/${teamSlug}/${projectSlug}/codes/${similarVersion.id}`}
                          className="flex-1 min-w-0 hover:opacity-80 transition-opacity"
                        >
                          <CodeVersionElementCompact version={similarVersion} />
                        </Link>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {Math.round(score * 100)}%
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateParentMutation.mutate(similarVersion.id)}
                            disabled={updateParentMutation.isPending}
                            className="text-xs h-7"
                          >
                            Set parent
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
          <CodeVersionMenu
            version={version}
            teamSlug={teamSlug}
            projectSlug={projectSlug}
            analysisQuery={analysisQuery}
          />
        </div>
      </div>
    </div>
  );
};

export default CodeMetadata;
