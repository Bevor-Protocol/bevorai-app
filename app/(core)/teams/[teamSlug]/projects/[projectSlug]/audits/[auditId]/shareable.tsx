"use client";

import { bevorAction } from "@/actions";
import { Button } from "@/components/ui/button";
import * as Tooltip from "@/components/ui/tooltip";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { navigation } from "@/utils/navigation";
import { AuditSchemaI } from "@/utils/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Lock, Unlock } from "lucide-react";

const Shareable: React.FC<{ audit: AuditSchemaI }> = ({ audit }) => {
  const queryClient = useQueryClient();
  const { copy, isCopied } = useCopyToClipboard();

  const visibilityMutation = useMutation({
    mutationFn: () => bevorAction.toggleAuditVisibility(audit.id),
    onSuccess: (updatedAudit) => {
      queryClient.setQueryData(["audit", audit.id], updatedAudit);
      queryClient.invalidateQueries({ queryKey: ["audits"] });
    },
  });

  const handleCopy = (): void => {
    const shareableLink = `${window.location.origin}${navigation.shared.overview({
      auditId: audit.id,
    })}`;
    copy(shareableLink);
  };

  return (
    <div className="flex items-center space-x-3">
      {audit.is_public && (
        <Tooltip.Reference>
          <Tooltip.Trigger>
            <Button variant="transparent" onClick={handleCopy} className="p-2">
              {isCopied ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom" align="end">
            <div className="whitespace-nowrap">
              {isCopied ? "Link copied!" : "Copy public link"}
            </div>
          </Tooltip.Content>
        </Tooltip.Reference>
      )}
      <Tooltip.Reference>
        <Tooltip.Trigger>
          <Button
            variant="transparent"
            onClick={() => visibilityMutation.mutate()}
            disabled={visibilityMutation.isPending}
            className="p-2"
          >
            {audit.is_public ? (
              <Unlock className="w-3 h-3 text-green-500" />
            ) : (
              <Lock className="w-3 h-3 text-purple-400" />
            )}
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content side="bottom" align="end">
          <div className="whitespace-nowrap">
            {audit.is_public ? "Make audit private" : "Make audit public"}
          </div>
        </Tooltip.Content>
      </Tooltip.Reference>
    </div>
  );
};

export default Shareable;
