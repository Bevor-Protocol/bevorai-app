"use server";

import api from "@/lib/api";
import { generateQueryKey } from "@/utils/constants";
import {
  ApiResponse,
  StripeAddonI,
  StripeCustomerI,
  StripePaymentMethodI,
  StripePlanI,
  StripeSubscriptionI,
  UpdateSubscriptionRequest,
} from "@/utils/types";
import { QueryKey } from "@tanstack/react-query";

export const getProducts = async (teamSlug: string): ApiResponse<StripePlanI[]> => {
  return api
    .get("/billing/products", { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results,
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const getAddons = async (teamSlug: string): ApiResponse<StripeAddonI[]> => {
  return api
    .get("/billing/add-ons", { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results,
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const getSubscription = async (teamSlug: string): ApiResponse<StripeSubscriptionI> => {
  return api
    .get("/billing/subscription", { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data,
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const modifySubscription = async (
  teamSlug: string,
  lookupKey: string,
): ApiResponse<StripeSubscriptionI> => {
  return api
    .patch(
      "/billing/subscription",
      { lookup_key: lookupKey },
      { headers: { "bevor-team-slug": teamSlug } },
    )
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data,
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const getCustomer = async (teamSlug: string): ApiResponse<StripeCustomerI> => {
  return api
    .get("/billing/customer", { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data,
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const updateCustomer = async (
  teamSlug: string,
  data: { name?: string; email?: string },
): ApiResponse<StripeCustomerI> => {
  return api
    .patch("/billing/customer", data, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data,
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const createCheckoutSession = async (
  teamSlug: string,
  data: { success_url: string; cancel_url: string },
): ApiResponse<{ session_id: string; url: string }> => {
  return api
    .post("/billing/checkout", data, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data,
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const updateSubscription = async (
  teamSlug: string,
  data: UpdateSubscriptionRequest,
): ApiResponse<boolean> => {
  return api
    .patch(
      "/billing/subscription",
      {
        price_id: data.price_id,
      },
      { headers: { "bevor-team-slug": teamSlug } },
    )
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.success,
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const cancelSubscription = async (
  teamSlug: string,
): ApiResponse<{ toInvalidate: QueryKey[] }> => {
  const toInvalidate = [generateQueryKey.subscription(teamSlug)];
  return api
    .delete("/billing/subscription", { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: { toInvalidate },
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const reactivateSubscription = async (
  teamSlug: string,
): ApiResponse<{ toInvalidate: QueryKey[] }> => {
  const toInvalidate = [generateQueryKey.subscription(teamSlug)];
  return api
    .patch("/billing/reactivate", {}, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: { toInvalidate },
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const getPaymentMethod = async (
  teamSlug: string,
): ApiResponse<StripePaymentMethodI | null> => {
  return api
    .get("/billing/payment-method", { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data,
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const updatePaymentMethod = async (
  teamSlug: string,
  data: { success_url: string; cancel_url: string },
): ApiResponse<{ session_id: string; url: string }> => {
  return api
    .post("/billing/payment-method", data, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data,
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};
