"use client";
import { Button } from "@/components/ui/button";
import { MoveLeft } from "lucide-react";
import * as React from "react";
import ContractAdressStep from "./(steps)/address";
import FileStep from "./(steps)/file";
import FolderStep from "./(steps)/folder";
import MethodSelection from "./(steps)/method";

const steps = ["Code Method", "Code Submission", "Submission"];

const Steps: React.FC<{ teamId: string; projectId: string }> = (props) => {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [method, setMethod] = React.useState<string | null>(null);

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
      {currentStep === 1 && <MethodSelection setMethod={setMethod} nextStep={nextStep} />}
      {currentStep === 2 && method === "scan" && (
        <ContractAdressStep {...props} prevStep={prevStep} />
      )}
      {currentStep === 2 && method === "file" && <FileStep {...props} prevStep={prevStep} />}
      {currentStep === 2 && method === "folder" && <FolderStep {...props} prevStep={prevStep} />}
    </div>
  );
};

export default Steps;
