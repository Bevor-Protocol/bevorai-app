"use server";

import { dashboardActions } from "@/actions/bevor";
import Container from "@/components/container";
import { getQueryClient } from "@/lib/config/query";
import { generateQueryKey } from "@/utils/constants";
import { AsyncComponent } from "@/utils/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ProjectsTable } from "./projects-client";

const ProjectsPage: AsyncComponent = async () => {
  const queryClient = getQueryClient();

  const projectQuery = {
    page_size: "12",
    name: "",
    tag: "",
  };

  await queryClient.fetchQuery({
    queryKey: generateQueryKey.allProjects(projectQuery),
    queryFn: async () => dashboardActions.getAllProjects(projectQuery),
  });

  return (
    <Container>
      <div className="flex flex-row mb-8 justify-between">
        <div className="flex flex-row items-center gap-4">
          <h3 className="text-foreground">Projects</h3>
        </div>
      </div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ProjectsTable projectQuery={projectQuery} />
      </HydrationBoundary>
    </Container>
  );
};

export default ProjectsPage;
