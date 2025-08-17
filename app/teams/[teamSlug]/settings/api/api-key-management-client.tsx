"use client";

import { bevorAction } from "@/actions";
import CreateApiKeyModal from "@/components/Modal/create-api-key";
import ShowApiKeyModal from "@/components/Modal/show-api-key";
import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/useContexts";
import { AuthSchema } from "@/utils/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Key, Plus, RefreshCw, Trash2 } from "lucide-react";

const ApiKeyManagementClient: React.FC = () => {
  const { show } = useModal();

  const queryClient = useQueryClient();

  const { data: apiKeys = [], isLoading } = useQuery<AuthSchema[]>({
    queryKey: ["team-api-keys"],
    queryFn: async () => {
      return await bevorAction.listKeys();
    },
  });

  const regenerateApiKeyMutation = useMutation({
    mutationFn: async (apiKeyId: string) => bevorAction.refreshKey(apiKeyId),
    onSuccess: ({ api_key }) => {
      show(<ShowApiKeyModal apiKey={api_key} />);
      queryClient.invalidateQueries({ queryKey: ["team-api-keys"] });
    },
  });

  const deleteApiKeyMutation = useMutation({
    mutationFn: async (apiKeyId: string) => bevorAction.revokeKey(apiKeyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-api-keys"] });
    },
  });

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDeleteApiKey = (apiKeyId: string): void => {
    if (confirm("Are you sure you want to delete this API key? This action cannot be undone.")) {
      deleteApiKeyMutation.mutate(apiKeyId);
    }
  };

  const handleModal = (): void => {
    show(<CreateApiKeyModal />);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-4">
        <div className="flex flex-row mb-8 justify-between">
          <h3 className="text-xl font-semibold text-neutral-100">API Keys</h3>
          <Button variant="bright" onClick={handleModal} className="text-white">
            <Plus className="w-4 h-4 mr-2" />
            Create API Key
          </Button>
        </div>
        <p className="text-neutral-400">
          API keys allow you to integrate with our API for MCP, CI/CD, and other automation.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
          <p className="text-neutral-400 mt-4">Loading API keys...</p>
        </div>
      ) : apiKeys.length === 0 ? (
        <div className="text-center py-12">
          <Key className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-100 mb-2">No API Keys</h3>
        </div>
      ) : (
        <div className="border border-blue-500/50 rounded divide-blue-500/25 divide-y">
          {apiKeys.map((apiKey) => (
            <div key={apiKey.id} className="p-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center flex-shrink-0">
                  <Key className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex flex-col">
                  <div className="text-sm font-medium text-neutral-100">{apiKey.name}</div>
                  <div className="text-xs text-neutral-400">
                    Created {formatDate(apiKey.created_at)}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="dark"
                  onClick={() => regenerateApiKeyMutation.mutate(apiKey.id)}
                  disabled={regenerateApiKeyMutation.isPending}
                  className="text-xs h-8 px-3"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Regenerate
                </Button>
                <Button
                  variant="dark"
                  onClick={() => handleDeleteApiKey(apiKey.id)}
                  disabled={deleteApiKeyMutation.isPending}
                  className="text-red-400 hover:bg-red-500/10 text-xs h-8 px-3"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApiKeyManagementClient;
