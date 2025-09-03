"use server";

import { bevorAction } from "@/actions";
import { TeamHeader } from "@/components/team/header";
import { AsyncComponent } from "@/utils/types";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import ProjectsPageClient from "./projects-page-client";

const ProjectsPage: AsyncComponent = async () => {
  const queryClient = new QueryClient();
  const team = await bevorAction.getTeam();

  queryClient.prefetchQuery({
    queryKey: ["projects", team.id, { page_size: "6", name: "", tag: "" }],
    queryFn: () => bevorAction.getProjects({ page_size: "6" }),
  });

  return (
    <div className="px-6 py-8 fill-remaining-height">
      <TeamHeader title="Projects" subTitle="projects" />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ProjectsPageClient team={team} />
      </HydrationBoundary>
    </div>
  );
};

export default ProjectsPage;
