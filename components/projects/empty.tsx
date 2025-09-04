"use client";

import CreateProjectModal from "@/components/Modal/create-project";
import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/useContexts";
import { TeamSchemaI } from "@/utils/types";
import { FileText } from "lucide-react";
import React from "react";

export const ProjectEmpty: React.FC<{
  team?: TeamSchemaI;
  includeCta?: boolean;
  centered?: boolean;
}> = ({ team, includeCta = false, centered = false }) => {
  const { show, hide } = useModal();

  if (!centered) {
    <div className="flex flex-col py-6 gap-2">
      <div className="flex flex-row gap-2 items-center">
        <FileText className="size-6 text-neutral-600" />
        <h4 className="text-base font-medium text-neutral-300">No projects yet</h4>
      </div>
      <p className="text-sm text-neutral-500 pl-8">
        Get started by creating your first security audit project.
      </p>
      {includeCta && team && (
        <Button
          onClick={() => {
            if (close) close();
            show(<CreateProjectModal onClose={hide} targetTeamSlug={team.slug} />);
          }}
        >
          Start New Project
        </Button>
      )}
    </div>;
  }

  return (
    <div className="flex flex-col py-12 justify-center items-center">
      <FileText className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-neutral-300 mb-2">No projects yet</h3>
      <p className="text-sm text-neutral-500 mb-6">
        Get started by creating your first security audit project.
      </p>
      {includeCta && team && (
        <Button
          onClick={() => {
            if (close) close();
            show(<CreateProjectModal onClose={hide} targetTeamSlug={team.slug} />);
          }}
        >
          Start New Project
        </Button>
      )}
    </div>
  );
};
