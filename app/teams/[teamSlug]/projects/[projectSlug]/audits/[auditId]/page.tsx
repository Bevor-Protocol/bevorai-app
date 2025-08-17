import { AsyncComponent } from "@/utils/types";
import { bevorAction } from "@/actions";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import React from "react";
import AuditResults from "./audit-results";

type Props = {
  params: Promise<{ teamSlug: string; projectSlug: string; auditId: string }>;
};

const AuditResultsPage: AsyncComponent<Props> = async ({ params }) => {
  const { teamSlug, projectSlug, auditId } = await params;
  const audit = await bevorAction.getAuditFindings(auditId);
  const version = await bevorAction.getContractVersion(audit.code_version_mapping_id);

  return (
    <div className="px-6 py-4 bg-neutral-950">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm">
          <Link
            href={`/teams/${teamSlug}/projects/${projectSlug}/versions/${version.id}`}
            className="flex items-center space-x-2 text-neutral-400 hover:text-neutral-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Code Version</span>
          </Link>
        </div>
      </div>
      <AuditResults audit={audit} version={version} />
    </div>
  );
};

export default AuditResultsPage;
