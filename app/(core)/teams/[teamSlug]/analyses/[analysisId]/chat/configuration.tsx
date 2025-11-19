"use client";

import { analysisActions, codeActions, projectActions } from "@/actions/bevor";
import { AnalysisVersionElementCompact } from "@/components/analysis/element";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent } from "@/components/ui/tooltip";
import { CodeVersionElementCompact } from "@/components/versions/element";
import { cn } from "@/lib/utils";
import { generateQueryKey } from "@/utils/constants";
import { CreateChatFormValues } from "@/utils/schema";
import { TooltipTrigger } from "@radix-ui/react-tooltip";
import { UseMutationResult, useQuery } from "@tanstack/react-query";
import { ChevronDown, Code, InfoIcon, Shield } from "lucide-react";
import { useEffect, useState } from "react";

interface ConfigurationProps {
  teamSlug: string;
  analysisId: string;
  projectSlug: string;
  createMutation: UseMutationResult<
    { id: string; toInvalidate: unknown[] },
    Error,
    CreateChatFormValues,
    unknown
  >;
}

export const Configuration: React.FC<ConfigurationProps> = ({
  teamSlug,
  analysisId,
  projectSlug,
  createMutation,
}) => {
  const [selectedCodeVersionId, setSelectedCodeVersionId] = useState<string | null>(null);
  const [selectedAnalysisVersionId, setSelectedAnalysisVersionId] = useState<string | undefined>(
    undefined,
  );
  const [codeOnlyMode, setCodeOnlyMode] = useState(false);
  const [codeVersionPopoverOpen, setCodeVersionPopoverOpen] = useState(false);
  const [analysisVersionPopoverOpen, setAnalysisVersionPopoverOpen] = useState(false);

  const recentCodeQuery = useQuery({
    queryKey: generateQueryKey.projectRecentCode(projectSlug),
    queryFn: () => projectActions.getRecentCode(teamSlug, projectSlug),
  });

  const recentAnalysisVersionQuery = useQuery({
    queryKey: generateQueryKey.analysisVersionRecent(analysisId),
    queryFn: () => analysisActions.getAnalysisRecentVersion(teamSlug, analysisId),
  });

  const { data: codeVersions } = useQuery({
    queryKey: generateQueryKey.codes(teamSlug, { project_id: projectSlug }),
    queryFn: () => codeActions.getVersions(teamSlug, { project_id: projectSlug }),
  });

  const { data: analysisVersions } = useQuery({
    queryKey: generateQueryKey.analysisVersions(teamSlug, { analysis_id: analysisId }),
    queryFn: () => analysisActions.getAnalysisVersions(teamSlug, { analysis_id: analysisId }),
    enabled: !codeOnlyMode,
  });

  const defaultCodeVersion = recentCodeQuery.data?.code_version;
  const defaultAnalysisVersion = recentAnalysisVersionQuery.data;

  useEffect(() => {
    if (defaultCodeVersion && !selectedCodeVersionId) {
      setSelectedCodeVersionId(defaultCodeVersion.id);
    }
  }, [defaultCodeVersion, selectedCodeVersionId]);

  useEffect(() => {
    if (defaultAnalysisVersion && !codeOnlyMode && !selectedAnalysisVersionId) {
      setSelectedAnalysisVersionId(defaultAnalysisVersion.id);
    }
  }, [defaultAnalysisVersion, codeOnlyMode, selectedAnalysisVersionId]);

  const selectedCodeVersion = codeVersions?.results.find((v) => v.id === selectedCodeVersionId);
  const selectedAnalysisVersion = analysisVersions?.results.find(
    (v) => v.id === selectedAnalysisVersionId,
  );

  return (
    <div className="absolute inset-0 flex flex-col z-10 pointer-events-none">
      <div className="pointer-events-auto p-6 space-y-6 max-w-2xl mx-auto pt-12">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Configure your chat</h3>
          <p className="text-sm text-muted-foreground">
            Select the code version and optionally an analysis version to provide context for your
            conversation. The code version determines which smart contract code will be available,
            while the analysis version adds security findings and analysis context to help answer
            your questions.
          </p>
        </div>
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-fit">
            <div className="flex items-center gap-2 mb-2">
              <Code className="size-4 text-green-400" />
              <Label className="text-sm font-medium">Code Version</Label>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="size-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px] text-muted-foreground">
                  <p className="text-sm">
                    Select the code version to chat about. This is the smart contract code that will
                    be available in the conversation.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Popover open={codeVersionPopoverOpen} onOpenChange={setCodeVersionPopoverOpen}>
              <PopoverTrigger className="border flex items-center justify-between gap-4 rounded-lg pr-2 w-[380px]">
                <div className="flex-1 text-left min-w-0">
                  {selectedCodeVersion ? (
                    <CodeVersionElementCompact version={selectedCodeVersion} />
                  ) : (
                    <div className="flex items-center text-sm text-muted-foreground py-2 px-3 h-14">
                      Select code version (required)
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
                          selectedCodeVersionId === version.id ? "bg-accent" : "hover:bg-accent/50",
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
            <div className="w-fit">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="size-4 text-purple-400" />
                <Label className="text-sm font-medium">Analysis Version</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <InfoIcon className="size-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[300px] text-muted-foreground">
                    <p className="text-sm">
                      Optional: Select an analysis version to include analysis context in the chat.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Popover
                open={analysisVersionPopoverOpen}
                onOpenChange={setAnalysisVersionPopoverOpen}
              >
                <PopoverTrigger className="border flex items-center justify-between gap-4 rounded-lg pr-2 w-[380px]">
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
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="code-only"
            checked={codeOnlyMode}
            onCheckedChange={(checked) => {
              setCodeOnlyMode(checked === true);
              if (checked) {
                setSelectedAnalysisVersionId(undefined);
              }
            }}
          />
          <Label htmlFor="code-only" className="text-sm cursor-pointer">
            Code only mode (no analysis context)
          </Label>
        </div>
        <Button
          onClick={() => {
            createMutation.mutate({
              analysis_id: analysisId,
              ...(selectedCodeVersionId && { code_version_id: selectedCodeVersionId }),
              ...(selectedAnalysisVersionId && {
                analysis_version_id: selectedAnalysisVersionId,
              }),
              is_code_only: codeOnlyMode,
            });
          }}
          disabled={createMutation.isPending || !selectedCodeVersionId}
          className="w-full"
        >
          {createMutation.isPending ? "Creating..." : "Initiate chat"}
        </Button>
      </div>
    </div>
  );
};
