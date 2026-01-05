import { Code } from "lucide-react";
import React from "react";

export const VersionEmpty: React.FC<{ centered?: boolean }> = ({ centered = false }) => {
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
