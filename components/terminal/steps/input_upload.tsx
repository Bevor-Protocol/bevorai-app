import { bevorAction } from "@/actions";
import { cn } from "@/lib/utils";
import { Message, TerminalStep } from "@/utils/enums";
import { MessageType } from "@/utils/types";
import { Dispatch, FormEvent, SetStateAction, useEffect, useRef, useState } from "react";
import FileDropZone from "../file-drop-zone";
import TerminalInputBar from "../input-bar";

type TerminalProps = {
  setTerminalStep: (step: TerminalStep) => void;
  handleGlobalState: (step: TerminalStep, history: MessageType[]) => void;
  setContractId: Dispatch<SetStateAction<string>>;
  state: MessageType[];
};

const UploadStep = ({
  setTerminalStep,
  handleGlobalState,
  setContractId,
  state,
}: TerminalProps): JSX.Element => {
  const [input, setInput] = useState("");
  const [uploadAvailable, setUploadAvailable] = useState(state.length === 1 || state.length === 3);
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

  const handleUpload = (file: File): void => {
    bevorAction
      .contractUploadFile(file)
      .then((result) => {
        if (!result) {
          throw new Error("bad response");
        }
        const { id, message } = result;
        setContractId(id);
        setUploadAvailable(false);
        setHistory((prev) => [
          ...prev,
          {
            type: Message.ASSISTANT,
            content: message,
          },
          {
            type: Message.SYSTEM,
            content: "Does this look right? (y/n)",
          },
        ]);
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
  };

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
        setInput("");
        handleGlobalState(TerminalStep.INPUT_UPLOAD, history);
        setTerminalStep(TerminalStep.AUDIT_TYPE);
        break;
      }
      case "n": {
        setInput("");
        setHistory((prev) => [
          ...prev,
          {
            type: Message.SYSTEM,
            content: "Okay, let's try again",
          },
        ]);
        setUploadAvailable(true);
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
    setHistory((prev) => [
      ...prev,
      {
        type: Message.USER,
        content: input,
      },
    ]);
    handleValidate();
  };

  return (
    <>
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
        {uploadAvailable && <FileDropZone onFileSelect={handleUpload} className="my-8" />}
      </div>
      <TerminalInputBar
        onSubmit={handleSubmit}
        onChange={(value: string) => setInput(value)}
        disabled={uploadAvailable}
        value={input}
      />
    </>
  );
};

export default UploadStep;
