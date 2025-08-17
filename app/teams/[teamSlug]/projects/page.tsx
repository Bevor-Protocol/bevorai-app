import { bevorAction } from "@/actions";
import { AsyncComponent } from "@/utils/types";
import ProjectsPageClient from "./projects-page-client";

interface ProjectsPageProps {
  params: Promise<{ teamSlug: string }>;
}

const ProjectsPage: AsyncComponent<ProjectsPageProps> = async ({ params }) => {
  const { teamSlug } = await params;
  const team = await bevorAction.getTeamBySlug(teamSlug);
  const projects = await bevorAction.getProjects();

  return <ProjectsPageClient team={team} projects={projects} />;
};

export default ProjectsPage;
