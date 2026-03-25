import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSSE } from "@/providers/sse";
import { AnalysisNodeSchema } from "@/types/api/responses/security";
import { AlertCircle, CheckCircle2, Eye, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

const getStatusIcon = (scopeStatus: AnalysisNodeSchema["scopes"][0]["status"]): React.ReactNode => {
  switch (scopeStatus) {
    case "waiting":
      return <Loader2 className="size-4 text-neutral-400 animate-spin shrink-0" />;
    case "processing":
      return <Loader2 className="size-4 text-blue-400 animate-spin shrink-0" />;
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

const AnalysisStatusDisplay: React.FC<{
  analysis: AnalysisNodeSchema;
  teamSlug: string;
  projectSlug: string;
  toastRefId: string | number | undefined;
}> = ({ analysis, teamSlug, projectSlug, toastRefId }) => {
  const router = useRouter();
  const { registerCallback } = useSSE();

  const getNFindingsPerScope = (nodeId: string): number => {
    return analysis.findings.filter((f) => f.source_node_id === nodeId).length;
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
