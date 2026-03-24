import { Button } from "@/components/ui/button";
import { PlayCircle, Shield } from "lucide-react";
import Link from "next/link";
import React from "react";

interface AnalysisEmptyProps {
  centered?: boolean;
  analyzeHref?: string;
  hasCode?: boolean;
}

export const AnalysisEmpty: React.FC<AnalysisEmptyProps> = ({
  centered = false,
  analyzeHref,
  hasCode,
}) => {
  if (analyzeHref && hasCode) {
    return (
      <div className="rounded-lg border border-dashed p-8 flex flex-col items-center justify-center gap-4 bg-black text-center">
        <div className="p-3 rounded-full bg-muted">
          <Shield className="size-6 text-muted-foreground" />
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-1">Run your first analysis</h4>
          <p className="text-xs text-muted-foreground max-w-xs">
            Your code is uploaded and ready. Start an AI-powered security analysis to surface
            vulnerabilities and findings.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href={analyzeHref}>
            <PlayCircle className="size-4" />
            Start Analysis
          </Link>
        </Button>
      </div>
    );
  }

  if (!centered) {
    return (
      <div className="flex flex-col py-4 gap-2">
        <div className="flex flex-row gap-2 items-center">
          <Shield className="size-6 text-neutral-600" />
          <h4 className="text-base font-medium">No analyses yet</h4>
        </div>
        <p className="text-sm text-neutral-500 pl-8">Start by creating your first analysis.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col py-4 justify-center items-center gap-2">
      <Shield className="size-8 text-neutral-600 mx-auto" />
      <h4 className="text-base font-medium">No audits yet</h4>
      <p className="text-sm text-neutral-500 text-center">Start by creating your first analysis.</p>
    </div>
  );
};
