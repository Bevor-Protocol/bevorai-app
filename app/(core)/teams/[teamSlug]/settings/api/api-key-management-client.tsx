"use client";

import { apiKeyActions } from "@/actions/bevor";
import CreateApiKeyModal from "@/components/Modal/create-api-key";
import ShowApiKeyModal from "@/components/Modal/show-api-key";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { generateQueryKey } from "@/utils/constants";
import { formatDate } from "@/utils/helpers";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";

export const ApiKeyCreate: React.FC<{ teamSlug: string }> = ({ teamSlug }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Create API Key
        </Button>
      </DialogTrigger>
      <DialogContent>
        <CreateApiKeyModal teamSlug={teamSlug} />
      </DialogContent>
    </Dialog>
  );
};

export const ApiKeyTable: React.FC<{ teamSlug: string }> = ({ teamSlug }) => {
  const queryClient = useQueryClient();
  const [showKey, setShowKey] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: generateQueryKey.apiKeys(teamSlug),
    queryFn: async () => apiKeyActions.listKeys(teamSlug),
  });

  const regenerateApiKeyMutation = useMutation({
    mutationFn: async (keyId: string) => apiKeyActions.refreshKey(teamSlug, keyId),
    onSuccess: ({ toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      setShowKey(true);
    },
  });

  const deleteApiKeyMutation = useMutation({
    mutationFn: async (keyId: string) => apiKeyActions.revokeKey(teamSlug, keyId),
    onSuccess: ({ toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
    },
  });

  return (
    <>
      <Dialog open={showKey} onOpenChange={setShowKey}>
        <DialogContent>
          <ShowApiKeyModal apiKey={regenerateApiKeyMutation.data?.api_key ?? ""} />
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!selectedKey} onOpenChange={() => setSelectedKey(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will revoke the key.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteApiKeyMutation.mutate(selectedKey!)}
              variant="destructive"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          API keys allow you to integrate with our API for MCP, CI/CD, and other automation.
        </p>
      </div>
      <ScrollArea className="w-full pb-4">
        <div className="space-y-2">
          {isLoading &&
            [0, 1].map((ind) => (
              <div key={ind} className="flex items-center gap-4 p-3 border rounded-lg">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-40" />
                <Skeleton className="size-8 rounded-full" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          {apiKeys.length === 0 && !isLoading ? (
            <div className="text-center py-12 text-muted-foreground">No API keys created yet</div>
          ) : (
            apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="flex items-center gap-4 flex-1">
                  <div className="font-medium">{apiKey.name}</div>
                  <div className="text-sm text-muted-foreground">
                    sk_{apiKey.prefix}•••••••••••••••
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Icon size="sm" seed={apiKey.user.id} />
                  <span>{apiKey.user.username}</span>
                </div>
                <div className="text-sm text-muted-foreground w-24">
                  {formatDate(apiKey.created_at)}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => regenerateApiKeyMutation.mutate(apiKey.id)}>
                      <RefreshCw className="size-4" />
                      Regenerate
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setSelectedKey(apiKey.id)}
                    >
                      <Trash2 className="size-4" />
                      Revoke
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </>
  );
};
