import { bevorAction } from "@/actions";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { useChat } from "@/hooks/useContexts";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, DownloadIcon, ExternalLink, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import TerminalInputBar from "../input-bar";

type TerminalProps = {
  projectId: string;
  versionId: string;
  scopes: { identifier: string; level: string }[];
};

const ResultsStep = ({ projectId, versionId, scopes }: TerminalProps): JSX.Element => {
  // once removed from the stack, we don't allow going back to this point, so there's
  // no need to retain a state in the parent Terminal component.
  const { setCurrentAuditId } = useChat();
  const [progress, setProgress] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  const {
    mutateAsync,
    data: evalData,
    isError: isEvalError,
    isSuccess: isEvalSuccess,
  } = useMutation({
    mutationFn: async () => bevorAction.initiateAudit(projectId, versionId, scopes),
  });

  useEffect(() => {
    mutateAsync();
  }, [mutateAsync]);

  // poll for audit status.
  const { data: pollingData, isError: isPollingError } = useQuery({
    queryKey: ["polling", evalData?.id],
    queryFn: async () => bevorAction.getAuditStatus(evalData!.id),
    refetchInterval: (query) => {
      const { data } = query.state;
      if (!data) return 1_000;
      if (["success", "failed"].includes(data.status)) {
        return false;
      }
      return 1_000;
    },
    enabled: !!evalData?.id,
  });

  // Progress bar animation
  useEffect(() => {
    if (pollingData?.status === "processing" && !startTime) {
      setStartTime(Date.now());
    }

    if (pollingData?.status === "processing" && startTime) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min((elapsed / 10000) * 100, 95); // Max 95% until success
        setProgress(newProgress);
      }, 100);

      return () => clearInterval(interval);
    }

    if (pollingData?.status === "success") {
      setProgress(100);
    }
  }, [pollingData?.status, startTime]);

  // fetch the completed audit once it's ready.
  const {
    data: auditData,
    isError: isAuditError,
    isSuccess,
  } = useQuery({
    queryKey: ["audit", evalData?.id],
    queryFn: async () =>
      bevorAction.getAudit(evalData!.id).then((result) => {
        if (result.status === "success") {
          setCurrentAuditId(evalData!.id);
          return result.markdown;
        }
        throw new Error("failed audit");
      }),
    enabled: pollingData?.status === "success",
  });

  const terminalRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div ref={terminalRef} className="flex-1 overflow-y-auto font-mono text-sm no-scrollbar">
        {!isEvalSuccess && (
          <div className="space-y-2">
            <p>Starting audit...</p>
          </div>
        )}
        {!!pollingData && !isSuccess && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {pollingData.status === "processing" && <Loader className="h-4 w-4 animate-spin" />}
              {pollingData.status === "waiting" && <Loader className="h-4 w-4 animate-spin" />}
              {pollingData.status === "success" && <Check className="h-4 w-4 text-green-400" />}
              {pollingData.status === "failed" && <X className="h-4 w-4 text-red-400" />}
              <span className="capitalize font-medium">{pollingData.status}</span>
            </div>

            {pollingData.status === "processing" && (
              <div className="space-y-2">
                <div className="text-sm text-gray-400">
                  Analyzing smart contract(s) for vulnerabilities...
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1 max-w-3xs">
                  <div
                    className="bg-blue-500 h-1 rounded-full transition-all duration-100 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {pollingData.status === "waiting" && (
              <div className="text-sm text-gray-400">
                Your audit is queued and will begin shortly...
              </div>
            )}
          </div>
        )}
        {isSuccess && auditData && (
          <ReactMarkdown className="overflow-scroll no-scrollbar markdown">
            {auditData}
          </ReactMarkdown>
        )}
        {(isEvalError || isAuditError || isPollingError) && (
          <div className="mb-2 leading-relaxed whitespace-pre-wrap text-red-400">
            Something went wrong, try again or please reach out
          </div>
        )}
      </div>
      {!auditData && (
        <TerminalInputBar
          onSubmit={() => {}}
          onChange={() => {}}
          disabled={true}
          value={""}
          overrideLoading={!auditData}
          placeholder="Chat feature coming soon..."
        />
      )}
      {!!auditData && !!evalData && <Download auditId={evalData.id} auditContent={auditData} />}
    </>
  );
};

type DownloadProps = {
  auditContent?: string;
  className?: string;
  auditId: string;
};

const Download: React.FC<DownloadProps> = ({ auditContent, className, auditId }) => {
  const handleDownload = (): void => {
    if (!auditContent) return;
    const blob = new Blob([auditContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit-report.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  return (
    <div className={cn("flex flex-row gap-2", className)}>
      <Link href={`audits/${auditId}`}>
        <Button variant="bright">
          <span className="text-sm">View Breakdown</span>
          <ExternalLink size={14} className="ml-1" />
        </Button>
      </Link>
      <Button onClick={handleDownload} variant="bright">
        <span className="text-sm">Download Report</span>
        <DownloadIcon size={14} className="ml-1" />
      </Button>
    </div>
  );
};

export default ResultsStep;
