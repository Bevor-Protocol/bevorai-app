import AppNav from "@/components/nav";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getQueryClient } from "@/lib/config/query";
import { LocalStorageProvider } from "@/providers/localStore";
import { SSEProvider } from "@/providers/sse";
import { AsyncComponent } from "@/utils/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

const Layout: AsyncComponent<{ children: React.ReactNode }> = async ({ children }) => {
  const queryClient = getQueryClient();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <LocalStorageProvider>
        <SSEProvider>
          <TooltipProvider>
            <AppNav />
            {children}
          </TooltipProvider>
        </SSEProvider>
      </LocalStorageProvider>
    </HydrationBoundary>
  );
};

export default Layout;
