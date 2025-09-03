import { Shield } from "lucide-react";
import React from "react";

export const AuditEmpty: React.FC = () => {
  return (
    <div className="flex flex-col py-12 justify-center items-center">
      <Shield className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-neutral-300 mb-2">No audits yet</h3>
      <p className="text-sm text-neutral-500">
        Start by creating a version and running your first audit.
      </p>
    </div>
  );
};
