"use client";

import { teamActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import { TeamSchemaI } from "@/utils/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Save, Trash2, User } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

interface SettingsPageClientProps {
  team: TeamSchemaI;
  isUpdated?: boolean;
}

const SettingsPageClient: React.FC<SettingsPageClientProps> = ({ team, isUpdated }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [teamName, setTeamName] = useState(team.name);
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(isUpdated);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  const updateTeamMutation = useMutation({
    mutationFn: async (name: string) => teamActions.updateTeam({ name }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.push(`/teams/${data.id}/settings?updated=true`);
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async () => teamActions.deleteTeam(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.push("/teams");
    },
    onError: () => {
      setDeleteError(true);
      setTimeout(() => setDeleteError(false), 3000);
    },
  });

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleSave = (e: React.FormEvent): void => {
    e.preventDefault();
    if (team.name === teamName) return;
    updateTeamMutation.mutate(teamName);
  };

  useEffect(() => {
    if (!updateTeamMutation.isError) return;
    setShowError(true);
    const timeout = setTimeout(() => {
      setShowError(false);
    }, 1500);
    return (): void => clearTimeout(timeout);
  }, [updateTeamMutation.isError]);

  useEffect(() => {
    if (!isUpdated) return;
    const timeout = setTimeout(() => {
      setShowSuccess(false);
    }, 1500);
    return (): void => clearTimeout(timeout);
  }, [isUpdated]);

  const isOwner = team.role === "owner";
  const canDelete = isOwner && !team.is_default;

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <h3 className="text-xl font-semibold text-foreground">Team Information</h3>
        </div>
        <div className="flex flex-row gap-8 items-center">
          <p className="block text-sm font-medium text-foreground w-16">Created</p>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Calendar className="size-4" />
            <span>{formatDate(team.created_at)}</span>
          </div>
        </div>
        <div className="flex flex-row gap-8 items-center">
          <p className="block text-sm font-medium text-foreground w-16">Your Role</p>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <User className="size-4" />
            <span className="capitalize">{team.role}</span>
          </div>
        </div>
        {team.is_default && (
          <div className="flex flex-row gap-8 items-center">
            <p className="block text-sm font-medium text-foreground w-16">Type</p>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-xs">
                Default Team
              </span>
            </div>
          </div>
        )}
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSave}>
        <div className="flex flex-row flex-wrap items-end gap-x-4 gap-y-2">
          <div className="grow min-w-52 max-w-80">
            <label className="block font-medium text-foreground mb-2">Team Name</label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              disabled={!isOwner}
              className="w-full h-10 px-3 border border-neutral-700 text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter team name"
            />
          </div>
          {isOwner && (
            <Button
              type="submit"
              disabled={updateTeamMutation.isPending || updateTeamMutation.isSuccess}
              className="h-10 px-4"
            >
              <Save className="size-4 mr-2" />
              {updateTeamMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </div>
        <div className="min-h-5">
          {!isOwner && (
            <p className="text-xs text-neutral-500">Only team owners can edit the team name</p>
          )}
          {showError && (
            <p className="text-xs text-red-400">Failed to update team name. Please try again.</p>
          )}
          {showSuccess && <p className="text-xs text-green-400">Team name updated successfully!</p>}
        </div>
      </form>

      {canDelete && (
        <div className="border-t border-border pt-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-medium text-foreground">Delete Team</h3>
            </div>
            <div className="bg-neutral-800/30 border border-neutral-700 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Trash2 className="size-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-foreground mb-4">
                    This will permanently delete the team and all associated projects, audits, and
                    data.
                  </p>
                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center cursor-pointer gap-2 px-4 py-2 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="size-4" />
                      Delete Team
                    </button>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-foreground font-medium">Are you sure?</span>
                      <button
                        onClick={() => deleteTeamMutation.mutate()}
                        disabled={deleteTeamMutation.isPending}
                        className="text-red-400 hover:text-red-300 cursor-pointer flex gap-2 items-center"
                      >
                        <Trash2 className="size-4" />
                        {deleteTeamMutation.isPending ? "Deleting..." : "Yes, Delete Team"}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="text-muted-foreground hover:text-foreground cursor-pointer flex gap-2 items-center"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {deleteError && (
              <p className="text-xs text-red-400 mt-2">Failed to delete team. Please try again.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPageClient;
