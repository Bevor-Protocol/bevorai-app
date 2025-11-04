"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CodeVersionMappingSchemaI } from "@/utils/types";
import { GitBranch } from "lucide-react";
import Link from "next/link";

const Relations: React.FC<{
  version: CodeVersionMappingSchemaI;
  teamId: string;
}> = ({ version, teamId }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="ml-4">
          <GitBranch className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <div className="p-2 text-sm">
          <div className="mb-2">
            <span className="font-medium">Parent: </span>
            {version.parent ? (
              <Link
                href={`/teams/${teamId}/codes/${version.parent.id}`}
                className="text-blue-400 hover:underline"
              >
                Version {version.parent.version_number}
              </Link>
            ) : (
              <span className="text-muted-foreground">none</span>
            )}
          </div>

          <div>
            <span className="font-medium">Child: </span>
            {version.child ? (
              <Link
                href={`/teams/${teamId}/codes/${version.child.id}`}
                className="text-blue-400 hover:underline"
              >
                Version {version.child.version_number}
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
