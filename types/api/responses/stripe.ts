export enum PlanStatusEnum {
  ACTIVE = "active",
  CANCELED = "canceled",
  INCOMPLETE = "incomplete",
  INCOMPLETE_EXPIRED = "incomplete_expired",
  PAST_DUE = "past_due",
  TRIALING = "trialing",
  UNPAID = "unpaid",
  PAUSED = "paused",
}

interface StripeSeatTier {
  up_to: number | null;
  flat_amount: number;
  unit_amount: number;
}

interface StripeSeatPricing {
  type: "graduated";
  tiers: StripeSeatTier[];
}

interface StripeAnalysisUsage {
  included: number;
  unit_amount: number;
  billing_scheme: "metered";
}

interface StripeUsage {
  audits: StripeAnalysisUsage;
}

export interface StripePlan {
  id: string;
  name: string;
  description: string;
  billing_interval: string;
  base_price: number;
  base_lookup_key: string;
  currency: string;
  included_seats: number;
  seat_pricing: StripeSeatPricing;
  usage: StripeUsage;
  features: string[];
  image: string | null;
  is_active: boolean;
}

export interface StripeAddon {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billing_interval: string;
  features: string[];
  image: string | null;
  is_active: boolean;
  is_eligible: boolean;
  is_pending_removal: boolean;
  lookup_key: string;
}

export interface StripeSubscriptionLimit {
  feature: string;
  limit?: number;
  current: number;
  is_hard_cap: boolean;
}

export interface StripeSubscription {
  plan_status: PlanStatusEnum;
  subscription: {
    id: string;
    status: string;
    cancel_at_period_end: boolean;
    metadata: {
      [key: string]: boolean;
    };
    plan_ids: string[];
  } | null;
  limits: StripeSubscriptionLimit[];
  n_seats: number;
  current_period_start: Date;
  current_period_end?: Date;
}

export interface StripeCustomer {
  id?: string;
  exists: boolean;
  name?: string;
  email?: string;
}

export interface CreateStripeCustomerRequest {
  email: string;
  team_id: string;
}

export interface CreateStripeCustomerResponse {
  stripe_customer_id: string;
  email: string;
}

export interface CreateCheckoutSessionRequest {
  price_id: string;
  team_id: string;
  success_url: string;
  cancel_url: string;
}

export interface CreateCheckoutSessionResponse {
  checkout_url: string;
}

export interface StripePaymentMethod {
  id: string;
  object: "payment_method";
  billing_details: {
    address: {
      city: string | null;
      country: string | null;
      line1: string | null;
      line2: string | null;
      postal_code: string | null;
      state: string | null;
    };
    email: string | null;
    name: string | null;
    phone: string | null;
  };
  card: {
    brand: string;
    checks: {
      address_line1_check: string | null;
      address_postal_code_check: string | null;
      cvc_check: string | null;
    };
    country: string | null;
    exp_month: number;
    exp_year: number;
    fingerprint: string | null;
    funding: string;
    generated_from: string | null;
    last4: string;
    networks: {
      available: string[];
      preferred: string | null;
    };
    three_d_secure_usage: {
      supported: boolean;
    };
    wallet: string | null;
  };
  created: number;
  customer: string | null;
  livemode: boolean;
  metadata: Record<string, any>;
  type: string;
}

export interface UpdateSubscriptionRequest {
  subscription_id: string;
  price_id: string;
}
