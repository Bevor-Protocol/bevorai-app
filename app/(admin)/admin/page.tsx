import { AdminOverviewClient } from "@/components/admin/admin-overview-client";
import { AsyncComponent } from "@/types";

const AdminHomePage: AsyncComponent = async () => {
  return <AdminOverviewClient />;
};

export default AdminHomePage;
