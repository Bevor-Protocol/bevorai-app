import { bevorAction } from "@/actions";
import { AsyncComponent } from "@/utils/types";
import AuditScopeSelector from "./audit-scope-selector";

type Props = {
  params: Promise<{ projectId: string; versionId: string }>;
};

const AuditPage: AsyncComponent<Props> = async ({ params }) => {
  const { projectId, versionId } = await params;
  const team = await bevorAction.getTeam();
  const project = await bevorAction.getProject(projectId);
  const tree = await bevorAction.getContractTree(versionId);

  return <AuditScopeSelector tree={tree} team={team} project={project} versionId={versionId} />;
};

export default AuditPage;
