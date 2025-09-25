import { bevorAction } from "@/actions";
import FolderStep from "@/app/(core)/teams/[teamSlug]/projects/[projectSlug]/versions/new/folder/step";
import StepHeader from "@/app/(core)/teams/[teamSlug]/projects/[projectSlug]/versions/new/step-header";
import Container from "@/components/container";
import { AsyncComponent } from "@/utils/types";
import { QueryClient } from "@tanstack/react-query";

type Props = {
  params: Promise<{ teamSlug: string; projectSlug: string }>;
};

const FolderStepPage: AsyncComponent<Props> = async ({ params }) => {
  const slugs = await params;

  const queryClient = new QueryClient();
  const project = await queryClient.fetchQuery({
    queryKey: ["projects", slugs.projectSlug],
    queryFn: () => bevorAction.getProjectBySlug(slugs.projectSlug),
  });

  return (
    <Container constrainHeight>
      <StepHeader params={slugs} />
      <FolderStep projectId={project.id} params={slugs} />
    </Container>
  );
};

export default FolderStepPage;
