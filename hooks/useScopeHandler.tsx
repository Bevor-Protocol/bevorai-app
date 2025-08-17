import { bevorAction } from "@/actions";
import {
  ContractScopeI,
  ContractVersionSourceI,
  FunctionScopeI,
  TreeResponseI,
} from "@/utils/types";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";

export type ScopeHookResponse = {
  selectedSource: TreeResponseI | null;
  selectedScope: FunctionScopeI | null;
  selectedScopes: FunctionScopeI[]; // Array of all matching scopes (for inherited functions)
  sourceResponse: UseQueryResult<ContractVersionSourceI, Error>;
  targets: FunctionScopeI[];
  handleSourceChange: (source: TreeResponseI) => void;
  handleContractChange: (contract: ContractScopeI) => void;
  handleFunctionChange: (func: FunctionScopeI) => void;
  handleScopeToggle: (scopes: FunctionScopeI[]) => void;
};

export const useScopeHandler = ({
  versionId,
  scope,
  sourceTriggerOn = "source",
}: {
  versionId: string;
  scope: TreeResponseI[];
  sourceTriggerOn?: "source" | "contract" | "function";
}): ScopeHookResponse => {
  // used to handle the differences in code view interactions.

  // this is used to tell the code viewer which source to actually render.
  const [selectedSource, setSelectedSource] = useState<TreeResponseI | null>(
    scope.length ? scope[0] : null,
  );

  // need a ref since code view registers an onClick handler, which doesn't have access
  // to state changes. Largely duplicative. But we need both.
  const [selectedScopes, setSelectedScopes] = useState<FunctionScopeI[]>([]);
  const selectedScopeRef = useRef<FunctionScopeI[]>([]);

  const sourceResponse = useQuery({
    queryKey: ["source", selectedSource?.id ?? "", versionId],
    queryFn: () => bevorAction.getContractVersionSource(selectedSource?.id ?? "", versionId),
    enabled: !!selectedSource,
  });

  const targets: FunctionScopeI[] = useMemo(() => {
    // this defines what the available code viewer options will be, to support onClick events.
    if (!selectedSource) return [];
    return scope
      .flatMap((s) => s.contracts.flatMap((contract) => contract.functions))
      .filter((fct) => {
        return fct.source_defined_in_id === selectedSource.id;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSource]);

  const handleSourceChange = (source: TreeResponseI): void => {
    if (sourceTriggerOn === "source") {
      // reset scope, and update source.
      setSelectedScopes([]);
      selectedScopeRef.current = [];
      setSelectedSource(source);
    }
  };

  const handleContractChange = (contract: ContractScopeI): void => {
    if (sourceTriggerOn === "contract") {
      const newSource = scope.find((s) => s.id === contract.source_defined_in_id);
      if (newSource) {
        // reset scope, and update source.
        setSelectedScopes([]);
        selectedScopeRef.current = [];
        setSelectedSource(newSource);
      }
    }
  };

  const handleFunctionChange = (func: FunctionScopeI): void => {
    if (sourceTriggerOn === "function") {
      const newSource = scope.find((s) => s.id === func.source_defined_in_id);
      if (newSource) {
        // update source.
        selectedScopeRef.current = [];
        setSelectedSource(newSource);
      }

      // Find all functions with the same source_defined_in_id and position
      const allMatchingScopes = scope
        .flatMap((s) => s.contracts.flatMap((contract) => contract.functions))
        .filter(
          (f) =>
            f.source_defined_in_id === func.source_defined_in_id &&
            f.src_start_pos === func.src_start_pos &&
            f.src_end_pos === func.src_end_pos,
        );

      const isAlreadyInScope = selectedScopes.find((s) => s.id === func.id);
      if (isAlreadyInScope) {
        setSelectedScopes([]);
        selectedScopeRef.current = [];
      } else {
        setSelectedScopes(allMatchingScopes);
        selectedScopeRef.current = allMatchingScopes;
      }
    }
  };

  const handleScopeToggle = (scopes: FunctionScopeI[]): void => {
    // the code viewer will only respond to functions. If a function is clicked, whether in the
    // code viewer, or by some outside trigger, we need to do something.

    if (!scopes || scopes.length === 0) {
      setSelectedScopes([]);
      selectedScopeRef.current = [];
      return;
    }

    // Check if the scopes are equivalent to the currently selected scopes
    const currentScopes = selectedScopeRef.current;
    const areEquivalent =
      currentScopes.length === scopes.length &&
      currentScopes.every((currentScope) => scopes.some((scope) => scope.id === currentScope.id));

    if (areEquivalent) {
      // Toggle off - remove the scopes
      setSelectedScopes([]);
      selectedScopeRef.current = [];
    } else {
      // Set the new scopes
      setSelectedScopes(scopes);
      selectedScopeRef.current = scopes;
    }
  };

  // Compute selectedScope for backward compatibility (first scope in the array)
  const selectedScope = selectedScopes.length > 0 ? selectedScopes[0] : null;

  return {
    selectedSource,
    selectedScope,
    selectedScopes,
    sourceResponse,
    targets,
    handleSourceChange,
    handleContractChange,
    handleFunctionChange,
    handleScopeToggle,
  };
};
