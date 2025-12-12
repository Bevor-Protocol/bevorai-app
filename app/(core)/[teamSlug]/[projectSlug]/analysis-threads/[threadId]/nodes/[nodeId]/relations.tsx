"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AnalysisNodeSchemaI } from "@/utils/types";
import { GitBranch } from "lucide-react";
import Link from "next/link";
import React from "react";

const Relations: React.FC<{
  analysisVersion: AnalysisNodeSchemaI;
  threadId: string;
  teamSlug: string;
  projectSlug: string;
}> = ({ analysisVersion, teamSlug, projectSlug, threadId }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="ml-4">
          <GitBranch className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <div className="p-2 text-sm">
          <div className="mb-2 flex items-center gap-2">
            <span className="font-medium">Parent: </span>
            {analysisVersion.parent ? (
              <Badge variant="outline" size="sm">
                <Link
                  href={`/${teamSlug}/${projectSlug}/analysis-threads/${threadId}/nodes/${analysisVersion.parent.id}`}
                  className="text-blue-400"
                >
                  {analysisVersion.parent.id.slice(0, 7)}
                </Link>
              </Badge>
            ) : (
              <span className="text-muted-foreground">none</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-medium">Children: </span>
            <div className="flex flex-wrap gap-1 items-center">
              {analysisVersion.children.map((child) => (
                <Badge key={child.id} variant="outline" size="sm">
                  <Link
                    href={`/${teamSlug}/${projectSlug}/analysis-threads/${threadId}/nodes/${child.id}`}
                    className="text-blue-400"
                  >
                    {child.id.slice(0, 7)}
                  </Link>
                </Badge>
              ))}
            </div>
            {analysisVersion.children.length === 0 && (
              <span className="text-muted-foreground">none</span>
            )}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Relations;
