"use client";

import { authActions, userActions } from "@/actions/bevor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { start } from "@/utils/auth";
import { generateQueryKey } from "@/utils/constants";
import { UserDetailedSchemaI } from "@/utils/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Chrome, Github, Mail, RefreshCcw, Settings, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

const LinkedAccountsClient: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: generateQueryKey.currentUser(),
    queryFn: () => userActions.get(),
  });

  const [isAttaching, setIsAttaching] = useState<"google" | "github" | null>(null);
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState<"google" | "github" | null>(
    null,
  );

  const attachOauth = async (providerName: "google" | "github"): Promise<void> => {
    setIsAttaching(providerName);
    try {
      const oauth_attach_token = await authActions.getAttachToken(providerName);
      start({
        providerName,
        oauth_attach_token,
        loginRedirect: "/api/auth/callback/attach",
        signupRedirect: "/api/auth/callback/attach",
      });
    } catch (error) {
      console.error(`Failed to attach ${providerName}:`, error);
      toast.error(`Failed to attach ${providerName}. Please try again.`);
      setIsAttaching(null);
    }
  };

  const detachOAuthMutation = useMutation({
    mutationFn: async (providerName: "google" | "github") => {
      return authActions.detachOAuth(providerName);
    },
    onSuccess: (_, providerName) => {
      toast.success("OAuth account disconnected successfully");
      // we only manipulate 1 field, just update it.
      queryClient.setQueryData(
        generateQueryKey.currentUser(),
        (prev: UserDetailedSchemaI): UserDetailedSchemaI => {
          if (providerName === "github") {
            return { ...prev, is_github_oauth_connected: false };
          } else {
            return { ...prev, is_google_oauth_connected: false };
          }
        },
      );
    },
    onError: () => {
      toast.error("Failed to disconnect OAuth account. Please try again.");
    },
  });

  const providerDetaching = detachOAuthMutation.isPending ? detachOAuthMutation.variables : null;

  return (
    <div className="border-b pb-6">
      <h2 className="text-lg font-semibold mb-4">Authentication Methods</h2>
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
          {isLoadingUser ? (
            <Skeleton className="h-8 w-24" />
          ) : user?.is_google_oauth_connected ? (
            <AlertDialog
              open={disconnectDialogOpen === "google"}
              onOpenChange={(open) => setDisconnectDialogOpen(open ? "google" : null)}
            >
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={providerDetaching === "google"}>
                  <X className="size-4" />
                  {providerDetaching === "google" ? "Disconnecting..." : "Disconnect"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Disconnect Google OAuth?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Disconnecting Google OAuth will remove it as an authentication method for your
                    account. You will no longer be able to sign in using your Google account. This
                    does not affect your GitHub App installations or any other account settings.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      detachOAuthMutation.mutate("google");
                      setDisconnectDialogOpen(null);
                    }}
                    disabled={providerDetaching === "google"}
                  >
                    Disconnect
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => attachOauth("google")}
              disabled={isAttaching !== null}
            >
              {isAttaching === "google" ? "Connecting..." : "Connect"}
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <Github className="size-4 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">GitHub OAuth</p>
              <p className="text-xs text-muted-foreground">Sign in with GitHub</p>
            </div>
          </div>
          {isLoadingUser ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/user/github/manage">
                    <Button variant="outline" size="sm">
                      <Settings className="size-4" />
                      Manage
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">
                    Manage GitHub App installations (separate from OAuth authentication). This
                    allows access to repositories and organizations.
                  </p>
                </TooltipContent>
              </Tooltip>
              {user?.is_github_oauth_connected ? (
                <AlertDialog
                  open={disconnectDialogOpen === "github"}
                  onOpenChange={(open) => setDisconnectDialogOpen(open ? "github" : null)}
                >
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={providerDetaching === "github"}>
                      <X className="size-4" />
                      {providerDetaching === "github" ? "Disconnecting..." : "Disconnect"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Disconnect GitHub OAuth?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Disconnecting GitHub OAuth will remove it as an authentication method for
                        your account. You will no longer be able to sign in using your GitHub
                        account. This does not affect your GitHub App installations or any other
                        account settings.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          detachOAuthMutation.mutate("github");
                          setDisconnectDialogOpen(null);
                        }}
                        disabled={providerDetaching === "github"}
                      >
                        Disconnect
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => attachOauth("github")}
                  disabled={isAttaching !== null}
                >
                  {isAttaching === "github" ? "Connecting..." : "Connect"}
                </Button>
              )}
            </div>
          )}
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
