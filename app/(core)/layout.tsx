import { teamActions, userActions } from "@/actions/bevor";
import AppSidebar from "@/components/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AsyncComponent } from "@/utils/types";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const Layout: AsyncComponent<{ children: React.ReactNode }> = async ({ children }) => {
  const queryClient = new QueryClient();
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bevor-token")?.value;
  const sidebarOpen = cookieStore.get("sidebar_state")?.value === "true";

  if (!sessionToken) {
    redirect("/logout");
  }

  const currentUser = await userActions.getUser();
  if (!currentUser) {
    redirect("/logout");
  }

  await queryClient.prefetchQuery({
    queryKey: ["teams"],
    queryFn: () => teamActions.getTeams(),
  });

  await queryClient.prefetchQuery({
    queryKey: ["user-invites"],
    queryFn: async () => userActions.getUserInvites(),
  });

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <TooltipProvider>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <AppSidebar userId={currentUser.id} />
        </HydrationBoundary>
        {children}
      </TooltipProvider>
    </SidebarProvider>
  );
};

export default Layout;
