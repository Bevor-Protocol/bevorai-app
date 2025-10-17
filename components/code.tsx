import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { FileText } from "lucide-react";
import React from "react";

export const CodeHolder: React.FC<React.ComponentProps<"div">> = ({ ...props }) => {
  return (
    <div
      className="border border-border rounded-lg grid size-full overscroll-y-contain"
      style={{ gridTemplateColumns: "250px 1fr", gridTemplateRows: "auto 1fr" }}
      {...props}
    />
  );
};

export const CodeCounter: React.FC<React.ComponentProps<"div">> = ({ ...props }) => {
  return (
    <div
      className="flex items-center space-x-2 border-b border-border bg-card h-11 px-3 sticky top-0 z-10"
      {...props}
    />
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
  ...props
}) => {
  return (
    <div
      className="flex items-center space-x-2 border-b border-border bg-card h-11 px-3 sticky top-0 z-10"
      {...props}
    >
      <FileText className="size-4 text-muted-foreground" />
      <span className="text-sm font-medium text-foreground">{getFileName(path ?? "")}</span>
      <span className="text-xs text-neutral-500">{path}</span>
    </div>
  );
};

export const CodeSources: React.FC<
  React.ComponentProps<typeof ScrollAreaPrimitive.Root> & {
    viewportRef?: React.RefObject<HTMLDivElement>;
  }
> = ({ ...props }) => {
  return (
    <ScrollArea
      className="border-r border-border sticky! top-11 z-10 h-[calc(100svh-2.75rem)]"
      {...props}
    />
  );
};

export const CodeSource: React.FC<
  React.ComponentProps<"div"> & {
    path: string;
    isActive: boolean;
    isImported: boolean;
    nFcts: number;
  }
> = ({ path, isActive, isImported, nFcts, ...props }) => {
  return (
    <div
      className={cn(
        "px-3 h-14 border-b border-border cursor-pointer transition-colors flex justify-center flex-col",
        isActive ? "bg-neutral-800 text-foreground" : "text-foreground hover:bg-accent",
      )}
      {...props}
    >
      <div className="flex items-center space-x-2 mb-1">
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
