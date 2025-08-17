"use client";

import * as Card from "@/components/ui/card";
import { privyConfig } from "@/lib/config/privy";
import { cn } from "@/lib/utils";
import { ChainPresets } from "@/utils/constants";
import { useWallets } from "@privy-io/react-auth";
import { Check } from "lucide-react";
import { Icon } from "../ui/icon";

const Networks: React.FC<{ close?: () => void }> = ({ close }) => {
  // this hook gets you the connected wallet. It should contain information
  // for the currently connected network. This is not necessarily the wallet
  // that the user is authenticated with.
  const { wallets } = useWallets();
  const wallet = wallets[0];
  const supportedChains = privyConfig.supportedChains ?? [];
  const currentChainId = Number(wallet.chainId.split(":")[1]);

  const handleChain = async (chainId: number): Promise<void> => {
    await wallet.switchChain(chainId);
    if (close) close();
  };

  return (
    <Card.Main
      className={cn("text-sm min-w-44 shadow-sm", "divide-gray-200/10 divide-y divide-solid")}
    >
      <div className="flex flex-col px-2 py-2 gap-2">
        <p className="text-white/60 pl-2">Select Network:</p>
        {supportedChains.map((chain) => (
          <div
            className={cn(
              "flex items-center relative rounded-lg transition-colors",
              "justify-start gap-2 pl-2 pr-6 py-1",
              currentChainId != chain.id ? "cursor-pointer hover:bg-slate-700/40" : "opacity-75",
            )}
            key={chain.id}
            onClick={async (): Promise<void> => await handleChain(chain.id)}
          >
            <Icon
              size="sm"
              image={ChainPresets[chain && chain.id in ChainPresets ? chain.id : 99999]}
              className={cn(
                currentChainId == chain.id && "opacity-disable",
                chain.name === "Localhost" && "bg-auto!",
              )}
            />
            <span
              className={cn("whitespace-nowrap", currentChainId == chain.id && "opacity-disable")}
            >
              {chain.name}
            </span>
            {currentChainId == chain.id && (
              <Check
                height="1rem"
                width="1rem"
                className="absolute right-0 fill-primary-light-50"
              />
            )}
          </div>
        ))}
      </div>
    </Card.Main>
  );
};

export default Networks;
