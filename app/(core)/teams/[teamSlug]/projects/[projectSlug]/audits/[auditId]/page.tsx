import { bevorAction } from "@/actions";
import { AsyncComponent } from "@/utils/types";
import AuditResults from "./audit-results";

type Props = {
  params: Promise<{ teamSlug: string; projectSlug: string; auditId: string }>;
};

const AuditResultsPage: AsyncComponent<Props> = async ({ params }) => {
  const { auditId } = await params;
  const audit = await bevorAction.getAuditFindings(auditId);
  const version = await bevorAction.getContractVersion(audit.code_version_mapping_id);

  return (
    <div className="px-6 py-4 bg-neutral-950">
      <AuditResults audit={audit} version={version} />
    </div>
  );
};

export default AuditResultsPage;
