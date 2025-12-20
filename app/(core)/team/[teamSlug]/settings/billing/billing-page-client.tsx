/* eslint-disable @next/next/no-img-element */
"use client";

import { billingActions } from "@/actions/bevor";

import { AddonRow } from "@/components/billing/addon";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { generateQueryKey } from "@/utils/constants";
import { PlanStatusEnum } from "@/utils/enums";
import { StripeAddonI, StripeSubscriptionI, StripeSubscriptionLimit } from "@/utils/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import React, { useEffect, useState } from "react";

const InvoiceNameSection: React.FC<{ teamSlug: string }> = ({ teamSlug }) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");

  const { data: customer } = useQuery({
    queryKey: generateQueryKey.customer(teamSlug),
    queryFn: () => billingActions.getCustomer(teamSlug),
  });

  useEffect(() => {
    if (customer?.name && !name) {
      setName(customer.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer?.name]);

  const updateNameMutation = useMutation({
    mutationFn: (data: { name: string }) => billingActions.updateCustomer(teamSlug, data),
    onSuccess: (data) => {
      // don't need to invalidate here. The PATCH returns the same response as the GET.
      const queryKey = generateQueryKey.customer(teamSlug);
      queryClient.setQueryData(queryKey, data);
    },
  });

  const handleNameSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    updateNameMutation.mutate({ name });
  };

  return (
    <form onSubmit={handleNameSubmit} className="flex flex-col gap-4">
      <FieldGroup>
        <FieldSet>
          <FieldLegend>Invoice Name</FieldLegend>
          <FieldDescription>
            Your team name is shown on your invoice by default. If you want, you can have it show a
            custom name.
          </FieldDescription>
          <Field>
            <FieldLabel htmlFor="invoice-name">Custom Name</FieldLabel>
            <Input
              id="invoice-name"
              name="invoice-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter custom name for invoices"
              className="w-full"
              disabled={updateNameMutation.isPending}
            />
          </Field>
        </FieldSet>
      </FieldGroup>

      <div className="pt-4 border-t border-border">
        <Button type="submit" disabled={updateNameMutation.isPending} className="text-sm">
          {updateNameMutation.isPending ? "Updating..." : "Update Invoice Name"}
        </Button>
      </div>
    </form>
  );
};

