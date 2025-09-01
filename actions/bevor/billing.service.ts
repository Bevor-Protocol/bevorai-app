import api from "@/lib/api";
import {
  StripeAddonI,
  StripeCustomerI,
  StripePlanI,
  StripeSubscriptionI,
  UpdateSubscriptionRequest,
} from "@/utils/types";

class BillingService {
  async getProducts(): Promise<StripePlanI[]> {
    return api.get("/billing/products").then((response: any) => {
      return response.data.results;
    });
  }

  async getAddons(): Promise<StripeAddonI[]> {
    return api.get("/billing/add-ons").then((response: any) => {
      return response.data.results;
    });
  }

  async getSubscription(): Promise<StripeSubscriptionI> {
    return api.get("/billing/subscription").then((response: any) => {
      return response.data;
    });
  }

  async modifySubscription(lookupKey: string): Promise<StripeSubscriptionI> {
    return api.patch("/billing/subscription", { lookup_key: lookupKey }).then((response: any) => {
      return response.data;
    });
  }

  async getCustomer(): Promise<StripeCustomerI> {
    return api.get("/billing/customer").then((response: any) => {
      return response.data;
    });
  }

  async updateCustomer(data: { name?: string; email?: string }): Promise<StripeCustomerI> {
    return api.patch("/billing/customer", data).then((response: any) => {
      return response.data;
    });
  }

  async createCheckoutSession(data: {
    success_url: string;
    cancel_url: string;
  }): Promise<{ session_id: string; url: string }> {
    return api.post("/billing/checkout", data).then((response: any) => {
      return response.data;
    });
  }

  async updateSubscription(data: UpdateSubscriptionRequest): Promise<boolean> {
    return api
      .patch("/billing/subscription", {
        price_id: data.price_id,
      })
      .then((response: any) => {
        return response.data.success;
      });
  }

  async cancelSubscription(): Promise<boolean> {
    return api.delete("/billing/subscription").then((response: any) => {
      return response.data.success;
    });
  }

  async reactivateSubscription(): Promise<boolean> {
    return api.patch("/billing/reactivate").then((response: any) => {
      return response.data.success;
    });
  }
}

const billingService = new BillingService();
export default billingService;
