"use client";

import { projectActions } from "@/actions/bevor";
import CreateAnalysisModal from "@/components/Modal/create-analysis";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { generateQueryKey } from "@/utils/constants";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import React from "react";

export const AnalysisCreate: React.FC<{ teamSlug: string; projectSlug: string }> = ({
  teamSlug,
  projectSlug,
}) => {
  const { data: project } = useQuery({
    queryKey: generateQueryKey.project(projectSlug),
    queryFn: async () => projectActions.getProject(teamSlug, projectSlug),
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Create Analysis
        </Button>
      </DialogTrigger>
      <DialogContent>
        {!!project && <CreateAnalysisModal teamSlug={teamSlug} project={project} />}
      </DialogContent>
    </Dialog>
  );
};
