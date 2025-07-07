import { bevorAction } from "@/actions";
import { cn } from "@/lib/utils";
import { Message, TerminalStep } from "@/utils/enums";
import { MessageType } from "@/utils/types";
import { Dispatch, FormEvent, SetStateAction, useEffect, useRef, useState } from "react";
import TerminalInputBar from "../input-bar";
import TerminalTextArea from "../textarea-bar";

type TerminalProps = {
  setTerminalStep: (step: TerminalStep) => void;
  handleGlobalState: (step: TerminalStep, history: MessageType[]) => void;
  setContractId: Dispatch<SetStateAction<string>>;
  state: MessageType[];
};

const PasteStep = ({
  setTerminalStep,
  handleGlobalState,
  setContractId,
  state,
}: TerminalProps): JSX.Element => {
  const [input, setInput] = useState("");
  const [textAvailable, setTextAvailable] = useState(state.length === 1);
  const [tempInput, setTempInput] = useState(
    state.find((s) => s.type === Message.ASSISTANT)?.content ?? "",
  );
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

  const handleValidate = (): void => {
    if (!input) {
      setHistory((prev) => [
        ...prev,
        {
          type: Message.ERROR,
          content: "Invalid input, try again",
        },
      ]);
      setInput("");
      return;
    }
    const l = input[0].toLowerCase();
    switch (l) {
      case "y": {
        bevorAction
          .contractUploadPaste(tempInput)
          .then((result) => {
            if (!result) {
              throw new Error("bad response");
            }
            const { id } = result;
            setContractId(id);
            handleGlobalState(TerminalStep.INPUT_PASTE, history);
            setTerminalStep(TerminalStep.AUDIT_TYPE);
            setInput("");
          })
          .catch((error) => {
            console.log(error);
            setHistory((prev) => [
              ...prev,
              {
                type: Message.ERROR,
                content: "Something went wrong",
              },
            ]);
          });
        break;
      }
      case "n": {
        setInput("");
        // filter out the input from history, but still pre-fill the textarea
        // with the last input.
        const historyFiltered = history.filter((h) => h.type !== Message.ASSISTANT);
        historyFiltered.push({
          type: Message.SYSTEM,
          content: "Okay, let's try again",
        });
        setHistory(historyFiltered);
        setTextAvailable(true);
        break;
      }
      default: {
        setHistory((prev) => [
          ...prev,
          {
            type: Message.SYSTEM,
            content: "Not a valid input, try again...",
          },
        ]);
      }
    }
  };

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault();
    if (textAvailable) {
      setHistory((prev) => [
        ...prev,
        {
          type: Message.ASSISTANT,
          content: tempInput,
        },
        {
          type: Message.SYSTEM,
          content: "Does this look right? (y/n)",
        },
      ]);
      setTextAvailable(false);
    } else {
      handleValidate();
    }
  };

  return (
    <>
      {!textAvailable && (
        <div ref={terminalRef} className="flex-1 overflow-y-auto font-mono text-sm no-scrollbar">
          {history.map((message, i) => (
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
        </div>
      )}
      {textAvailable && (
        <TerminalTextArea
          onSubmit={handleSubmit}
          onChange={(value: string) => setTempInput(value)}
          disabled={false}
          value={tempInput}
        />
      )}
      {!textAvailable && (
        <TerminalInputBar
          onSubmit={handleSubmit}
          onChange={(value: string) => setInput(value)}
          disabled={false}
          value={input}
        />
      )}
    </>
  );
};

export default PasteStep;
