import { Button } from "@/components/ui/button";
import { Code, FolderOpen, Upload } from "lucide-react";
import Link from "next/link";
import React from "react";

interface VersionEmptyProps {
  centered?: boolean;
  uploadHref?: string;
}

export const VersionEmpty: React.FC<VersionEmptyProps> = ({ centered = false, uploadHref }) => {
  if (uploadHref) {
    return (
      <div className="rounded-lg border border-dashed p-8 flex flex-col items-center justify-center gap-4 bg-black text-center">
        <div className="p-3 rounded-full bg-muted">
          <FolderOpen className="size-6 text-muted-foreground" />
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-1">Upload your first smart contract</h4>
          <p className="text-xs text-muted-foreground max-w-xs">
            Upload Solidity files, scan a deployed contract address, or connect a GitHub repository
            to get started.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href={uploadHref}>
            <Upload className="size-4" />
            Upload Code
          </Link>
        </Button>
      </div>
    );
  }

  if (!centered) {
    return (
      <div className="flex flex-col py-4 gap-2">
        <div className="flex flex-row gap-2 items-center">
          <Code className="size-6 text-neutral-600" />
          <h4 className="text-base font-medium">No code versions yet</h4>
        </div>
        <p className="text-sm text-neutral-500 pl-8">
          Create your first code version to get started
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col py-4 justify-center items-center gap-2">
      <Code className="size-8 text-neutral-600 mx-auto" />
      <h4 className="text-base font-medium">No code versions yet</h4>
      <p className="text-sm text-neutral-500 text-center">
        Create your first code version to get started
      </p>
    </div>
  );
};
