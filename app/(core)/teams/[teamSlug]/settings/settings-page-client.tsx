"use client";

import { bevorAction } from "@/actions";
import { Button } from "@/components/ui/button";
import { TeamSchemaI } from "@/utils/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Save, User } from "lucide-react";
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

  const { mutate, isError, isPending, isSuccess } = useMutation({
    mutationFn: async (name: string) => bevorAction.updateTeam({ name }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.push(`/teams/${data.slug}/settings?updated=true`);
    },
  });

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleSave = (e: React.FormEvent): void => {
    e.preventDefault();
    if (team.name === teamName) return;
    mutate(teamName);
  };

  useEffect(() => {
    if (!isError) return;
    setShowError(true);
    const timeout = setTimeout(() => {
      setShowError(false);
    }, 1500);
    return (): void => clearTimeout(timeout);
  }, [isError]);

  useEffect(() => {
    if (!isUpdated) return;
    const timeout = setTimeout(() => {
      setShowSuccess(false);
    }, 1500);
    return (): void => clearTimeout(timeout);
  }, [isUpdated]);

  const isOwner = team.role === "owner";

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <h3 className="text-xl font-semibold text-neutral-100">Team Information</h3>
        </div>
        <div className="flex flex-row gap-8 items-center">
          <p className="block text-sm font-medium text-neutral-300 w-16">Created</p>
          <div className="flex items-center space-x-2 text-sm text-neutral-400">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(team.created_at)}</span>
          </div>
        </div>
        <div className="flex flex-row gap-8 items-center">
          <p className="block text-sm font-medium text-neutral-300 w-16">Your Role</p>
          <div className="flex items-center space-x-2 text-sm text-neutral-400">
            <User className="w-4 h-4" />
            <span className="capitalize">{team.role}</span>
          </div>
        </div>
      </div>
      <form className="flex flex-col gap-4" onSubmit={handleSave}>
        <div className="flex flex-row flex-wrap items-end gap-x-4 gap-y-2">
          <div className="grow min-w-52 max-w-80">
            <label className="block font-medium text-neutral-300 mb-2">Team Name</label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              disabled={!isOwner}
              className="w-full h-10 px-3 border border-neutral-700 text-neutral-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter team name"
            />
          </div>
          {isOwner && (
            <Button
              variant="bright"
              type="submit"
              disabled={isPending || isSuccess}
              className="h-10 px-4"
            >
              <Save className="w-4 h-4 mr-2" />
              {isPending ? "Saving..." : "Save Changes"}
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
    </div>
  );
};

export default SettingsPageClient;
