import { bevorAction } from "@/actions";
import { AsyncComponent } from "@/utils/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import React from "react";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ teamSlug: string; projectSlug: string; auditId: string }>;
};

const AuditLayout: AsyncComponent<LayoutProps> = async ({ params, children }) => {
  const { teamSlug, projectSlug, auditId } = await params;

  const audit = await bevorAction.getAudit(auditId);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm my-4">
          <Link
            href={`/teams/${teamSlug}/projects/${projectSlug}/versions/${audit.code_version_mapping_id}`}
            className="flex items-center space-x-2 text-neutral-400 hover:text-neutral-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Code Version</span>
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
};

export default AuditLayout;
