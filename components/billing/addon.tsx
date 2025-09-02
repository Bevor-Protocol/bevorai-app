/* eslint-disable @next/next/no-img-element */
import { bevorAction } from "@/actions";
import { Switch } from "@/components/ui/switch";
import { StripeAddonI } from "@/utils/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

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

  const getCompleteDescription = (description: string): string => {
    if (addon.is_pending_removal) {
      return `${description} This add-on will be removed at the end of the current billing period. You can revert this decision if you change your mind.`;
    } else if (addon.is_active) {
      return `${description} Disabling this add-on will remove it at the end of the billing period.`;
    } else {
      return `${description} Enabling this add-on now will create a prorated invoice for the remainder of your billing period.`;
    }
  };

  const getStatusBadge = (): JSX.Element | null => {
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
    return null;
  };

  const getSwitchState = (): boolean => {
    // If pending removal, show as unchecked but allow toggling to revert
    if (addon.is_pending_removal) {
      return false;
    }
    return addon.is_active;
  };

  const getSwitchLabel = (): string => {
    if (addon.is_pending_removal) {
      return "Revert Removal";
    } else if (addon.is_active) {
      return "Disable";
    } else {
      return "Enable";
    }
  };

  return (
    <div
      className={`border rounded-lg p-6 ${
        addon.is_pending_removal ? "border-amber-600/50 bg-amber-950/20" : "border-neutral-800"
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
              <h4 className="text-lg font-semibold text-neutral-100 truncate">{addon.name}</h4>
              {getStatusBadge()}
              {checkoutMutation.isPending && (
                <div className="w-4 h-4 border-2 border-neutral-600 border-t-blue-500 rounded-full animate-spin"></div>
              )}
            </div>
            <p className="text-neutral-400 text-sm mb-1">
              {getCompleteDescription(addon.description)}
            </p>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-neutral-100">
                {formatCurrency(currentPrice)}
              </span>
              <span className="text-neutral-400 text-sm">/{addon.billing_interval}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-2 flex-shrink-0">
          <Switch
            checked={getSwitchState()}
            onCheckedChange={() => handleToggleAddon(addon.lookup_key)}
            disabled={checkoutMutation.isPending || !addon.is_eligible}
            className="flex-shrink-0"
          />
          <span className="text-xs text-neutral-400 text-center">{getSwitchLabel()}</span>
        </div>
      </div>
    </div>
  );
};
