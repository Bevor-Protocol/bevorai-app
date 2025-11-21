"use client";

import { analysisActions, chatActions, codeActions } from "@/actions/bevor";
import { AnalysisVersionElementCompact } from "@/components/analysis/element";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CodeVersionElementCompact } from "@/components/versions/element";
import { cn } from "@/lib/utils";
import { generateQueryKey } from "@/utils/constants";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface HeadProps {
  teamSlug: string;
  chatId: string;
  analysisId: string;
  projectSlug: string;
}

export const Head: React.FC<HeadProps> = ({ teamSlug, chatId, analysisId, projectSlug }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCodeVersionId, setSelectedCodeVersionId] = useState<string | null>(null);
  const [selectedAnalysisVersionId, setSelectedAnalysisVersionId] = useState<string | undefined>(
    undefined,
  );
  const [codeOnlyMode, setCodeOnlyMode] = useState(false);
  const [codeVersionPopoverOpen, setCodeVersionPopoverOpen] = useState(false);
  const [analysisVersionPopoverOpen, setAnalysisVersionPopoverOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: chatHead } = useQuery({
    queryKey: generateQueryKey.chatHead(chatId),
    queryFn: () => chatActions.getChatHead(teamSlug, chatId),
  });

  const { data: codeVersions } = useQuery({
    queryKey: generateQueryKey.codes(teamSlug, { project_id: projectSlug }),
    queryFn: () => codeActions.getVersions(teamSlug, { project_id: projectSlug }),
  });

  const { data: analysisVersions } = useQuery({
    queryKey: generateQueryKey.analysisVersions(teamSlug, { analysis_id: analysisId }),
    queryFn: () => analysisActions.getAnalysisVersions(teamSlug, { analysis_id: analysisId }),
    enabled: !codeOnlyMode && dialogOpen,
  });

  useEffect(() => {
    if (chatHead && dialogOpen) {
      setSelectedCodeVersionId(chatHead.code_version_id ?? null);
      setSelectedAnalysisVersionId(chatHead.analysis_version_id ?? undefined);
      setCodeOnlyMode(!chatHead.analysis_version_id);
    }
  }, [chatHead, dialogOpen]);

  const updateMutation = useMutation({
    mutationFn: (data: {
      analysis_version_id?: string;
      code_version_id?: string;
      is_code_only?: boolean;
    }) => chatActions.updateChatHead(teamSlug, chatId, data),
    onSuccess: ({ toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      setDialogOpen(false);
      toast.success("Chat head updated");
    },
    onError: () => {
      toast.error("Failed to update chat head");
    },
  });

  const selectedCodeVersion = codeVersions?.results.find((v) => v.id === selectedCodeVersionId);
  const selectedAnalysisVersion = analysisVersions?.results.find(
    (v) => v.id === selectedAnalysisVersionId,
  );

  if (!chatHead) return null;

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Context</h4>
          <Button size="sm" variant="ghost" onClick={() => setDialogOpen(true)}>
            Edit
          </Button>
        </div>
        <div className="space-y-3">
          {chatHead.code_version && <CodeVersionElementCompact version={chatHead.code_version} />}
          {chatHead.analysis_version && (
            <AnalysisVersionElementCompact analysisVersion={chatHead.analysis_version} />
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update Chat Context</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Popover open={codeVersionPopoverOpen} onOpenChange={setCodeVersionPopoverOpen}>
                <PopoverTrigger className="border flex items-center justify-between gap-4 rounded-lg pr-2 w-full">
                  <div className="flex-1 text-left min-w-0">
                    {selectedCodeVersion ? (
                      <CodeVersionElementCompact version={selectedCodeVersion} />
                    ) : (
                      <div className="flex items-center text-sm text-muted-foreground py-2 px-3 h-14">
                        Select code version
                      </div>
                    )}
                  </div>
                  <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
                </PopoverTrigger>
                <PopoverContent className="w-[380px] p-1" align="start">
                  <ScrollArea className="max-h-[400px]">
                    <div className="space-y-0.5">
                      {codeVersions?.results.map((version) => (
                        <div
                          key={version.id}
                          onClick={() => {
                            setSelectedCodeVersionId(version.id);
                            setCodeVersionPopoverOpen(false);
                          }}
                          className={cn(
                            "cursor-pointer rounded-md transition-colors",
                            selectedCodeVersionId === version.id
                              ? "bg-accent"
                              : "hover:bg-accent/50",
                          )}
                        >
                          <CodeVersionElementCompact version={version} />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </div>

            {!codeOnlyMode && (
              <div className="space-y-2">
                <Popover
                  open={analysisVersionPopoverOpen}
                  onOpenChange={setAnalysisVersionPopoverOpen}
                >
                  <PopoverTrigger className="border flex items-center justify-between gap-4 rounded-lg pr-2 w-full">
                    <div className="flex-1 text-left min-w-0">
                      {selectedAnalysisVersion ? (
                        <AnalysisVersionElementCompact analysisVersion={selectedAnalysisVersion} />
                      ) : (
                        <div className="flex items-center text-sm text-muted-foreground py-2 px-3 h-14">
                          None selected
                        </div>
                      )}
                    </div>
                    <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
                  </PopoverTrigger>
                  <PopoverContent className="w-[380px] p-1" align="start">
                    <ScrollArea className="max-h-[300px]">
                      <div className="space-y-0.5">
                        {analysisVersions?.results.map((version) => (
                          <div
                            key={version.id}
                            onClick={() => {
                              setSelectedAnalysisVersionId(version.id);
                              setAnalysisVersionPopoverOpen(false);
                            }}
                            className={cn(
                              "cursor-pointer rounded-md transition-colors",
                              selectedAnalysisVersionId === version.id
                                ? "bg-accent"
                                : "hover:bg-accent/50",
                            )}
                          >
                            <AnalysisVersionElementCompact analysisVersion={version} />
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Checkbox
                id="head-code-only"
                checked={codeOnlyMode}
                onCheckedChange={(checked) => {
                  setCodeOnlyMode(checked === true);
                  if (checked) {
                    setSelectedAnalysisVersionId(undefined);
                  }
                }}
              />
              <Label htmlFor="head-code-only" className="text-sm cursor-pointer">
                Code only mode
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setDialogOpen(false);
                if (chatHead) {
                  setSelectedCodeVersionId(chatHead.code_version_id ?? null);
                  setSelectedAnalysisVersionId(chatHead.analysis_version_id ?? undefined);
                  setCodeOnlyMode(!chatHead.analysis_version_id);
                }
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                updateMutation.mutate({
                  ...(selectedCodeVersionId && { code_version_id: selectedCodeVersionId }),
                  ...(selectedAnalysisVersionId && {
                    analysis_version_id: selectedAnalysisVersionId,
                  }),
                  is_code_only: codeOnlyMode,
                });
              }}
              disabled={updateMutation.isPending || !selectedCodeVersionId}
            >
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
