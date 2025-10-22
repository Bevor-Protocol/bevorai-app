import { projectActions } from "@/actions/bevor";
import FolderStep from "@/app/(core)/teams/[teamId]/projects/[projectId]/versions/new/folder/step";
import StepHeader from "@/app/(core)/teams/[teamId]/projects/[projectId]/versions/new/step-header";
import Container from "@/components/container";
import { AsyncComponent } from "@/utils/types";
import { QueryClient } from "@tanstack/react-query";

type Props = {
  params: Promise<{ teamId: string; projectId: string }>;
};

const FolderStepPage: AsyncComponent<Props> = async ({ params }) => {
  const slugs = await params;

  const queryClient = new QueryClient();
  const project = await queryClient.fetchQuery({
    queryKey: ["projects", slugs.projectId],
    queryFn: () => projectActions.getProject(slugs.projectId),
  });

  return (
    <Container constrainHeight>
      <StepHeader params={slugs} />
      <FolderStep projectId={project.id} params={slugs} />
    </Container>
  );
};

export default FolderStepPage;
