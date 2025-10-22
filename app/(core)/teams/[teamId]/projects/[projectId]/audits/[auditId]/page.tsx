import { securityAnalysisActions, versionActions } from "@/actions/bevor";
import Container from "@/components/container";
import { AsyncComponent } from "@/utils/types";
import AuditResults from "./audit-results";

type Props = {
  params: Promise<{ teamId: string; projectId: string; auditId: string }>;
};

const AuditResultsPage: AsyncComponent<Props> = async ({ params }) => {
  const { auditId } = await params;
  const audit = await securityAnalysisActions.getFindings(auditId);
  const version = await versionActions.getContractVersion(audit.code_version_mapping_id);

  return (
    <Container>
      <AuditResults audit={audit} version={version} />
    </Container>
  );
};

export default AuditResultsPage;
