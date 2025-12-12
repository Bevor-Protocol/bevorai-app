"use client";

import { projectActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateQueryKey } from "@/utils/constants";
import { DefaultProjectsQuery } from "@/utils/query-params";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import React, { useState } from "react";

const CreateCodeModal: React.FC<{
  teamSlug: string;
}> = ({ teamSlug }) => {
  // Fetch this only if the project is not provided. We'll hardcord the provided project otherwise.
  const [projectSlug, setProjectSlug] = useState("");

  const { data: projects } = useQuery({
    queryKey: generateQueryKey.projects(teamSlug, DefaultProjectsQuery),
    queryFn: async () => projectActions.getProjects(teamSlug, DefaultProjectsQuery),
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add New Code</DialogTitle>
        <DialogDescription>
          Choose a project that this new code should be added to
        </DialogDescription>
      </DialogHeader>
      <Select value={projectSlug} onValueChange={(value) => setProjectSlug(value)}>
        <SelectTrigger id="project_slug" className="w-full">
          <SelectValue placeholder="Select a project" />
        </SelectTrigger>
        <SelectContent>
          {projects?.results?.map((project) => (
            <SelectItem key={project.id} value={project.slug}>
              <Icon size="sm" seed={project.id} />
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <DialogFooter className="mt-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </DialogClose>
        {!projectSlug ? (
          <Button disabled>Create Code</Button>
        ) : (
          <Button asChild>
            <Link href={`/${teamSlug}/${projectSlug}/codes/new`}>Create Code</Link>
          </Button>
        )}
      </DialogFooter>
    </>
  );
};

export default CreateCodeModal;
