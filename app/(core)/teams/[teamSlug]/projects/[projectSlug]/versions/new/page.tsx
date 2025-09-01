import { bevorAction } from "@/actions";
import { AsyncComponent } from "@/utils/types";
import Link from "next/link";
import VersionCreationStep from "./version-creation-step";

interface NewVersionPageProps {
  params: Promise<{ teamSlug: string; projectSlug: string }>;
}

const NewVersionPage: AsyncComponent<NewVersionPageProps> = async ({ params }) => {
  const { teamSlug, projectSlug } = await params;

  const team = await bevorAction.getTeam();
  const project = await bevorAction.getProjectBySlug(projectSlug);

  return (
    <div className="px-6 py-8 bg-neutral-950 min-h-screen">
      <div className="mb-8">
        <Link
          href={`/teams/${teamSlug}/projects/${projectSlug}`}
          className="text-blue-400 hover:text-blue-300"
        >
          ← Back to {project.name}
        </Link>
      </div>

      <VersionCreationStep
        projectId={project.id}
        teamId={team.id}
        teamSlug={teamSlug}
        projectSlug={projectSlug}
      />
    </div>
  );
};

export default NewVersionPage;
