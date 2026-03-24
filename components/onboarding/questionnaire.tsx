"use client";

import { userActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OnboardingPersona } from "@/hooks/useOnboarding";
import { cn } from "@/lib/utils";
import { generateQueryKey } from "@/utils/constants";
import { UserDetailedSchemaI } from "@/utils/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Briefcase, Code2, GitBranch, Search, Target } from "lucide-react";
import React, { useEffect, useState } from "react";

interface PersonaOption {
  id: OnboardingPersona;
  icon: React.ReactNode;
  title: string;
  description: string;
  checklist: string[];
}

const PERSONAS: PersonaOption[] = [
  {
    id: "smart-contract-engineer",
    icon: <Code2 className="size-5" />,
    title: "Smart Contract Engineer",
    description: "I'm building smart contracts and want AI-powered security feedback on my code",
    checklist: ["Upload codebase", "Install MCP", "Add to CI/CD", "Validate vulnerability"],
  },
  {
    id: "auditor",
    icon: <Search className="size-5" />,
    title: "Auditor",
    description: "I audit client contracts and need to ramp up fast and deliver security reports",
    checklist: ["Upload codebase", "Ramp-up on scope", "Validate vulnerability", "Install Skills"],
  },
  {
    id: "builder",
    icon: <Bot className="size-5" />,
    title: "Builder",
    description: "I'm building tools or agents powered by the BevorAI API or MCP",
    checklist: ["Get API key", "Install SDK", "Run custom agent"],
  },
  {
    id: "bounty-hunter",
    icon: <Target className="size-5" />,
    title: "Bounty Hunter",
    description: "I hunt for vulnerabilities in public contracts for bug bounties",
    checklist: ["Upload codebase", "Ramp-up on scope", "Validate vulnerability", "Install MCP"],
  },
  {
    id: "devops",
    icon: <GitBranch className="size-5" />,
    title: "DevOps",
    description: "I'm integrating automated security analysis into CI/CD pipelines",
    checklist: ["Upload codebase", "Get API key", "Add to CI/CD pipeline"],
  },
  {
    id: "exec",
    icon: <Briefcase className="size-5" />,
    title: "Exec",
    description: "I manage a team working on smart contract security and want team-wide visibility",
    checklist: ["Add team members", "Upload code", "Onboard to codebase"],
  },
];

export const OnboardingQuestionnaire: React.FC = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<OnboardingPersona | null>(null);

  const { data: user, isSuccess } = useQuery<UserDetailedSchemaI>({
    queryKey: generateQueryKey.currentUser(),
    queryFn: () =>
      userActions.get().then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  useEffect(() => {
    if (isSuccess && !user?.onboarding_persona) {
      setOpen(true);
    }
  }, [isSuccess, user?.onboarding_persona]);

  const savePersonaMutation = useMutation({
    mutationFn: (persona: OnboardingPersona) =>
      userActions.update({ onboarding_persona: persona }).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: generateQueryKey.currentUser() });
      setOpen(false);
    },
  });

  const handleConfirm = (): void => {
    if (!selected) return;
    savePersonaMutation.mutate(selected);
  };

  const handleSkip = (): void => {
    savePersonaMutation.mutate("auditor");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="max-w-2xl"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">What best describes your role?</DialogTitle>
          <DialogDescription>
            Pick the option that fits you best. We&apos;ll tailor your getting started checklist to
            match.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 py-2">
          {PERSONAS.map((p) => {
            const isSelected = selected === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={cn(
                  "flex flex-col gap-2 rounded-lg border p-4 text-left transition-colors hover:bg-muted",
                  isSelected && "border-primary bg-muted",
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "shrink-0 transition-colors",
                      isSelected ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {p.icon}
                  </span>
                  <p className="text-sm font-semibold">{p.title}</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{p.description}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {p.checklist.map((step) => (
                    <span
                      key={step}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-muted border text-muted-foreground"
                    >
                      {step}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            disabled={savePersonaMutation.isPending}
          >
            Skip
          </Button>
          <Button
            size="sm"
            disabled={!selected || savePersonaMutation.isPending}
            onClick={handleConfirm}
          >
            Get started
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
