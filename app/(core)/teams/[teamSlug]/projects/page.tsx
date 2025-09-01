import { bevorAction } from "@/actions";
import { AsyncComponent } from "@/utils/types";
import ProjectsPageClient from "./projects-page-client";

const ProjectsPage: AsyncComponent = async () => {
  const team = await bevorAction.getTeam();
  const projects = await bevorAction.getProjects();

  return <ProjectsPageClient team={team} projects={projects} />;
};

export default ProjectsPage;
