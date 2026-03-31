import { AdminTeamDetailClient } from "@/components/admin/admin-team-detail-client";
import { AsyncComponent } from "@/types";

interface PageProps {
  params: Promise<{ teamId: string }>;
}

const AdminTeamDetailPage: AsyncComponent<PageProps> = async ({ params }) => {
  const { teamId } = await params;
  return <AdminTeamDetailClient teamId={teamId} />;
};

export default AdminTeamDetailPage;
