import LucideIcon from "@/components/lucide-icon";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ChatMessageSchema } from "@/types/api/responses/chat";
import { GraphSnapshotNode } from "@/types/api/responses/graph";
import {
  AlertTriangle,
  Calendar,
  Code,
  FileCode,
  Hash,
  Package,
  Shield,
  Variable,
  Zap,
} from "lucide-react";
import React from "react";
import ReactMarkdown from "react-markdown";

type AutocompleteProps = {
  attributes: GraphSnapshotNode[];
  selectedAutocompleteIndex: number;
  insertAutocompleteItem: (item: GraphSnapshotNode) => void;
};

const AutoComplete: React.FC<AutocompleteProps> = ({
  attributes,
  selectedAutocompleteIndex,
  insertAutocompleteItem,
}) => {
  return (
    <div
      className="absolute bottom-full mb-2 left-0 right-0 z-50 bg-accent border rounded-lg shadow-xl"
      data-autocomplete-dropdown
    >
      <ScrollArea className="h-56">
        {attributes.map((attr, index) => (
          <div
            key={attr.id}
            data-autocomplete-item
            className={`px-3 py-2 cursor-pointer flex items-start space-x-2 rounded ${
              index === selectedAutocompleteIndex ? "bg-neutral-700" : "hover:bg-neutral-800"
            }`}
            onClick={() => insertAutocompleteItem(attr)}
          >
            <div className="shrink-0 mt-0.5">
              {attr.node_type === "ContractDefinition" ? (
                <FileCode className="size-3 text-blue-400" />
              ) : attr.node_type === "FunctionDefinition" ? (
                <Code className="size-3 text-green-400" />
              ) : attr.node_type === "ModifierDefinition" ? (
                <Shield className="size-3 text-purple-400" />
              ) : attr.node_type === "VariableDeclaration" ? (
                <Variable className="size-3 text-yellow-400" />
              ) : attr.node_type === "EventDefinition" ? (
                <Calendar className="size-3 text-orange-400" />
              ) : attr.node_type === "StructDefinition" ? (
                <Package className="size-3 text-cyan-400" />
              ) : attr.node_type === "EnumDefinition" ? (
                <Hash className="size-3 text-pink-400" />
              ) : attr.node_type === "ErrorDefinition" ? (
                <AlertTriangle className="size-3 text-destructive" />
              ) : (
                <Zap className="size-3 text-gray-400" />
              )}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-medium truncate">{attr.name}</span>
              <span className="text-xs text-muted-foreground truncate">{attr.path}</span>
              {attr.signature && (
                <span className="text-xs text-neutral-500 font-mono break-all">
                  {attr.signature}
                </span>
              )}
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
};

const Message: React.FC<
  React.ComponentProps<"div"> & {
    role: ChatMessageSchema["chat_role"];
    content: string;
    references?: ChatMessageSchema["references"];
    onReferenceClick?: (nodeId: string) => void;
  }
> = ({ className, role, content, references, onReferenceClick, ...props }) => {
  return (
    <div
      className={cn(
        "relative",
        role === "user" && "rounded-lg rounded-br-none px-3 py-2 bg-background border border-blue-500/60 max-w-2xl ml-auto text-[13px]",
        role === "system" && "max-w-none",
        className,
      )}
      {...props}
    >
      <ReactMarkdown className="markdown">{content}</ReactMarkdown>
      {role === "system" && references && references.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {references.map((reference) => (
            <button
              key={`${reference.id}-${reference.name}`}
              type="button"
              className="text-sm underline underline-offset-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => onReferenceClick?.(reference.id)}
            >
              {reference.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Empty: React.FC<React.ComponentProps<"div">> = ({ className, ...props }) => {
  return (
    <div
      className={cn("flex flex-col items-center justify-center py-8 grow", className)}
      {...props}
    />
  );
};

const EmptyCta: React.FC<React.ComponentProps<"div">> = ({ className, ...props }) => {
  return <div className={cn("text-center grow place-content-center", className)} {...props} />;
};

const EmptyActions: React.FC<React.ComponentProps<"div">> = ({ ...props }) => {
  return <div className="flex flex-col gap-2 w-full" {...props} />;
};

const EmptyAction: React.FC<React.ComponentProps<"div">> = ({ children, ...props }) => {
  return (
    <div
      className="border border-border rounded-lg animate-appear transition-colors p-3 pr-8 relative leading-relaxed cursor-pointer hover:bg-white/[0.03] hover:border-zinc-600 text-[13px] text-muted-foreground"
      {...props}
    >
      <LucideIcon
        assetType="chat"
        className="absolute top-2 right-2 text-muted-foreground size-5"
      />
      {children}
    </div>
  );
};

export { AutoComplete, Empty, EmptyAction, EmptyActions, EmptyCta, Message };
