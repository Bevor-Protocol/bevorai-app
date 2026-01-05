"use client";

import { codeActions } from "@/actions/bevor";
import CreateCodeModal from "@/components/Modal/create-code";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CodeVersionCompactElement } from "@/components/versions/element";
import { generateQueryKey } from "@/utils/constants";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import Link from "next/link";
import React from "react";

export const AnalysisCreate: React.FC<{ teamSlug: string; projectSlug?: string }> = ({
  teamSlug,
  projectSlug,
}) => {
  const query: { [key: string]: string } = { page_size: "3", order: "desc" };
  if (projectSlug) {
    query.project_slug = projectSlug;
  }

  const { data: codeVersions, isLoading } = useQuery({
    queryKey: generateQueryKey.codes(teamSlug, query),
    queryFn: () =>
      codeActions.getVersions(teamSlug, query).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  if (!projectSlug && !isLoading && (!codeVersions?.results || codeVersions.results.length === 0)) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button>
            <Plus className="size-4" />
            Create Analysis
          </Button>
        </DialogTrigger>
        <DialogContent>
          <CreateCodeModal teamSlug={teamSlug} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Create Analysis
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[400px]">
        <div className="px-2 py-1.5 border-b">
          <div className="text-sm font-medium">What do you want to analyze?</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Choose a code version to create a security analysis
          </div>
        </div>
        <div className="min-h-[144px]">
          {isLoading && (
            <div className="p-4 text-sm text-muted-foreground">Loading code versions...</div>
          )}
          {!isLoading && codeVersions?.results && codeVersions.results.length > 0 && (
            <>
              {codeVersions.results.map((version) => (
                <DropdownMenuItem key={version.id} asChild>
                  <Link
                    href={`/team/${teamSlug}/${version.project_slug}/analyses/new?codeVersionId=${version.id}`}
                    className="block"
                  >
                    <CodeVersionCompactElement version={version} className="border-0 p-0" />
                  </Link>
                </DropdownMenuItem>
              ))}
            </>
          )}
          {((!isLoading && !codeVersions?.results) || codeVersions?.results.length === 0) && (
            <div className="text-sm text-muted-foreground text-center h-full flex flex-col items-center justify-center p-4">
              No code versions found. Upload a code version to get started.
            </div>
          )}
        </div>
        {((!isLoading && !codeVersions?.results) || codeVersions?.results.length === 0) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href={`/team/${teamSlug}/${projectSlug}/codes/new`}
                className="text-center justify-center"
              >
                Upload Code
              </Link>
            </DropdownMenuItem>
          </>
        )}
        {!isLoading && codeVersions?.results && codeVersions.results.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href={
                  projectSlug ? `/team/${teamSlug}/${projectSlug}/codes` : `/team/${teamSlug}/codes`
                }
                className="text-center justify-center"
              >
                View all
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
