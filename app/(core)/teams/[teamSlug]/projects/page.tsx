"use server";

import { bevorAction } from "@/actions";
import { TeamHeader } from "@/components/team/header";
import { Button } from "@/components/ui/button";
import { AsyncComponent } from "@/utils/types";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import ProjectsPageClient from "./projects-page-client";

const ProjectsPage: AsyncComponent = async () => {
  const queryClient = new QueryClient();
  const team = await bevorAction.getTeam();

  await queryClient.prefetchQuery({
    queryKey: ["projects", team.id, { page_size: "6", name: "", tag: "" }],
    queryFn: () => bevorAction.getProjects({ page_size: "6" }),
  });

  return (
    <div className="px-6 py-8 fill-remaining-height">
      <TeamHeader title="Projects" subTitle="projects">
        <Button>
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </TeamHeader>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ProjectsPageClient team={team} />
      </HydrationBoundary>
    </div>
  );
};

export default ProjectsPage;
