import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatAttributeI } from "@/utils/types";
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

type AutocompleteProps = {
  attributes: ChatAttributeI[];
  selectedAutocompleteIndex: number;
  insertAutocompleteItem: (item: ChatAttributeI) => void;
};

const AutoComplete: React.FC<AutocompleteProps> = ({
  attributes,
  selectedAutocompleteIndex,
  insertAutocompleteItem,
}) => {
  return (
    <div
      className="absolute bottom-full mb-2 left-0 right-0 z-50 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl"
      data-autocomplete-dropdown
    >
      <ScrollArea className="h-56">
        {attributes.map((attr, index) => (
          <div
            key={attr.id}
            data-autocomplete-item
            className={`px-3 py-2 cursor-pointer flex items-start space-x-2 rounded ${
              index === selectedAutocompleteIndex
                ? "bg-neutral-700 text-foreground"
                : "hover:bg-neutral-800 text-foreground"
            }`}
            onClick={() => insertAutocompleteItem(attr)}
          >
            <div className="flex-shrink-0 mt-0.5">
              {attr.type === "ContractDefinition" ? (
                <FileCode className="size-3 text-blue-400" />
              ) : attr.type === "FunctionDefinition" ? (
                <Code className="size-3 text-green-400" />
              ) : attr.type === "ModifierDefinition" ? (
                <Shield className="size-3 text-purple-400" />
              ) : attr.type === "VariableDeclaration" ? (
                <Variable className="size-3 text-yellow-400" />
              ) : attr.type === "EventDefinition" ? (
                <Calendar className="size-3 text-orange-400" />
              ) : attr.type === "StructDefinition" ? (
                <Package className="size-3 text-cyan-400" />
              ) : attr.type === "EnumDefinition" ? (
                <Hash className="size-3 text-pink-400" />
              ) : attr.type === "ErrorDefinition" ? (
                <AlertTriangle className="size-3 text-red-400" />
              ) : (
                <Zap className="size-3 text-gray-400" />
              )}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-medium truncate">{attr.name}</span>
              <span className="text-xs text-muted-foreground truncate">{attr.string}</span>
              {attr.metadata && (
                <span className="text-xs text-neutral-500 font-mono break-all">
                  {attr.metadata}
                </span>
              )}
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
};

export { AutoComplete };
