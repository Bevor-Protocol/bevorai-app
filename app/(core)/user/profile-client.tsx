"use client";

import { userActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
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
    queryFn: () => userActions.get(),
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (newUsername: string) => userActions.update({ username: newUsername }),
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
      <div className="border-b pb-6">
        <h2 className="text-lg font-semibold mb-4">Profile</h2>
        <div className="space-y-4">
          <div className="h-8 bg-muted animate-pulse rounded max-w-md" />
          <div className="h-10 bg-muted animate-pulse rounded max-w-md" />
        </div>
      </div>
    );
  }

  return (
    <div className="border-b pb-6">
      <h2 className="text-lg font-semibold mb-4">Profile</h2>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="username">Username</FieldLabel>
            <FieldDescription>Your unique username that others will see</FieldDescription>
            <FieldContent>
              {isEditing ? (
                <div className="flex items-center gap-3">
                  <Input
                    id="username"
                    name="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="max-w-md"
                    autoFocus
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={updateProfileMutation.isPending || !username.trim()}
                  >
                    <Save className="size-4" />
                    {updateProfileMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={updateProfileMutation.isPending}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{user?.username || "No username set"}</span>
                  <Button type="button" size="sm" variant="outline" onClick={handleEdit}>
                    <Edit2 className="size-4" />
                  </Button>
                </div>
              )}
            </FieldContent>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
};
