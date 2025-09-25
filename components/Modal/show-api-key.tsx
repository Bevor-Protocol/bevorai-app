"use client";

import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { AlertTriangle, Check, Copy } from "lucide-react";

interface ShowApiKeyModalProps {
  apiKey: string;
}

const ShowApiKeyModal: React.FC<ShowApiKeyModalProps> = ({ apiKey }) => {
  const { isCopied, copy } = useCopyToClipboard();

  return (
    <div>
      <DialogHeader>
        <div className="inline-flex gap-2 items-center">
          <AlertTriangle className="size-5 text-yellow-400 mt-0.5" />
          <DialogTitle>Your API Key</DialogTitle>
        </div>
        <DialogDescription>
          This is the only time you&apos;ll see this API key. Make sure to copy it and store it
          securely.
        </DialogDescription>
      </DialogHeader>
      <div className="border border-neutral-700 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <code className="text-sm font-mono text-neutral-100 break-all">{apiKey}</code>
          <div
            onClick={() => copy(apiKey)}
            className="p-2 border border-neutral-800 rounded cursor-pointer"
          >
            {isCopied ? <Check className="size-4 text-green-400" /> : <Copy className="size-4" />}
          </div>
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button>Done</Button>
        </DialogClose>
      </DialogFooter>
    </div>
  );
};

export default ShowApiKeyModal;
