import { cn } from "@/lib/utils";
import React from "react";

type Props = {
  children: React.ReactNode;
  subnav?: React.ReactNode;
  className?: string;
};

const Container: React.FC<Props> = ({ children, subnav, className }) => {
  return (
    <main className="min-h-[calc(100svh-(var(--spacing-header)))] bg-background flex flex-col size-full grow relative">
      {subnav}
      <div className={cn("p-6 grow max-w-screen relative", className)}>{children}</div>
    </main>
  );
};

export default Container;
