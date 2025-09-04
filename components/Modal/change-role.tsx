"use client";

import { bevorAction } from "@/actions";
import { Button } from "@/components/ui/button";
import { MemberRoleEnum } from "@/utils/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Crown, Shield, User, X } from "lucide-react";
import React, { useEffect } from "react";

interface ChangeRoleModalProps {
  onClose: () => void;
  fromRole: MemberRoleEnum;
  toRole: MemberRoleEnum;
  memberId: string;
  memberIdentifier: string;
}

const ChangeRoleModal: React.FC<ChangeRoleModalProps> = ({
  onClose,
  fromRole,
  toRole,
  memberId,
  memberIdentifier,
}) => {
  const queryClient = useQueryClient();

  const { mutate, error, isSuccess, isPending } = useMutation({
    mutationFn: async () => bevorAction.updateMember(memberId, { role: toRole }),
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

  const getRoleIcon = (role: string): React.ReactElement => {
    switch (role) {
      case "owner":
        return <Crown className="w-4 h-4 text-yellow-400" />;
      default:
        return <User className="w-4 h-4 text-neutral-400" />;
    }
  };

  const getRoleColor = (role: string): string => {
    switch (role) {
      case "owner":
        return "text-yellow-400 bg-yellow-500/10";
      case "admin":
        return "text-blue-400 bg-blue-500/10";
      default:
        return "text-neutral-400 bg-neutral-500/10";
    }
  };

  const handleConfirm = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    mutate();
  };

  return (
    <form onSubmit={handleConfirm} className="justify-center flex flex-col gap-2">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800 w-full">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-100">Change Member Role</h2>
            <p className="text-sm text-neutral-400">Update the role for this team member</p>
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
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center">
              <User className="w-4 h-4 text-neutral-400" />
            </div>
            <span className="text-neutral-100 font-medium">{memberIdentifier}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-neutral-400">Current:</span>
              <span
                className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getRoleColor(fromRole)}`}
              >
                {getRoleIcon(fromRole)}
                <span className="ml-1 capitalize">{fromRole}</span>
              </span>
            </div>

            <div className="text-neutral-500">→</div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-neutral-400">New:</span>
              <span
                className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getRoleColor(toRole)}`}
              >
                {getRoleIcon(toRole)}
                <span className="ml-1 capitalize">{toRole}</span>
              </span>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error.message}</p>}
        {isSuccess && <p className="text-sm text-green-400">Role successfully updated</p>}
      </div>

      <div className="flex justify-between pt-4 border-t border-neutral-800">
        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || isSuccess}>
          {isPending ? "Updating..." : "Update Role"}
        </Button>
      </div>
    </form>
  );
};

export default ChangeRoleModal;
