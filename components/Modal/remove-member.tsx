"use client";

import { bevorAction } from "@/actions";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";

interface RemoveMemberModalProps {
  teamName: string;
  memberId: string;
}

const RemoveMemberModal: React.FC<RemoveMemberModalProps> = ({ teamName, memberId }) => {
  const queryClient = useQueryClient();

  const { mutate, error, isSuccess, isPending } = useMutation({
    mutationFn: async () => bevorAction.removeMember(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });

  return (
    <div>
      <DialogHeader>
        <div className="inline-flex gap-2 items-center">
          <LogOut className="size-5 text-orange-400" />
          <DialogTitle>Leave Team</DialogTitle>
        </div>
        <DialogDescription>Leave this team permanently</DialogDescription>
      </DialogHeader>
      <div className="py-4 space-y-4">
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="size-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-orange-400 text-xs font-bold">!</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-orange-200 mb-1">Warning</h3>
              <p className="text-sm text-orange-300">
                You are about to leave the team <strong>&quot;{teamName}&quot;</strong>. This action
                cannot be undone.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-md font-medium text-neutral-200">
            What happens when you leave:
          </label>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
            <li>• You will lose access to all team projects and resources</li>
            <li>• Your team membership will be permanently removed</li>
            <li>• You will need to be re-invited to rejoin the team</li>
          </ul>
        </div>

        {error && <p className="text-sm text-red-400">{error.message}</p>}
        {isSuccess && <p className="text-sm text-green-400">Successfully left the team</p>}
      </div>

      <div className="flex justify-between pt-4 border-t border-border">
        <DialogClose asChild disabled={isPending}>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </DialogClose>
        <Button
          type="button"
          className="bg-orange-600 hover:bg-orange-700"
          disabled={isPending || isSuccess}
          onClick={() => mutate()}
        >
          {isPending ? "Leaving..." : "Leave Team"}
        </Button>
      </div>
    </div>
  );
};

export default RemoveMemberModal;
