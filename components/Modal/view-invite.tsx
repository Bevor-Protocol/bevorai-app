"use client";

import { bevorAction } from "@/actions";
import { Button } from "@/components/ui/button";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { navigation } from "@/utils/navigation";
import { MemberInviteSchema } from "@/utils/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const ViewInviteModal: React.FC<{ invite: MemberInviteSchema }> = ({ invite }) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const acceptInviteMutation = useMutation({
    mutationFn: async () => bevorAction.acceptInvite(invite.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-invites"] });
      // also refresh the breadcrumbs nav.
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const rejectInviteMutation = useMutation({
    mutationFn: async () => bevorAction.removeInvite(invite.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-invites"] });
    },
  });

  useEffect(() => {
    if (!acceptInviteMutation.isSuccess) return;
    const timeout = setTimeout(() => {
      router.push(navigation.team.overview({ teamSlug: invite.team.slug }));
    }, 1000);

    return (): void => clearTimeout(timeout);
  }, [acceptInviteMutation.isSuccess]);

  useEffect(() => {
    if (!rejectInviteMutation.isSuccess) return;
    const timeout = setTimeout(() => {
      router.push(navigation.team.overview({ teamSlug: invite.team.slug }));
    }, 1000);

    return (): void => clearTimeout(timeout);
  }, [rejectInviteMutation.isSuccess]);

  const isPending = acceptInviteMutation.isPending || rejectInviteMutation.isPending;
  const isSuccess = acceptInviteMutation.isSuccess || rejectInviteMutation.isSuccess;

  return (
    <div>
      <DialogHeader>
        <div className="inline-flex gap-2 items-center">
          <Bell className="w-5 h-5" />
          <DialogTitle>Team Invite</DialogTitle>
        </div>
        <DialogDescription>Want to join this team?</DialogDescription>
      </DialogHeader>
      <div className="py-4 space-y-4">
        <div className="space-y-2">
          <div className="flex flex-row gap-2 items-center">
            <Icon size="sm" seed={invite.team.id} className="text-blue-400 mt-1" />
            <p>{invite.team.name}</p>
          </div>
          <p>
            You were invited you to join a team. You&apos;ll be able to collaborate on your auditing
            processes together.
          </p>
        </div>

        {acceptInviteMutation.error && (
          <p className="text-sm text-red-400">{acceptInviteMutation.error.message}</p>
        )}
        {acceptInviteMutation.isSuccess && (
          <p className="text-sm text-green-400">Successfully joined the team</p>
        )}
        {rejectInviteMutation.error && (
          <p className="text-sm text-red-400">{rejectInviteMutation.error.message}</p>
        )}
        {rejectInviteMutation.isSuccess && (
          <p className="text-sm text-green-400">Rejected the invite</p>
        )}
      </div>

      <div className="flex justify-between pt-4 border-t border-neutral-800">
        <Button
          type="button"
          variant="outline"
          onClick={() => rejectInviteMutation.mutate()}
          disabled={isPending || isSuccess}
        >
          Reject
        </Button>
        <Button
          type="button"
          className="bg-blue-600 hover:bg-blue-700"
          disabled={isPending || isSuccess}
          onClick={() => acceptInviteMutation.mutate()}
        >
          {isPending ? "Joining..." : "Accept"}
        </Button>
      </div>
    </div>
  );
};

export default ViewInviteModal;
