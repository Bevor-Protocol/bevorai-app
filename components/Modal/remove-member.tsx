"use client";

import { bevorAction } from "@/actions";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LogOut, X } from "lucide-react";
import { useEffect } from "react";

interface RemoveMemberModalProps {
  onClose: () => void;
  teamName: string;
  memberId: string;
}

const RemoveMemberModal: React.FC<RemoveMemberModalProps> = ({ onClose, teamName, memberId }) => {
  const queryClient = useQueryClient();

  const { mutate, error, isSuccess, isPending } = useMutation({
    mutationFn: async () => bevorAction.removeMember(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });

  useEffect(() => {
    if (!isSuccess) return;
    const timeout = setTimeout(() => {
      onClose();
    }, 1000);

    return (): void => clearTimeout(timeout);
  }, [isSuccess, onClose]);

  return (
    <div className="justify-center flex flex-col gap-2">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800 w-full">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <LogOut className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-100">Leave Team</h2>
            <p className="text-sm text-neutral-400">Leave this team permanently</p>
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
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
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
          <ul className="text-sm text-neutral-400 space-y-1 ml-4">
            <li>• You will lose access to all team projects and resources</li>
            <li>• Your team membership will be permanently removed</li>
            <li>• You will need to be re-invited to rejoin the team</li>
          </ul>
        </div>

        {error && <p className="text-sm text-red-400">{error.message}</p>}
        {isSuccess && <p className="text-sm text-green-400">Successfully left the team</p>}
      </div>

      <div className="flex justify-between pt-4 border-t border-neutral-800">
        <Button type="button" variant="dark" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="bright"
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
