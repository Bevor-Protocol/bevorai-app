import { analysisActions } from "@/actions/bevor";
import { AsyncComponent } from "@/utils/types";
import { notFound } from "next/navigation";
import AnalysisResults from "./audit-results";

type Props = {
  params: Promise<{ teamId: string; projectId: string; analysisId: string }>;
};

const AnalysisResultsPage: AsyncComponent<Props> = async ({ params }) => {
  const { teamId, analysisId } = await params;
  let audit;
  try {
    audit = await analysisActions.getFindings(teamId, analysisId);
    if (!audit.is_public) {
      throw new Error("not public");
    }
  } catch {
    throw notFound();
  }

  return (
    <div className="px-6 py-4 bg-neutral-950">
      <AnalysisResults audit={audit} />
    </div>
  );
};

export default AnalysisResultsPage;
