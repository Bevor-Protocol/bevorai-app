import { bevorAction } from "@/actions";
import Shareable from "@/app/(core)/teams/[teamId]/projects/[projectId]/audits/[auditId]/shareable";
import { navigation } from "@/utils/navigation";
import { AsyncComponent } from "@/utils/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import React from "react";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ teamId: string; projectId: string; auditId: string }>;
};

const AuditLayout: AsyncComponent<LayoutProps> = async ({ params, children }) => {
  const { teamId, projectId, auditId } = await params;

  const audit = await bevorAction.getSecurityAnalysis(auditId);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm my-4">
          <Link
            href={navigation.version.overview({
              teamId,
              projectId,
              versionId: audit.code_version_mapping_id,
            })}
            className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>Back to Code Version</span>
          </Link>
        </div>
        <Shareable audit={audit} />
      </div>
      {children}
    </div>
  );
};

export default AuditLayout;
