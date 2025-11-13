import { dashboardActions } from "@/actions/bevor";
import AppSidebar from "@/components/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getQueryClient } from "@/lib/config/query";
import { LocalStorageProvider } from "@/providers/localStore";
import { QUERY_KEYS } from "@/utils/constants";
import { AsyncComponent } from "@/utils/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";

const Layout: AsyncComponent<{ children: React.ReactNode }> = async ({ children }) => {
  const sidebarOpen = true;
  const queryClient = getQueryClient();

  const currentUser = await queryClient.fetchQuery({
    queryKey: [QUERY_KEYS.USERS],
    queryFn: () => dashboardActions.getUser(),
  });

  if (!currentUser) {
    redirect("/sign-in");
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <LocalStorageProvider>
        <SidebarProvider defaultOpen={sidebarOpen}>
          <TooltipProvider>
            <AppSidebar userId={currentUser.id} />
            {children}
          </TooltipProvider>
        </SidebarProvider>
      </LocalStorageProvider>
    </HydrationBoundary>
  );
};

export default Layout;
