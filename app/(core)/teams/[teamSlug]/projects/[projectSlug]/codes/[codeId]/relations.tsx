"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CodeMappingSchemaI } from "@/utils/types";
import { GitBranch } from "lucide-react";
import Link from "next/link";

const Relations: React.FC<{
  version: CodeMappingSchemaI;
  teamSlug: string;
}> = ({ version, teamSlug }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <GitBranch className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <div className="p-2 text-sm">
          <div className="mb-2">
            <span className="font-medium">Parent: </span>
            {version.parent ? (
              <Link
                href={`/teams/${teamSlug}/projects/${version.project_slug}/codes/${version.parent.id}`}
                className="text-blue-400 hover:underline"
              >
                Version {version.parent.name}
              </Link>
            ) : (
              <span className="text-muted-foreground">none</span>
            )}
          </div>

          <div>
            <span className="font-medium">Child: </span>
            {version.child ? (
              <Link
                href={`/teams/${teamSlug}/projects/${version.project_slug}/codes/${version.child.id}`}
                className="text-blue-400 hover:underline"
              >
                Version {version.child.name}
              </Link>
            ) : (
              <span className="text-muted-foreground">none</span>
            )}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Relations;
