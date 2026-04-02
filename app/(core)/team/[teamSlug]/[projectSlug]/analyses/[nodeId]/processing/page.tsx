import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ teamSlug: string; projectSlug: string; nodeId: string }>;
};

/** @deprecated Processing UI lives on the main analysis page. */
export default async function LegacyAnalysisProcessingRedirect({ params }: Props): Promise<never> {
  const { teamSlug, projectSlug, nodeId } = await params;
  redirect(`/team/${teamSlug}/${projectSlug}/analyses/${nodeId}`);
}
