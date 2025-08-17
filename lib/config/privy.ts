import { PrivyClientConfig } from "@privy-io/react-auth";
import { Chain } from "viem";
import { anvil, base, sepolia } from "viem/chains";

let chains: readonly [Chain, ...Chain[]];
if (process.env.NEXT_PUBLIC_VERCEL_ENV === "development") {
  chains = [anvil];
} else if (process.env.NEXT_PUBLIC_VERCEL_ENV === "preview") {
  chains = [sepolia];
} else {
  chains = [base];
}

export const privyConfig: PrivyClientConfig = {
  loginMethods: ["email", "wallet", "google"],
  appearance: {
    theme: "dark",
    accentColor: "#3b82f6",
    showWalletLoginFirst: false,
    walletChainType: "ethereum-only",
    logo: "/logo.png",
  },
  supportedChains: chains as [Chain, ...Chain[]],
  defaultChain: chains[0],
};
