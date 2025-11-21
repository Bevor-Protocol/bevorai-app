"use client";

import { analysisActions, projectActions } from "@/actions/bevor";
import CreateAnalysisModal from "@/components/Modal/create-analysis";
import { AnalysisElementCompact } from "@/components/analysis/element";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { generateQueryKey } from "@/utils/constants";
import { DefaultAnalysisThreadsQuery } from "@/utils/query-params";
import { CodeMappingSchemaI } from "@/utils/types";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, MoreHorizontal, Plus, Shield } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const CodeVersionMenu: React.FC<{
  teamSlug: string;
  projectSlug: string;
  version: CodeMappingSchemaI;
  analysisQuery: typeof DefaultAnalysisThreadsQuery;
}> = ({ teamSlug, projectSlug, version, analysisQuery }) => {
  const [open, setOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);

  const { data: project } = useQuery({
    queryKey: generateQueryKey.project(projectSlug),
    queryFn: () => projectActions.getProject(teamSlug, projectSlug),
  });

  const { data: analyses, refetch } = useQuery({
    queryKey: generateQueryKey.analyses(teamSlug, analysisQuery),
    queryFn: () => analysisActions.getAnalyses(teamSlug, analysisQuery),
  });

  const handleAnalysisCreated = (analysisId: string): void => {
    setCreateDialogOpen(false);
    refetch();
    setSelectedAnalysisId(analysisId);
  };

  const hasAnalyses = analyses && analyses.results.length > 0;
  const chatPath = `/teams/${teamSlug}/projects/${projectSlug}/codes/${version.id}/chat`;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={chatPath}>
              <MessageSquare className="size-4" />
              Chat
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setOpen(true)}>
            <Shield className="size-4" />
            Analyze
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setSelectedAnalysisId(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select Analysis Thread</DialogTitle>
            <DialogDescription>
              Choose an existing analysis thread to continue, or create a new thread for this code
              version
            </DialogDescription>
          </DialogHeader>
          {hasAnalyses ? (
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  Continue an existing analysis thread:
                </p>
                <ScrollArea className="max-h-[300px]">
                  <div className="space-y-2">
                    {analyses.results.map((analysis) => (
                      <div
                        key={analysis.id}
                        onClick={() => setSelectedAnalysisId(analysis.id)}
                        className={cn(
                          "rounded-lg border transition-colors",
                          selectedAnalysisId === analysis.id
                            ? "border-primary bg-accent"
                            : "hover:border-muted-foreground/60",
                        )}
                      >
                        <AnalysisElementCompact analysis={analysis} />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              <Separator />
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground">
                  Or start a new analysis thread for this code version:
                </p>
                {project && (
                  <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <Plus className="size-4" />
                        Create New Analysis Thread
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <CreateAnalysisModal
                        teamSlug={teamSlug}
                        project={project}
                        onSuccess={handleAnalysisCreated}
                      />
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                {selectedAnalysisId ? (
                  <Button asChild>
                    <Link
                      href={`/teams/${teamSlug}/analysis-threads/${selectedAnalysisId}/versions/new?codeVersionId=${version.id}`}
                    >
                      Continue with Selected Thread
                    </Link>
                  </Button>
                ) : (
                  <Button disabled>Continue with Selected Thread</Button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 py-4">
              <p className="text-sm text-muted-foreground">
                You don&apos;t have any analysis threads in this project. Create one to get started.
              </p>
              {project && (
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="size-4" />
                      Create Analysis Thread
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <CreateAnalysisModal
                      teamSlug={teamSlug}
                      project={project}
                      onSuccess={handleAnalysisCreated}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CodeVersionMenu;
