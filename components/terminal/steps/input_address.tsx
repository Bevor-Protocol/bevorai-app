import { bevorAction } from "@/actions";
import { cn } from "@/lib/utils";
import { Message, TerminalStep } from "@/utils/enums";
import { MessageType } from "@/utils/types";
import { Dispatch, FormEvent, SetStateAction, useEffect, useRef, useState } from "react";
import TerminalInputBar from "../input-bar";

type TerminalProps = {
  setTerminalStep: (step: TerminalStep) => void;
  handleGlobalState: (step: TerminalStep, history: MessageType[]) => void;
  setProjectId: Dispatch<SetStateAction<string>>;
  setVersionId: Dispatch<SetStateAction<string>>;
  state: MessageType[];
};

const AddressStep = ({
  setTerminalStep,
  handleGlobalState,
  setProjectId,
  setVersionId,
  state,
}: TerminalProps): JSX.Element => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<MessageType[]>(state);

  const terminalRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (): void => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  const handleScan = (): void => {
    if (!input) {
      setHistory((prev) => [
        ...prev,
        {
          type: Message.ERROR,
          content: "Not a valid address, try again...",
        },
      ]);
      setInput("");
      return;
    }

    setInput("");
    setLoading(true);
    const address = encodeURIComponent(input);

    bevorAction
      .contractUploadScan(address)
      .then((result) => {
        if (!result) {
          throw new Error("bad response");
        }
        const { project_id, version_id } = result;

        setProjectId(project_id);
        setVersionId(version_id);
        setInput("");
        handleGlobalState(TerminalStep.INPUT_ADDRESS, history);
        setTerminalStep(TerminalStep.SCOPE_DEFINITION);
      })
      .catch((error) => {
        console.log(error);
        setHistory((prev) => [
          ...prev,
          {
            type: Message.ERROR,
            content: "Contract not found",
          },
        ]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault();
    setHistory((prev) => [
      ...prev,
      {
        type: Message.USER,
        content: input,
      },
    ]);
    handleScan();
  };

  return (
    <>
      <div ref={terminalRef} className="overflow-y-auto font-mono text-sm no-scrollbar grow">
        {history.map((message, i) => (
          <div
            key={i}
            className={cn(
              "mb-2 leading-relaxed whitespace-pre-wrap",
              message.type === Message.SYSTEM && "text-blue-400",
              message.type === Message.USER && "text-green-400",
              message.type === Message.ERROR && "text-red-400",
              message.type === Message.ASSISTANT && "text-white text-xs",
            )}
          >
            {message.type === Message.USER && "> "}
            {message.content}
          </div>
        ))}
      </div>
      <TerminalInputBar
        onSubmit={handleSubmit}
        onChange={(value: string) => setInput(value)}
        disabled={false}
        value={input}
        overrideLoading={loading}
      />
    </>
  );
};

export default AddressStep;
