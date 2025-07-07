import { bevorAction } from "@/actions";
import Content from "@/components/content";
import AdminAuditPanel from "@/components/screens/admin/audit";
import { redirect } from "next/navigation";

const AdminAuditPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<JSX.Element> => {
  const isAdmin = await bevorAction.isAdmin();
  if (!isAdmin) {
    redirect("/terminal");
  }

  const audit = await bevorAction.getAuditWithChildren((await params).slug);

  return (
    <Content className="bg-black/90">
      <AdminAuditPanel audit={audit} />
    </Content>
  );
};

export default AdminAuditPage;
