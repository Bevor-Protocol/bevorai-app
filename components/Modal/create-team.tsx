"use client";

import { teamActions } from "@/actions/bevor";
import LucideIcon from "@/components/lucide-icon";
import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { teamFormSchema, TeamFormValues } from "@/utils/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const CreateTeamModal: React.FC = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [teamName, setTeamName] = useState("");
  const [formError, setFormError] = useState("");

  const { mutate, error, isSuccess, isPending } = useMutation({
    mutationFn: async (data: TeamFormValues) => teamActions.createTeam(data),
    onSuccess: ({ id, toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });

      toast.success("Team created", {
        action: {
          label: "View",
          onClick: () => router.push(`/team/${id}`),
        },
        icon: <LucideIcon assetType="team" />,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    const parsed = teamFormSchema.safeParse({ name: teamName });
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        setFormError(issue.message);
      });
      return;
    }
    mutate(parsed.data);
  };

  return (
    <>
      <DialogHeader>
        <div className="inline-flex gap-2 items-center">
          <DialogTitle>Create New Team</DialogTitle>
        </div>
        <DialogDescription>Create a team to start collaborating with others</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="team-name" aria-required>
              Team Name
            </FieldLabel>
            <Input
              id="team-name"
              name="team-name"
              type="text"
              className="bg-gray-900 rounded px-3 py-2 text-sm flex-1 w-full"
              value={teamName}
              onChange={(e) => {
                setFormError("");
                setTeamName(e.target.value);
              }}
              disabled={isPending}
              required
              aria-invalid={!!formError}
            />
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            {error && <p className="text-sm text-destructive">{error.message}</p>}
            {isSuccess && <p className="text-sm text-green-400">team successfully created</p>}
          </Field>
        </FieldGroup>
        <DialogFooter className="mt-2">
          <DialogClose disabled={isPending} asChild>
            <Button type="button" variant="outline" disabled={isPending}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isPending || isSuccess}>
            {isPending ? "Creating..." : "Create Team"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
};

export default CreateTeamModal;
