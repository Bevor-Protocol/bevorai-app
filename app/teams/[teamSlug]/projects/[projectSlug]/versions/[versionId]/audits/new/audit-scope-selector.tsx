"use client";

import { bevorAction } from "@/actions";
import ContractTree from "@/components/contract-tree";
import { Button } from "@/components/ui/button";
import { navigation } from "@/utils/navigation";
import { CodeProjectSchema, CodeVersionSchema, TeamSchemaI, TreeResponseI } from "@/utils/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Play, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AuditScopeSelectorProps {
  version: CodeVersionSchema;
  tree: TreeResponseI[];
  team: TeamSchemaI;
  project: CodeProjectSchema;
  versionId: string;
}

const AuditScopeSelector: React.FC<AuditScopeSelectorProps> = ({
  version,
  tree,
  team,
  project,
  versionId,
}) => {
  const [selectedScopes, setSelectedScopes] = useState<{ identifier: string; level: string }[]>([]);
  const router = useRouter();

  const {
    mutate: initiateAudit,
    isPending,
    data: evalData,
  } = useMutation({
    mutationFn: async () => {
      return await bevorAction.initiateAudit(versionId, selectedScopes);
    },
  });

  // Poll for audit status
  const { data: pollingData } = useQuery({
    queryKey: ["polling", evalData?.id],
    queryFn: async () => bevorAction.getAuditStatus(evalData!.id),
    refetchInterval: (query) => {
      const { data } = query.state;
      if (!data) return 1000;
      if (["success", "failed"].includes(data.status)) {
        return false;
      }
      return 1000;
    },
    enabled: !!evalData?.id,
  });

  useEffect(() => {
    if (pollingData?.status === "success" && evalData?.id) {
      router.push(
        navigation.audit.overview({
          teamSlug: team.slug,
          projectSlug: project.slug,
          auditId: evalData.id,
        }),
      );
    }
  }, [pollingData?.status, evalData?.id]);

  const handleScopeSelect = (scope: { identifier: string; level: string }): void => {
    setSelectedScopes((prev) => {
      const isSelected = prev.some(
        (s) => s.identifier === scope.identifier && s.level === scope.level,
      );
      if (isSelected) {
        return prev.filter((s) => !(s.identifier === scope.identifier && s.level === scope.level));
      } else {
        return [...prev, scope];
      }
    });
  };

  // Show loading state while audit is processing
  if (evalData?.id && pollingData?.status === "processing") {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-100 mb-2">Audit in Progress</h1>
            <p className="text-neutral-400">
              Your audit is being processed. This may take a few minutes depending on the code size.
            </p>
          </div>
        </div>

        <div className="bg-neutral-800 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
            <div>
              <div className="text-sm font-medium text-neutral-100">Processing...</div>
              <div className="text-xs text-neutral-500">Audit ID: {evalData.id}</div>
            </div>
          </div>
          <div className="text-sm text-neutral-400">
            Analyzing smart contract(s) for vulnerabilities...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100 mb-2">Audit Scope Selection</h1>
          <p className="text-neutral-400">
            Select which parts of the code you want to audit. If no scope is selected, all auditable
            functions will be included.
          </p>
        </div>
        <div className="flex items-center space-x-4 text-sm text-neutral-400">
          <div className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>{version.version_method}</span>
          </div>
          {version.solc_version && (
            <div className="flex items-center space-x-2">
              <span>Solc {version.solc_version}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-6 text-xs text-neutral-500 bg-neutral-800/50 rounded-lg px-4 py-2">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-white"></div>
          <span>Auditable items</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-neutral-500"></div>
          <span>Non-auditable items</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>Click to select/deselect</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Check className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium text-neutral-100">
            {selectedScopes.length > 0
              ? `${selectedScopes.length} scope${selectedScopes.length === 1 ? "" : "s"} selected`
              : "All auditable functions will be included"}
          </span>
        </div>
        <div className="flex items-center space-x-3">
          {selectedScopes.length > 0 && (
            <Button
              variant="transparent"
              className="flex items-center space-x-2"
              onClick={() => setSelectedScopes([])}
            >
              <span>Deselect All</span>
            </Button>
          )}
          <Button
            variant="bright"
            className="flex items-center space-x-2"
            onClick={() => initiateAudit()}
            disabled={isPending}
          >
            <Play className="w-4 h-4" />
            <span>{isPending ? "Starting Audit..." : "Start Audit"}</span>
          </Button>
        </div>
      </div>
      <ContractTree
        tree={tree}
        selectedScope={selectedScopes}
        onScopeSelect={handleScopeSelect}
        className="text-sm"
      />
    </div>
  );
};

export default AuditScopeSelector;
