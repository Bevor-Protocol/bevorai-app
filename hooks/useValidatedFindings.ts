"use client";

import { FindingSchemaI, ProjectValidatedFinding } from "@/utils/types";
import { useCallback, useEffect, useState } from "react";

// Keyed per project so findings are project-scoped across analyses.
// TODO: Replace get/set with API calls (GET /projects/{slug}/validated-findings,
//       POST to promote, PATCH to remediate) when the backend endpoint exists.
//       The return shape of this hook is the stable public interface.
const storageKey = (projectSlug: string) => `vf:${projectSlug}`;

const load = (projectSlug: string): ProjectValidatedFinding[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(projectSlug));
    return raw ? (JSON.parse(raw) as ProjectValidatedFinding[]) : [];
  } catch {
    return [];
  }
};

const save = (projectSlug: string, findings: ProjectValidatedFinding[]): void => {
  localStorage.setItem(storageKey(projectSlug), JSON.stringify(findings));
};

export const useValidatedFindings = (projectSlug: string) => {
  const [findings, setFindings] = useState<ProjectValidatedFinding[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setFindings(load(projectSlug));
    setHydrated(true);
  }, [projectSlug]);

  // Promote a per-analysis finding to the project-level validated list.
  // Called when a user thumbs-up a finding in the Feedback tab.
  const promote = useCallback(
    (
      finding: FindingSchemaI,
      sourceAnalysisId: string,
      codeVersionId: string,
      validatedByUsername: string,
    ) => {
      setFindings((prev) => {
        // Idempotent: don't add duplicates for the same source finding.
        if (prev.some((f) => f.source_finding_id === finding.id)) {
          const next = prev.map((f) =>
            f.source_finding_id === finding.id ? { ...f, status: "active" as const } : f,
          );
          save(projectSlug, next);
          return next;
        }
        const entry: ProjectValidatedFinding = {
          id: crypto.randomUUID(),
          name: finding.name,
          level: finding.level,
          type: finding.type,
          explanation: finding.explanation,
          recommendation: finding.recommendation,
          source_finding_id: finding.id,
          source_analysis_id: sourceAnalysisId,
          code_version_id: codeVersionId,
          status: "active",
          validated_at: new Date().toISOString(),
          validated_by_username: validatedByUsername,
        };
        const next = [entry, ...prev];
        save(projectSlug, next);
        return next;
      });
    },
    [projectSlug],
  );

  // Flag an active finding as pending remediation (AI-suggested intermediate state).
  // A human must call remediate() to officially confirm.
  const flagForRemediation = useCallback(
    (id: string) => {
      setFindings((prev) => {
        const next = prev.map((f) =>
          f.id === id && f.status === "active"
            ? { ...f, status: "pending_remediation" as const }
            : f,
        );
        save(projectSlug, next);
        return next;
      });
    },
    [projectSlug],
  );

  // Explicitly mark an active or pending_remediation finding as remediated (human-confirmed).
  // Pass the code version that fixed it if known (e.g. the current analysis version).
  const remediate = useCallback(
    (id: string, remediatedByUsername: string, codeVersionId?: string) => {
      setFindings((prev) => {
        const next = prev.map((f) =>
          f.id === id
            ? {
                ...f,
                status: "remediated" as const,
                remediated_at: new Date().toISOString(),
                remediated_by_username: remediatedByUsername,
                remediated_code_version_id: codeVersionId,
              }
            : f,
        );
        save(projectSlug, next);
        return next;
      });
    },
    [projectSlug],
  );

  // Restore a remediated finding back to active.
  const restore = useCallback(
    (id: string) => {
      setFindings((prev) => {
        const next = prev.map((f) =>
          f.id === id
            ? {
                ...f,
                status: "active" as const,
                remediated_at: undefined,
                remediated_code_version_id: undefined,
                remediated_by_username: undefined,
              }
            : f,
        );
        save(projectSlug, next);
        return next;
      });
    },
    [projectSlug],
  );

  // Remove a finding from the list entirely.
  const remove = useCallback(
    (id: string) => {
      setFindings((prev) => {
        const next = prev.filter((f) => f.id !== id);
        save(projectSlug, next);
        return next;
      });
    },
    [projectSlug],
  );

  const active = findings.filter((f) => f.status === "active");
  const pendingRemediation = findings.filter((f) => f.status === "pending_remediation");
  const remediated = findings.filter((f) => f.status === "remediated");

  return { active, pendingRemediation, remediated, promote, flagForRemediation, remediate, restore, remove, hydrated };
};
