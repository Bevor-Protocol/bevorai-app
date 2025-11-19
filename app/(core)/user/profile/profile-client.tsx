"use client";

import { dashboardActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { generateQueryKey } from "@/utils/constants";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, Save, X } from "lucide-react";
import { useState } from "react";

export const ProfileClient: React.FC = () => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState("");

  const { data: user, isLoading } = useQuery({
    queryKey: generateQueryKey.currentUser(),
    queryFn: async () => dashboardActions.getUser(),
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (newUsername: string) =>
      dashboardActions.updateUser({ username: newUsername }),
    onSuccess: ({ toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      setIsEditing(false);
    },
  });

  const handleEdit = (): void => {
    setUsername(user?.username || "");
    setIsEditing(true);
  };

  const handleSave = (): void => {
    if (username.trim() && username !== user?.username) {
      updateProfileMutation.mutate(username.trim());
    } else {
      setIsEditing(false);
    }
  };

  const handleCancel = (): void => {
    setUsername("");
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="h-10 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Profile</h2>
        <p className="text-sm text-muted-foreground">Manage your account information</p>
      </div>

      <Field>
        <FieldLabel>Username</FieldLabel>
        <FieldDescription>Your unique username that others will see</FieldDescription>
        <FieldContent>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="flex-1"
                autoFocus
              />
              <Button
                size="sm"
                onClick={handleSave}
                disabled={updateProfileMutation.isPending || !username.trim()}
              >
                <Save className="size-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                disabled={updateProfileMutation.isPending}
              >
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{user?.username || "No username set"}</span>
              <Button size="sm" variant="outline" onClick={handleEdit}>
                <Edit2 className="size-4" />
              </Button>
            </div>
          )}
        </FieldContent>
      </Field>
    </div>
  );
};
