import { bevorAction } from "@/actions";
import { AsyncComponent } from "@/utils/types";
import { notFound } from "next/navigation";
import AuditResults from "./audit-results";

type Props = {
  params: Promise<{ teamSlug: string; projectSlug: string; auditId: string }>;
};

const AuditResultsPage: AsyncComponent<Props> = async ({ params }) => {
  const { auditId } = await params;
  let audit;
  try {
    audit = await bevorAction.getAuditFindings(auditId);
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