const BillingEmailSection: React.FC<{ teamSlug: string }> = ({ teamSlug }) => {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const { data: customer } = useQuery({
    queryKey: generateQueryKey.customer(teamSlug),
    queryFn: () => billingActions.getCustomer(teamSlug),
  });

  useEffect(() => {
    if (customer?.email && !email) {
      setEmail(customer.email);
    }
  }, [customer?.email, email]);

  const updateEmailMutation = useMutation({
    mutationFn: (data: { email: string }) => billingActions.updateCustomer(teamSlug, data),
    onSuccess: (data) => {
      const queryKey = generateQueryKey.customer(teamSlug);
      queryClient.setQueryData(queryKey, data);
    },
    onError: (error) => {
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
    <div className="border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold  mb-4">Billing Email</h3>
      <p className="text-sm text-muted-foreground my-4">
        By default, your invoices will go to the email of the user who created the team. If you
        want, you can update it here.
      </p>
      <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="billing-email" aria-required>
              Email Address
            </FieldLabel>
            <Input
              id="billing-email"
              name="billing-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter billing email address"
              className="w-full"
              disabled={updateEmailMutation.isPending}
              aria-invalid={!!emailError}
            />
            {emailError && <p className="text-sm text-destructive">{emailError}</p>}
          </Field>
        </FieldGroup>

        <div className="pt-4 border-t border-border">
          <Button type="submit" disabled={updateEmailMutation.isPending} className="text-sm">
            {updateEmailMutation.isPending ? "Updating..." : "Update Billing Email"}
          </Button>
        </div>
      </form>
    </div>
  );
};

const PaymentMethodSection: React.FC<{ teamSlug: string }> = ({ teamSlug }) => {
  const { data: paymentMethod, isLoading: paymentMethodLoading } = useQuery({
    queryKey: generateQueryKey.paymentMethods(teamSlug),
    queryFn: () => billingActions.getPaymentMethod(teamSlug),
  });

  const checkoutMutation = useMutation({
    mutationFn: () =>
      billingActions.updatePaymentMethod(teamSlug, {
        success_url: `${window.location.origin}/team/${teamSlug}/settings/billing?success=true`,
        cancel_url: `${window.location.origin}/team/${teamSlug}/settings/billing?canceled=true`,
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
      <div className="border border-border rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold  mb-4">Payment Method</h3>
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
      <div className="border border-border rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold  mb-4">Payment Method</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Unsupported payment method type. Please contact support.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg p-6 mb-8">
      <h3 className="text-lg font-semibold  mb-4">Payment Method</h3>
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-8 bg-neutral-800 rounded flex items-center justify-center">
            <span className="text-xs text-muted-foreground font-mono">
              {getCardDisplayText(paymentMethod.card.brand)}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-sm font-medium ">
                {formatCardBrand(paymentMethod.card.brand)} •••• {paymentMethod.card.last4}
              </span>
              <span className="text-xs text-muted-foreground">
                Expires{" "}
                {formatExpiryDate(paymentMethod.card.exp_month, paymentMethod.card.exp_year)}
              </span>
            </div>
            {paymentMethod.billing_details.name && (
              <p className="text-sm text-muted-foreground">{paymentMethod.billing_details.name}</p>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <Button
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
  teamSlug: string;
}> = ({ subscription, teamSlug }) => {
  const queryClient = useQueryClient();
  const isTrial = subscription.plan_status === PlanStatusEnum.TRIALING;
  const isCancelling = subscription.subscription?.cancel_at_period_end;

  const unsubscribeMutation = useMutation({
    mutationFn: async () => billingActions.cancelSubscription(teamSlug),
    onSuccess: ({ toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: async () => billingActions.reactivateSubscription(teamSlug),
    onSuccess: ({ toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
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
        return "Smart Contract Analyses";
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
      <div className="border border-border rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold ">{isTrial ? "Free Trial" : "BevorAI Pro"}</h3>
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
            <p className="text-sm text-muted-foreground mb-2">
              {periodInfo.label}: {formatDate(periodInfo.start)} -{" "}
              {periodInfo.end ? formatDate(periodInfo.end) : "Ongoing"}
            </p>
          </div>
        )}

        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">
            Team Seats: {subscription.n_seats}
            {subscription.plan_status === PlanStatusEnum.TRIALING && (
              <span className="text-orange-400 ml-2">(3 seat limit during trial)</span>
            )}
          </p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          {isTrial ? (
            <Link href={`/team/${teamSlug}/settings/plans`}>
              <Button className="text-sm px-4 py-2">Upgrade Plan</Button>
            </Link>
          ) : isCancelling ? (
            <div className="flex items-center space-x-3">
              <Button
                className="text-sm px-4 py-2"
                onClick={() => reactivateMutation.mutate()}
                disabled={reactivateMutation.isPending}
              >
                {reactivateMutation.isPending ? "Reactivating..." : "Reactivate Subscription"}
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
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
              className="text-sm text-muted-foreground hover: transition-colors"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </div>

      {subscription.limits && subscription.limits.length > 0 && (
        <div className="border border-border rounded-lg p-6 mb-8">
          <h4 className="text-lg font-semibold  mb-4">Usage & Limits</h4>
          <div className="space-y-3">
            {subscription.limits.map((limit, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {getFeatureName(limit.feature)}
                </span>
                <span className="text-sm ">{getLimitCopy(limit)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

const AddonsSection: React.FC<{ teamSlug: string }> = ({ teamSlug }) => {
  const { data: addons, isLoading: addonsLoading } = useQuery({
    queryKey: generateQueryKey.addons(teamSlug),
    queryFn: () => billingActions.getAddons(teamSlug),
  });

  if (addonsLoading) {
    return (
      <div className="border border-border rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold  mb-4">Add-ons</h3>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="border border-border rounded-lg p-6 animate-pulse">
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
    <div className="border border-border rounded-lg p-6 mb-8">
      <h3 className="text-lg font-semibold  mb-4">Add-ons</h3>
      <div className="space-y-4">
        {addons.map((addon: StripeAddonI) => (
          <AddonRow teamSlug={teamSlug} key={addon.id} addon={addon} />
        ))}
      </div>
    </div>
  );
};

const NoSubscription: React.FC<{ teamSlug: string; subscription?: StripeSubscriptionI }> = ({
  teamSlug,
  subscription,
}) => {
  return (
    <div className="border border-border rounded-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold ">No Active Subscription</h3>
        <span className="bg-neutral-500/20 text-muted-foreground text-xs px-2 py-1 rounded">
          {subscription ? subscription.plan_status : "Inactive"}
        </span>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        You don&apos;t have an active subscription. Upgrade to a plan to access premium features and
        manage your billing.
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Link href={`/team/${teamSlug}/settings/plans`}>
          <Button className="text-sm px-4 py-2">View Plans</Button>
        </Link>
        <div className="flex items-center space-x-3">
          <a
            href="https://bevor.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover: transition-colors"
          >
            Contact Sales
          </a>
        </div>
      </div>
    </div>
  );
};

const BillingPageClient: React.FC<{ teamSlug: string }> = ({ teamSlug }) => {
  const { data: subscription } = useQuery({
    queryKey: generateQueryKey.subscription(teamSlug),
    queryFn: () => billingActions.getSubscription(teamSlug),
  });

  const hasActiveSubscription =
    subscription &&
    ([PlanStatusEnum.ACTIVE, PlanStatusEnum.PAST_DUE, PlanStatusEnum.TRIALING].includes(
      subscription.plan_status,
    ) ||
      subscription.subscription?.cancel_at_period_end);

  return (
    <div className="px-6 pb-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {hasActiveSubscription ? (
          <>
            <CurrentSubscription subscription={subscription} teamSlug={teamSlug} />
            {(subscription?.plan_status === PlanStatusEnum.ACTIVE ||
              subscription?.subscription?.cancel_at_period_end) && (
              <AddonsSection teamSlug={teamSlug} />
            )}
          </>
        ) : (
          <NoSubscription teamSlug={teamSlug} subscription={subscription} />
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InvoiceNameSection teamSlug={teamSlug} />
          <BillingEmailSection teamSlug={teamSlug} />
        </div>

        <PaymentMethodSection teamSlug={teamSlug} />
      </div>
    </div>
  );
};

export default BillingPageClient;
