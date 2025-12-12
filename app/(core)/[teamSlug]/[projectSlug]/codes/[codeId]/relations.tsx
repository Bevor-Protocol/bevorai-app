"use client";

import { codeActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CodeVersionElementCompact } from "@/components/versions/element";
import { generateQueryKey } from "@/utils/constants";
import { CodeMappingSchemaI } from "@/utils/types";
import { useQuery } from "@tanstack/react-query";
import { GitBranch } from "lucide-react";
import Link from "next/link";

const Relations: React.FC<{
  version: CodeMappingSchemaI;
  teamSlug: string;
}> = ({ version, teamSlug }) => {
  const { data: relations } = useQuery({
    queryKey: generateQueryKey.codeRelations(version.id),
    queryFn: () => codeActions.getRelations(teamSlug, version.id),
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <GitBranch className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[500px]">
        <div className="p-2 space-y-3">
          <div>
            <span className="font-medium text-sm mb-2 block">Parent:</span>
            {relations?.parent ? (
              <Link
                href={`/${teamSlug}/${version.project_slug}/codes/${relations.parent.id}`}
                className="block hover:opacity-80 transition-opacity"
              >
                <CodeVersionElementCompact version={relations.parent} />
              </Link>
            ) : (
              <span className="text-muted-foreground text-sm">none</span>
            )}
          </div>

          <div>
            <span className="font-medium text-sm mb-2 block">Children:</span>
            {relations?.children && relations.children.length > 0 ? (
              <div className="space-y-2">
                {relations.children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/${teamSlug}/${version.project_slug}/codes/${child.id}`}
                    className="block hover:opacity-80 transition-opacity"
                  >
                    <CodeVersionElementCompact version={child} />
                  </Link>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground text-sm">none</span>
            )}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Relations;
