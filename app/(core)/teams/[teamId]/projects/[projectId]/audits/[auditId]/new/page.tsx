import { projectActions, teamActions, versionActions } from "@/actions/bevor";
import { AsyncComponent } from "@/utils/types";
import AuditScopeSelector from "./audit-scope-selector";

type Props = {
  params: Promise<{ projectId: string; versionId: string }>;
};

const AuditPage: AsyncComponent<Props> = async ({ params }) => {
  const { projectId, versionId } = await params;
  const team = await teamActions.getTeam();
  const project = await projectActions.getProject(projectId);
  const tree = await versionActions.getContractTree(versionId);

  return <AuditScopeSelector tree={tree} team={team} project={project} versionId={versionId} />;
};

export default AuditPage;
