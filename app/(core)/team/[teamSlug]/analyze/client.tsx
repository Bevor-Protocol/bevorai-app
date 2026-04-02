"use client";

import { projectActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import ContractAddressStep from "@/components/views/upload/explorer";
import FileStep from "@/components/views/upload/file";
import FolderStep from "@/components/views/upload/folder";
import MethodSelection from "@/components/views/upload/method";
import { PasteCodeStep } from "@/components/views/upload/paste";
import RepoUrlStep from "@/components/views/upload/public_repo";
import { cn } from "@/lib/utils";
import type { ProjectDetailedSchema } from "@/types/api/responses/business";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, MoveLeft, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useCallback, useRef, useState } from "react";

type Phase = "select" | "upload";

const AnalyzeClient: React.FC<{
  teamSlug: string;
  initialMethod?: string;
  onBack?: () => void;
}> = ({ teamSlug, initialMethod, onBack }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<Phase>(initialMethod ? "upload" : "select");
  const [method, setMethod] = useState<string | null>(initialMethod ?? null);
  const [error, setError] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const projectRef = useRef<ProjectDetailedSchema | null>(null);
  const pendingMethodRef = useRef<string | null>(null);

  const ensureProject = useCallback(async (): Promise<ProjectDetailedSchema> => {
    if (projectRef.current) return projectRef.current;
    const res = await projectActions.createProject(teamSlug, {});
    if (!res.ok) {
      throw new Error(
        typeof res.error === "object" && res.error != null && "message" in res.error
          ? String((res.error as { message?: string }).message)
          : "Failed to create project",
      );
    }
    res.data.toInvalidate.forEach((queryKey) => {
      queryClient.invalidateQueries({ queryKey });
    });
    projectRef.current = res.data.project;
    return res.data.project;
  }, [teamSlug, queryClient]);

  const handleSetMethod = (m: string): void => {
    pendingMethodRef.current = m;
  };

  const handleNextStep = (): void => {
    const m = pendingMethodRef.current;
    if (m) {
      setMethod(m);
      setPhase("upload");
    }
  };

  const captureEnsureProject = useCallback(async (): Promise<ProjectDetailedSchema> => {
    try {
      return await ensureProject();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
      throw err;
    }
  }, [ensureProject]);

  const reset = (): void => {
    setPhase("select");
    setMethod(null);
    setError(null);
    projectRef.current = null;
    pendingMethodRef.current = null;
  };

  if (phase === "select") {
    return (
      <>
        {error && (
          <p className={cn("text-sm text-destructive mb-4 flex items-center gap-2")}>
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

  if (phase === "upload" && method) {
    return (
      <div className="relative w-full h-full min-h-0 flex flex-col">
        {isFinishing && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/85 rounded-lg">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Creating analysis…</p>
          </div>
        )}
        {error && (
          <p className="text-sm text-destructive mb-4 flex items-center gap-2 shrink-0">
            <XCircle className="size-4 shrink-0" />
            {error}
          </p>
        )}
        <Button
          variant="ghost"
          className="mb-4 shrink-0 self-start"
          onClick={() => (onBack ? onBack() : reset())}
          disabled={isFinishing}
        >
          <MoveLeft />
          Back to selection
        </Button>
        <div className="flex-1 min-h-0 overflow-hidden">
          {method === "file" && (
            <FileStep
              ensureProject={captureEnsureProject}
              onSuccess={() => console.log("uploaded!")}
            />
          )}
          {method === "paste" && (
            <PasteCodeStep
              ensureProject={captureEnsureProject}
              onSuccess={() => console.log("uploaded!")}
            />
          )}
          {method === "folder" && (
            <FolderStep
              ensureProject={captureEnsureProject}
              onSuccess={() => console.log("uploaded!")}
            />
          )}
          {method === "scan" && (
            <ContractAddressStep
              ensureProject={captureEnsureProject}
              onSuccess={() => console.log("uploaded!")}
            />
          )}
          {method === "repo" && (
            <RepoUrlStep
              ensureProject={captureEnsureProject}
              onSuccess={() => console.log("uploaded!")}
            />
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default AnalyzeClient;
