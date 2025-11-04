import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import React from "react";

type Props = {
  children: React.ReactNode;
  breadcrumb?: React.ReactNode;
  className?: string;
};

const Container: React.FC<Props> = ({ children, breadcrumb, className }) => {
  return (
    <div className="h-svh pl-0 lg:pt-4 lg:pr-4 grow">
      <main className="bg-background flex flex-col size-full lg:rounded-t-2xl">
        <header className="w-full flex items-center justify-between h-header min-h-header">
          <div className="flex items-center w-full pr-6 pl-10 gap-4">
            <SidebarTrigger className="inline-flex md:hidden" />
            {breadcrumb}
          </div>
        </header>
        <div className={cn("pr-6 pl-10 py-6 grow overflow-x-hidden max-w-screen", className)}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Container;
