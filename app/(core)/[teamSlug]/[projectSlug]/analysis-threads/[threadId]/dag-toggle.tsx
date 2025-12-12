"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AnalysisDagSchemaI } from "@/utils/types";
import { Network } from "lucide-react";
import React from "react";
import DagViewer from "./dag-viewer";

interface DagToggleProps {
  dag: AnalysisDagSchemaI;
}

const DagToggle: React.FC<DagToggleProps> = ({ dag }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Network className="size-4" />
          DAG
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl w-[90vw] h-[90vh] p-0">
        <DialogHeader>
          <DialogTitle>DAG Viewer</DialogTitle>
        </DialogHeader>
        <div className="w-full h-full p-6">
          <DagViewer dag={dag} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DagToggle;
