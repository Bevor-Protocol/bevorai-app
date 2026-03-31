import { AdminProjectDetailClient } from "@/components/admin/admin-project-detail-client";
import { AsyncComponent } from "@/types";

interface PageProps {
  params: Promise<{ teamId: string; projectId: string }>;
}

const AdminProjectDetailPage: AsyncComponent<PageProps> = async ({ params }) => {
  const { teamId, projectId } = await params;
  return <AdminProjectDetailClient teamId={teamId} projectId={projectId} />;
};

export default AdminProjectDetailPage;
