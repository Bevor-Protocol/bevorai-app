import { bevorAction } from "@/actions";
import { AsyncComponent } from "@/utils/types";
import { notFound } from "next/navigation";
import AuditResults from "./audit-results";

type Props = {
  params: Promise<{ teamId: string; projectId: string; auditId: string }>;
};

const AuditResultsPage: AsyncComponent<Props> = async ({ params }) => {
  const { auditId } = await params;
  let audit;
  try {
    audit = await bevorAction.getFindings(auditId);
    if (!audit.is_public) {
      throw new Error("not public");
    }
  } catch {
    throw notFound();
  }

  return (
    <div className="px-6 py-4 bg-neutral-950">
      <AuditResults audit={audit} />
    </div>
  );
};

export default AuditResultsPage;
