import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import React from "react";

type Props = {
  children: React.ReactNode;
  breadcrumb?: React.ReactNode;
  constrainHeight?: boolean;
  className?: string;
};

const Container: React.FC<Props> = ({
  children,
  breadcrumb,
  constrainHeight = false,
  className,
}) => {
  return (
    <main className="bg-background min-h-svh flex flex-col grow">
      <header className="w-full flex items-center justify-between h-header">
        <div className="flex items-center w-full px-4 gap-4">
          <SidebarTrigger className="inline-flex md:hidden" />
          {breadcrumb}
        </div>
      </header>
      <div
        className={cn(
          "pb-2 px-4 grow overflow-x-hidden max-w-screen",
          constrainHeight && "flex flex-col max-h-remaining overflow-hidden",
          className,
        )}
      >
        {children}
      </div>
    </main>
  );
};

export default Container;
