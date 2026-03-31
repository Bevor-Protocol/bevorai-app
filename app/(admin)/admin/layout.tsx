import { adminActions } from "@/actions/bevor";
import { AdminHeader } from "@/components/admin/admin-header";
import { AsyncComponent } from "@/types";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Admin",
};

const Layout: AsyncComponent<{ children: React.ReactNode }> = async ({ children }) => {
  const status = await adminActions.isAdmin();

  if (!status.ok) {
    redirect("/sign-in");
  }

  if (!status.data.success) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminHeader />
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
};

export default Layout;
