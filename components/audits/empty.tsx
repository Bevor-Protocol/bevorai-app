import { Shield } from "lucide-react";
import React from "react";

export const AuditEmpty: React.FC<{ centered?: boolean }> = ({ centered = false }) => {
  if (!centered) {
    return (
      <div className="flex flex-col py-6 gap-2">
        <div className="flex flex-row gap-2 items-center">
          <Shield className="size-6 text-neutral-600" />
          <h4 className="text-base font-medium text-neutral-300">No audits yet</h4>
        </div>
        <p className="text-sm text-neutral-500 pl-8">
          Start by creating a version and running your first audit.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col py-6 justify-center items-center gap-2">
      <Shield className="size-8 text-neutral-600 mx-auto" />
      <h4 className="text-base font-medium text-neutral-300">No audits yet</h4>
      <p className="text-sm text-neutral-500 text-center">
        Start by creating a version and running your first audit.
      </p>
    </div>
  );
};
