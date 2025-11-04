"use server";

import api from "@/lib/api";
import {
  StripeAddonI,
  StripeCustomerI,
  StripePaymentMethodI,
  StripePlanI,
  StripeSubscriptionI,
  UpdateSubscriptionRequest,
} from "@/utils/types";

export const getProducts = async (teamId: string): Promise<StripePlanI[]> => {
  return api.get("/billing/products", { headers: { "bevor-team-id": teamId } }).then((response) => {
    return response.data.results;
  });
};

export const getAddons = async (teamId: string): Promise<StripeAddonI[]> => {
  return api.get("/billing/add-ons", { headers: { "bevor-team-id": teamId } }).then((response) => {
    return response.data.results;
  });
};

export const getSubscription = async (teamId: string): Promise<StripeSubscriptionI> => {
  return api
    .get("/billing/subscription", { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data;
    });
};

export const modifySubscription = async (
  teamId: string,
  lookupKey: string,
): Promise<StripeSubscriptionI> => {
  return api
    .patch(
      "/billing/subscription",
      { lookup_key: lookupKey },
      { headers: { "bevor-team-id": teamId } },
    )
    .then((response) => {
      return response.data;
    });
};

export const getCustomer = async (teamId: string): Promise<StripeCustomerI> => {
  return api.get("/billing/customer", { headers: { "bevor-team-id": teamId } }).then((response) => {
    return response.data;
  });
};

export const updateCustomer = async (
  teamId: string,
  data: { name?: string; email?: string },
): Promise<StripeCustomerI> => {
  return api
    .patch("/billing/customer", data, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data;
    });
};

export const createCheckoutSession = async (
  teamId: string,
  data: { success_url: string; cancel_url: string },
): Promise<{ session_id: string; url: string }> => {
  return api
    .post("/billing/checkout", data, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data;
    });
};

export const updateSubscription = async (
  teamId: string,
  data: UpdateSubscriptionRequest,
): Promise<boolean> => {
  return api
    .patch(
      "/billing/subscription",
      {
        price_id: data.price_id,
      },
      { headers: { "bevor-team-id": teamId } },
    )
    .then((response) => {
      return response.data.success;
    });
};

export const cancelSubscription = async (teamId: string): Promise<boolean> => {
  return api
    .delete("/billing/subscription", { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data.success;
    });
};

export const reactivateSubscription = async (teamId: string): Promise<boolean> => {
  return api
    .patch("/billing/reactivate", {}, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data.success;
    });
};

export const getPaymentMethod = async (teamId: string): Promise<StripePaymentMethodI | null> => {
  return api
    .get("/billing/payment-method", { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data;
    });
};

export const updatePaymentMethod = async (
  teamId: string,
  data: { success_url: string; cancel_url: string },
): Promise<{ session_id: string; url: string }> => {
  return api
    .post("/billing/payment-method", data, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data;
    });
};
