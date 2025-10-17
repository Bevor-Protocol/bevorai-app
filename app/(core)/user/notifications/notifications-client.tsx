"use client";

import { bevorAction } from "@/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { MemberInviteSchema } from "@/utils/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Calendar, Users } from "lucide-react";
import { useState } from "react";

interface NotificationsClientProps {
  invites: MemberInviteSchema[];
}

const InviteCard: React.FC<{ invite: MemberInviteSchema }> = ({ invite }) => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const acceptInviteMutation = useMutation({
    mutationFn: async () => bevorAction.acceptInvite(invite.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-invites"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setShowModal(false);
    },
  });

  const rejectInviteMutation = useMutation({
    mutationFn: async () => bevorAction.removeInvite(invite.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-invites"] });
      setShowModal(false);
    },
  });

  const isPending = acceptInviteMutation.isPending || rejectInviteMutation.isPending;
  const isSuccess = acceptInviteMutation.isSuccess || rejectInviteMutation.isSuccess;

  return (
    <>
      <div
        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
        onClick={() => setShowModal(true)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Team Invitation</h3>
              <p className="text-sm text-muted-foreground">
                You&apos;ve been invited to join a team
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {new Date(invite.created_at).toLocaleDateString()}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Icon size="sm" seed={invite.team.id} className="text-blue-400" />
          <div>
            <p className="font-medium">{invite.team.name}</p>
            <p className="text-sm text-muted-foreground">
              Join this team to collaborate on auditing processes
            </p>
          </div>
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <div className="inline-flex gap-2 items-center">
              <Bell className="size-5" />
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
                You were invited to join a team. You&apos;ll be able to collaborate on your auditing
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

          <div className="flex justify-between pt-4 border-t border-border">
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
        </DialogContent>
      </Dialog>
    </>
  );
};

const NotificationsClient: React.FC<NotificationsClientProps> = ({ invites }) => {
  return (
    <div className="space-y-4">
      {invites.map((invite) => (
        <InviteCard key={invite.id} invite={invite} />
      ))}
    </div>
  );
};

export default NotificationsClient;
