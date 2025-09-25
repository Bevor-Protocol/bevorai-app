"use client";

import { bevorAction } from "@/actions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trimAddress } from "@/utils/helpers";
import { MemberInviteSchema, MemberSchema } from "@/utils/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail } from "lucide-react";

interface InvitesListProps {
  curMember: MemberSchema;
  invites: MemberInviteSchema[];
  isLoading: boolean;
}

const InvitesList: React.FC<InvitesListProps> = ({ curMember, invites, isLoading }) => {
  const queryClient = useQueryClient();
  const { mutate: removeInvite, isPending } = useMutation({
    mutationFn: async (inviteId: string) => bevorAction.removeInvite(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invites"] });
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });

  const getDisplayIdentifier = (identifier: string): string => {
    if (identifier.includes("@")) {
      return identifier;
    }
    return trimAddress(identifier);
  };

  const handleRemoveInvite = (inviteId: string): void => removeInvite(inviteId);

  if (isLoading) {
    return (
      <div className="border border-blue-500/50 rounded divide-blue-500/25 divide-y">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="p-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Skeleton className="size-8 rounded-full flex-shrink-0" />
              <div className="flex flex-row gap-4 items-center">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Don't render anything if no invites
  if (!invites || invites.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-neutral-400 text-center">
        <p className="text-sm">No pending invites</p>
      </div>
    );
  }

  return (
    <div className="border border-blue-500/50 rounded divide-blue-500/25 divide-y">
      {invites.map((invite) => (
        <div key={invite.id} className="p-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="size-8 rounded-full bg-neutral-800 flex items-center justify-center flex-shrink-0">
              <Mail className="size-4 text-neutral-400" />
            </div>
            <div className="flex flex-row gap-4 items-center">
              <div className="text-sm font-medium text-neutral-100">
                {getDisplayIdentifier(invite.identifier)}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button disabled variant="outline" size="sm">
              {invite.role}
            </Button>
            {curMember.role === "owner" && (
              <Button
                onClick={() => handleRemoveInvite(invite.id)}
                disabled={isPending}
                variant="destructive"
                size="sm"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default InvitesList;
