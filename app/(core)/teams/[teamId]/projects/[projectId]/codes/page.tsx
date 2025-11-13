import { teamActions } from "@/actions/bevor";
import ContainerBreadcrumb from "@/components/breadcrumbs";
import Container from "@/components/container";
import { Button } from "@/components/ui/button";
import { navigation } from "@/utils/navigation";
import { extractCodesQuery } from "@/utils/queries";
import { AsyncComponent } from "@/utils/types";
import { Plus } from "lucide-react";
import Link from "next/link";
import CodeVersionsData from "./codes-page-client";

interface ResolvedParams {
  teamId: string;
  projectId: string;
}

interface ProjectPageProps {
  params: Promise<ResolvedParams>;
  searchParams: Promise<{ [key: string]: string }>;
}

const ProjectVersionsPage: AsyncComponent<ProjectPageProps> = async ({ params, searchParams }) => {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const currentUser = await teamActions.getCurrentMember(resolvedParams.teamId);

  const query = extractCodesQuery(resolvedParams.projectId, {
    user_id: currentUser.user.id,
    ...resolvedSearchParams,
  });

  return (
    <Container
      breadcrumb={
        <ContainerBreadcrumb
          queryKey={[resolvedParams.projectId]}
          queryType="project-codes"
          teamId={resolvedParams.teamId}
          id={resolvedParams.projectId}
        />
      }
      className="flex flex-col"
    >
      <div className="flex flex-row mb-8 justify-between">
        <h3 className="text-foreground">Code Versions</h3>
        <Button className="text-foreground" asChild>
          <Link href={navigation.code.new({ ...resolvedParams })}>
            <Plus className="size-4" />
            Create Version
          </Link>
        </Button>
      </div>
      <CodeVersionsData query={query} {...resolvedParams} />
    </Container>
  );
};

export default ProjectVersionsPage;
