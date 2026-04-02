"use client";

import { analysisActions, codeActions } from "@/actions/bevor";
import AnalysisStatusDisplay, {
  ChecklistGlyph,
  type AnalysisWithScopesAndFindings,
} from "@/app/(core)/team/[teamSlug]/[projectSlug]/codes/[codeId]/analyses/new/status";
import Container from "@/components/container";
import ProjectSubnav from "@/components/subnav/project";
import { useSSE } from "@/providers/sse";
import type { CodeVersionStatus } from "@/types/api/responses/graph";
import { generateQueryKey } from "@/utils/constants";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";

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

interface ProcessingClientProps {
  teamSlug: string;
  projectSlug: string;
  analysisId: string;
}

const ProcessingClient: React.FC<ProcessingClientProps> = ({
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
    refetchInterval: (query) => {
      const st = query.state.data?.status;
      return st === "waiting" || st === "processing" ? 4000 : false;
    },
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

  const { data: findings } = useQuery({
    queryKey: generateQueryKey.analysisFindings(analysisId),
    queryFn: async () => {
      const r = await analysisActions.getAnalysisFindings(teamSlug, analysisId);
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
    refetchInterval: (query) => {
      const st = query.state.data?.status;
      return st === "waiting" || st === "processing" ? 4000 : false;
    },
  });

  const analysisForStatus = useMemo((): AnalysisWithScopesAndFindings | null => {
    if (!analysis || scopes === undefined || findings === undefined) return null;
    return { ...analysis, scopes, findings };
  }, [analysis, scopes, findings]);

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
    const off = registerCallback("code", "team", codeVersionId, (payload) => {
      const next = payload.data.status as CodeVersionStatus;
      setCodeStatus(next);
      void queryClient.invalidateQueries({ queryKey: generateQueryKey.code(codeVersionId) });
    });
    return off;
  }, [codeVersionId, queryClient, registerCallback]);

  useEffect(() => {
    const off = registerCallback("analysis", "team", analysisId, () => {
      invalidateAnalysisBundle();
    });
    return off;
  }, [analysisId, invalidateAnalysisBundle, registerCallback]);

  if (!analysis || !code || !analysisForStatus) {
    return (
      <Container subnav={<ProjectSubnav />}>
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </Container>
    );
  }

  const status = codeStatus ?? code.status;
  const codeDone = status === "success";
  const codeFailed = status === "failed";
  const codeBusy = status === "waiting" || status === "processing";

  return (
    <Container subnav={<ProjectSubnav />}>
      <div className="max-w-lg w-full mx-auto flex flex-col gap-10 py-8 pb-20 min-h-0">
        <header>
          <h1 className="text-lg font-medium tracking-tight text-foreground">Processing</h1>
          <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">
            Progress updates as your code is indexed, then as each scope is analyzed.
          </p>
        </header>

        <div className="flex flex-col gap-10">
          <div className="flex gap-3.5">
            <ChecklistGlyph done={codeDone} failed={codeFailed} busy={codeBusy} />
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-h-5">
                <span className="text-[15px] font-medium leading-none tracking-[-0.01em]">
                  Code
                </span>
                <span className="text-muted-foreground/50">·</span>
                <Link
                  href={`/team/${teamSlug}/${projectSlug}/codes/${codeVersionId}`}
                  className="text-[13px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Open version
                </Link>
              </div>
              <p className="text-[13px] text-muted-foreground mt-1.5 leading-snug">
                {codeStatusLine(status)}
              </p>
            </div>
          </div>

          <div>
            <AnalysisStatusDisplay
              analysis={analysisForStatus}
              teamSlug={teamSlug}
              projectSlug={projectSlug}
              toastRefId={undefined}
              checklist
            />
          </div>
        </div>
      </div>
    </Container>
  );
};

export default ProcessingClient;
