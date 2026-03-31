import { AdminUserDetailClient } from "@/components/admin/admin-user-detail-client";
import { AsyncComponent } from "@/types";

interface PageProps {
  params: Promise<{ userId: string }>;
}

const AdminUserDetailPage: AsyncComponent<PageProps> = async ({ params }) => {
  const { userId } = await params;
  return <AdminUserDetailClient userId={userId} />;
};

export default AdminUserDetailPage;
