import AppNav from "@/components/nav";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LocalStorageProvider } from "@/providers/localStore";
import { SSEProvider } from "@/providers/sse";
import { AsyncComponent } from "@/types";
import { Suspense } from "react";

const Layout: AsyncComponent<{ children: React.ReactNode }> = async ({ children }) => {
  return (
    <LocalStorageProvider>
      <SSEProvider>
        <TooltipProvider>
          <Suspense fallback={null}>
            <AppNav />
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
            </div>
          </Suspense>
        </TooltipProvider>
      </SSEProvider>
    </LocalStorageProvider>
  );
};

export default Layout;
