/* eslint-disable @next/next/no-img-element */
import { bevorAction } from "@/actions";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { StripeAddonI } from "@/utils/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Info } from "lucide-react";

export const AddonRow: React.FC<{
  addon: StripeAddonI;
}> = ({ addon }) => {
  const queryClient = useQueryClient();

  const currentPrice = addon.price / 100;

  const checkoutMutation = useMutation({
    mutationFn: (lookupKey: string) => bevorAction.modifySubscription(lookupKey),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["addons"],
      });
      queryClient.invalidateQueries({
        queryKey: ["subscription"],
      });
    },
  });

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleToggleAddon = (lookupKey: string): void => {
    if (!checkoutMutation.isPending && addon.is_eligible) {
      checkoutMutation.mutate(lookupKey);
    }
  };

  const tooltipCopy = addon.is_pending_removal
    ? "This add-on will be removed at the end of the current billing period. You can revert this decision if you change your mind."
    : addon.is_active
      ? "Disabling this add-on will remove it at the end of the billing period."
      : "Enabling this add-on now will create a prorated invoice for the remainder of your billing period.";

  const isChecked = addon.is_pending_removal ? false : addon.is_active;

  const getStatusBadge = (): React.ReactNode => {
    if (addon.is_pending_removal) {
      return (
        <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-1 rounded flex-shrink-0">
          Pending Removal
        </span>
      );
    } else if (addon.is_active) {
      return (
        <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded flex-shrink-0">
          Active
        </span>
      );
    }
    return <></>;
  };

  const getSwitchLabel = (): string => {
    if (addon.is_pending_removal) {
      return "reactivate";
    } else if (addon.is_active) {
      return "disable";
    } else {
      return "enable";
    }
  };

  return (
    <div
      className={`border rounded-lg p-6 ${
        addon.is_pending_removal ? "border-amber-600/50 bg-amber-950/20" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-4 flex-1">
          {addon.image && addon.image !== null && (
            <img
              src={addon.image}
              alt={addon.name}
              className="w-12 h-12 object-contain rounded-lg"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              <h4 className="text-lg font-semibold text-foreground truncate">{addon.name}</h4>
              {getStatusBadge()}
              {checkoutMutation.isPending && (
                <div className="size-4 border-2 border-neutral-600 border-t-blue-500 rounded-full animate-spin"></div>
              )}
            </div>
            <p className="text-muted-foreground text-sm mb-1">{addon.description}</p>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-foreground">
                {formatCurrency(currentPrice)}
              </span>
              <span className="text-muted-foreground text-sm">/{addon.billing_interval}</span>
            </div>
          </div>
        </div>
        {addon.is_eligible && (
          <div className="flex flex-row gap-4 items-center">
            <div className="relative">
              <Switch
                checked={isChecked}
                onCheckedChange={() => handleToggleAddon(addon.lookup_key)}
                disabled={checkoutMutation.isPending || !addon.is_eligible}
              />
              <span className="text-xs text-muted-foreground text-center absolute top-full left-1/2 -translate-x-1/2">
                {getSwitchLabel()}
              </span>
            </div>
            <Tooltip>
              <TooltipTrigger>
                <Info className="text-muted-foreground size-4" />
              </TooltipTrigger>
              <TooltipContent className="w-52" side="top" align="end">
                {tooltipCopy}
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
};
