/* eslint-disable @next/next/no-img-element */
"use client";

import { bevorAction } from "@/actions";
import { AddonRow } from "@/components/billing/addon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlanStatusEnum } from "@/utils/enums";
import {
  MemberRoleEnum,
  StripeAddonI,
  StripeSubscriptionI,
  StripeSubscriptionLimit,
  TeamSchemaI,
} from "@/utils/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

interface BillingPageClientProps {
  team: TeamSchemaI;
}

const InvoiceNameSection: React.FC = () => {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");

  const { data: customer } = useQuery({
    queryKey: ["customer"],
    queryFn: () => bevorAction.getCustomer(),
  });

  useEffect(() => {
    if (customer?.name && !name) {
      setName(customer.name);
    }
  }, [customer?.name]);

  const updateNameMutation = useMutation({
    mutationFn: (data: { name: string }) => bevorAction.updateCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer"] });
    },
  });

  const handleNameSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    updateNameMutation.mutate({ name });
  };

  return (
    <div className="border border-neutral-800 rounded-lg p-6 mb-8">
      <h3 className="text-lg font-semibold text-neutral-100 mb-4">Invoice Name</h3>
      <p className="text-sm text-neutral-400 my-4">
        Your team name is shown on your invoice by default. If you want, you can have it show a
        custom name.
      </p>
      <form onSubmit={handleNameSubmit} className="space-y-4">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Custom Name</label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter custom name for invoices"
              className="w-full"
              disabled={updateNameMutation.isPending}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-800">
          <Button
            type="submit"
            variant="bright"
            disabled={updateNameMutation.isPending}
            className="text-sm"
          >
            {updateNameMutation.isPending ? "Updating..." : "Update Invoice Name"}
          </Button>
        </div>
      </form>
    </div>
  );
};

const BillingEmailSection: React.FC = () => {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const { data: customer } = useQuery({
    queryKey: ["customer"],
    queryFn: () => bevorAction.getCustomer(),
  });

  useEffect(() => {
    if (customer?.email && !email) {
      setEmail(customer.email);
    }
  }, [customer?.email, email]);

  const updateEmailMutation = useMutation({
    mutationFn: (data: { email: string }) => bevorAction.updateCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer"] });
    },
    onError: (error: any) => {
      setEmailError(error.message || "Failed to update customer");
    },
  });

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    setEmailError("");

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    updateEmailMutation.mutate({ email });
  };

  return (
    <div className="border border-neutral-800 rounded-lg p-6 mb-8">
      <h3 className="text-lg font-semibold text-neutral-100 mb-4">Billing Email</h3>
      <p className="text-sm text-neutral-400 my-4">
        By default, your invoices will go to the email of the user who created the team. If you
        want, you can update it here.
      </p>
      <form onSubmit={handleEmailSubmit} className="space-y-4">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Email Address</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter billing email address"
              className="w-full"
              disabled={updateEmailMutation.isPending}
            />
            {emailError && <p className="text-red-400 text-sm mt-1">{emailError}</p>}
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-800">
          <Button
            type="submit"
            variant="bright"
            disabled={updateEmailMutation.isPending}
            className="text-sm"
          >
            {updateEmailMutation.isPending ? "Updating..." : "Update Billing Email"}
          </Button>
        </div>
      </form>
    </div>
  );
};

