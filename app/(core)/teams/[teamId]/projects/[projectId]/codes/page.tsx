import Container from "@/components/container";
import { Button } from "@/components/ui/button";
import { navigation } from "@/utils/navigation";
import { extractCodesQuery } from "@/utils/queries";
import { AsyncComponent } from "@/utils/types";
import { Plus } from "lucide-react";
import Link from "next/link";
import ContainerBreadcrumb from "./breadcrumb";
import CodeVersionsData from "./codes-page-client";

interface ProjectPageProps {
  params: Promise<{ teamId: string; projectId: string }>;
  searchParams: Promise<{ [key: string]: string }>;
}

const ProjectVersionsPage: AsyncComponent<ProjectPageProps> = async ({ params, searchParams }) => {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const query = extractCodesQuery(resolvedParams.projectId, resolvedSearchParams);

  return (
    <Container breadcrumb={<ContainerBreadcrumb {...resolvedParams} />} className="flex flex-col">
      <div className="flex flex-row mb-8 justify-between">
        <h3 className="text-foreground">Code Versions</h3>
        <Button className="text-foreground" asChild>
          <Link href={navigation.code.new({ ...resolvedParams })}>
            <Plus className="size-4 mr-2" />
            Create Version
          </Link>
        </Button>
      </div>
      <CodeVersionsData query={query} {...resolvedParams} />
    </Container>
  );
};

export default ProjectVersionsPage;
