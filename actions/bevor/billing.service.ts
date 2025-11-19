"use server";

import api from "@/lib/api";
import { generateQueryKey } from "@/utils/constants";
import {
  StripeAddonI,
  StripeCustomerI,
  StripePaymentMethodI,
  StripePlanI,
  StripeSubscriptionI,
  UpdateSubscriptionRequest,
} from "@/utils/types";
import { QueryKey } from "@tanstack/react-query";

export const getProducts = async (teamSlug: string): Promise<StripePlanI[]> => {
  return api
    .get("/billing/products", { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data.results;
    });
};

export const getAddons = async (teamSlug: string): Promise<StripeAddonI[]> => {
  return api
    .get("/billing/add-ons", { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data.results;
    });
};

export const getSubscription = async (teamSlug: string): Promise<StripeSubscriptionI> => {
  return api
    .get("/billing/subscription", { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data;
    });
};

export const modifySubscription = async (
  teamSlug: string,
  lookupKey: string,
): Promise<StripeSubscriptionI> => {
  return api
    .patch(
      "/billing/subscription",
      { lookup_key: lookupKey },
      { headers: { "bevor-team-slug": teamSlug } },
    )
    .then((response) => {
      return response.data;
    });
};

export const getCustomer = async (teamSlug: string): Promise<StripeCustomerI> => {
  return api
    .get("/billing/customer", { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data;
    });
};

export const updateCustomer = async (
  teamSlug: string,
  data: { name?: string; email?: string },
): Promise<StripeCustomerI> => {
  return api
    .patch("/billing/customer", data, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data;
    });
};

export const createCheckoutSession = async (
  teamSlug: string,
  data: { success_url: string; cancel_url: string },
): Promise<{ session_id: string; url: string }> => {
  return api
    .post("/billing/checkout", data, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data;
    });
};

export const updateSubscription = async (
  teamSlug: string,
  data: UpdateSubscriptionRequest,
): Promise<boolean> => {
  return api
    .patch(
      "/billing/subscription",
      {
        price_id: data.price_id,
      },
      { headers: { "bevor-team-slug": teamSlug } },
    )
    .then((response) => {
      return response.data.success;
    });
};

export const cancelSubscription = async (
  teamSlug: string,
): Promise<{ toInvalidate: QueryKey[] }> => {
  const toInvalidate = [generateQueryKey.subscription(teamSlug)];
  return api
    .delete("/billing/subscription", { headers: { "bevor-team-slug": teamSlug } })
    .then(() => {
      return { toInvalidate };
    });
};

export const reactivateSubscription = async (
  teamSlug: string,
): Promise<{ toInvalidate: QueryKey[] }> => {
  const toInvalidate = [generateQueryKey.subscription(teamSlug)];
  return api
    .patch("/billing/reactivate", {}, { headers: { "bevor-team-slug": teamSlug } })
    .then(() => {
      return { toInvalidate };
    });
};

export const getPaymentMethod = async (teamSlug: string): Promise<StripePaymentMethodI | null> => {
  return api
    .get("/billing/payment-method", { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data;
    });
};

export const updatePaymentMethod = async (
  teamSlug: string,
  data: { success_url: string; cancel_url: string },
): Promise<{ session_id: string; url: string }> => {
  return api
    .post("/billing/payment-method", data, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data;
    });
};
