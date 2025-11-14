import AppSidebar from "@/components/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getQueryClient } from "@/lib/config/query";
import { LocalStorageProvider } from "@/providers/localStore";
import { AsyncComponent } from "@/utils/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

const Layout: AsyncComponent<{ children: React.ReactNode }> = async ({ children }) => {
  const sidebarOpen = true;
  const queryClient = getQueryClient();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <LocalStorageProvider>
        <SidebarProvider defaultOpen={sidebarOpen}>
          <TooltipProvider>
            <AppSidebar />
            {children}
          </TooltipProvider>
        </SidebarProvider>
      </LocalStorageProvider>
    </HydrationBoundary>
  );
};

export default Layout;
