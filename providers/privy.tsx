"use client";

import { privyConfig } from "@/lib/config/privy";
import { PrivyProvider } from "@privy-io/react-auth";

interface PrivyWrapperProps {
  children: React.ReactNode;
}

export const PrivyWrapper: React.FC<PrivyWrapperProps> = ({ children }) => {
  // IMPORTANT: user.linkedAccounts and wallets (from useWallets()) can differ.
  // this can get people into confusing state, especially when it comes to purchasing credits.

  // SOLUTION: allow people to be in this state. Allow them to purchase credits. It doesn't really
  // matter which wallet they purchased the credits with, as long as they were authenticated at
  // the time. A credit sync will look at their connected wallet, and reference it with their
  // authenticated user instance.
  return (
    <PrivyProvider config={privyConfig} appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}>
      {children}
    </PrivyProvider>
  );
};
