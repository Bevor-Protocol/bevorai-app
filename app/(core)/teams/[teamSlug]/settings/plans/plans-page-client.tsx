/* eslint-disable @next/next/no-img-element */
"use client";

import { bevorAction } from "@/actions";
import { AddonRow } from "@/components/billing/addon";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MemberRoleEnum, StripeAddonI, StripePlanI, TeamSchemaI } from "@/utils/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Info, Lock } from "lucide-react";
import React from "react";

const getFeatureName = (feature: string): string => {
  switch (feature) {
    case "audit":
      return "Smart Contract Audits";
    case "chat":
      return "AI Chat Support";
    case "contract_heavy":
      return "Heavy Contract Analysis";
    case "contract_light":
      return "Light Contract Analysis";
    case "contract_private_repo":
      return "Private Repository Support";
    default:
      return feature;
  }
};

const PlanCard: React.FC<{
  plan: StripePlanI;
  team: TeamSchemaI;
}> = ({ plan, team }) => {
  const checkoutMutation = useMutation({
    mutationFn: () =>
      bevorAction.createCheckoutSession({
        success_url: `${window.location.origin}/teams/${team.slug}/settings/billing?success=true`,
        cancel_url: `${window.location.origin}/teams/${team.slug}/settings/plans?canceled=true`,
      }),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const currentPrice = plan.base_price / 100;
  const additionalSeatPrice =
    (plan.seat_pricing.tiers.find((tier) => tier.up_to === null)?.unit_amount ?? 0) / 100;

  return (
    <div className="border border-border rounded-lg p-6">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            {plan.image && (
              <img
                src={plan.image || ""}
                alt={plan.name}
                className="w-12 h-12 object-contain rounded-lg"
              />
            )}
            <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-lg font-semibold text-foreground">
              {formatCurrency(currentPrice)}
            </span>
            <span className="text-muted-foreground">/{plan.billing_interval}</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="flex-1">
            <p className="text-muted-foreground text-sm mb-3">{plan.description}</p>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {plan.included_seats} seats included
                </span>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="size-4 text-neutral-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" align="center">
                    <div className="max-w-xs">
                      <p className="text-xs">First {plan.included_seats} seats included</p>
                      <p className="text-xs">
                        Additional seats: {formatCurrency(additionalSeatPrice)} / seat /
                        {plan.billing_interval}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
              {plan.usage?.audits && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {plan.usage.audits.included} audits included
                  </span>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="size-4 text-neutral-500 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center">
                      <div className="max-w-xs">
                        <p className="text-xs">
                          {plan.usage.audits.included} audits included per month
                        </p>
                        <p className="text-xs">
                          Additional audits: {formatCurrency(plan.usage.audits.unit_amount / 100)}/
                          audit
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="text-xs text-muted-foreground">Features:</span>
              <div className="flex flex-wrap items-center gap-3">
                {plan.features.slice(0, 3).map((feature: string, index: number) => (
                  <div key={index} className="flex items-center space-x-1">
                    <Check className="w-3 h-3 text-green-400" />
                    <span className="text-xs text-foreground">
                      {getFeatureName(feature.toLowerCase())}
                    </span>
                  </div>
                ))}
                {plan.features.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{plan.features.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 sm:ml-6">
            {plan.is_active ? (
              <span className="bg-green-500 text-foreground text-xs px-3 py-1 rounded-full">
                Current
              </span>
            ) : (
              <Button
                className="w-full sm:w-auto text-sm px-4 py-2"
                onClick={() => checkoutMutation.mutate()}
                disabled={checkoutMutation.isPending}
              >
                {checkoutMutation.isPending ? "Processing..." : "Subscribe"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const PlansSection: React.FC<{ team: TeamSchemaI }> = ({ team }) => {
  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => bevorAction.getProducts(),
  });

  if (plansLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="border border-border rounded-lg p-6 animate-pulse">
            <div className="h-6 bg-neutral-800 rounded mb-4"></div>
            <div className="h-4 bg-neutral-800 rounded mb-2"></div>
            <div className="h-4 bg-neutral-800 rounded mb-4"></div>
            <div className="h-8 bg-neutral-800 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {plans
        ?.sort((a: StripePlanI, b: StripePlanI) => a.base_price - b.base_price)
        .map((plan: StripePlanI) => (
          <PlanCard key={plan.id} plan={plan} team={team} />
        ))}
    </div>
  );
};

const AddonsSection: React.FC = () => {
  const { data: addons, isLoading: addonsLoading } = useQuery({
    queryKey: ["addons"],
    queryFn: () => bevorAction.getAddons(),
  });

  if (addonsLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="border border-border rounded-lg p-6 animate-pulse">
            <div className="h-6 bg-neutral-800 rounded mb-4"></div>
            <div className="h-4 bg-neutral-800 rounded mb-2"></div>
            <div className="h-4 bg-neutral-800 rounded mb-4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!addons || addons.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {addons.map((addon: StripeAddonI) => (
        <AddonRow key={addon.id} addon={addon} />
      ))}
    </div>
  );
};

const AccessRestricted: React.FC = () => (
  <div className="px-6 py-8 bg-neutral-950 min-h-screen">
    <div className="max-w-7xl mx-auto">
      <div className="text-center py-12">
        <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Access Restricted</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Only team owners can manage billing and subscription settings.
        </p>
      </div>
    </div>
  </div>
);

const PlansPageClient: React.FC<{ team: TeamSchemaI }> = ({ team }) => {
  const isOwner = team?.role === MemberRoleEnum.OWNER;

  if (!isOwner) {
    return <AccessRestricted />;
  }

  return (
    <div className="px-6 pb-8 bg-neutral-950 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-foreground mb-6">Available Plans</h2>
          <PlansSection team={team} />
        </div>
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-6">Optional Add-ons</h2>
          <AddonsSection />
        </div>
      </div>
    </div>
  );
};

export default PlansPageClient;
