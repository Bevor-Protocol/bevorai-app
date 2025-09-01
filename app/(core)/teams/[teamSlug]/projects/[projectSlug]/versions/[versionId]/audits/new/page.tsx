import { bevorAction } from "@/actions";
import { AsyncComponent } from "@/utils/types";
import AuditScopeSelector from "./audit-scope-selector";

type Props = {
  params: Promise<{ projectSlug: string; versionId: string }>;
};

const AuditPage: AsyncComponent<Props> = async ({ params }) => {
  const { projectSlug, versionId } = await params;
  const team = await bevorAction.getTeam();
  const project = await bevorAction.getProjectBySlug(projectSlug);
  const version = await bevorAction.getContractVersion(versionId);
  const tree = await bevorAction.getContractTree(versionId);

  return (
    <div className="px-6 py-4 bg-neutral-950">
      <AuditScopeSelector
        version={version}
        tree={tree}
        team={team}
        project={project}
        versionId={versionId}
      />
    </div>
  );
};

export default AuditPage;
