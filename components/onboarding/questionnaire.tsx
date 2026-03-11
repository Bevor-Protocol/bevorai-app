"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { OnboardingPersona, useOnboarding } from "@/hooks/useOnboarding";
import { Bot, Building2, Search, Users, Wrench } from "lucide-react";
import React, { useEffect, useState } from "react";

interface PersonaOption {
  id: OnboardingPersona;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const PERSONAS: PersonaOption[] = [
  {
    id: "solo-dev",
    icon: <Wrench className="size-5" />,
    title: "Solo Developer",
    description: "I'm building smart contracts and want security feedback on my code",
  },
  {
    id: "dev-team",
    icon: <Users className="size-5" />,
    title: "Dev Team",
    description: "We collaborate on smart contract development and want shared analysis",
  },
  {
    id: "auditing-firm",
    icon: <Building2 className="size-5" />,
    title: "Auditing Firm",
    description: "We audit client contracts and deliver security reports",
  },
  {
    id: "solo-auditor",
    icon: <Search className="size-5" />,
    title: "Solo Auditor",
    description: "I'm an independent security researcher analyzing contracts",
  },
  {
    id: "agent-builder",
    icon: <Bot className="size-5" />,
    title: "Agent Builder",
    description: "I'm integrating BevorAI into my tooling via the API or MCP",
  },
];

interface OnboardingQuestionnaireProps {
  isSignup: boolean;
}

export const OnboardingQuestionnaire: React.FC<OnboardingQuestionnaireProps> = ({ isSignup }) => {
  const { persona, hydrated, setPersona } = useOnboarding();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<OnboardingPersona | null>(null);

  useEffect(() => {
    if (hydrated && isSignup && !persona) {
      setOpen(true);
    }
  }, [hydrated, isSignup, persona]);

  const handleConfirm = (): void => {
    if (!selected) return;
    setPersona(selected);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="max-w-xl"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">What brings you to BevorAI?</DialogTitle>
          <DialogDescription>
            Choose the option that best describes you. This helps us surface the right tools first.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 py-2">
          {PERSONAS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted",
                selected === p.id && "border-primary bg-muted",
              )}
            >
              <span className="mt-0.5 shrink-0 text-muted-foreground">{p.icon}</span>
              <div>
                <p className="text-sm font-medium">{p.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setPersona("solo-dev");
              setOpen(false);
            }}
          >
            Skip
          </Button>
          <Button size="sm" disabled={!selected} onClick={handleConfirm}>
            Get started
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
