import { bevorAction } from "@/actions";
import Content from "@/components/content";
import AdminPanel from "@/components/screens/admin";
import { redirect } from "next/navigation";

const AdminPage = async (): Promise<JSX.Element> => {
  const isAdmin = await bevorAction.isAdmin();
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
