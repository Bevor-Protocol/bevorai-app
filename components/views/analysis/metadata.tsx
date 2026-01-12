"use client";

import { analysisActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { generateQueryKey } from "@/utils/constants";
import { formatDateShort } from "@/utils/helpers";
import { AnalysisNodeSchemaI } from "@/utils/types";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Check,
  Copy,
  Globe,
  Leaf,
  Lock,
  Pencil,
  TreeDeciduous,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import AnalysisVersionMenu from "./menu";

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

const AnalysisMetadata: React.FC<{
  teamSlug: string;
  projectSlug: string;
  nodeId: string;
  isEditMode: boolean;
  allowChat?: boolean;
  allowEditMode?: boolean;
  allowActions?: boolean;
  isOwner?: boolean;
}> = ({
  teamSlug,
  projectSlug,
  nodeId,
  isEditMode,
  allowChat = false,
  allowEditMode = false,
  allowActions = false,
  isOwner = false,
}) => {
  const { isCopied, copy } = useCopyToClipboard();

  const { data: version } = useSuspenseQuery({
    queryKey: generateQueryKey.analysisDetailed(nodeId),
    queryFn: async () =>
      analysisActions.getAnalysisDetailed(teamSlug, nodeId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });


  return (
    <div className="pt-3 pb-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap text-muted-foreground text-xs">
          <div className="flex items-center gap-1.5 text-xs">
            {version.is_public ? (
              <Globe className="size-3.5 text-blue-400" />
            ) : (
              <Lock className="size-3.5 text-muted-foreground" />
            )}
            <span className="text-muted-foreground">
              {version.is_public ? "Public" : "Private"}
            </span>
            {version.is_public && (
              <button
                onClick={() => copy(`${window.origin}/shared/${nodeId}`)}
                className="ml-0.5 p-0.5 hover:bg-muted rounded transition-colors"
                aria-label="Copy link"
              >
                {isCopied ? (
                  <Check className="size-3 text-green-400" />
                ) : (
                  <Copy className="size-3 text-muted-foreground" />
                )}
              </button>
            )}
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1.5 capitalize">
            {version.trigger.replace("_", " ")}
          </div>
          {(version.is_leaf || !version.parent_node_id) && (
            <>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-1 justify-start">
                {!version.parent_node_id && (
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 whitespace-nowrap shrink-0"
                    title="root"
                  >
                    <TreeDeciduous className="size-3" />
                  </span>
                )}
                {version.is_leaf && version.parent_node_id && (
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400 whitespace-nowrap shrink-0"
                    title="leaf"
                  >
                    <Leaf className="size-3" />
                  </span>
                )}
              </div>
            </>
          )}
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <Icon size="xs" seed={version.user.id} className="shrink-0" />
            <span className="truncate">{version.user.username}</span>
            <span>·</span>
            <span>{formatDateShort(version.created_at)}</span>
          </div>
          {version.status !== "success" && (
            <>
              <div className="h-4 w-px bg-border" />
              {getStatusIndicator(version.status)}
            </>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {allowEditMode && (
            <Button variant="outline" size="sm" asChild>
              <Link
                href={{
                  pathname: `/team/${teamSlug}/${projectSlug}/analyses/${version.id}`,
                  query: !isEditMode ? { mode: "edit" } : {},
                }}
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
          {allowActions ? (
            <AnalysisVersionMenu
              teamSlug={teamSlug}
              projectSlug={projectSlug}
              nodeId={nodeId}
              isOwner={isOwner}
              isPublic={version.is_public}
            />
          ) : (
            <Button variant="outline" asChild>
              <Link href={`/team/${teamSlug}/${projectSlug}/analyses/${nodeId}`}>Go To Source</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisMetadata;
