"use client";

import CreateCodeModal from "@/components/Modal/create-code";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import React from "react";

export const CodeCreate: React.FC<{ teamSlug: string }> = ({ teamSlug }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          New Code
        </Button>
      </DialogTrigger>
      <DialogContent>
        <CreateCodeModal teamSlug={teamSlug} />
      </DialogContent>
    </Dialog>
  );
};
