This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# CertaiK

## Billing System Implementation

The billing system has been implemented with the following features:

### Frontend Components

- **Billing Page**: Located at `app/teams/[teamSlug]/settings/billing/billing-page-client.tsx`
- **Role-based Access**: Only team owners can access billing functionality
- **Email Collection**: Users must provide an email to create a Stripe customer before subscribing
- **Subscription Plans**: Displays plans with monthly/annual pricing and audit limits

### Backend API Endpoints Required

The following API endpoints need to be implemented on the backend:

#### 1. Get Subscription Plans

```
GET /billing/plans
Response: { results: SubscriptionPlan[] }
```

#### 2. Get Team Billing Info

```
GET /billing/teams/{teamSlug}
Response: BillingInfo
```

#### 3. Create Stripe Customer

```
POST /billing/customers
Body: { email: string, team_id: string }
Response: { stripe_customer_id: string, email: string }
```

#### 4. Create Checkout Session

```
POST /billing/checkout
Body: { price_id: string, team_id: string, success_url: string, cancel_url: string }
Response: { checkout_url: string }
```

#### 5. Update Subscription

```
PUT /billing/subscriptions/{subscriptionId}
Body: { price_id: string }
Response: { success: boolean }
```

#### 6. Cancel Subscription

```
DELETE /billing/subscriptions/{subscriptionId}
Response: { success: boolean }
```

### Data Types

#### SubscriptionPlan

```typescript
{
  id: string;
  name: string;
  description: string;
  monthly_price: number;
  annual_price: number;
  monthly_stripe_price_id: string;
  annual_stripe_price_id: string;
  features: string[];
  audits_included: number;
  cost_per_audit_after_limit: number;
  is_popular?: boolean;
}
```

#### BillingInfo

```typescript
{
  stripe_customer_id?: string;
  email?: string;
  current_subscription?: {
    id: string;
    plan_id: string;
    status: 'active' | 'canceled' | 'past_due' | 'unpaid';
    current_period_start: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
  };
  usage: {
    audits_used: number;
    audits_included: number;
    cost_per_audit: number;
  };
}
```

### Key Features

- **Email Validation**: Only validates email format, no authentication required
- **Stripe Integration**: Uses Stripe for payment processing
- **Graduated Pricing**: Shows audit limits and cost per audit after limit
- **Role-based Access**: Only team owners can modify billing
- **Subscription Management**: View, cancel, and manage subscriptions

### Example Plan Structure

```typescript
// Example plans that should be returned by the API
[
  {
    id: "basic",
    name: "Basic",
    description: "Perfect for small projects",
    monthly_price: 29,
    annual_price: 290,
    monthly_stripe_price_id: "price_basic_monthly",
    annual_stripe_price_id: "price_basic_annual",
    features: ["Up to 5 audits per month", "Basic security analysis", "Email support"],
    audits_included: 5,
    cost_per_audit_after_limit: 10,
    is_popular: false,
  },
  {
    id: "pro",
    name: "Professional",
    description: "For growing teams and projects",
    monthly_price: 99,
    annual_price: 990,
    monthly_stripe_price_id: "price_pro_monthly",
    annual_stripe_price_id: "price_pro_annual",
    features: [
      "Up to 25 audits per month",
      "Advanced security analysis",
      "Priority support",
      "Custom integrations",
    ],
    audits_included: 25,
    cost_per_audit_after_limit: 5,
    is_popular: true,
  },
];
```
