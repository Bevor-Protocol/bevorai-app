import Container from "@/components/container";
import { ChatsView } from "@/components/screens/chats";
import ProjectSubnav from "@/components/subnav/project";
import { AsyncComponent } from "@/types";
import { extractQueryParams } from "@/utils/query-params";

type ResolvedParams = {
  teamSlug: string;
  projectSlug: string;
};

interface ChatsPageProps {
  params: Promise<ResolvedParams>;
  searchParams: Promise<{ [key: string]: string }>;
}

const ChatsPage: AsyncComponent<ChatsPageProps> = async ({ params, searchParams }) => {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const initialQuery = extractQueryParams({
    ...resolvedSearchParams,
    project_slug: resolvedParams.projectSlug,
  });

  const defaultQuery = { project_slug: resolvedParams.projectSlug };

  return (
    <Container subnav={<ProjectSubnav />}>
      <div className="max-w-7xl mx-auto">
        <div className="border-b">
          <div className="py-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold mb-1">Chats</h1>
              <p className="text-sm text-muted-foreground">
                List of chats for code and analysis discussions
              </p>
            </div>
          </div>
        </div>
        <div className="py-6">
          <ChatsView initialQuery={initialQuery} defaultQuery={defaultQuery} {...resolvedParams} />
        </div>
      </div>
    </Container>
  );
};

export default ChatsPage;
