import { bevorAction } from "@/actions";
import VersionLayoutClient from "@/app/(core)/teams/[teamSlug]/projects/[projectSlug]/versions/[versionId]/layout-client";
import { AsyncComponent } from "@/utils/types";

interface LayoutProps {
  params: Promise<{ teamSlug: string; projectSlug: string; versionId: string }>;
  children: React.ReactNode;
}

const VersionLayout: AsyncComponent<LayoutProps> = async ({ params, children }) => {
  const slugs = await params;

  const version = await bevorAction.getContractVersion(slugs.versionId);
  return (
    <div className="max-w-6xl m-auto">
      <VersionLayoutClient version={version} slugs={slugs} />
      {children}
    </div>
  );
};

export default VersionLayout;
