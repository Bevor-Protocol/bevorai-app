import { cn } from "@/lib/utils";
import React from "react";

type Props = {
  children: React.ReactNode;
  subnav?: React.ReactNode;
  contain?: boolean;
  className?: string;
};

const Container: React.FC<Props> = ({ children, subnav, contain = false, className }) => {
  return (
    <main className="min-h-[calc(100svh-(var(--spacing-header)))] bg-background flex flex-col size-full grow relative">
      {subnav}
      <div
        className={cn(
          "p-6 grow max-w-screen relative",
          contain && "flex flex-col",
          contain &&
            !!subnav &&
            "max-h-[calc(100svh-var(--spacing-subheader)-var(--spacing-header))]",
          contain && !subnav && "max-h-[calc(100svh-var(--spacing-header))]",
          className,
        )}
      >
        {children}
      </div>
    </main>
  );
};

export default Container;
