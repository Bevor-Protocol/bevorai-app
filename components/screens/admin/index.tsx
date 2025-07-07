"use client";

import { bevorAction } from "@/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  AppSearchResponseI,
  DropdownOption,
  PromptResponseI,
  UserSearchResponseI,
} from "@/utils/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon, XIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const AdminPanel = (): JSX.Element => {
  const queryClient = useQueryClient();
  const [userSearch, setUserSearch] = useState("");
  const [appSearch, setAppSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserSearchResponseI | null>(null);
  const [selectedApp, setSelectedApp] = useState<AppSearchResponseI | null>(null);

  const [selectedPrompt, setSelectedPrompt] = useState<PromptResponseI | null>(null);
  const [isAddingPrompt, setIsAddingPrompt] = useState(false);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);

  const [selectedPromptType, setSelectedPromptType] = useState<DropdownOption | null>(null);
  const [showPromptInactive, setShowPromptInactive] = useState(false);

  const { data: users } = useQuery({
    queryKey: ["users", userSearch],
    queryFn: async () => await bevorAction.searchUsers(userSearch),
  });

  const { data: apps } = useQuery({
    queryKey: ["apps", appSearch],
    queryFn: async () => await bevorAction.searchApps(appSearch),
  });

  const { data: prompts } = useQuery({
    queryKey: ["prompts"],
    queryFn: async () => await bevorAction.getPrompts(),
  });

  const { mutate: updateUserPermissions, isPending: userPending } = useMutation({
    onSuccess: async () => await queryClient.invalidateQueries({ queryKey: ["users", userSearch] }),
    mutationFn: ({
      toUpdateId,
      canCreateApp,
      canCreateApiKey,
    }: {
      toUpdateId: string;
      canCreateApp: boolean;
      canCreateApiKey: boolean;
    }) =>
      bevorAction.updateUserPermissions({
        toUpdateId,
        canCreateApp,
        canCreateApiKey,
      }),
  });

  const { mutate: updateAppPermissions, isPending: appPending } = useMutation({
    onSuccess: async () => await queryClient.invalidateQueries({ queryKey: ["apps", appSearch] }),
    mutationFn: ({
      toUpdateId,
      canCreateApp,
      canCreateApiKey,
    }: {
      toUpdateId: string;
      canCreateApp: boolean;
      canCreateApiKey: boolean;
    }) =>
      bevorAction.updateAppPermissions({
        toUpdateId,
        canCreateApp,
        canCreateApiKey,
      }),
  });

  const { mutate: updatePrompt, isPending: promptUpdatePending } = useMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["prompts"] });
      setIsEditingPrompt(false);
    },
    mutationFn: (data: {
      promptId: string;
      tag?: string;
      content?: string;
      version?: string;
      is_active?: boolean;
    }) => bevorAction.updatePrompt(data),
  });

  const { mutate: createPrompt, isPending: promptCreatePending } = useMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["prompts"] });
      setIsAddingPrompt(false);
    },
    mutationFn: (data: {
      audit_type: string;
      tag: string;
      content: string;
      version: string;
      is_active?: boolean;
    }) => bevorAction.addPrompt(data),
  });

  const promptTypes = useMemo(() => {
    if (!prompts) return [];
    return Array.from(new Set(prompts.map((prompt) => prompt.audit_type))).map((option) => {
      return {
        value: option,
        name: option,
      };
    });
  }, [prompts]);

  const promptsDisplay = useMemo(() => {
    if (!prompts || !selectedPromptType) return [];
    return prompts
      .filter((prompt) => {
        if (prompt.audit_type === selectedPromptType.value) {
          return prompt.is_active || showPromptInactive;
        }
        return false;
      })
      .sort((a, b) => {
        // Sort by tag first, then by version
        if (a.tag !== b.tag) return a.tag.localeCompare(b.tag);
        return a.version.localeCompare(b.version);
      });
  }, [prompts, selectedPromptType, showPromptInactive]);

  useEffect(() => {
    // on invalidation after an edit or add, we need to re-updated the selectedPrompt
    if (!selectedPrompt) return;
    const prompt = prompts?.find((prompt) => prompt.id === selectedPrompt.id);
    if (prompt) {
      setSelectedPrompt(prompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompts]);

  const handleSelect = ({
    app,
    user,
    prompt,
  }: {
    user?: UserSearchResponseI;
    app?: AppSearchResponseI;
    prompt?: any;
  }): void => {
    if (app) {
      setSelectedUser(null);
      setSelectedApp(app);
      setSelectedPrompt(null);
      setIsAddingPrompt(false);
    }
    if (user) {
      setSelectedUser(user);
      setSelectedApp(null);
      setSelectedPrompt(null);
      setIsAddingPrompt(false);
    }
    if (prompt) {
      setSelectedUser(null);
      setSelectedApp(null);
      setSelectedPrompt(prompt);
      setIsAddingPrompt(false);
    }
  };

  const handleClose = (): void => {
    setSelectedApp(null);
    setSelectedUser(null);
    setIsAddingPrompt(false);
    setIsEditingPrompt(false);
  };

  return (
    <div className="grid gap-6 w-full h-full relative">
      <Tabs
        defaultValue="users"
        className="w-full flex flex-col overflow-hidden max-h-full"
        onValueChange={handleClose}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="apps">App Management</TabsTrigger>
          <TabsTrigger value="prompts">Prompt Management</TabsTrigger>
        </TabsList>

        <TabsContent
          value="users"
          className="bg-black/90 p-6 rounded-lg flex-grow overflow-hidden flex flex-col"
        >
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Search by address or ID"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="flex-1"
            />
          </div>

          {users && users.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-2">ID</th>
                    <th className="text-left p-2">Address</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className={cn(
                        "border-b border-gray-700 hover:bg-gray-800/50",
                        "transition-colors cursor-pointer",
                      )}
                      onClick={() => handleSelect({ user })}
                    >
                      <td className="p-2">{user.id}</td>
                      <td className="p-2">{user.address}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent
          value="apps"
          className="bg-black/90 p-6 rounded-lg flex-grow overflow-hidden flex flex-col"
        >
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Search by app name or ID"
              value={appSearch}
              onChange={(e) => setAppSearch(e.target.value)}
              className="flex-1"
            />
          </div>

          {apps && apps.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-2">ID</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Owner ID</th>
                    <th className="text-left p-2">Type</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {apps.map((app) => (
                    <tr
                      key={app.id}
                      className={cn(
                        "border-b border-gray-700 hover:bg-gray-800/50",
                        "transition-colors cursor-pointer",
                      )}
                      onClick={() => handleSelect({ app })}
                    >
                      <td className="p-2">{app.id}</td>
                      <td className="p-2">{app.name}</td>
                      <td className="p-2">{app.owner_id}</td>
                      <td className="p-2">{app.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent
          value="prompts"
          className="bg-black/90 p-6 rounded-lg flex-grow overflow-hidden flex flex-col"
        >
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <Select
                className="w-40"
                options={promptTypes}
                placeholder="type"
                current={selectedPromptType}
                handleCurrent={(option) => setSelectedPromptType(option)}
              />
              <div className="flex items-center ml-4">
                <input
                  type="checkbox"
                  id="showInactive"
                  className="mr-2 cursor-pointer"
                  checked={showPromptInactive}
                  onChange={(e) => setShowPromptInactive(e.target.checked)}
                />
                <label htmlFor="showInactive" className="text-sm text-gray-400 whitespace-nowrap">
                  Show Inactive Prompts
                </label>
              </div>
            </div>
            <Button variant="transparent" onClick={() => setIsAddingPrompt(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Prompt
            </Button>
          </div>

          <div className="flex h-full">
            {selectedPromptType && (
              <div className="pr-4 overflow-y-auto border-r border-gray-700 min-w-fit">
                <h3 className="text-sm font-medium mb-2">Prompts for {selectedPromptType.name}</h3>
                <div className="space-y-1">
                  {promptsDisplay.map((prompt) => (
                    <div
                      key={prompt.id}
                      className={cn(
                        "p-2 rounded cursor-pointer text-sm",
                        selectedPrompt?.id === prompt.id ? "bg-gray-700" : "hover:bg-gray-800",
                        !prompt.is_active && "opacity-60",
                      )}
                      onClick={() => setSelectedPrompt(prompt)}
                    >
                      <div className="flex justify-between items-center gap-4">
                        <span>{prompt.tag}</span>
                        <div className="flex items-center">
                          <span className="text-xs text-gray-400 mr-2">v{prompt.version}</span>
                          <span
                            className={cn(
                              "w-2 h-2 rounded-full",
                              prompt.is_active ? "bg-green-500" : "bg-red-500",
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div
              className={cn("overflow-y-auto", selectedPromptType ? "flex-grow pl-4" : "w-full")}
            >
              {selectedPrompt && (
                <div className="bg-gray-800/30 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-400">
                        Version: {selectedPrompt.version}
                      </span>
                      <span
                        className={cn(
                          "px-2 py-1 rounded text-xs",
                          selectedPrompt.is_active
                            ? "bg-green-900/50 text-green-400"
                            : "bg-red-900/50 text-red-400",
                        )}
                      >
                        {selectedPrompt.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="transparent" onClick={() => setIsEditingPrompt(true)}>
                        Edit
                      </Button>
                      <Button
                        variant="transparent"
                        onClick={() =>
                          updatePrompt({
                            promptId: selectedPrompt.id,
                            is_active: !selectedPrompt.is_active,
                          })
                        }
                      >
                        {selectedPrompt.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-400 mb-1">
                      ID
                      <span className="text-sm font-mono bg-black/50 p-2 rounded text-white">
                        {selectedPrompt.id}
                      </span>
                    </p>
                    <p className="text-sm text-gray-400 mb-1">
                      tag
                      <span className="text-sm font-mono bg-black/50 p-2 rounded text-white">
                        {selectedPrompt.tag}
                      </span>
                    </p>
                  </div>

                  <div className="mb-4">
                    <div
                      className={cn(
                        "text-sm font-mono bg-black/50 p-2",
                        "overflow-y-auto whitespace-pre-wrap",
                      )}
                    >
                      {selectedPrompt.content}
                    </div>
                  </div>
                </div>
              )}

              {!selectedPrompt && (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  {selectedPromptType
                    ? "Select a prompt from the sidebar to view details"
                    : "Select an audit type to view available prompts"}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
      <div
        className={cn(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden",
          (!!selectedApp || !!selectedUser || !!selectedPrompt || isAddingPrompt) && "block",
        )}
      >
        {selectedApp && (
          <AppPermission
            key={selectedApp.id} // forces data to refresh
            app={selectedApp}
            handleClose={handleClose}
            handleUpdate={(data) => {
              handleClose();
              updateAppPermissions(data);
            }}
            isLoading={appPending}
          />
        )}
        {selectedUser && (
          <UserPermission
            key={selectedUser.id} // forces data to refresh
            user={selectedUser}
            handleClose={handleClose}
            handleUpdate={(data) => {
              handleClose();
              updateUserPermissions(data);
            }}
            isLoading={userPending}
          />
        )}
        {isAddingPrompt && (
          <PromptEditor
            handleClose={handleClose}
            handleCreate={createPrompt}
            isLoading={promptCreatePending}
          />
        )}
        {isEditingPrompt && !!selectedPrompt && (
          <PromptEditor
            prompt={selectedPrompt}
            handleClose={handleClose}
            handleUpdate={updatePrompt}
            isLoading={promptUpdatePending}
          />
        )}
      </div>
    </div>
  );
};

const UserPermission = ({
  user,
  handleClose,
  handleUpdate,
  isLoading,
}: {
  user: UserSearchResponseI;
  isLoading: boolean;
  handleClose: () => void;
  handleUpdate: ({
    toUpdateId,
    canCreateApp,
    canCreateApiKey,
  }: {
    toUpdateId: string;
    canCreateApp: boolean;
    canCreateApiKey: boolean;
  }) => void;
}): JSX.Element => {
  const [permission, setPermission] = useState(user.permissions);

  const handleSave = (): void => {
    if (permission === null || permission === undefined) return;
    handleUpdate({
      toUpdateId: user.id,
      canCreateApiKey: permission.can_create_api_key,
      canCreateApp: permission.can_create_app,
    });
  };

  return (
    <div className="bg-black/90 p-6 rounded-lg shadow-lg w-96 border border-gray-600">
      <button
        className="absolute top-2 right-2 text-gray-400 hover:text-white cursor-pointer"
        onClick={handleClose}
      >
        <XIcon className="h-5 w-5" />
      </button>

      <h2 className="text-xl font-bold mb-4">User Details</h2>

      <div className="space-y-4">
        <div className="text-sm">
          <p className="text-gray-400">ID</p>
          <p className="font-medium">{user.id}</p>
        </div>
        <div className="text-sm">
          <p className="text-gray-400">Address</p>
          <p className="font-medium truncate">{user.address}</p>
        </div>
        <div className="pt-4 border-t border-gray-700">
          {!user.permissions ? (
            <h3 className="font-semibold mb-3">No Auth</h3>
          ) : (
            <>
              <h3 className="font-semibold mb-3">Permissions</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="canCreateApp" className="text-sm">
                    Can Create App
                  </label>
                  <Switch
                    id="canCreateApp"
                    checked={permission?.can_create_app}
                    onCheckedChange={(checked: boolean) =>
                      setPermission((prev) =>
                        prev
                          ? { ...prev, can_create_app: checked }
                          : { can_create_app: checked, can_create_api_key: false },
                      )
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label htmlFor="canCreateApiKey" className="text-sm">
                    Can Create API Key
                  </label>
                  <Switch
                    id="canCreateApiKey"
                    checked={permission?.can_create_api_key}
                    onCheckedChange={(checked: boolean) =>
                      setPermission((prev) =>
                        prev
                          ? { ...prev, can_create_api_key: checked }
                          : { can_create_app: false, can_create_api_key: checked },
                      )
                    }
                  />
                </div>
              </div>
            </>
          )}
        </div>
        {!!user.permissions && (
          <Button
            variant="bright"
            className="w-full mt-4"
            onClick={handleSave}
            disabled={isLoading}
          >
            Save Permissions
          </Button>
        )}
      </div>
    </div>
  );
};

const AppPermission = ({
  app,
  handleClose,
  handleUpdate,
  isLoading,
}: {
  app: AppSearchResponseI;
  isLoading: boolean;
  handleClose: () => void;
  handleUpdate: ({
    toUpdateId,
    canCreateApp,
    canCreateApiKey,
  }: {
    toUpdateId: string;
    canCreateApp: boolean;
    canCreateApiKey: boolean;
  }) => void;
}): JSX.Element => {
  const [permission, setPermission] = useState(app.permissions);

  const handleSave = (): void => {
    if (permission === null || permission === undefined) return;
    handleUpdate({
      toUpdateId: app.id,
      canCreateApiKey: permission.can_create_api_key,
      canCreateApp: permission.can_create_app,
    });
  };

  return (
    <div className="bg-black/90 p-6 rounded-lg shadow-lg w-96 border border-gray-600">
      <button
        className="absolute top-2 right-2 text-gray-400 hover:text-white cursor-pointer"
        onClick={handleClose}
      >
        <XIcon className="h-5 w-5" />
      </button>

      <h2 className="text-xl font-bold mb-4">App Details</h2>

      <div className="space-y-4">
        <div className="text-sm">
          <p className="text-gray-400">ID</p>
          <p className="font-medium">{app.id}</p>
        </div>
        <div className="text-sm">
          <p className="text-gray-400">Name</p>
          <p className="font-medium truncate">{app.name}</p>
        </div>
        <div className="text-sm">
          <p className="text-gray-400">App Type</p>
          <p className="font-medium truncate">{app.type}</p>
        </div>
        <div className="text-sm">
          <p className="text-gray-400">Owner ID</p>
          <p className="font-medium truncate">{app.owner_id}</p>
        </div>
        <div className="pt-4 border-t border-gray-700">
          {!app.permissions ? (
            <h3 className="font-semibold mb-3">No Auth</h3>
          ) : (
            <>
              <h3 className="font-semibold mb-3">Permissions</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="canCreateApiKey" className="text-sm">
                    Can Create API Key
                  </label>
                  <Switch
                    id="canCreateApiKey"
                    checked={permission?.can_create_api_key}
                    onCheckedChange={(checked: boolean) =>
                      setPermission((prev) =>
                        prev
                          ? { ...prev, can_create_api_key: checked }
                          : { can_create_app: false, can_create_api_key: checked },
                      )
                    }
                  />
                </div>
              </div>
            </>
          )}
        </div>
        {!!app.permissions && (
          <Button
            variant="bright"
            className="w-full mt-4"
            onClick={handleSave}
            disabled={isLoading}
          >
            Save Permissions
          </Button>
        )}
      </div>
    </div>
  );
};

const PromptEditor = ({
  prompt,
  handleClose,
  handleUpdate,
  handleCreate,
  isLoading,
}: {
  prompt?: PromptResponseI;
  isLoading: boolean;
  handleClose: () => void;
  handleUpdate?: ({
    promptId,
    content,
    tag,
    version,
    is_active,
  }: {
    promptId: string;
    tag?: string;
    content?: string;
    version?: string;
    is_active?: boolean;
  }) => void;
  handleCreate?: ({
    audit_type,
    is_active,
    content,
    tag,
    version,
  }: {
    audit_type: string;
    tag: string;
    content: string;
    version: string;
    is_active?: boolean;
  }) => void;
}): JSX.Element => {
  const [auditType, setAuditType] = useState(prompt?.audit_type || "");
  const [content, setContent] = useState(prompt?.content || "");
  const [tag, setTag] = useState(prompt?.tag || "");
  const [version, setVersion] = useState(prompt?.version || "");

  const isNewPrompt = useMemo(() => !prompt, [prompt]);

  const handleSave = (): void => {
    if (!content || !tag || !version) return;

    if (isNewPrompt && handleCreate) {
      if (!content || !auditType || !tag || !version) return;
      handleCreate({
        audit_type: auditType,
        content,
        tag,
        version,
      });
    } else if (prompt && handleUpdate) {
      handleUpdate({
        promptId: prompt.id,
        content,
        tag,
        version,
      });
    }
  };

  return (
    <div
      className={cn(
        "bg-black p-6 rounded-lg shadow-lg max-w-[90%] w-[800px] transform border border-gray-600",
      )}
    >
      <button
        className="absolute top-2 right-2 text-gray-400 hover:text-white cursor-pointer"
        onClick={handleClose}
      >
        <XIcon className="h-5 w-5" />
      </button>

      <h2 className="text-xl font-bold mb-4">{isNewPrompt ? "Add Prompt" : "Edit Prompt"}</h2>

      <div className="space-y-4">
        {!isNewPrompt && !!prompt && (
          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-1">
              ID
              <span className="text-sm font-mono bg-black/50 p-2 rounded text-white">
                {prompt.id}
              </span>
            </p>
            <p className="text-sm text-gray-400 mb-1">
              Type
              <span className="text-sm font-mono bg-black/50 p-2 rounded text-white">
                {prompt.audit_type}
              </span>
            </p>
            <p className="text-sm text-gray-400 mb-1">
              tag
              <span className="text-sm font-mono bg-black/50 p-2 rounded text-white">
                {prompt.tag}
              </span>
            </p>
            <p className="text-sm text-gray-400 mb-1">
              status
              <span
                className={cn(
                  "font-medium p-2",
                  prompt.is_active ? "text-green-400" : "text-red-400",
                )}
              >
                {prompt.is_active ? "Active" : "Inactive"}
              </span>
            </p>
          </div>
        )}
        <div className="text-sm">
          <p className="text-gray-400 mb-1">Audit Type</p>
          <input
            type="text"
            value={auditType}
            onChange={(e) => setAuditType(e.target.value)}
            className="w-full bg-gray-800/50 border border-gray-700 rounded p-2 text-white"
          />
        </div>
        <div className="text-sm">
          <p className="text-gray-400 mb-1">Tag</p>
          <input
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="w-full bg-gray-800/50 border border-gray-700 rounded p-2 text-white"
          />
        </div>
        <div className="text-sm">
          <p className="text-gray-400 mb-1">Version</p>
          <input
            type="text"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            className="w-full bg-gray-800/50 border border-gray-700 rounded p-2 text-white"
          />
        </div>
        <div className="text-sm">
          <p className="text-gray-400 mb-1">Content</p>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-gray-800/50 border border-gray-700 rounded p-2 text-white h-64 
            font-mono"
          />
        </div>
        <div className="flex space-x-3 pt-4">
          <Button variant="bright" className="flex-1" onClick={handleSave} disabled={isLoading}>
            {isNewPrompt ? "Create Prompt" : "Save Changes"}
          </Button>
          <Button variant="transparent" className="flex-1" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
