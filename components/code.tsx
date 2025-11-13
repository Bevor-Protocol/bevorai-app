import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { FileText } from "lucide-react";
import React from "react";

export const CodeHolder: React.FC<React.ComponentProps<"div">> = ({ className, ...props }) => {
  return (
    <div
      className={cn("grid size-full rounded-lg min-h-0", className)}
      style={{
        gridTemplateColumns: "250px 1fr",
        gridTemplateRows: "var(--spacing-header) minmax(0, 1fr)",
      }}
      {...props}
    />
  );
};

export const CodeCounter: React.FC<React.ComponentProps<"div">> = ({ className, ...props }) => {
  return (
    <div className="bg-background sticky top-0 z-10 h-header">
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
    <div className="bg-background sticky top-0 z-10 h-header">
      <div
        className="flex items-center justify-between border border-l-0 rounded-tr-lg pl-3 pr-1.5 bg-background size-full gap-6"
        {...props}
      >
        <div className="flex items-center gap-2 whitespace-nowrap">
          <FileText className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{getFileName(path ?? "")}</span>
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
    <div className={cn("z-5 bg-background border-l border-r border-b rounded-bl-lg", className)}>
      <ScrollArea
        {...props}
        className="h-[calc(100svh-2*var(--spacing-header)-1.5rem-1rem)] sticky! top-11"
      />
    </div>
  );
};

export const CodeSource: React.FC<
  React.ComponentProps<"div"> & {
    path: string;
    isActive?: boolean;
    isImported?: boolean;
    nFcts: number;
  }
> = ({ path, isActive = false, isImported = false, nFcts, ...props }) => {
  return (
    <div
      className={cn(
        "px-3 h-14 not-last:border-b cursor-pointer transition-colors flex justify-center flex-col w-full",
        isActive ? "bg-neutral-800 text-accent-foreground" : "hover:bg-accent",
      )}
      {...props}
    >
      <div className="flex items-center gap-2 mb-1">
        <div
          className={cn(
            "w-2 h-2 rounded-full",
            isImported ? "bg-orange-500" : nFcts > 0 ? "bg-green-500" : "bg-gray-400",
          )}
        />
        <span className="text-sm font-medium truncate">{getFileName(path)}</span>
      </div>
      <div className="text-xs text-neutral-500 truncate">{getDirectoryPath(path)}</div>
    </div>
  );
};
