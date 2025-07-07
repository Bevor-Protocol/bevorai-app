import { bevorAction } from "@/actions";
import ContractTree from "@/components/terminal/contract-tree";
import TerminalInputBar from "@/components/terminal/input-bar";
import { cn } from "@/lib/utils";
import { Message, TerminalStep } from "@/utils/enums";
import { MessageType } from "@/utils/types";
import { useQuery } from "@tanstack/react-query";
import { FormEvent, useRef, useState } from "react";

type TerminalProps = {
  setTerminalStep: (step: TerminalStep) => void;
  versionId: string;
  state: MessageType[];
  scopes: { identifier: string; level: string }[];
  setScopes: React.Dispatch<React.SetStateAction<{ identifier: string; level: string }[]>>;
};

const ScopeDefinitionStep = ({
  setTerminalStep,
  versionId,
  state,
  scopes,
  setScopes,
}: TerminalProps): JSX.Element => {
  const [input, setInput] = useState("");

  const terminalRef = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: ["contract-tree", versionId],
    queryFn: async () => bevorAction.getContractTree(versionId),
  });

  const handleScopeSelect = ({
    identifier,
    level,
  }: {
    identifier: string;
    level: string;
  }): void => {
    setScopes((prev) => {
      const isSelected = prev.some((p) => p.identifier === identifier && p.level === level);
      if (isSelected) {
        return prev.filter((p) => p.identifier !== identifier);
      } else {
        return [...prev, { identifier, level }];
      }
    });
  };

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault();
    setTerminalStep(TerminalStep.RESULTS);
  };

  return (
    <>
      <div ref={terminalRef} className="flex-1 overflow-y-auto font-mono text-sm no-scrollbar">
        {state.map((message, i) => (
          <div
            key={i}
            className={cn(
              "mb-2 leading-relaxed whitespace-pre-wrap",
              message.type === Message.SYSTEM && "text-blue-400",
              message.type === Message.USER && "text-green-400",
              message.type === Message.ERROR && "text-red-400",
              message.type === Message.ASSISTANT && "text-white",
            )}
          >
            {message.type === Message.USER && "> "}
            {message.content}
          </div>
        ))}
        {!!data && (
          <div className="my-4">
            <ContractTree tree={data} selectedScope={scopes} onScopeSelect={handleScopeSelect} />
          </div>
        )}
      </div>
      <TerminalInputBar
        onSubmit={handleSubmit}
        onChange={(value: string) => setInput(value)}
        value={input}
      />
    </>
  );
};

export default ScopeDefinitionStep;
