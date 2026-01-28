import AppNav from "@/components/nav";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LocalStorageProvider } from "@/providers/localStore";
import { SSEProvider } from "@/providers/sse";
import { AsyncComponent } from "@/utils/types";

const Layout: AsyncComponent<{ children: React.ReactNode }> = async ({ children }) => {
  return (
    <LocalStorageProvider>
      <SSEProvider>
        <TooltipProvider>
          <AppNav />
          {children}
        </TooltipProvider>
      </SSEProvider>
    </LocalStorageProvider>
  );
};

export default Layout;
