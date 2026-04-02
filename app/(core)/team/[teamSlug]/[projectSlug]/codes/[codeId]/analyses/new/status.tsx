import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useSSE } from "@/providers/sse";
import type {
  AnalysisNodeSchema,
  AnalysisNodeStatus,
  FindingSchema,
  ScopeSchema,
} from "@/types/api/responses/security";
import { AlertCircle, CheckCircle2, Circle, Eye, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

/** Populated analysis row used when scopes + findings are loaded alongside the node. */
export type AnalysisWithScopesAndFindings = AnalysisNodeSchema & {
  scopes: ScopeSchema[];
  findings: Array<FindingSchema & { source_node_id?: string }>;
};

const getStatusIcon = (scopeStatus: AnalysisNodeStatus): React.ReactNode => {
  switch (scopeStatus) {
    case "waiting":
      return <Loader2 className="size-4 text-neutral-400 animate-spin shrink-0" />;
    case "processing":
      return <Loader2 className="size-4 text-green-400 animate-spin shrink-0" />;
    case "success":
      return <CheckCircle2 className="size-4 text-green-400 shrink-0" />;
    case "failed":
      return <XCircle className="size-4 text-destructive shrink-0" />;
    case "partial":
      return <AlertCircle className="size-4 text-yellow-400 shrink-0" />;
    default:
      return null;
  }
};

export const ChecklistGlyph: React.FC<{
  done: boolean;
  failed: boolean;
  busy: boolean;
}> = ({ done, failed, busy }) => {
  const icon = "size-[18px] shrink-0 text-[0] leading-none mt-0.5";
  if (failed) {
    return <XCircle className={cn(icon, "text-destructive")} strokeWidth={1.5} aria-hidden />;
  }
  if (busy) {
    return (
      <Loader2
        className={cn(icon, "animate-spin text-green-400")}
        strokeWidth={1.75}
        aria-hidden
      />
    );
  }
  if (done) {
    return (
      <CheckCircle2
        className={cn(icon, "text-green-400")}
        strokeWidth={1.5}
        aria-hidden
      />
    );
  }
  return <Circle className={cn(icon, "text-muted-foreground/35")} strokeWidth={1.35} aria-hidden />;
};

const AnalysisStatusDisplay: React.FC<{
  analysis: AnalysisWithScopesAndFindings;
  teamSlug: string;
  projectSlug: string;
  toastRefId: string | number | undefined;
  checklist?: boolean;
}> = ({ analysis, teamSlug, projectSlug, toastRefId, checklist }) => {
  const router = useRouter();
  const { registerCallback } = useSSE();

  const getNFindingsPerScope = (nodeId: string): number => {
    return analysis.findings.filter((f) => {
      const sid =
        f.source_node_id ?? f.locations[0]?.source_node_id;
      return sid === nodeId;
    }).length;
  };

  useEffect(() => {
    if (!toastRefId) return;

    const unregister = registerCallback("analysis", "team", analysis.id, (payload) => {
      const newStatus: AnalysisNodeSchema["status"] = payload.data.status;

      if (newStatus === "success") {
        toast.success("Analysis Complete", {
          id: toastRefId,
          action: {
            label: "View",
            onClick: () => router.push(`/team/${teamSlug}/${projectSlug}/analyses/${analysis.id}`),
          },
        });
      } else if (newStatus === "partial") {
        toast.success("Analysis Complete (some scopes failed)", {
          id: toastRefId,
          action: {
            label: "View",
            onClick: () => router.push(`/team/${teamSlug}/${projectSlug}/analyses/${analysis.id}`),
          },
        });
      } else if (newStatus === "failed") {
        toast.error("Something went wrong", { id: toastRefId });
      } else if (newStatus === "processing" || newStatus === "waiting") {
        //
      } else {
        toast.dismiss(toastRefId);
      }
    });

    return unregister;
  }, [analysis.id, toastRefId, teamSlug, projectSlug, router, registerCallback]);

  const analysisDone =
    analysis.status === "success" || analysis.status === "partial";
  const analysisFailed = analysis.status === "failed";
  const analysisBusy =
    analysis.status === "waiting" || analysis.status === "processing";

  if (checklist) {
    return (
      <div className="min-h-0 w-full flex flex-col">
        <ScrollArea className="max-h-[min(65vh,560px)]">
          <div className="flex flex-col gap-8 pr-2 pb-2">
            <div className="flex gap-3.5">
              <ChecklistGlyph
                done={analysisDone}
                failed={analysisFailed}
                busy={analysisBusy}
              />
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-h-5">
                  <span className="text-[15px] font-medium leading-none tracking-[-0.01em]">
                    Analysis
                  </span>
                  <span className="text-[13px] text-muted-foreground">
                    {analysis.n_findings}&nbsp;finding{analysis.n_findings !== 1 ? "s" : ""}
                  </span>
                  <span className="text-muted-foreground/50">·</span>
                  <Link
                    href={`/team/${teamSlug}/${projectSlug}/analyses/${analysis.id}`}
                    className="text-[13px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    Open
                  </Link>
                </div>
                <p className="text-[13px] text-muted-foreground mt-1.5 leading-snug">
                  {analysis.status === "waiting"
                    ? "Queued"
                    : analysis.status === "processing"
                      ? "Running"
                      : analysis.status === "success"
                        ? "Complete"
                        : analysis.status === "partial"
                          ? "Complete with issues"
                          : analysis.status === "failed"
                            ? "Failed"
                            : analysis.status}
                </p>
              </div>
            </div>

            {analysis.scopes.length > 0 && (
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/70 mb-3 pl-8">
                  Scopes
                </p>
                <div className="flex flex-col gap-5">
                  {analysis.scopes.map((scope) => {
                    const nFindings = getNFindingsPerScope(scope.source_node_id);
                    const done = scope.status === "success" || scope.status === "partial";
                    const failed = scope.status === "failed";
                    const busy = scope.status === "waiting" || scope.status === "processing";
                    return (
                      <div key={scope.id} className="flex gap-3.5 items-start">
                        <ChecklistGlyph done={done} failed={failed} busy={busy} />
                        <div className="flex-1 min-w-0 flex gap-4 justify-between items-start pt-0.5">
                          <div className="min-w-0">
                            <p className="text-[14px] font-medium text-foreground/95 leading-snug">
                              {scope.name}
                            </p>
                            <p className="text-[12px] text-muted-foreground font-mono truncate mt-0.5 opacity-90">
                              {scope.signature}
                            </p>
                          </div>
                          <span className="shrink-0 text-[13px] tabular-nums text-muted-foreground pt-0.5">
                            {nFindings}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="min-h-0 max-w-5xl mx-auto w-full flex flex-col h-full">
      <ScrollArea className="h-0 flex-1 overflow-scroll">
        <div className="flex flex-col gap-4 pr-4">
          <div className="flex items-center gap-2 justify-between py-4">
            <div className="flex gap-2 items-center">
              {getStatusIcon(analysis.status)}
              <span className="text-lg font-semibold">
                {analysis.status.charAt(0).toUpperCase() + analysis.status.slice(1)}
              </span>
              <span>total findings: {analysis.n_findings}</span>
            </div>
            <Button asChild size="lg">
              <Link href={`/team/${teamSlug}/${projectSlug}/analyses/${analysis.id}`}>
                <Eye />
                View Results
              </Link>
            </Button>
          </div>
          <div className="space-y-2 w-full max-w-5xl">
            {analysis.scopes.map((scope) => {
              const nFindings = getNFindingsPerScope(scope.source_node_id);
              return (
                <div key={scope.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  {getStatusIcon(scope.status)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{scope.name}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {scope.signature}
                    </p>
                  </div>
                  <Badge variant="outline" size="sm" className="shrink-0">
                    {nFindings} finding{nFindings !== 1 ? "s" : ""}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default AnalysisStatusDisplay;
