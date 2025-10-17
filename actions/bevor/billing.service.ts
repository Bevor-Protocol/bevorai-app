import api from "@/lib/api";
import {
  StripeAddonI,
  StripeCustomerI,
  StripePaymentMethodI,
  StripePlanI,
  StripeSubscriptionI,
  UpdateSubscriptionRequest,
} from "@/utils/types";

class BillingService {
  async getProducts(): Promise<StripePlanI[]> {
    return api.get("/billing/products").then((response) => {
      return response.data.results;
    });
  }

  async getAddons(): Promise<StripeAddonI[]> {
    return api.get("/billing/add-ons").then((response) => {
      return response.data.results;
    });
  }

  async getSubscription(): Promise<StripeSubscriptionI> {
    return api.get("/billing/subscription").then((response) => {
      return response.data;
    });
  }

  async modifySubscription(lookupKey: string): Promise<StripeSubscriptionI> {
    return api.patch("/billing/subscription", { lookup_key: lookupKey }).then((response) => {
      return response.data;
    });
  }

  async getCustomer(): Promise<StripeCustomerI> {
    return api.get("/billing/customer").then((response) => {
      return response.data;
    });
  }

  async updateCustomer(data: { name?: string; email?: string }): Promise<StripeCustomerI> {
    return api.patch("/billing/customer", data).then((response) => {
      return response.data;
    });
  }

  async createCheckoutSession(data: {
    success_url: string;
    cancel_url: string;
  }): Promise<{ session_id: string; url: string }> {
    return api.post("/billing/checkout", data).then((response) => {
      return response.data;
    });
  }

  async updateSubscription(data: UpdateSubscriptionRequest): Promise<boolean> {
    return api
      .patch("/billing/subscription", {
        price_id: data.price_id,
      })
      .then((response) => {
        return response.data.success;
      });
  }

  async cancelSubscription(): Promise<boolean> {
    return api.delete("/billing/subscription").then((response) => {
      return response.data.success;
    });
  }

  async reactivateSubscription(): Promise<boolean> {
    return api.patch("/billing/reactivate").then((response) => {
      return response.data.success;
    });
  }

  async getPaymentMethod(): Promise<StripePaymentMethodI | null> {
    return api.get("/billing/payment-method").then((response) => {
      return response.data;
    });
  }

  async updatePaymentMethod(data: {
    success_url: string;
    cancel_url: string;
  }): Promise<{ session_id: string; url: string }> {
    return api.post("/billing/payment-method", data).then((response) => {
      return response.data;
    });
  }
}

const billingService = new BillingService();
export default billingService;
