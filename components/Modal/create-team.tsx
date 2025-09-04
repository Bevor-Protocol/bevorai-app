"use client";

import { bevorAction } from "@/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { navigation } from "@/utils/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface CreateTeamModalProps {
  onClose: () => void;
}

const CreateTeamModal: React.FC<CreateTeamModalProps> = ({ onClose }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [teamName, setTeamName] = useState("");

  const { mutate, error, isSuccess, data, isPending } = useMutation({
    mutationFn: async (data: { name: string }) => bevorAction.createTeam(data),
  });

  useEffect(() => {
    if (!isSuccess || !data) return;
    queryClient.invalidateQueries({ queryKey: ["teams"] });
    const timeout = setTimeout(() => {
      // Refresh the page to get updated team list and redirect to the new team
      router.push(navigation.team.overview({ teamSlug: data.slug }));
      onClose();
    }, 1000);

    return (): void => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, data]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    await mutate({ name: teamName });
  };

  return (
    <form onSubmit={handleSubmit} className="justify-center flex flex-col gap-2">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800 w-full">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-100">Create New Team</h2>
            <p className="text-sm text-neutral-400">
              Create a team to start collaborating with others
            </p>
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
      <div className="py-4">
        <div className="space-y-2">
          <label className="text-md font-medium text-neutral-200">
            Team Name <span className="text-red-400">*</span>
          </label>
          <Input
            type="text"
            className="bg-gray-900 rounded px-3 py-2 text-sm flex-1 w-full"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            disabled={isPending}
            required
          />
          {error && <p>{error.message}</p>}
          {isSuccess && <p className="text-sm text-green-400">team successfully created</p>}
        </div>
      </div>
      <div className="flex justify-between pt-4 border-t border-neutral-800">
        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || !teamName.trim() || isSuccess}>
          {isPending ? "Creating..." : "Create Team"}
        </Button>
      </div>
    </form>
  );
};

export default CreateTeamModal;
