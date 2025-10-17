import { cn } from "@/lib/utils";
import * as React from "react";

const Pill: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...rest }) => {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center",
        "px-2 py-1 text-xs rounded-full",
        "bg-gray-800 text-foreground",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
};

Pill.displayName = "Pill";

export { Pill };
