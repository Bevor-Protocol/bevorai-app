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

export const getProducts = async (): Promise<StripePlanI[]> => {
  return api.get("/billing/products").then((response) => {
    return response.data.results;
  });
};

export const getAddons = async (): Promise<StripeAddonI[]> => {
  return api.get("/billing/add-ons").then((response) => {
    return response.data.results;
  });
};

export const getSubscription = async (): Promise<StripeSubscriptionI> => {
  return api.get("/billing/subscription").then((response) => {
    return response.data;
  });
};

export const modifySubscription = async (lookupKey: string): Promise<StripeSubscriptionI> => {
  return api.patch("/billing/subscription", { lookup_key: lookupKey }).then((response) => {
    return response.data;
  });
};

export const getCustomer = async (): Promise<StripeCustomerI> => {
  return api.get("/billing/customer").then((response) => {
    return response.data;
  });
};

export const updateCustomer = async (data: {
  name?: string;
  email?: string;
}): Promise<StripeCustomerI> => {
  return api.patch("/billing/customer", data).then((response) => {
    return response.data;
  });
};

export const createCheckoutSession = async (data: {
  success_url: string;
  cancel_url: string;
}): Promise<{ session_id: string; url: string }> => {
  return api.post("/billing/checkout", data).then((response) => {
    return response.data;
  });
};

export const updateSubscription = async (data: UpdateSubscriptionRequest): Promise<boolean> => {
  return api
    .patch("/billing/subscription", {
      price_id: data.price_id,
    })
    .then((response) => {
      return response.data.success;
    });
};

export const cancelSubscription = async (): Promise<boolean> => {
  return api.delete("/billing/subscription").then((response) => {
    return response.data.success;
  });
};

export const reactivateSubscription = async (): Promise<boolean> => {
  return api.patch("/billing/reactivate").then((response) => {
    return response.data.success;
  });
};

export const getPaymentMethod = async (): Promise<StripePaymentMethodI | null> => {
  return api.get("/billing/payment-method").then((response) => {
    return response.data;
  });
};

export const updatePaymentMethod = async (data: {
  success_url: string;
  cancel_url: string;
}): Promise<{ session_id: string; url: string }> => {
  return api.post("/billing/payment-method", data).then((response) => {
    return response.data;
  });
};
