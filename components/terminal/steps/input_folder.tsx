import { bevorAction } from "@/actions";
import ContractTree from "@/components/terminal/contract-tree";
import FolderDropZone from "@/components/terminal/folder-drop-zone";
import { cn } from "@/lib/utils";
import { Message, TerminalStep } from "@/utils/enums";
import { ContractResponseI, MessageType } from "@/utils/types";
import { Dispatch, FormEvent, SetStateAction, useEffect, useRef, useState } from "react";
import TerminalInputBar from "../input-bar";

type TerminalProps = {
  setTerminalStep: (step: TerminalStep) => void;
  handleGlobalState: (step: TerminalStep, history: MessageType[]) => void;
  setContractId: Dispatch<SetStateAction<string>>;
  contractId: string;
  state: MessageType[];
};

const FolderUploadStep = ({
  setTerminalStep,
  handleGlobalState,
  setContractId,
  contractId,
  state,
}: TerminalProps): JSX.Element => {
  const [input, setInput] = useState("");
  const [uploadAvailable, setUploadAvailable] = useState(state.length === 1 || state.length === 3);
  const [history, setHistory] = useState<MessageType[]>(state);
  const [selectedContracts, setSelectedContracts] = useState<string[]>([]);
  const [showTree, setShowTree] = useState(false);
  const [treeData, setTreeData] = useState<ContractResponseI | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const terminalRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (): void => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  const handleUpload = (fileMap: Record<string, File>): void => {
    setIsLoading(true);
    bevorAction
      .contractUploadFolder(fileMap)
      .then((result) => {
        if (!result) {
          throw new Error("bad response");
        }
        setContractId(result.id);
        handleFolderUploadSuccess(result);
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
      })
      .finally(() => setIsLoading(false));
  };

  const handleContractSelect = (contractId: string): void => {
    setSelectedContracts((prev) => {
      const isSelected = prev.includes(contractId);
      if (isSelected) {
        return prev.filter((id) => id !== contractId);
      } else {
        return [...prev, contractId];
      }
    });
  };

  const handleFolderUploadSuccess = (result: ContractResponseI): void => {
    setUploadAvailable(false);
    setTreeData(result);
    setShowTree(true);
    setHistory((prev) => [
      ...prev,
      {
        type: Message.SYSTEM,
        content: "Select the contracts you want to analyze:",
      },
    ]);
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
        {uploadAvailable && (
          <FolderDropZone onFolderSelect={handleUpload} isDisabled={isLoading} className="my-8" />
        )}
        {showTree && treeData && (
          <div className="my-4">
            <ContractTree
              tree={treeData}
              selectedContracts={selectedContracts}
              onContractSelect={handleContractSelect}
            />
          </div>
        )}
      </div>
      <TerminalInputBar
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          setHistory((prev) => [
            ...prev,
            {
              type: Message.USER,
              content: input,
            },
          ]);
          if (input.toLowerCase() === "n") {
            setUploadAvailable(true);
            setSelectedContracts([]);
            setTreeData(null);
            setShowTree(false);
          }
          setInput("");
        }}
        onChange={(value: string) => setInput(value)}
        disabled={uploadAvailable}
        value={input}
      />
    </>
  );
};

export default FolderUploadStep;
