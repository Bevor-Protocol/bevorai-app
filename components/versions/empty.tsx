import { Code } from "lucide-react";
import React from "react";

export const VersionEmpty: React.FC = () => {
  return (
    <div className="flex flex-col py-12 justify-center items-center">
      <Code className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-neutral-300 mb-2">No versions yet</h3>
      <p className="text-sm text-neutral-500 mb-6">
        Create your first code version to get started auditing. Do this within any project.
      </p>
    </div>
  );
};
