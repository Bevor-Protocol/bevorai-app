import { dashboardActions } from "@/actions/bevor";
import AppSidebar from "@/components/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LocalStorageProvider } from "@/providers/localStore";
import { AsyncComponent } from "@/utils/types";
import { redirect } from "next/navigation";

const Layout: AsyncComponent<{ children: React.ReactNode }> = async ({ children }) => {
  // Always open on desktop, controlled by mobile behavior
  const sidebarOpen = true;

  const currentUser = await dashboardActions.getUser();
  if (!currentUser) {
    redirect("/sign-in");
  }

  return (
    <LocalStorageProvider>
      <SidebarProvider defaultOpen={sidebarOpen}>
        <TooltipProvider>
          <AppSidebar userId={currentUser.id} />
          {children}
        </TooltipProvider>
      </SidebarProvider>
    </LocalStorageProvider>
  );
};

export default Layout;
