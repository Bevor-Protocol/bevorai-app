"use client";

import { analysisActions, codeActions } from "@/actions/bevor";
import { AnalysisVersionPreviewElement } from "@/components/analysis/element";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getStatusIndicator } from "@/components/versions/element";
import { generateQueryKey } from "@/utils/constants";
import { SourceTypeEnum } from "@/utils/enums";
import { explorerUrl, formatDateShort, truncateId, truncateVersion } from "@/utils/helpers";
import { extractAnalysisNodesQuery } from "@/utils/query-params";
import { CodeMappingSchemaI } from "@/utils/types";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { GitCommit, Network, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import CodeVersionMenu from "./code-version-menu";

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
          <span>{version.branch}</span>
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
    queryFn: () =>
      codeActions.getCodeVersion(teamSlug, codeId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  const analysisQuery = extractAnalysisNodesQuery({
    project_slug: projectSlug,
    code_version_id: version.id,
  });

  const parentAnalysisQuery = extractAnalysisNodesQuery({
    project_slug: projectSlug,
    code_version_id: version.parent_id,
  });

  const [analyzeDialogOpen, setAnalyzeDialogOpen] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string>("");

  const { data: analyses } = useQuery({
    queryKey: generateQueryKey.analyses(teamSlug, analysisQuery),
    queryFn: () =>
      analysisActions.getAnalyses(teamSlug, analysisQuery).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  const { data: parentAnalyses = { results: [] } } = useQuery({
    queryKey: generateQueryKey.analyses(teamSlug, parentAnalysisQuery),
    queryFn: () =>
      analysisActions.getAnalyses(teamSlug, parentAnalysisQuery).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    enabled: !!version.parent_id,
  });

  const userAnalyses = useMemo(() => {
    if (!analyses?.results) return [];
    return analyses.results
      .filter((analysis) => analysis.user.id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [analyses, userId]);

  const userParentAnalyses = useMemo(() => {
    if (!parentAnalyses?.results) return [];
    return parentAnalyses.results
      .filter((analysis) => analysis.user.id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [parentAnalyses, userId]);

  const candidateParents = useMemo(() => {
    if (userAnalyses.length > 0) {
      return userAnalyses;
    }
    if (userParentAnalyses.length > 0 && version.parent_id) {
      return userParentAnalyses;
    }
    return [];
  }, [userAnalyses, userParentAnalyses, version.parent_id]);

  const isFromCurrentCodeVersion = userAnalyses.length > 0;

  const handleAnalyzeClick = (): void => {
    if (candidateParents.length > 0) {
      setSelectedParentId(candidateParents[0]?.id || "");
      setAnalyzeDialogOpen(true);
    } else {
      router.push(`/team/${teamSlug}/${projectSlug}/analyses/new?codeVersionId=${version.id}`);
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
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAnalyzeClick}
                disabled={version.status !== "success"}
              >
                <Shield className="size-4" />
                Analyze
              </Button>
            </>
          )}
          {allowActions ? (
            <CodeVersionMenu version={version} teamSlug={teamSlug} projectSlug={projectSlug} />
          ) : (
            <Button variant="outline" asChild>
              <Link href={`/team/${teamSlug}/${projectSlug}/codes/${codeId}`}>Go To Source</Link>
            </Button>
          )}
        </div>
      </div>
      <Dialog open={analyzeDialogOpen} onOpenChange={setAnalyzeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Analysis</DialogTitle>
            <DialogDescription>
              {isFromCurrentCodeVersion
                ? candidateParents.length === 1
                  ? "You already have an analysis for this code version. You can start a new analysis from scratch."
                  : "You already have analyses for this code version. Create a new analysis based on one of them, or start from scratch."
                : candidateParents.length === 1
                  ? "Create a new analysis with the previous code version's analysis as parent, or start from scratch"
                  : "Select a parent analysis from the previous code version, or start from scratch"}
            </DialogDescription>
          </DialogHeader>
          {candidateParents.length === 1 ? (
            <div className="py-4">
              <AnalysisVersionPreviewElement analysisVersion={candidateParents[0]} />
            </div>
          ) : (
            <div className="py-4">
              <Select value={selectedParentId} onValueChange={setSelectedParentId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a parent analysis">
                    <div className="flex gap-2 items-center">
                      <Shield className="size-3.5 text-purple-400 shrink-0" />
                      {truncateId(selectedParentId)}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {candidateParents.map((analysis) => (
                    <SelectItem value={analysis.id} key={analysis.id}>
                      <AnalysisVersionPreviewElement analysisVersion={analysis} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnalyzeDialogOpen(false)}>
              Cancel
            </Button>
            {candidateParents.length === 1 ? (
              isFromCurrentCodeVersion ? (
                <Button asChild>
                  <Link
                    href={`/team/${teamSlug}/${projectSlug}/analyses/new?codeVersionId=${version.id}`}
                    onClick={() => setAnalyzeDialogOpen(false)}
                  >
                    Start from scratch
                  </Link>
                </Button>
              ) : (
                <>
                  <Button variant="outline" asChild>
                    <Link
                      href={`/team/${teamSlug}/${projectSlug}/analyses/new?codeVersionId=${version.id}`}
                      onClick={() => setAnalyzeDialogOpen(false)}
                    >
                      Start from scratch
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link
                      href={`/team/${teamSlug}/${projectSlug}/analyses/new?codeVersionId=${version.id}&parentVersionId=${candidateParents[0]?.id}`}
                      onClick={() => setAnalyzeDialogOpen(false)}
                    >
                      Create with parent
                    </Link>
                  </Button>
                </>
              )
            ) : (
              <Button asChild>
                <Link
                  href={
                    selectedParentId
                      ? `/team/${teamSlug}/${projectSlug}/analyses/new?codeVersionId=${version.id}&parentVersionId=${selectedParentId}`
                      : `/team/${teamSlug}/${projectSlug}/analyses/new?codeVersionId=${version.id}`
                  }
                  onClick={() => setAnalyzeDialogOpen(false)}
                >
                  {selectedParentId ? "Create with parent" : "Start from scratch"}
                </Link>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CodeMetadata;
