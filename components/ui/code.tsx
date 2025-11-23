import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { TreeResponseI } from "@/utils/types";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { FileText } from "lucide-react";
import React from "react";

export const CodeHolder: React.FC<React.ComponentProps<"div">> = ({ className, ...props }) => {
  return (
    <div
      className={cn("grid size-full rounded-lg min-h-0", className)}
      style={{
        gridTemplateColumns: "250px 1fr",
        gridTemplateRows: "var(--spacing-subheader) minmax(0, 1fr)",
      }}
      {...props}
    />
  );
};

export const CodeCounter: React.FC<React.ComponentProps<"div">> = ({ className, ...props }) => {
  return (
    <div className="bg-background sticky top-subheader z-10">
      <div
        className={cn(
          "flex items-center gap-2 border border-b rounded-tl-lg px-3 bg-background size-full",
          className,
        )}
        {...props}
      />
    </div>
  );
};

const getFileName = (path: string): string => {
  const parts = path.split("/");
  return parts[parts.length - 1];
};

const getDirectoryPath = (path: string): string => {
  const parts = path.split("/");
  return parts.slice(0, -1).join("/");
};

export const CodeHeader: React.FC<React.ComponentProps<"div"> & { path?: string }> = ({
  path,
  children,
  ...props
}) => {
  return (
    <div className="bg-background sticky top-subheader z-10" id="code-header">
      <div
        className="flex items-center justify-between border border-l-0 rounded-tr-lg pl-3 pr-1.5 bg-background size-full gap-6"
        {...props}
      >
        <div className="flex items-center gap-2 whitespace-nowrap">
          <FileText className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">{getFileName(path ?? "")}</span>
          <span className="text-xs text-neutral-500">{path}</span>
        </div>
        {children}
      </div>
    </div>
  );
};

export const CodeSources: React.FC<
  React.ComponentProps<typeof ScrollAreaPrimitive.Root> & {
    viewportRef?: React.RefObject<HTMLDivElement>;
  }
> = ({ className, ...props }) => {
  return (
    <div className="sticky top-[calc(2*var(--spacing-subheader))] self-start z-5 h-[calc(100svh-1.5rem-2*var(--spacing-subheader))] bg-background border-l rounded-bl-lg">
      <ScrollArea className={cn("h-full", className)} {...props} />
    </div>
  );
};

export const CodeSource: React.FC<
  React.ComponentProps<"div"> & {
    source: TreeResponseI;
    isActive: boolean;
  }
> = ({ source, isActive = false, ...props }) => {
  return (
    <div
      className={cn(
        "px-3 h-14 not-last:border-b cursor-pointer transition-colors flex justify-center flex-col w-full",
        isActive ? "text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground",
      )}
      {...props}
    >
      <div className="flex items-center gap-2 mb-1">
        <div
          className={cn(
            "w-2 h-2 rounded-full",
            source.is_known_target
              ? "bg-green-500"
              : source.n_auditable_fct > 0
                ? "bg-orange-500"
                : "bg-gray-400",
          )}
        />
        <span className="text-sm font-medium truncate">{getFileName(source.path)}</span>
      </div>
      <div className="text-xs text-neutral-500 truncate">{getDirectoryPath(source.path)}</div>
    </div>
  );
};

export const CodeContent: React.FC<
  React.ComponentProps<typeof ScrollAreaPrimitive.Root> & {
    viewportRef?: React.RefObject<HTMLDivElement>;
  }
> = ({ className, ...props }) => {
  return (
    <div
      className={cn("overflow-x-scroll border-r border-b border-l rounded-br-lg", className)}
      id="code-holder"
      {...props}
    />
  );
};
