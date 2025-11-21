import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";

const Subnav: React.FC<React.ComponentProps<"div">> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        "w-full flex items-center justify-start h-subheader border-b px-6 bg-background",
        className,
      )}
      {...props}
    />
  );
};

const SubnavItem: React.FC<
  React.ComponentProps<typeof Link> & { isActive: boolean; shouldHighlight?: boolean }
> = ({ className, isActive, shouldHighlight = false, ...props }) => {
  return (
    <Link
      className={cn(
        "relative flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:text-accent-foreground hover:bg-accent",
        className,
      )}
      data-subnav
      data-highlight={shouldHighlight}
      data-active={isActive ? "true" : "false"}
      {...props}
    />
  );
};

const SubnavButton: React.FC<
  React.ComponentProps<"button"> & { isActive: boolean; shouldHighlight?: boolean }
> = ({ className, isActive, shouldHighlight = false, ...props }) => {
  return (
    <button
      type="button"
      className={cn(
        "relative flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:text-accent-foreground hover:bg-accent",
        className,
      )}
      data-subnav
      data-highlight={shouldHighlight}
      data-active={isActive ? "true" : "false"}
      {...props}
    />
  );
};

export { Subnav, SubnavButton, SubnavItem };
