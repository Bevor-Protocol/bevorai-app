import AppNav from "@/components/nav";
import GlobalChatPanel from "@/components/views/chat/global-panel";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LocalStorageProvider } from "@/providers/localStore";
import { GlobalChatWrapper } from "@/providers/global-chat";
import { SSEProvider } from "@/providers/sse";
import { AsyncComponent } from "@/types";
import { Suspense } from "react";

const Layout: AsyncComponent<{ children: React.ReactNode }> = async ({ children }) => {
  return (
    <LocalStorageProvider>
      <SSEProvider>
        <TooltipProvider>
          <Suspense fallback={null}>
            <GlobalChatWrapper>
              <AppNav />
              <div className="flex flex-1 min-h-0">
                <div className="flex-1 min-w-0 flex flex-col">{children}</div>
                <GlobalChatPanel />
              </div>
            </GlobalChatWrapper>
          </Suspense>
        </TooltipProvider>
      </SSEProvider>
    </LocalStorageProvider>
  );
};

export default Layout;
