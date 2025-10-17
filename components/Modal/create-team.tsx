"use client";

import { bevorAction } from "@/actions";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { navigation } from "@/utils/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const CreateTeamModal: React.FC = () => {
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
    }, 1000);

    return (): void => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, data]);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    mutate({ name: teamName });
  };

  return (
    <div>
      <DialogHeader>
        <div className="inline-flex gap-2 items-center">
          <Users className="size-5 text-blue-400" />
          <DialogTitle>Create New Team</DialogTitle>
        </div>
        <DialogDescription>Create a team to start collaborating with others</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="justify-center flex flex-col gap-2">
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
        <div className="flex justify-between pt-4 border-t border-border">
          <DialogClose disabled={isPending} asChild>
            <Button type="button" variant="outline" disabled={isPending}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isPending || !teamName.trim() || isSuccess}>
            {isPending ? "Creating..." : "Create Team"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateTeamModal;
