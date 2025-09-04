"use client";

import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/useContexts";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { AlertTriangle, Check, Copy, X } from "lucide-react";

interface ShowApiKeyModalProps {
  apiKey: string;
}

const ShowApiKeyModal: React.FC<ShowApiKeyModalProps> = ({ apiKey }) => {
  const { hide } = useModal();

  const { isCopied, copy } = useCopyToClipboard();

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div onClick={hide} className="cursor-pointer ml-auto">
          <X className="w-4 h-4" />
        </div>
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-yellow-400 mb-1">Copy Your API Key Now</h4>
            <p className="text-sm text-yellow-400/80">
              This is the only time you&apos;ll see this API key. Make sure to copy it and store it
              securely.
            </p>
          </div>
        </div>
      </div>

      <div className="border border-neutral-700 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <code className="text-sm font-mono text-neutral-100 break-all">{apiKey}</code>
          <div
            onClick={() => copy(apiKey)}
            className="p-2 border border-neutral-800 rounded cursor-pointer"
          >
            {isCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end mt-6">
        <Button onClick={hide} className="text-white">
          Done
        </Button>
      </div>
    </div>
  );
};

export default ShowApiKeyModal;
