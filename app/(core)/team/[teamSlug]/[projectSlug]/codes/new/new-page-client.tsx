"use client";

import { Button } from "@/components/ui/button";
import ContractAddressStep from "@/components/views/upload/explorer";
import FileStep from "@/components/views/upload/file";
import FolderStep from "@/components/views/upload/folder";
import MethodSelection from "@/components/views/upload/method";
import { PasteCodeStep } from "@/components/views/upload/paste";
import RepoUrlStep from "@/components/views/upload/public_repo";
import { useSSE } from "@/providers/sse";
import { ProjectDetailedSchema } from "@/types/api/responses/business";
import { MoveLeft } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

const steps = ["Code Method", "Code Submission", "Submission"];

const Steps: React.FC<{
  project: ProjectDetailedSchema;
  parentId?: string;
}> = ({ project, parentId }) => {
  const ensureProject = React.useCallback(async () => project, [project]);

  const [currentStep, setCurrentStep] = React.useState(1);
  const [method, setMethod] = React.useState<string | null>(null);
  const sseToastId = React.useRef<string | number | undefined>(undefined);
  const unregisterRef = React.useRef<() => void | undefined>(undefined);

  const { registerCallback } = useSSE();

  const handleSuccess = React.useCallback(
    (id: string) => {
      unregisterRef.current = registerCallback("code.status", id, (payload) => {
        if (payload.type !== "code.status") return;
        if (payload.data.status === "processing") {
          sseToastId.current = toast.loading("Processing code...");
        } else if (payload.data.status === "success") {
          toast.success("Processing successful", {
            id: sseToastId.current,
          });
          sseToastId.current = undefined;
        } else if (payload.data.status === "failed") {
          toast.error("Processing failed", {
            id: sseToastId.current,
          });
          sseToastId.current = undefined;
        } else {
          toast.dismiss(sseToastId.current);
          sseToastId.current = undefined;
        }
      });
    },
    [registerCallback],
  );

  React.useEffect(() => {
    // handle the instance that someone navigates away, as we don't want the toast
    // to persist, and want to kill the callback handler.
    return (): void => {
      if (sseToastId.current) {
        toast.dismiss(sseToastId.current);
      }
      if (unregisterRef.current) {
        unregisterRef.current();
      }
    };
  }, []);

  const nextStep = (): void => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = (): void => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="w-full">
      {currentStep === 2 && (
        <Button variant="ghost" onClick={prevStep}>
          <MoveLeft />
          Back to selection
        </Button>
      )}
      {currentStep === 1 && (
        <MethodSelection
          setMethod={setMethod}
          nextStep={nextStep}
          isChild={!!parentId}
          teamSlug={project.team.slug}
        />
      )}
      {currentStep === 2 && method === "scan" && (
        <ContractAddressStep
          ensureProject={ensureProject}
          parentId={parentId}
          onSuccess={handleSuccess}
        />
      )}
      {currentStep === 2 && method === "file" && (
        <FileStep ensureProject={ensureProject} parentId={parentId} onSuccess={handleSuccess} />
      )}
      {currentStep === 2 && method === "paste" && (
        <PasteCodeStep ensureProject={ensureProject} parentId={parentId} onSuccess={handleSuccess} />
      )}
      {currentStep === 2 && method === "folder" && (
        <FolderStep ensureProject={ensureProject} parentId={parentId} onSuccess={handleSuccess} />
      )}
      {currentStep === 2 && method === "repo" && (
        <RepoUrlStep ensureProject={ensureProject} parentId={parentId} onSuccess={handleSuccess} />
      )}
    </div>
  );
};

export default Steps;
