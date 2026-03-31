"use client";

import ContractAddressStep from "@/app/(core)/team/[teamSlug]/[projectSlug]/codes/new/(steps)/address";
import FileStep from "@/app/(core)/team/[teamSlug]/[projectSlug]/codes/new/(steps)/file";
import FolderStep from "@/app/(core)/team/[teamSlug]/[projectSlug]/codes/new/(steps)/folder";
import MethodSelection from "@/app/(core)/team/[teamSlug]/[projectSlug]/codes/new/(steps)/method";
import RepoUrlStep from "@/app/(core)/team/[teamSlug]/[projectSlug]/codes/new/(steps)/repo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProjectDetailedSchema } from "@/types/api/responses/business";
import { CheckCircle, Circle, Loader2, MoveLeft, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

type Phase = "select" | "creating-project" | "upload" | "processing";

type Step = { id: string; label: string; status: "idle" | "active" | "done" | "error" };

const STEPS: Step[] = [
  { id: "processing", label: "Processing code", status: "idle" },
  { id: "analysis", label: "Creating analysis", status: "idle" },
];

const AnalyzeClient: React.FC<{
  teamSlug: string;
  initialMethod?: string;
  onBack?: () => void;
}> = ({ teamSlug, initialMethod, onBack }) => {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>(initialMethod ? "creating-project" : "select");
  const [method, setMethod] = useState<string | null>(initialMethod ?? null);
  const [project, setProject] = useState<ProjectDetailedSchema | null>(null);
  const [steps, setSteps] = useState<Step[]>(STEPS);
  const [error, setError] = useState<string | null>(null);
  const pendingMethodRef = useRef<string | null>(null);
  const didInitRef = useRef(false);

  // Auto-start project creation when initialMethod is provided
  useEffect(() => {
    if (!initialMethod || didInitRef.current) return;
    didInitRef.current = true;
    startProjectCreation(initialMethod);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Used by MethodSelection when no initialMethod is present
  const handleSetMethod = (m: string) => {
    pendingMethodRef.current = m;
  };

  const handleNextStep = () => {
    const m = pendingMethodRef.current;
    if (m) startProjectCreation(m);
  };

  const startProjectCreation = async (m: string) => {
    setMethod(m);
    setPhase("creating-project");
    setError(null);

    try {
      const res = await fetch("/api/analyze/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamSlug }),
      });
      if (!res.ok) throw new Error("Failed to create project");
      const proj = await res.json();
      setProject(proj as ProjectDetailedSchema);
      setPhase("upload");
    } catch (err: any) {
      setError(err.message ?? "Failed to create project");
      setPhase("select");
    }
  };

  const handleUploadSuccess = async (codeVersionId: string) => {
    if (!project) return;
    setPhase("processing");
    setSteps(STEPS.map((s) => ({ ...s, status: "idle" })));
    setError(null);

    try {
      const res = await fetch("/api/analyze/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          projectSlug: project.slug,
          codeVersionId,
          teamSlug,
        }),
      });
      if (!res.body) throw new Error("No response stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          let event: any;
          try {
            event = JSON.parse(raw);
          } catch {
            continue;
          }

          if (event.type === "step") {
            setSteps((prev) =>
              prev.map((s) => {
                if (s.id === event.step) return { ...s, status: "active" };
                if (s.status === "active") return { ...s, status: "done" };
                return s;
              }),
            );
          } else if (event.type === "done") {
            setSteps((prev) => prev.map((s) => ({ ...s, status: "done" })));
            router.push(
              `/team/${event.teamSlug}/${event.projectSlug}/analyses/${event.analysisId}`,
            );
            return;
          } else if (event.type === "error") {
            setError(event.message ?? "Something went wrong");
            setSteps((prev) =>
              prev.map((s) => (s.status === "active" ? { ...s, status: "error" } : s)),
            );
          }
        }
      }
    } catch (err: any) {
      setError(err.message ?? "Network error");
    }
  };

  const reset = () => {
    setPhase("select");
    setMethod(null);
    setProject(null);
    setSteps(STEPS.map((s) => ({ ...s, status: "idle" })));
    setError(null);
    pendingMethodRef.current = null;
  };

  // ── Method selection ──────────────────────────────────────────────────────────
  if (phase === "select") {
    return (
      <>
        {error && (
          <p className="text-sm text-destructive mb-4 flex items-center gap-2">
            <XCircle className="size-4 shrink-0" />
            {error}
          </p>
        )}
        <MethodSelection
          setMethod={handleSetMethod}
          nextStep={handleNextStep}
          teamSlug={teamSlug}
          isChild={false}
        />
      </>
    );
  }

  // ── Creating project spinner ──────────────────────────────────────────────────
  if (phase === "creating-project") {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="size-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Setting up project...</p>
        </div>
      </div>
    );
  }

  // ── Upload step ───────────────────────────────────────────────────────────────
  if (phase === "upload" && project) {
    return (
      <div className="w-full h-full flex flex-col">
        <Button
          variant="ghost"
          className="mb-4 shrink-0 self-start"
          onClick={() => (onBack ? onBack() : reset())}
        >
          <MoveLeft />
          Back to selection
        </Button>
        <div className="flex-1 min-h-0 overflow-hidden">
          {method === "file" && (
            <FileStep project={project} onSuccess={handleUploadSuccess} />
          )}
          {method === "folder" && (
            <FolderStep project={project} onSuccess={handleUploadSuccess} />
          )}
          {method === "scan" && (
            <ContractAddressStep project={project} onSuccess={handleUploadSuccess} />
          )}
          {method === "repo" && (
            <RepoUrlStep project={project} onSuccess={handleUploadSuccess} />
          )}
        </div>
      </div>
    );
  }

  // ── Processing view ───────────────────────────────────────────────────────────
  return (
    <div className="h-full flex items-center justify-center">
    <div className="max-w-sm w-full space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">Running Analysis</h2>
        <p className="text-sm text-muted-foreground">
          Sit tight — this usually takes under a minute.
        </p>
      </div>

      <div className="space-y-3">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center gap-3">
            {step.status === "idle" && (
              <Circle className="size-5 text-muted-foreground/40 shrink-0" />
            )}
            {step.status === "active" && (
              <Loader2 className="size-5 animate-spin text-primary shrink-0" />
            )}
            {step.status === "done" && (
              <CheckCircle className="size-5 text-green-500 shrink-0" />
            )}
            {step.status === "error" && (
              <XCircle className="size-5 text-destructive shrink-0" />
            )}
            <span
              className={cn(
                "text-sm",
                step.status === "idle" && "text-muted-foreground/50",
                step.status === "active" && "text-foreground font-medium",
                step.status === "done" && "text-muted-foreground line-through",
                step.status === "error" && "text-destructive",
              )}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
          <Button variant="outline" size="sm" className="mt-3 w-full" onClick={reset}>
            Try again
          </Button>
        </div>
      )}
    </div>
    </div>
  );
};

export default AnalyzeClient;
