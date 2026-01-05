"use client";
import RepoUrlStep from "@/app/(core)/team/[teamSlug]/[projectSlug]/codes/new/(steps)/repo";
import { Button } from "@/components/ui/button";
import { useSSE } from "@/providers/sse";
import { ProjectDetailedSchemaI } from "@/utils/types";
import { MoveLeft } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import ContractAdressStep from "./(steps)/address";
import FileStep from "./(steps)/file";
import FolderStep from "./(steps)/folder";
import MethodSelection from "./(steps)/method";

const steps = ["Code Method", "Code Submission", "Submission"];

const Steps: React.FC<{
  project: ProjectDetailedSchemaI;
  parentId?: string;
}> = ({ project, parentId }) => {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [method, setMethod] = React.useState<string | null>(null);
  const sseToastId = React.useRef<string | number | undefined>(undefined);
  const unregisterRef = React.useRef<() => void | undefined>(undefined);

  const { registerCallback } = useSSE();

  const handleSuccess = React.useCallback(
    (id: string) => {
      unregisterRef.current = registerCallback("code", "team", id, (payload) => {
        if (payload.data.status === "parsing" || payload.data.status === "embedding") {
          sseToastId.current = toast.loading("Post-processing code...");
        } else if (payload.data.status == "success") {
          toast.success("Post-processing successful", {
            id: sseToastId.current,
          });
          sseToastId.current = undefined;
        } else if (
          payload.data.status === "failed_parsing" ||
          payload.data.status === "failed_embedding"
        ) {
          toast.error("Post-processing failed", {
            id: sseToastId.current,
          });
          sseToastId.current = undefined;
        } else {
          // something else, just handle it.
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
        <ContractAdressStep project={project} parentId={parentId} onSuccess={handleSuccess} />
      )}
      {currentStep === 2 && method === "file" && (
        <FileStep project={project} parentId={parentId} onSuccess={handleSuccess} />
      )}
      {currentStep === 2 && method === "folder" && (
        <FolderStep project={project} parentId={parentId} onSuccess={handleSuccess} />
      )}
      {currentStep === 2 && method === "repo" && (
        <RepoUrlStep project={project} parentId={parentId} onSuccess={handleSuccess} />
      )}
    </div>
  );
};

export default Steps;
