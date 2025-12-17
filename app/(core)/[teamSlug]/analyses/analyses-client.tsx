"use client";

import CreateAnalysisModal from "@/components/Modal/create-analysis";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import React from "react";

export const AnalysisCreate: React.FC<{ teamSlug: string }> = ({ teamSlug }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Create Analysis
        </Button>
      </DialogTrigger>
      <DialogContent>
        <CreateAnalysisModal teamSlug={teamSlug} />
      </DialogContent>
    </Dialog>
  );
};
