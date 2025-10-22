import { adminActions } from "@/actions/bevor";
import Content from "@/components/content";
import AdminPanel from "@/components/screens/admin";
import { AsyncComponent } from "@/utils/types";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const AdminPage: AsyncComponent = async () => {
  const isAdmin = await adminActions.isAdmin();
  if (!isAdmin) {
    redirect("/terminal");
  }

  return (
    <Content className="bg-black/90">
      <AdminPanel />
    </Content>
  );
};

export default AdminPage;
