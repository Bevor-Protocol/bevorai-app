import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CodeSourceSchemaI, NodeSchemaI } from "@/utils/types";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { FileText } from "lucide-react";
import React from "react";

export const CodeHolder: React.FC<React.ComponentProps<"div">> = ({ className, ...props }) => {
  return (
    <div
      className={cn("grid size-full rounded-lg min-h-0 gap-x-2", className)}
      style={{
        gridTemplateColumns: "250px 1fr",
      }}
      {...props}
    />
  );
};

export const CodeCounter: React.FC<React.ComponentProps<"div">> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        "bg-background sticky top-subheader z-10",
        "flex items-center gap-2 border-l border-t border-b rounded-tl-lg px-3 bg-background size-full",
        className,
      )}
      {...props}
    />
  );
};

export const CodeSourceToggle: React.FC<React.ComponentProps<"div">> = ({
  className,
  ...props
}) => {
  return (
    <div className="bg-background sticky top-subheader z-10">
      <div
        className={cn("flex flex-col items-center gap-2 bg-background w-full", className)}
        {...props}
      />
    </div>
  );
};

export const CodeSourceItem: React.FC<
  React.ComponentProps<"div"> & {
    source: CodeSourceSchemaI;
  }
> = ({ source, ...props }) => {
  return (
    <div className="flex justify-center items-start flex-col min-w-0 w-full h-full" {...props}>
      <div className="flex items-center gap-2 mb-1 min-w-0 w-full">
        <div className={cn("w-2 h-2 rounded-full shrink-0", getSourceColor(source))} />
        <span className="text-sm font-medium truncate min-w-0">{getFileName(source.path)}</span>
      </div>
      <div className="text-xs text-muted-foreground truncate w-full text-left">
        {getDirectoryPath(source.path)}
      </div>
    </div>
  );
};

export const getSourceColor = (source: CodeSourceSchemaI): string => {
  return source.is_known_target
    ? "bg-green-500"
    : source.n_entry_points > 0
      ? "bg-orange-500"
      : "bg-gray-400";
};

export const getFileName = (path: string): string => {
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
  className,
  ...props
}) => {
  return (
    <div
      className={cn("bg-background sticky top-subheader z-10 h-subheader", className)}
      id="code-header"
      {...props}
    >
      <div className="flex items-center justify-between border rounded-t-lg pl-3 pr-1.5 bg-background gap-6 size-full">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <FileText className="size-4 text-muted-foreground" />
          {!path && <Skeleton className="h-4 w-36" />}
          {path && (
            <>
              <span className="text-sm font-medium">{getFileName(path ?? "")}</span>
              <span className="text-xs text-neutral-500">{path}</span>
            </>
          )}
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
    <div className="sticky top-[calc(var(--spacing-subheader)+5.5rem)] self-start z-5 h-[calc(100svh-var(--spacing-subheader)-5.5rem-1.5rem)] bg-background w-full">
      <ScrollArea className={cn("h-full mt-2", className)} {...props} />
    </div>
  );
};

export const CodeSource: React.FC<
  React.ComponentProps<"div"> & {
    source: CodeSourceSchemaI;
    isActive: boolean;
  }
> = ({ source, isActive = false, ...props }) => {
  return (
    <div
      className={cn(
        "px-3 h-14 not-last:border-b cursor-pointer transition-colors flex justify-center items-start flex-col w-full",
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
              : source.n_entry_points > 0
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
      className={cn("overflow-x-scroll border-r border-b border-l rounded-b-lg flex", className)}
      id="code-holder"
      {...props}
    />
  );
};

export const CodeMetadata: React.FC<React.ComponentProps<"div">> = ({ className, ...props }) => {
  return <div className={cn("flex flex-col", className)} {...props} />;
};

export const CodeDisplay: React.FC<React.ComponentProps<"div">> = ({ className, ...props }) => {
  return <div className={cn("flex flex-col", className)} {...props} />;
};

export const getNodeTypeColor = (nodeType: string): string => {
  switch (nodeType) {
    case "FunctionDefinition":
    case "ModifierDefinition":
      return "bg-blue-500";
    case "ContractDefinition":
      return "bg-purple-500";
    default:
      return "bg-gray-400";
  }
};

export const CodeNodeList: React.FC<{
  node: NodeSchemaI;
  onNodeClick: (node: NodeSchemaI) => void;
}> = ({ node, onNodeClick }) => {
  return (
    <div
      className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-sm text-sm transition-colors"
      onClick={() => onNodeClick(node)}
    >
      <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", getNodeTypeColor(node.node_type))} />
      <span className="truncate">{node.name}</span>
    </div>
  );
};

export const CodeNodeCheckList: React.FC<{
  node: NodeSchemaI;
  isChecked: boolean;
  isDisabled: boolean;
  onNodeToggle: (node: NodeSchemaI) => void;
  onNodeClick: (node: NodeSchemaI) => void;
}> = ({ node, isChecked, isDisabled, onNodeToggle, onNodeClick }) => {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        disabled={isDisabled || !node.is_auditable}
        checked={isChecked}
        onCheckedChange={() => onNodeToggle(node)}
      />
      <CodeNodeList node={node} onNodeClick={onNodeClick} />
    </div>
  );
};