const PaymentMethodSection: React.FC<{ team: TeamSchemaI }> = ({ team }) => {
  const { data: paymentMethod, isLoading: paymentMethodLoading } = useQuery({
    queryKey: ["payment-method"],
    queryFn: () => bevorAction.getPaymentMethod(),
  });

  const checkoutMutation = useMutation({
    mutationFn: () =>
      bevorAction.updatePaymentMethod({
        success_url: `${window.location.origin}/teams/${team.slug}/settings/billing?success=true`,
        cancel_url: `${window.location.origin}/teams/${team.slug}/settings/billing?canceled=true`,
      }),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });

  const formatCardBrand = (brand: string): string => {
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  const formatExpiryDate = (month: number, year: number): string => {
    return `${month.toString().padStart(2, "0")}/${year.toString().slice(-2)}`;
  };

  const getCardDisplayText = (brand: string): string => {
    switch (brand.toLowerCase()) {
      case "visa":
        return "VISA";
      case "mastercard":
        return "MC";
      case "amex":
        return "AMEX";
      case "discover":
        return "DISC";
      default:
        return brand.toUpperCase().slice(0, 4);
    }
  };

  if (paymentMethodLoading) {
    return (
      <div className="border border-neutral-800 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-neutral-100 mb-4">Payment Method</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-neutral-800 rounded mb-2"></div>
          <div className="h-4 bg-neutral-800 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  if (!paymentMethod || !Object.keys(paymentMethod).length) {
    return <></>;
  }

  // Type guard to ensure we have a valid payment method with card details
  if (!paymentMethod.card || paymentMethod.type !== "card") {
    return (
      <div className="border border-neutral-800 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-neutral-100 mb-4">Payment Method</h3>
        <p className="text-sm text-neutral-400 mb-4">
          Unsupported payment method type. Please contact support.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-neutral-800 rounded-lg p-6 mb-8">
      <h3 className="text-lg font-semibold text-neutral-100 mb-4">Payment Method</h3>
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-8 bg-neutral-800 rounded flex items-center justify-center">
            <span className="text-xs text-neutral-400 font-mono">
              {getCardDisplayText(paymentMethod.card.brand)}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-sm font-medium text-neutral-100">
                {formatCardBrand(paymentMethod.card.brand)} •••• {paymentMethod.card.last4}
              </span>
              <span className="text-xs text-neutral-400">
                Expires{" "}
                {formatExpiryDate(paymentMethod.card.exp_month, paymentMethod.card.exp_year)}
              </span>
            </div>
            {paymentMethod.billing_details.name && (
              <p className="text-sm text-neutral-400">{paymentMethod.billing_details.name}</p>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-800">
          <Button
            variant="bright"
            className="text-sm px-4 py-2"
            onClick={() => checkoutMutation.mutate()}
            disabled={checkoutMutation.isPending}
          >
            Update Payment Method
          </Button>
        </div>
      </div>
    </div>
  );
};

const CurrentSubscription: React.FC<{
  subscription: StripeSubscriptionI;
  team: TeamSchemaI;
}> = ({ subscription, team }) => {
  const queryClient = useQueryClient();
  const isTrial = subscription.plan_status === PlanStatusEnum.TRIALING;
  const isCancelling = subscription.subscription?.cancel_at_period_end;

  const unsubscribeMutation = useMutation({
    mutationFn: async () => bevorAction.cancelSubscription(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: async () => bevorAction.reactivateSubscription(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });

  const formatDate = (dateString: Date): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

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

  const getPeriodInfo = (): { start: Date; end?: Date | null; label: string } | null => {
    if (isTrial) {
      return {
        start: subscription.current_period_start,
        end: null,
        label: "Trial Period",
      };
    }

    if (subscription.subscription) {
      return {
        start: subscription.current_period_start,
        end: subscription.current_period_end,
        label: "Billing Period",
      };
    }

    return null;
  };

  const getLimitCopy = (limit: StripeSubscriptionLimit): string => {
    if (limit.limit === 0) {
      if (isTrial) {
        return "subscription required";
      }
      return "add-on required";
    }
    if (limit.limit === undefined || limit.limit === null) {
      return `${limit.current} used`;
    }
    return `${limit.current}/${limit.limit}${limit.is_hard_cap ? "" : "+"} used`;
  };

  const periodInfo = getPeriodInfo();

  return (
    <>
      <div className="border border-neutral-800 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-100">
            {isTrial ? "Free Trial" : "BevorAI Pro"}
          </h3>
          {isCancelling && (
            <span className="bg-orange-500/20 text-orange-400 text-xs px-2 py-1 rounded">
              Cancelling
            </span>
          )}
        </div>

        {isCancelling && (
          <div className="mb-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <p className="text-sm text-orange-300 mb-2">
              Your subscription is set to cancel at the end of the current billing period.
            </p>
            <p className="text-sm text-orange-400">
              You&apos;ll lose access to premium features on{" "}
              {periodInfo?.end ? formatDate(periodInfo.end) : "the end of your billing period"}.
            </p>
          </div>
        )}

        {periodInfo && (
          <div className="mb-4">
            <p className="text-sm text-neutral-400 mb-2">
              {periodInfo.label}: {formatDate(periodInfo.start)} -{" "}
              {periodInfo.end ? formatDate(periodInfo.end) : "Ongoing"}
            </p>
          </div>
        )}

        <div className="mb-4">
          <p className="text-sm text-neutral-400 mb-2">
            Team Seats: {subscription.n_seats}
            {subscription.plan_status === PlanStatusEnum.TRIALING && (
              <span className="text-orange-400 ml-2">(3 seat limit during trial)</span>
            )}
          </p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
          {isTrial ? (
            <Link href={`/teams/${team.slug}/settings/plans`}>
              <Button variant="bright" className="text-sm px-4 py-2">
                Upgrade Plan
              </Button>
            </Link>
          ) : isCancelling ? (
            <div className="flex items-center space-x-3">
              <Button
                variant="bright"
                className="text-sm px-4 py-2"
                onClick={() => reactivateMutation.mutate()}
                disabled={reactivateMutation.isPending}
              >
                {reactivateMutation.isPending ? "Reactivating..." : "Reactivate Subscription"}
              </Button>
            </div>
          ) : (
            <Button
              variant="transparent"
              className="text-sm px-4 py-2"
              onClick={() => unsubscribeMutation.mutate()}
              disabled={unsubscribeMutation.isPending}
            >
              <span className="text-red-500">Unsubscribe</span>
            </Button>
          )}
          <div className="flex items-center space-x-3">
            <a
              href="https://bevor.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-neutral-400 hover:text-neutral-300 transition-colors"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </div>

      {subscription.limits && subscription.limits.length > 0 && (
        <div className="border border-neutral-800 rounded-lg p-6 mb-8">
          <h4 className="text-lg font-semibold text-neutral-100 mb-4">Usage & Limits</h4>
          <div className="space-y-3">
            {subscription.limits.map((limit, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-neutral-400">{getFeatureName(limit.feature)}</span>
                <span className="text-sm text-neutral-300">{getLimitCopy(limit)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

const AddonsSection: React.FC = () => {
  const { data: addons, isLoading: addonsLoading } = useQuery({
    queryKey: ["addons"],
    queryFn: () => bevorAction.getAddons(),
  });

  if (addonsLoading) {
    return (
      <div className="border border-neutral-800 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-neutral-100 mb-4">Add-ons</h3>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="border border-neutral-800 rounded-lg p-6 animate-pulse">
              <div className="h-6 bg-neutral-800 rounded mb-4"></div>
              <div className="h-4 bg-neutral-800 rounded mb-2"></div>
              <div className="h-4 bg-neutral-800 rounded mb-4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!addons || addons.length === 0) {
    return null;
  }

  return (
    <div className="border border-neutral-800 rounded-lg p-6 mb-8">
      <h3 className="text-lg font-semibold text-neutral-100 mb-4">Add-ons</h3>
      <div className="space-y-4">
        {addons.map((addon: StripeAddonI) => (
          <AddonRow key={addon.id} addon={addon} />
        ))}
      </div>
    </div>
  );
};

const NoSubscription: React.FC<{ team: TeamSchemaI; subscription?: StripeSubscriptionI }> = ({
  team,
  subscription,
}) => {
  return (
    <div className="border border-neutral-800 rounded-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neutral-100">No Active Subscription</h3>
        <span className="bg-neutral-500/20 text-neutral-400 text-xs px-2 py-1 rounded">
          {subscription ? subscription.plan_status : "Inactive"}
        </span>
      </div>

      <p className="text-sm text-neutral-400 mb-4">
        You don&apos;t have an active subscription. Upgrade to a plan to access premium features and
        manage your billing.
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
        <Link href={`/teams/${team.slug}/settings/plans`}>
          <Button variant="bright" className="text-sm px-4 py-2">
            View Plans
          </Button>
        </Link>
        <div className="flex items-center space-x-3">
          <a
            href="https://bevor.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-neutral-400 hover:text-neutral-300 transition-colors"
          >
            Contact Sales
          </a>
        </div>
      </div>
    </div>
  );
};

const AccessRestricted: React.FC = () => (
  <div className="px-6 py-8 bg-neutral-950 min-h-screen">
    <div className="max-w-7xl mx-auto">
      <div className="text-center py-12">
        <Lock className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-neutral-100 mb-2">Access Restricted</h3>
        <p className="text-neutral-400 mb-6 max-w-md mx-auto">
          Only team owners can manage billing and subscription settings.
        </p>
      </div>
    </div>
  </div>
);

const BillingPageClient: React.FC<BillingPageClientProps> = ({ team }) => {
  const isOwner = team.role === MemberRoleEnum.OWNER;

  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => bevorAction.getSubscription(),
    enabled: isOwner,
  });

  const hasActiveSubscription =
    subscription &&
    ([PlanStatusEnum.ACTIVE, PlanStatusEnum.PAST_DUE, PlanStatusEnum.TRIALING].includes(
      subscription.plan_status,
    ) ||
      subscription.subscription?.cancel_at_period_end);

  if (!isOwner) {
    return <AccessRestricted />;
  }

  return (
    <div className="px-6 pb-8 bg-neutral-950 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {hasActiveSubscription ? (
          <>
            <CurrentSubscription subscription={subscription} team={team} />
            {(subscription?.plan_status === PlanStatusEnum.ACTIVE ||
              subscription?.subscription?.cancel_at_period_end) && <AddonsSection />}
          </>
        ) : (
          <NoSubscription team={team} subscription={subscription} />
        )}

        <InvoiceNameSection />

        <BillingEmailSection />

        <PaymentMethodSection team={team} />
      </div>
    </div>
  );
};

export default BillingPageClient;
