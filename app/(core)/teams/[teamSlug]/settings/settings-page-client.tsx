"use client";

import { teamActions } from "@/actions/bevor";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { MemberRoleEnum, MemberSchemaI, TeamDetailedSchemaI } from "@/utils/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Check, Copy, LogOut, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

interface SettingsPageClientProps {
  team: TeamDetailedSchemaI;
  member: MemberSchemaI;
}

const SettingsPageClient: React.FC<SettingsPageClientProps> = ({ team, member }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [teamName, setTeamName] = useState(team.name);
  const [showError, setShowError] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  const isOwner = member.role === MemberRoleEnum.OWNER;
  const canLeave = !team.is_default || !isOwner;
  const canDelete = isOwner && !team.is_default;
  const { isCopied, copy } = useCopyToClipboard();

  const updateTeamMutation = useMutation({
    mutationFn: async (name: string) => teamActions.updateTeam(team.id, { name }),
    onSuccess: ({ toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      toast.success("Team updated successfully");
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async () => teamActions.deleteTeam(team.id),
    onSuccess: ({ toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      setShowDeleteDialog(false);
      router.push("/teams");
    },
    onError: () => {
      toast.error("Failed to delete team. Please try again.");
    },
  });

  const leaveTeamMutation = useMutation({
    mutationFn: async () => teamActions.removeMember(team.slug, member.id),
    onSuccess: ({ toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      setShowLeaveDialog(false);
      router.push("/teams");
    },
    onError: () => {
      toast.error("Failed to leave team. Please try again.");
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

  return (
    <>
      <div>
        <div className="border-b pb-6 mb-8">
          <h3>Team Settings</h3>
          <p className="text-sm text-muted-foreground">Manage your team settings and preferences</p>
        </div>

        <div className="space-y-8">
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold mb-4">General</h2>
            <form className="space-y-4" onSubmit={handleSave}>
              <div className="space-y-2">
                <Label>Team Name</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    disabled={!isOwner}
                    placeholder="Enter team name"
                    className="max-w-md"
                  />
                  {isOwner && (
                    <Button
                      type="submit"
                      size="sm"
                      disabled={updateTeamMutation.isPending || team.name === teamName}
                    >
                      <Save className="size-4" />
                      {updateTeamMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                  )}
                </div>
                {!isOwner && (
                  <p className="text-xs text-muted-foreground">
                    Only team owners can edit the team name
                  </p>
                )}
                {showError && (
                  <p className="text-xs text-destructive">
                    Failed to update team name. Please try again.
                  </p>
                )}
              </div>
            </form>
          </div>

          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold mb-4">Team Information</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Team ID</Label>
                <div className="flex items-center border rounded-md overflow-hidden">
                  <code className="px-3 py-1.5 font-mono text-xs!">{team.id}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copy(team.id)}
                    className="shrink-0 rounded-none border-l h-auto py-1.5"
                  >
                    {isCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Created</Label>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="size-4" />
                  <span>{formatDate(team.created_at)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Created By</Label>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon size="sm" seed={team.created_by_user_id} />
                  <span>{team.created_by_user.username}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Your Role</Label>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="capitalize">{member.role}</span>
                </div>
              </div>
              {team.is_default && (
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Type</Label>
                  <Badge variant="blue" size="sm">
                    Default Team
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {canLeave && (
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold mb-4">Leave Team</h2>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  You will lose access to all data associated with this team. Someone will have to
                  invite you again if you want to rejoin.
                </p>
                <Button variant="outline" onClick={() => setShowLeaveDialog(true)}>
                  <LogOut className="size-4" />
                  Leave Team
                </Button>
              </div>
            </div>
          )}

          {canDelete && (
            <div>
              <h2 className="text-lg font-semibold mb-4 text-destructive">Danger Zone</h2>
              <div className="space-y-4">
                <div className="border border-destructive/50 rounded-lg p-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold mb-1">Delete Team</h3>
                      <p className="text-sm text-muted-foreground">
                        This will permanently delete the team and all associated projects, audits,
                        and data. This action cannot be undone.
                      </p>
                    </div>
                    <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                      <Trash2 className="size-4" />
                      Delete Team
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave this team? You will lose access to all data associated
              with this team. Someone will have to invite you again if you want to rejoin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => leaveTeamMutation.mutate()}
              variant="destructive"
              disabled={leaveTeamMutation.isPending}
            >
              {leaveTeamMutation.isPending ? "Leaving..." : "Leave Team"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you absolutely sure? This will permanently delete the team and all associated
              projects, audits, and data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTeamMutation.mutate()}
              variant="destructive"
              disabled={deleteTeamMutation.isPending}
            >
              {deleteTeamMutation.isPending ? "Deleting..." : "Delete Team"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SettingsPageClient;
