"use client";
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

  const { updateClaims } = useSSE({
    eventTypes: ["code"],
    onMessage: (message) => {
      console.log("NEW CODE MESSAGE RECEIVED", message);
      let parsed: string;
      try {
        parsed = JSON.parse(message.data);
      } catch {
        parsed = message.data;
      }

      if (parsed === "pending" || parsed === "embedding") {
        sseToastId.current = toast.loading("Post-processing code...");
      }

      if (parsed === "embedded") {
        toast.success("Post-processing successful", {
          id: sseToastId.current,
        });
        sseToastId.current = undefined;
      } else if (parsed === "failed") {
        toast.error("Post-processing failed", {
          id: sseToastId.current,
        });
        sseToastId.current = undefined;
      }
    },
  });

  const handleSuccess = React.useCallback(
    (id: string): void => {
      updateClaims({ code_version_id: id });
    },
    [updateClaims],
  );

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
        <MethodSelection setMethod={setMethod} nextStep={nextStep} isChild={!!parentId} />
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
    </div>
  );
};

export default Steps;
