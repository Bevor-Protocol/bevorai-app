"use client";

import { analysisActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { generateQueryKey } from "@/utils/constants";
import { DefaultAnalysisNodesQuery } from "@/utils/query-params";
import { CodeMappingSchemaI } from "@/utils/types";
import { useQuery } from "@tanstack/react-query";
import { MoreHorizontal, Shield, Upload } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const CodeVersionMenu: React.FC<{
  teamSlug: string;
  projectSlug: string;
  version: CodeMappingSchemaI;
  analysisQuery: typeof DefaultAnalysisNodesQuery;
}> = ({ teamSlug, projectSlug, version, analysisQuery }) => {
  const [open, setOpen] = useState(false);

  const { data: analyses } = useQuery({
    queryKey: generateQueryKey.analyses(teamSlug, analysisQuery),
    queryFn: () => analysisActions.getAnalysisVersions(teamSlug, analysisQuery),
  });

  const hasAnalyses = analyses && analyses.results.length > 0;
  const uploadNewerPath = `/${teamSlug}/${version.project_slug}/codes/new?parentId=${version.id}`;
  const newAnalysisPath = `/${teamSlug}/${projectSlug}/analyses/new?codeVersionId=${version.id}`;
  const selectParentPath = `/${teamSlug}/${projectSlug}/analyses?codeVersionId=${version.id}&mode=selection`;

  const handleAnalyzeClick = (): void => {
    if (hasAnalyses) {
      setOpen(true);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {hasAnalyses ? (
            <DropdownMenuItem onSelect={handleAnalyzeClick}>
              <Shield className="size-4" />
              Analyze
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem asChild>
              <Link href={newAnalysisPath} onClick={(e) => e.stopPropagation()}>
                <Shield className="size-4" />
                Analyze
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link href={uploadNewerPath} onClick={(e) => e.stopPropagation()}>
              <Upload className="size-4" />
              Upload newer version
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Analysis</DialogTitle>
            <DialogDescription>
              Choose to select a parent node or start from scratch
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-4">
            <Button asChild variant="outline" className="w-full">
              <Link href={selectParentPath} onClick={() => setOpen(false)}>
                Select Parent Node
              </Link>
            </Button>
            <Button asChild className="w-full">
              <Link href={newAnalysisPath} onClick={() => setOpen(false)}>
                Start from Scratch
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CodeVersionMenu;
