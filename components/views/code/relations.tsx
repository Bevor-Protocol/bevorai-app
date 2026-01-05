"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CodeVersionCompactElement } from "@/components/versions/element";
import { CodeMappingSchemaI, CodeRelationSchemaI } from "@/utils/types";
import { ArrowUp, GitBranch } from "lucide-react";
import Link from "next/link";

const ParentButton: React.FC<{
  teamSlug: string;
  projectSlug: string;
  relations?: CodeRelationSchemaI;
  similarVersions?: { score: number; version: CodeMappingSchemaI }[];
  onSetParent: (parentId: string) => void;
  isUpdating: boolean;
}> = ({ teamSlug, projectSlug, relations, similarVersions, onSetParent, isUpdating }) => {
  const hasParent = !!relations?.parent;
  const showSimilarSuggestions = !hasParent && similarVersions && similarVersions.length > 0;

  if (!hasParent && !showSimilarSuggestions) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <ArrowUp className="size-4" />
          {showSimilarSuggestions && similarVersions && (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-blue-500 text-[10px] text-white">
              {similarVersions.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[500px]">
        <div className="p-2 space-y-3">
          {hasParent && relations.parent ? (
            <div>
              <span className="font-medium text-sm mb-2 block">Parent:</span>
              <Link
                href={`/team/${teamSlug}/${projectSlug}/codes/${relations.parent.id}`}
                className="block hover:opacity-80 transition-opacity"
              >
                <CodeVersionCompactElement version={relations.parent} />
              </Link>
            </div>
          ) : (
            similarVersions && (
              <div>
                <h4 className="font-medium text-sm">Similar versions found</h4>
                <p className="text-xs text-muted-foreground mt-1 mb-3">
                  This version doesn&apos;t have a parent. Consider linking it to one of these:
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {similarVersions.map(({ version: similarVersion, score }) => (
                    <div
                      key={similarVersion.id}
                      className="flex items-center justify-between gap-2 p-2 rounded border"
                    >
                      <Link
                        href={`/team/${teamSlug}/${projectSlug}/codes/${similarVersion.id}`}
                        className="flex-1 min-w-0 hover:opacity-80 transition-opacity"
                      >
                        <CodeVersionCompactElement version={similarVersion} />
                      </Link>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {Math.round(score * 100)}%
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onSetParent(similarVersion.id)}
                          disabled={isUpdating}
                          className="text-xs h-7"
                        >
                          Set parent
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const ChildrenButton: React.FC<{
  teamSlug: string;
  projectSlug: string;
  relations?: CodeRelationSchemaI;
}> = ({ teamSlug, projectSlug, relations }) => {
  const hasChildren = relations?.children && relations.children.length > 0;

  if (!hasChildren) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <GitBranch className="size-4" />
          {relations.children.length > 1 && (
            <span className="ml-1 text-xs">{relations.children.length}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[500px]">
        <div className="p-2 space-y-3">
          <div>
            <span className="font-medium text-sm mb-2 block">Children:</span>
            <div className="space-y-2">
              {relations.children.map((child) => (
                <Link
                  key={child.id}
                  href={`/team/${teamSlug}/${projectSlug}/codes/${child.id}`}
                  className="block hover:opacity-80 transition-opacity"
                >
                  <CodeVersionCompactElement version={child} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const Relations: React.FC<{
  teamSlug: string;
  projectSlug: string;
  relations?: CodeRelationSchemaI;
  similarVersions?: { score: number; version: CodeMappingSchemaI }[];
  onSetParent: (parentId: string) => void;
  isUpdating: boolean;
}> = ({ teamSlug, projectSlug, relations, similarVersions, onSetParent, isUpdating }) => {
  return (
    <>
      <ParentButton
        teamSlug={teamSlug}
        projectSlug={projectSlug}
        relations={relations}
        similarVersions={similarVersions}
        onSetParent={onSetParent}
        isUpdating={isUpdating}
      />
      <ChildrenButton teamSlug={teamSlug} projectSlug={projectSlug} relations={relations} />
    </>
  );
};

export default Relations;
