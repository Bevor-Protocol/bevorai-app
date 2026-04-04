"use client";

import { analysisActions, codeActions } from "@/actions/bevor";
import { useSSE } from "@/providers/sse";
import type { CodeVersionStatus } from "@/types/api/responses/graph";
import type { AnalysisNodeStatus } from "@/types/api/responses/security";
import { generateQueryKey } from "@/utils/constants";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";

const codeStatusLine = (s: CodeVersionStatus): string => {
  switch (s) {
    case "waiting":
      return "Queued for parsing";
    case "processing":
      return "Parsing and indexing sources";
    case "success":
      return "Indexed";
    case "failed":
      return "Could not process this version";
    default:
      return s;
  }
};

const analysisNodeStatusLine = (s: AnalysisNodeStatus): string => {
  switch (s) {
    case "waiting":
      return "Queued for analysis";
    case "processing":
      return "Running security analysis";
    case "success":
      return "Analysis complete";
    case "failed":
      return "Analysis failed";
    case "partial":
      return "Partially complete";
    default:
      return s;
  }
};

const glyphStateForAnalysisStatus = (
  s: AnalysisNodeStatus,
): { done: boolean; failed: boolean; busy: boolean } => ({
  failed: s === "failed",
  busy: s === "waiting" || s === "processing",
  done: s === "success" || s === "partial",
});

const ChecklistGlyph: React.FC<{ done: boolean; failed: boolean; busy: boolean }> = ({
  done,
  failed,
  busy,
}) => (
  <div className="flex size-6 shrink-0 items-center justify-center pt-0.5" aria-hidden>
    {failed ? (
      <XCircle className="size-5 text-destructive" />
    ) : busy ? (
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
    ) : done ? (
      <Check className="size-5 text-green-500" />
    ) : (
      <div className="size-5 rounded-full border-2 border-muted-foreground/35" />
    )}
  </div>
);

export interface AnalysisProgressProps {
  teamSlug: string;
  projectSlug: string;
  analysisId: string;
}

const AnalysisProgress: React.FC<AnalysisProgressProps> = ({
  teamSlug,
  projectSlug,
  analysisId,
}) => {
  const queryClient = useQueryClient();
  const { registerCallback } = useSSE();

  const { data: analysis } = useQuery({
    queryKey: generateQueryKey.analysis(analysisId),
    queryFn: async () => {
      const r = await analysisActions.getAnalysis(teamSlug, analysisId);
      if (!r.ok) throw r;
      return r.data;
    },
    enabled: !!teamSlug && !!analysisId,
  });

  const { data: scopes } = useQuery({
    queryKey: generateQueryKey.analysisScopes(analysisId),
    queryFn: async () => {
      const r = await analysisActions.getScopes(teamSlug, analysisId);
      if (!r.ok) throw r;
      return r.data;
    },
    enabled: !!teamSlug && !!analysisId,
  });

  const codeVersionId = analysis?.code_version_id ?? "";

  const { data: code } = useQuery({
    queryKey: generateQueryKey.code(codeVersionId),
    queryFn: async () => {
      const r = await codeActions.getCodeVersion(teamSlug, codeVersionId);
      if (!r.ok) throw r;
      return r.data;
    },
    enabled: !!codeVersionId,
  });

  const [codeStatus, setCodeStatus] = useState<CodeVersionStatus | null>(code?.status ?? null);

  useEffect(() => {
    if (code?.status) setCodeStatus(code.status);
  }, [code?.status]);

  const invalidateAnalysisBundle = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: generateQueryKey.analysis(analysisId) });
    void queryClient.invalidateQueries({ queryKey: generateQueryKey.analysisScopes(analysisId) });
    void queryClient.invalidateQueries({ queryKey: generateQueryKey.analysisFindings(analysisId) });
  }, [analysisId, queryClient]);

  useEffect(() => {
    if (!codeVersionId) return;
    const off = registerCallback("code.status", codeVersionId, (payload) => {
      if (payload.type !== "code.status") return;
      setCodeStatus(payload.data.status);
      void queryClient.invalidateQueries({ queryKey: generateQueryKey.code(codeVersionId) });
    });
    return off;
  }, [codeVersionId, queryClient, registerCallback]);

  useEffect(() => {
    const offStatus = registerCallback("analysis.status", analysisId, () => {
      invalidateAnalysisBundle();
    });
    const offScope = registerCallback("analysis.scope", analysisId, () => {
      invalidateAnalysisBundle();
    });
    return (): void => {
      offStatus();
      offScope();
    };
  }, [analysisId, invalidateAnalysisBundle, registerCallback]);

  if (!analysis || !code) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const status = codeStatus ?? code.status;
  const codeDone = status === "success";
  const codeFailed = status === "failed";
  const codeBusy = status === "waiting" || status === "processing";

  const analysisWorkspaceHref = `/team/${teamSlug}/${projectSlug}/analyses/${analysisId}`;

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-lg flex-col gap-10 pb-20 pt-2">
      <header>
        <h1 className="text-lg font-medium tracking-tight text-foreground">Processing</h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
          Progress updates as your code is indexed, then as each scope is analyzed.
        </p>
      </header>

      <div className="flex flex-col gap-10">
        <div className="flex gap-3.5">
          <ChecklistGlyph done={codeDone} failed={codeFailed} busy={codeBusy} />
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-[15px] font-medium leading-none tracking-[-0.01em]">Code</span>
              <span className="text-muted-foreground/50">·</span>
              <Link
                href={`/team/${teamSlug}/${projectSlug}/codes/${codeVersionId}`}
                className="text-[13px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Open version
              </Link>
            </div>
            <p className="mt-1.5 text-[13px] leading-snug text-muted-foreground">
              {codeStatusLine(status)}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div className="flex gap-3.5">
            <ChecklistGlyph {...glyphStateForAnalysisStatus(analysis.status)} />
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-[15px] font-medium leading-none tracking-[-0.01em]">
                  Analysis
                </span>
                <span className="text-muted-foreground/50">·</span>
                <Link
                  href={analysisWorkspaceHref}
                  className="text-[13px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Open workspace
                </Link>
              </div>
              <p className="mt-1.5 text-[13px] leading-snug text-muted-foreground">
                {analysisNodeStatusLine(analysis.status)}
              </p>
              {analysis.n_findings > 0 ? (
                <p className="mt-1 text-[12px] text-muted-foreground/90">
                  {`${analysis.n_findings} finding${analysis.n_findings !== 1 ? "s" : ""} recorded so far`}
                </p>
              ) : null}
            </div>
          </div>

          {scopes === undefined ? (
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <Loader2 className="size-4 shrink-0 animate-spin" />
              Loading scopes…
            </div>
          ) : scopes.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">No scopes listed yet.</p>
          ) : (
            <ul className="flex flex-col gap-8 border-l-2 border-border/70 pl-4 ml-[11px]">
              {scopes.map((scope) => {
                const label = scope.path?.trim() || scope.name || scope.id;
                return (
                  <li key={scope.id} className="flex gap-3.5">
                    <ChecklistGlyph {...glyphStateForAnalysisStatus(scope.status)} />
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p
                        className="text-[15px] font-medium leading-snug tracking-[-0.01em] text-foreground truncate"
                        title={label}
                      >
                        {label}
                      </p>
                      <p className="mt-1.5 text-[13px] leading-snug text-muted-foreground">
                        {analysisNodeStatusLine(scope.status)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisProgress;
