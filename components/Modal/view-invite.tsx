"use client";

import { bevorAction } from "@/actions";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { navigation } from "@/utils/navigation";
import { MemberInviteSchema } from "@/utils/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ViewInviteModalProps {
  onClose: () => void;
  invite: MemberInviteSchema;
}

const ViewInviteModal: React.FC<ViewInviteModalProps> = ({ onClose, invite }) => {
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
      onClose();
    }, 1000);

    return (): void => clearTimeout(timeout);
  }, [acceptInviteMutation.isSuccess, onClose]);

  useEffect(() => {
    if (!rejectInviteMutation.isSuccess) return;
    const timeout = setTimeout(() => {
      router.push(navigation.team.overview({ teamSlug: invite.team.slug }));
      onClose();
    }, 1000);

    return (): void => clearTimeout(timeout);
  }, [rejectInviteMutation.isSuccess, onClose]);

  const isPending = acceptInviteMutation.isPending || rejectInviteMutation.isPending;
  const isSuccess = acceptInviteMutation.isSuccess || rejectInviteMutation.isSuccess;

  return (
    <div className="justify-center flex flex-col gap-2">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800 w-full">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-100">Team Invite</h2>
            <p className="text-sm text-neutral-400">Want to join this team?</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="p-2 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

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
          variant="dark"
          onClick={() => rejectInviteMutation.mutate()}
          disabled={isPending || isSuccess}
        >
          Reject
        </Button>
        <Button
          type="button"
          variant="bright"
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
