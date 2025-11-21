"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Chrome, Github, Mail, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const LinkedAccountsClient: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated via session token
    const checkAuth = async (): Promise<void> => {
      try {
        const response = await fetch("/api/token/validate", { method: "GET" });
        if (!response.ok) {
          router.push("/sign-in");
        }
      } catch {
        router.push("/sign-in");
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="border-b pb-6">
      <h2 className="text-lg font-semibold mb-4">Authentication Methods</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Your account is authenticated through Stytch. You can manage your authentication methods in
        your account settings.
      </p>
      <div className="space-y-4">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <Mail className="size-4 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">Email Authentication</p>
              <p className="text-xs text-muted-foreground">
                Email/password and magic link authentication
              </p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">Available</span>
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <Chrome className="size-4 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">Google OAuth</p>
              <p className="text-xs text-muted-foreground">Sign in with Google</p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">Available</span>
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <Github className="size-4 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">GitHub OAuth</p>
              <p className="text-xs text-muted-foreground">Sign in with GitHub</p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">Available</span>
        </div>
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
      <div className="text-2xl font-bold  mb-1">{credits}</div>
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
