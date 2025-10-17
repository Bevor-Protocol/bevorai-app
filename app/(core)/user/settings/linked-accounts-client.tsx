"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { trimAddress } from "@/utils/helpers";
import {
  EmailWithMetadata,
  GoogleOAuthWithMetadata,
  usePrivy,
  WalletWithMetadata,
} from "@privy-io/react-auth";
import { Chrome, Mail, Plus, RefreshCcw, Unlink, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface AccountProps {
  isLoading?: boolean;
  canUnlink?: boolean;
}

const EmailAccount: React.FC<AccountProps & { linkedAccounts: EmailWithMetadata[] }> = ({
  linkedAccounts,
  isLoading,
  canUnlink,
}) => {
  const { linkEmail, unlinkEmail } = usePrivy();
  const isLinked = linkedAccounts.length > 0;

  const handleDisconnect = (): void => {
    if (linkedAccounts.length > 0 && !!linkedAccounts[0].address) {
      unlinkEmail(linkedAccounts[0].address);
    }
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
      <div className="flex items-center space-x-3">
        <Mail className="size-4 text-blue-400" />
        <div>
          <p className="text-foreground font-medium text-sm">Email</p>
          <p className="text-xs text-muted-foreground">
            {isLoading ? (
              <span className="inline-block w-20 h-3 bg-neutral-700 rounded animate-pulse" />
            ) : isLinked ? (
              "1 account connected"
            ) : (
              "Not connected"
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {isLoading ? (
          <span className="inline-block w-16 h-6 bg-neutral-700 rounded animate-pulse" />
        ) : isLinked ? (
          <>
            <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded">
              Connected
            </span>
            {canUnlink && (
              <button
                onClick={handleDisconnect}
                className="p-1 text-muted-foreground hover:text-red-400 transition-colors cursor-pointer"
                title="Unlink email"
              >
                <Unlink className="w-3 h-3" />
              </button>
            )}
          </>
        ) : (
          <button
            className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-foreground rounded transition-colors cursor-pointer"
            onClick={linkEmail}
          >
            Connect
          </button>
        )}
      </div>
    </div>
  );
};

const GoogleAccount: React.FC<AccountProps & { linkedAccounts: GoogleOAuthWithMetadata[] }> = ({
  linkedAccounts,
  isLoading,
  canUnlink,
}) => {
  const { linkGoogle, unlinkGoogle } = usePrivy();
  const isLinked = linkedAccounts.length > 0;

  const handleDisconnect = (): void => {
    if (linkedAccounts.length > 0 && !!linkedAccounts[0].email) {
      unlinkGoogle(linkedAccounts[0].email);
    }
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
      <div className="flex items-center space-x-3">
        <Chrome className="size-4 text-green-400" />
        <div>
          <p className="text-foreground font-medium text-sm">Google</p>
          <p className="text-xs text-muted-foreground">
            {isLoading ? (
              <span className="inline-block w-20 h-3 bg-neutral-700 rounded animate-pulse" />
            ) : isLinked ? (
              "1 account connected"
            ) : (
              "Not connected"
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {isLoading ? (
          <span className="inline-block w-16 h-6 bg-neutral-700 rounded animate-pulse" />
        ) : isLinked ? (
          <>
            <span className="px-2 py-1 text-xs bg-green text-green-foreground rounded">
              Connected
            </span>
            {canUnlink && (
              <button
                onClick={handleDisconnect}
                className="p-1 text-muted-foreground hover:text-red-400 transition-colors cursor-pointer"
                title="Unlink Google"
              >
                <Unlink className="w-3 h-3" />
              </button>
            )}
          </>
        ) : (
          <button
            className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-foreground rounded transition-colors cursor-pointer"
            onClick={linkGoogle}
          >
            Connect
          </button>
        )}
      </div>
    </div>
  );
};

const WalletAccount: React.FC<AccountProps & { linkedAccounts: WalletWithMetadata[] }> = ({
  linkedAccounts,
  isLoading,
  canUnlink,
}) => {
  const { linkWallet, unlinkWallet } = usePrivy();
  const isLinked = linkedAccounts.length > 0;

  const handleDisconnect = (address: string): void => {
    unlinkWallet(address);
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
      <div className="flex items-center space-x-3">
        <Wallet className="size-4 text-purple-400" />
        <div>
          <p className="text-foreground font-medium text-sm">Wallet</p>
          <p className="text-xs text-muted-foreground">
            {isLoading ? (
              <span className="inline-block w-24 h-3 bg-neutral-700 rounded animate-pulse" />
            ) : isLinked ? (
              `${linkedAccounts.length} wallet${linkedAccounts.length > 1 ? "s" : ""} connected`
            ) : (
              "Not connected"
            )}
          </p>
        </div>
        {!isLoading && (
          <button
            onClick={linkWallet}
            className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors text-xs cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Add</span>
          </button>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {isLoading ? (
          <span className="inline-block w-16 h-6 bg-neutral-700 rounded animate-pulse" />
        ) : isLinked ? (
          <div className="flex flex-col gap-1">
            {linkedAccounts.map((account) => (
              <div key={account.address} className="flex items-center gap-2">
                {canUnlink && (
                  <button
                    onClick={() => handleDisconnect(account.address)}
                    className="p-1 text-muted-foreground hover:text-red-400 transition-colors cursor-pointer"
                    title="Unlink wallet"
                  >
                    <Unlink className="w-3 h-3" />
                  </button>
                )}
                <span className="text-xs text-muted-foreground">
                  {trimAddress(account.address)}
                </span>
                <span className="px-2 py-1 text-xs bg-green text-green-foreground rounded">
                  Connected
                </span>
              </div>
            ))}
          </div>
        ) : (
          <button
            className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-foreground rounded transition-colors cursor-pointer"
            onClick={linkWallet}
          >
            Connect
          </button>
        )}
      </div>
    </div>
  );
};

const LinkedAccountsClient: React.FC = () => {
  const router = useRouter();
  const { user, ready, authenticated } = usePrivy();
  useEffect(() => {
    if (!ready) return;
    if (!authenticated) {
      router.push("/sign-in?method=privy");
    }
  }, [ready, authenticated, router]);

  const linkedAccounts = user?.linkedAccounts ?? [];
  const canUnlink = linkedAccounts.length >= 2;

  const emailAccounts = linkedAccounts.filter((account) => account.type === "email");
  const walletAccounts = linkedAccounts.filter((account) => account.type === "wallet");
  const googleAccounts = linkedAccounts.filter((account) => account.type === "google_oauth");

  return (
    <div className="border border-border rounded-lg p-6">
      <h2 className="text-lg font-semibold text-foreground">
        Linked Accounts ({linkedAccounts.length ?? 0})
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        You can link many wallets, but only 1 email or google account. At least 1 account must be
        connected.
      </p>
      <div className="space-y-3">
        <EmailAccount linkedAccounts={emailAccounts} isLoading={!ready} canUnlink={canUnlink} />
        <GoogleAccount linkedAccounts={googleAccounts} isLoading={!ready} canUnlink={canUnlink} />
        <WalletAccount linkedAccounts={walletAccounts} isLoading={!ready} canUnlink={canUnlink} />
      </div>
    </div>
  );
};

export const CreditSync: React.FC<{ credits: number }> = ({ credits }) => {
  const handleSyncCredits = (): void => {
    // TODO: Implement credit sync functionality
    console.log("Syncing credits...");
  };

  return (
    <div className="text-center p-4 border border-border rounded-lg relative">
      <div className="text-2xl font-bold text-foreground mb-1">{credits}</div>
      <div className="text-sm text-muted-foreground">Credits</div>

      <Tooltip>
        <TooltipTrigger className="absolute right-2 top-2" asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSyncCredits}
            className="p-1 text-muted-foreground hover:text-blue-400 transition-colors cursor-pointer"
          >
            <RefreshCcw className="size-4 absolute" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" align="end" className="min-w-32">
          Sync credits from your account
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default LinkedAccountsClient;
