"use client";

import { Button } from "@/components/ui/button";
import * as Card from "@/components/ui/card";
import { TeamSchemaI } from "@/utils/types";
import { Calendar, CreditCard, DollarSign, TrendingUp } from "lucide-react";

interface BillingPageClientProps {
  team: TeamSchemaI;
}

const BillingPageClient: React.FC<BillingPageClientProps> = ({ team }) => {
  return (
    <div className="px-6 py-8 bg-neutral-950 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-neutral-100 mb-2">Billing & Usage</h1>
          <p className="text-neutral-400">Manage billing and monitor usage for {team.name}</p>
        </div>

        {/* Billing Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card.Main className="bg-neutral-900 border border-neutral-800">
            <Card.Content className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Current Plan</p>
                  <p className="text-2xl font-bold text-neutral-100">Free</p>
                </div>
                <CreditCard className="w-8 h-8 text-blue-400" />
              </div>
            </Card.Content>
          </Card.Main>

          <Card.Main className="bg-neutral-900 border border-neutral-800">
            <Card.Content className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Monthly Usage</p>
                  <p className="text-2xl font-bold text-neutral-100">0%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </Card.Content>
          </Card.Main>

          <Card.Main className="bg-neutral-900 border border-neutral-800">
            <Card.Content className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Next Billing</p>
                  <p className="text-2xl font-bold text-neutral-100">-</p>
                </div>
                <Calendar className="w-8 h-8 text-yellow-400" />
              </div>
            </Card.Content>
          </Card.Main>

          <Card.Main className="bg-neutral-900 border border-neutral-800">
            <Card.Content className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Total Spent</p>
                  <p className="text-2xl font-bold text-neutral-100">$0</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-400" />
              </div>
            </Card.Content>
          </Card.Main>
        </div>

        {/* Billing Content */}
        <div className="space-y-6">
          <Card.Main className="bg-neutral-900 border border-neutral-800">
            <Card.Header>
              <CreditCard className="w-5 h-5 text-blue-400" />
              <span>Billing Information</span>
              <span>View billing history, manage subscriptions, and monitor usage.</span>
            </Card.Header>
            <Card.Content>
              <div className="text-center py-12">
                <CreditCard className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-neutral-100 mb-2">Billing Management</h3>
                <p className="text-neutral-400 mb-6 max-w-md mx-auto">
                  Billing and subscription management features are coming soon. You can view your
                  current usage and plan details here.
                </p>
                <Button variant="bright" className="text-white">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Manage Billing
                </Button>
              </div>
            </Card.Content>
          </Card.Main>

          <Card.Main className="bg-neutral-900 border border-neutral-800">
            <Card.Header>
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span>Usage Analytics</span>
              <span>Monitor your team&apos;s usage patterns and consumption.</span>
            </Card.Header>
            <Card.Content>
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-neutral-100 mb-2">Usage Analytics</h3>
                <p className="text-neutral-400 mb-6 max-w-md mx-auto">
                  Detailed usage analytics and reporting features are coming soon. Track your
                  team&apos;s consumption and optimize usage.
                </p>
                <Button variant="dark">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
              </div>
            </Card.Content>
          </Card.Main>
        </div>
      </div>
    </div>
  );
};

export default BillingPageClient;
