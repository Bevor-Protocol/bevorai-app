"use client";

import { bevorAction } from "@/actions";
import ContractTree from "@/components/terminal/contract-tree";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as Tooltip from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";
import { AuditResponseI } from "@/utils/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowUpRightFromSquareIcon,
  DownloadIcon,
  Info,
  MenuIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";

export const Content = ({
  auditId,
  address,
}: {
  auditId: string;
  address: string | null;
}): JSX.Element => {
  const { data, isLoading } = useQuery({
    queryKey: ["audit", auditId],
    queryFn: async () => bevorAction.getAudit(auditId),
  });

  return (
    <Tabs defaultValue="findings">
      <TabsList>
        <TabsTrigger value="findings">findings</TabsTrigger>
        <TabsTrigger value="markdown">markdown</TabsTrigger>
        <TabsTrigger value="contract">contract</TabsTrigger>
      </TabsList>
      <TabsContent value="findings">
        <FindingsView audit={data} isLoading={isLoading} userAddress={address} />
      </TabsContent>
      <TabsContent value="markdown">
        <MarkdownView audit={data} isLoading={isLoading} />
      </TabsContent>
      <TabsContent value="contract">
        <ContractView versionId={data?.version_id} />
      </TabsContent>
    </Tabs>
  );
};

const MarkdownView = ({
  audit,
  isLoading,
}: {
  audit?: AuditResponseI;
  isLoading: boolean;
}): JSX.Element => {
  const handleDownload = (): void => {
    if (!audit) return;
    const blob = new Blob([audit.markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit-report.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <Loader className="h-12 w-12" />;
  }

  if (!audit) {
    return <p>Something went wrong</p>;
  }

  return (
    <div>
      <Button onClick={handleDownload} variant="bright" className="w-full text-sm">
        Download Report
        <DownloadIcon size={24} className="ml-1" />
      </Button>
      <ReactMarkdown className="overflow-scroll no-scrollbar markdown grow">
        {audit.markdown}
      </ReactMarkdown>
    </div>
  );
};

const FindingsView = ({
  audit,
  isLoading,
  userAddress,
}: {
  audit?: AuditResponseI;
  isLoading: boolean;
  userAddress: string | null;
}): JSX.Element => {
  const [selectedFinding, setSelectedFinding] = useState<string | null>(null);
  const router = useRouter();
  const selectedFindingDetails = useMemo(() => {
    if (!audit) return null;
    return audit.findings.find((f) => f.id === selectedFinding);
  }, [selectedFinding, audit]);

  const [input, setInput] = useState("");
  const [attestation, setAttestation] = useState(0);
  const [isOpen, setIsOpen] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const isMobile = useIsMobile();

  const isOwner = useMemo(() => audit?.user.address !== userAddress, [audit, userAddress]);

  const { data: functionChunk } = useQuery({
    queryKey: ["function", selectedFindingDetails?.function_id],
    queryFn: async () => bevorAction.getFunctionChunk(selectedFindingDetails?.function_id || ""),
    enabled: !!selectedFindingDetails,
  });

  useEffect(() => {
    if (!selectedFindingDetails) return;
    setInput(selectedFindingDetails.feedback ?? "");
    // 0 for no attestation, -1 for rejected, +1 for accepted.
    setAttestation(
      Number(selectedFindingDetails.is_attested) *
        -1 *
        (1 - 2 * Number(selectedFindingDetails.is_verified)),
    );
  }, [selectedFindingDetails]);

  const { isPending, mutateAsync } = useMutation({
    mutationFn: (variables: { id: string; feedback?: string; verified?: boolean }) =>
      bevorAction.submitFeedback(variables.id, variables.feedback, variables.verified),
    onSuccess: () => {
      setShowSuccess(true);
      router.refresh();
    },
  });

  useEffect(() => {
    if (!isPending && showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 1000);
      return (): void => clearTimeout(timer);
    }
  }, [isPending, showSuccess]);

  // Group findings by level
  const findingsByLevel = useMemo(() => {
    const levels = ["critical", "high", "medium", "low"];
    if (!audit) return {};
    return audit.findings.reduce(
      (acc, finding) => {
        const level = finding.level;
        if (!acc[level]) {
          acc[level] = [];
        }
        acc[level].push(finding);
        return acc;
      },
      Object.fromEntries(levels.map((level) => [level, []])) as Record<
        string,
        typeof audit.findings
      >,
    );
  }, [audit]);

  const formatter = (text: string): JSX.Element => {
    // First split by multi-line code blocks
    const multiLineParts = text.split(/(```[\s\S]*?```)/);

    return (
      <>
        {multiLineParts.map((part, idx) => {
          // Handle multi-line code blocks
          if (part.startsWith("```")) {
            const code = part.slice(3, -3).replace(/^solidity\n/, ""); // Remove language identifier
            return (
              <pre key={idx} className="text-[0.875em]! bg-gray-800/50 p-2 rounded-md my-2">
                {code}
              </pre>
            );
          }

          // Handle inline code blocks
          const inlineParts = part.split(/(`.*?`)/);
          return (
            <span key={idx}>
              {inlineParts.map((inlinePart, inlineIdx) => {
                if (inlinePart.startsWith("`") && inlinePart.endsWith("`")) {
                  return (
                    <code key={inlineIdx} className="text-[0.875em]!">
                      {inlinePart.slice(1, -1)}
                    </code>
                  );
                }
                return inlinePart;
              })}
            </span>
          );
        })}
      </>
    );
  };

  const handleSubmit = async (): Promise<void> => {
    if (!isOwner) return;
    if (!selectedFindingDetails) return;
    if (!input && attestation === 0) return;
    const feedback = !input ? undefined : input;
    const verified = attestation === 0 ? undefined : attestation < 0 ? false : true;
    await mutateAsync({
      id: selectedFindingDetails.id,
      feedback,
      verified,
    });
  };

  if (isLoading) {
    return <Loader className="h-12 w-12" />;
  }

  if (!audit) {
    return <p>Something went wrong</p>;
  }

  return (
    <div className="flex flex-row h-full overflow-hidden w-full grow relative">
      <div className="w-fit block my-2 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <MenuIcon size={16} />
      </div>
      <div
        className={cn(
          "w-full md:w-64 md:max-w-1/3",
          "border-gray-800 overflow-y-auto md:pr-4 md:static md:inset-[unset]",
          "inset-0 absolute bg-black z-20",
          selectedFinding && !isOpen && "hidden",
        )}
      >
        {Object.entries(findingsByLevel).map(([level, levelFindings]) => (
          <div key={level} className="mb-4">
            <h3
              className={cn(
                "text-sm font-medium px-4 py-2",
                level === "critical" && "text-red-500",
                level === "high" && "text-orange-500",
                level === "medium" && "text-yellow-500",
                level === "low" && "text-green-500",
              )}
            >
              {level.toUpperCase()}
            </h3>
            <div className="space-y-1 overflow-x-hidden rounded-md">
              {levelFindings.map((finding) => (
                <div
                  key={finding.id}
                  onClick={() => {
                    if (isMobile) setIsOpen(false);
                    setSelectedFinding(finding.id);
                  }}
                  className={cn(
                    "px-4 py-2 cursor-pointer",
                    "whitespace-nowrap text-ellipsis overflow-x-hidden",
                    selectedFinding === finding.id ? "bg-gray-800" : "hover:bg-gray-800/80",
                  )}
                >
                  {finding.name}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        {selectedFindingDetails ? (
          <div className="space-y-4 markdown relative">
            <div className="absolute -top-6 right-0">
              <span
                className={cn(
                  "text-sm font-medium",
                  selectedFindingDetails.level === "critical" && "text-red-500",
                  selectedFindingDetails.level === "high" && "text-orange-500",
                  selectedFindingDetails.level === "medium" && "text-yellow-500",
                  selectedFindingDetails.level === "low" && "text-green-500",
                )}
              >
                {selectedFindingDetails.level.toUpperCase()}
              </span>
            </div>
            <div className="text-xl break-words">{formatter(selectedFindingDetails.name)}</div>
            <div>
              <h3 className="text-gray-400 mb-2">Explanation</h3>
              <div className="text-sm break-words">
                {formatter(selectedFindingDetails.explanation)}
              </div>
            </div>

            <div>
              <h3 className="text-gray-400 mb-2">Recommendation</h3>
              <div className="text-sm break-words">
                {formatter(selectedFindingDetails.recommendation)}
              </div>
            </div>

            {selectedFindingDetails.reference && (
              <div>
                <h3 className="text-gray-400 mb-2">Reference</h3>
                <div className="text-sm break-words">
                  {formatter(selectedFindingDetails.reference)}
                </div>
              </div>
            )}
            {functionChunk ? (
              <div>
                <h3 className="text-gray-400 mb-2">Source</h3>
                <pre className="overflow-scroll no-scrollbar grow text-xs">
                  {functionChunk.chunk}
                </pre>
              </div>
            ) : (
              <div>
                <h3 className="text-gray-400 mb-2">Source</h3>
                <pre className="overflow-scroll no-scrollbar grow text-xs">loading</pre>
              </div>
            )}
            <div>
              <div className="flex gap-4 items-center">
                <h3 className="text-gray-400 mb-2">User Feedback</h3>
                <Tooltip.Reference>
                  <Tooltip.Trigger>
                    <Info size={16} color="gray" />
                  </Tooltip.Trigger>
                  <Tooltip.Content>
                    <div className="bg-black border border-gray-600 rounded-md p-2 w-48">
                      This is only editable by the user who submitted this audit
                    </div>
                  </Tooltip.Content>
                </Tooltip.Reference>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={!isOwner}
                className={cn(
                  isOwner && "border border-gray-600 rounded-md p-1 resize-y",
                  !isOwner && "min-h-fit resize-none",
                  "flex-1 bg-transparent outline-hidden min-h-16 w-full",
                  "text-white font-mono text-sm",
                  "placeholder:text-gray-500",
                  "caret-green-400",
                )}
                placeholder={isOwner ? "input your feedback..." : "None Provided"}
              />
            </div>

            <div className="flex flex-col sm:flex-row mt-4 gap-4 sm:justify-between">
              <div className="flex gap-4 items-center">
                <div
                  className={cn(
                    "border-gray-800 flex items-center cursor-pointer",
                    (!isOwner || isPending) && "opacity-80 pointer-events-none",
                  )}
                  onClick={() => isOwner && setAttestation(1)}
                >
                  <ThumbsUpIcon
                    size={16}
                    className="mr-2"
                    color={attestation > 0 ? "green" : "gray"}
                  />
                  Accept
                </div>
                <div
                  className={cn(
                    "border-gray-800 flex items-center cursor-pointer",
                    (!isOwner || isPending) && "opacity-80 pointer-events-none",
                  )}
                  onClick={() => isOwner && setAttestation(-1)}
                >
                  <ThumbsDownIcon
                    size={16}
                    className="mr-2"
                    color={attestation < 0 ? "red" : "gray"}
                  />
                  Reject
                </div>
              </div>
              {isOwner && (
                <Button variant="bright" onClick={handleSubmit} disabled={isPending || showSuccess}>
                  {showSuccess ? "Success" : "Submit Feedback"}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Select a finding to view details
          </div>
        )}
      </div>
    </div>
  );
};

const ContractView = ({ versionId }: { versionId?: string }): JSX.Element => {
  const [selectedSource, setSelectedSource] = useState("");

  const { data: version, isLoading: isVersionLoading } = useQuery({
    queryKey: ["contract-version", versionId],
    queryFn: async () => bevorAction.getContractVersion(versionId!),
    enabled: !!versionId,
  });

  const { data: tree, isLoading: isTreeLoading } = useQuery({
    queryKey: ["contract-tree", versionId],
    queryFn: async () => bevorAction.getContractTree(versionId!),
    enabled: !!versionId,
  });

  const { data: sources, isLoading: isSourcesLoading } = useQuery({
    queryKey: ["contract-source", versionId],
    queryFn: async () => bevorAction.getContractSources(versionId!),
    enabled: !!versionId,
  });

  if (isVersionLoading || isTreeLoading || isSourcesLoading) {
    return <Loader className="h-12 w-12" />;
  }

  return (
    <div>
      <div
        className={cn(
          "flex justify-between lg:justify-start",
          "flex-row gap-4 border-b border-b-gray-600 pb-4",
          "flex-wrap items-center",
        )}
      >
        <div className="text-sm">
          <div className="*:whitespace-nowrap">
            <p>Address: {version?.source_type === "scan" ? version.target : "Not Provided"}</p>
            <p>Network: {version?.network ?? "Not Provided"}</p>
            <p>Pragma Version: {version?.solc_version ?? "Not Determined"}</p>
          </div>
        </div>
        <div className="w-full *:w-1/2 ml-0 flex flex-row gap-2 lg:ml-auto lg:w-fit">
          <Link
            href={version?.block_explorer_url ?? ""}
            aria-disabled={!version?.block_explorer_url}
            target="_blank"
            referrerPolicy="no-referrer"
            className={cn(
              "text-sm relative",
              !version?.block_explorer_url && "pointer-events-none",
            )}
          >
            <Button
              variant="bright"
              className="w-full text-sm"
              disabled={!version?.block_explorer_url}
            >
              view onchain
              <ArrowUpRightFromSquareIcon size={10} className="ml-2" />
            </Button>
          </Link>
        </div>
      </div>
      <Tabs defaultValue="sources">
        <TabsList>
          <TabsTrigger value="sources">sources</TabsTrigger>
          <TabsTrigger value="tree">tree</TabsTrigger>
        </TabsList>
        <TabsContent value="sources">
          <div className="flex flex-row h-full overflow-hidden w-full grow relative">
            <div
              className={cn(
                "w-full md:w-64 md:max-w-1/3",
                "border-gray-800 overflow-y-auto md:pr-4 md:static md:inset-[unset]",
                "inset-0 absolute bg-black z-20",
              )}
            >
              {sources?.map((source) => (
                <div
                  key={source.id}
                  onClick={() => {
                    setSelectedSource(source.content);
                  }}
                  className={cn(
                    "px-4 py-2 cursor-pointer hover:bg-gray-800/50",
                    "whitespace-nowrap text-ellipsis overflow-x-hidden",
                    selectedSource === source.id && "bg-gray-800",
                  )}
                >
                  {source.path.split("/").slice(-1)[0]}
                </div>
              ))}
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              <pre className="overflow-scroll no-scrollbar grow text-xs">{selectedSource}</pre>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="tree">{!!tree && <ContractTree tree={tree} />}</TabsContent>
      </Tabs>
    </div>
  );
};
