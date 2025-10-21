import { bevorAction } from "@/actions";
import Container from "@/components/container";
import { AsyncComponent } from "@/utils/types";
import AuditResults from "./audit-results";

type Props = {
  params: Promise<{ teamId: string; projectId: string; auditId: string }>;
};

const AuditResultsPage: AsyncComponent<Props> = async ({ params }) => {
  const { auditId } = await params;
  const audit = await bevorAction.getFindings(auditId);
  const version = await bevorAction.getContractVersion(audit.code_version_mapping_id);

  return (
    <Container>
      <AuditResults audit={audit} version={version} />
    </Container>
  );
};

export default AuditResultsPage;
