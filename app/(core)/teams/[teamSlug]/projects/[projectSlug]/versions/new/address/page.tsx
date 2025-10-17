import { bevorAction } from "@/actions";
import ContractAddressStep from "@/app/(core)/teams/[teamSlug]/projects/[projectSlug]/versions/new/address/step";
import StepHeader from "@/app/(core)/teams/[teamSlug]/projects/[projectSlug]/versions/new/step-header";
import Container from "@/components/container";
import { AsyncComponent } from "@/utils/types";
import { QueryClient } from "@tanstack/react-query";

type Props = {
  params: Promise<{ teamSlug: string; projectSlug: string }>;
};

const AddressStep: AsyncComponent<Props> = async ({ params }) => {
  const slugs = await params;

  const queryClient = new QueryClient();
  const project = await queryClient.fetchQuery({
    queryKey: ["projects", slugs.projectSlug],
    queryFn: () => bevorAction.getProjectBySlug(slugs.projectSlug),
  });

  return (
    <Container>
      <StepHeader params={slugs} />
      <ContractAddressStep projectId={project.id} params={slugs} />
    </Container>
  );
};

export default AddressStep;
