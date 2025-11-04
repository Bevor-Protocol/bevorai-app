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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QUERY_KEYS } from "@/utils/constants";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";

export const ApiKeyCreate: React.FC<{ teamId: string }> = ({ teamId }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="text-foreground">
          <Plus className="size-4" />
          Create API Key
        </Button>
      </DialogTrigger>
      <DialogContent>
        <CreateApiKeyModal teamId={teamId} />
      </DialogContent>
    </Dialog>
  );
};

export const ApiKeyTable: React.FC<{ teamId: string }> = ({ teamId }) => {
  const queryClient = useQueryClient();
  const [showKey, setShowKey] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: [QUERY_KEYS.API_KEYS, teamId],
    queryFn: async () => {
      return await apiKeyActions.listKeys(teamId);
    },
  });

  const regenerateApiKeyMutation = useMutation({
    mutationFn: async (keyId: string) => apiKeyActions.refreshKey(teamId, keyId),
    onSuccess: () => {
      setShowKey(true);
      queryClient.invalidateQueries({ queryKey: ["api-keys", teamId] });
    },
  });

  const deleteApiKeyMutation = useMutation({
    mutationFn: async (keyId: string) => apiKeyActions.revokeKey(teamId, keyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys", teamId] });
    },
  });

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

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
      <ScrollArea className="w-full pb-4">
        <Table>
          <TableCaption>
            API keys allow you to integrate with our API for MCP, CI/CD, and other automation.
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[20%]">Name</TableHead>
              <TableHead className="w-[40%]">Key Prefix</TableHead>
              <TableHead className="w-[15%]">Created At</TableHead>
              <TableHead className="text-right w-[10%]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              [0, 1].map((ind) => (
                <TableRow key={ind}>
                  <TableCell>
                    <Skeleton className="h-8" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8" />
                  </TableCell>
                </TableRow>
              ))}
            {apiKeys.map((apiKey) => (
              <TableRow key={apiKey.id}>
                <TableCell>{apiKey.name}</TableCell>
                <TableCell>sk_{apiKey.prefix}•••••••••••••••</TableCell>
                <TableCell>{formatDate(apiKey.created_at)}</TableCell>
                <TableCell className="text-right">
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </>
  );
};
