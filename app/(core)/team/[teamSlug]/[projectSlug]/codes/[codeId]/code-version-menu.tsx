"use client";

import { analysisActions } from "@/actions/bevor";
import { AnalysisVersionElementCompact } from "@/components/analysis/element";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateQueryKey } from "@/utils/constants";
import { truncateId } from "@/utils/helpers";
import { extractAnalysisNodesQuery } from "@/utils/query-params";
import { CodeMappingSchemaI } from "@/utils/types";
import { useQuery } from "@tanstack/react-query";
import { Eye, List, MoreHorizontal, Shield, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const CodeVersionMenu: React.FC<{
  teamSlug: string;
  projectSlug: string;
  userId: string;
  version: CodeMappingSchemaI;
}> = ({ teamSlug, projectSlug, userId, version }) => {
  const router = useRouter();
  const analysisQuery = extractAnalysisNodesQuery({
    project_slug: projectSlug,
    code_version_id: version.id,
  });

  const parentAnalysisQuery = extractAnalysisNodesQuery({
    project_slug: projectSlug,
    code_version_id: version.parent_id,
  });

  const [open, setOpen] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string>("");

  const { data: analyses } = useQuery({
    queryKey: generateQueryKey.analyses(teamSlug, analysisQuery),
    queryFn: () => analysisActions.getAnalyses(teamSlug, analysisQuery),
  });

  const { data: parentAnalyses = { results: [] } } = useQuery({
    queryKey: generateQueryKey.analyses(teamSlug, parentAnalysisQuery),
    queryFn: () => analysisActions.getAnalyses(teamSlug, parentAnalysisQuery),
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

  const uploadNewerPath = `/team/${teamSlug}/${projectSlug}/codes/new?parentId=${version.id}`;
  const baseNewAnalysisPath = `/team/${teamSlug}/${projectSlug}/analyses/new?codeVersionId=${version.id}`;
  const viewAllAnalysesPath = `/team/${teamSlug}/${projectSlug}/analyses?code_version_id=${version.id}&user=unset`;
  const viewUserAnalysesPath = `/team/${teamSlug}/${projectSlug}/analyses?code_version_id=${version.id}`;

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
      setOpen(true);
    } else {
      router.push(baseNewAnalysisPath);
    }
  };

  const handleUseParent = (): void => {
    const parentId = candidateParents[0]?.id;
    router.push(
      `/team/${teamSlug}/${projectSlug}/analyses/new?codeVersionId=${version.id}&parentVersionId=${parentId}`,
    );
    setOpen(false);
  };

  const handleStartFromScratch = (): void => {
    router.push(baseNewAnalysisPath);
    setOpen(false);
  };

  const handleConfirmParent = (): void => {
    if (selectedParentId) {
      router.push(
        `/team/${teamSlug}/${projectSlug}/analyses/new?codeVersionId=${version.id}&parentVersionId=${selectedParentId}`,
      );
    } else {
      router.push(baseNewAnalysisPath);
    }
    setOpen(false);
  };

  console.log(candidateParents);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={handleAnalyzeClick}>
            <Shield className="size-4" />
            Analyze
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={uploadNewerPath} onClick={(e) => e.stopPropagation()}>
              <Upload className="size-4" />
              Upload newer version
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild disabled={!userAnalyses.length}>
            <Link href={viewUserAnalysesPath} onClick={(e) => e.stopPropagation()}>
              <Eye className="size-4" />
              View my analyses
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild disabled={!analyses?.results.length}>
            <Link href={viewAllAnalysesPath} onClick={(e) => e.stopPropagation()}>
              <List className="size-4" />
              View all analyses
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={open} onOpenChange={setOpen}>
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
              <AnalysisVersionElementCompact analysisVersion={candidateParents[0]} />
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
                      <AnalysisVersionElementCompact analysisVersion={analysis} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            {candidateParents.length === 1 ? (
              isFromCurrentCodeVersion ? (
                <Button onClick={handleStartFromScratch}>Start from scratch</Button>
              ) : (
                <>
                  <Button variant="outline" onClick={handleStartFromScratch}>
                    Start from scratch
                  </Button>
                  <Button onClick={handleUseParent}>Create with parent</Button>
                </>
              )
            ) : (
              <Button onClick={handleConfirmParent}>
                {selectedParentId ? "Create with parent" : "Start from scratch"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CodeVersionMenu;
